import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";
import {
  registerLiveReviewCommands,
  registerProductionLiveReviewCommands,
} from "../src/cli/review-live.ts";
import {
  issueReviewRequest,
  type ReviewAttestationRequest,
  type ReviewVerdictProjectionResult,
} from "../src/feedback/review-attestation.ts";
import {
  claimCodexReviewWake,
  codexWakeInboxRoot,
  consumeCodexReviewWake,
  publishCodexReviewWake,
  readCodexReviewWake,
} from "../src/runtime/codex-review-wake.ts";
import { resolveProjectMemoryRoot } from "../src/runtime/project-memory-root.ts";
import { ensureTrackedProjectIdentity } from "./support/project-identity-fixture.ts";

const roots: string[] = [];
const head = "a".repeat(40);

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ut-codex-review-wake-"));
  roots.push(root);
  ensureTrackedProjectIdentity(root, "fixture/codex-review-wake");
  const memoryDir = join(root, ".ut-tdd", "memory");
  mkdirSync(memoryDir, { recursive: true });
  const memoryPath = join(memoryDir, "review.md");
  writeFileSync(
    memoryPath,
    [
      "---",
      "memory_id: memory:codex-wake",
      "kind: feedback",
      'title: "Codex wake"',
      "tags: []",
      "updated_at: 2026-09-16T00:00:00.000Z",
      "---",
      "review task",
    ].join("\n"),
    "utf8",
  );
  return { root, memoryPath };
}

function request(revision: string, requestedAt: string, pr = 319): ReviewAttestationRequest {
  return {
    memoryId: "memory:codex-wake",
    pr,
    exactHead: head,
    reviewRevision: revision,
    authorFamily: "claude",
    requestedAt,
  };
}

function wake(root: string, memoryPath: string, input: ReviewAttestationRequest) {
  const issued = issueReviewRequest({ repoRoot: root, request: input, strict: true });
  if (!issued.ok) throw new Error(issued.reason);
  return {
    purpose: "review" as const,
    reviewer: "codex" as const,
    requestDigest: issued.digest,
    requestPath: issued.path,
    request: issued.request,
    memoryPath: relative(root, memoryPath).replaceAll("\\", "/"),
  };
}

afterEach(() => {
  delete process.env.CODEX_REVIEW_TARGET_SESSION;
  while (roots.length > 0) rmSync(roots.pop() as string, { recursive: true, force: true });
});

describe("Codex review wake contract", () => {
  it("CANDIDATE-CODEXWAKE-009 fails closed without a target session and writes no projection", () => {
    const { root, memoryPath } = fixture();
    const value = wake(
      root,
      memoryPath,
      request("wake-missing-session", "2026-09-16T00:00:00.000Z"),
    );
    delete process.env.CODEX_REVIEW_TARGET_SESSION;
    expect(() => publishCodexReviewWake(root, value)).toThrow(
      "codex_review_target_session_unavailable",
    );
    const project = resolveProjectMemoryRoot(root);
    if (!project.ok) throw new Error(project.reason);
    expect(() => readdirSync(join(project.runtimeBusRoot, "codex-memory-wake"))).toThrow();
  });

  it("CANDIDATE-CODEXWAKE-009 keeps the normal Codex hook exit 0 without a target session", () => {
    const { root } = fixture();
    const result = spawnSync(
      process.execPath,
      [join(process.cwd(), "src", "cli.ts"), "hook", "codex-memory-wake"],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          UT_TDD_PROJECT_DIR: root,
          CLAUDE_PROJECT_DIR: "",
          CODEX_REVIEW_TARGET_SESSION: "",
        },
        windowsHide: true,
      },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      schema: "ut-tdd.codex-memory-wake/v1",
      status: "empty",
      deliveryConfirmed: false,
    });
  });

  it("CANDIDATE-CODEXWAKE-011 surfaces valid entries and preserves invalid bytes", () => {
    const { root, memoryPath } = fixture();
    process.env.CODEX_REVIEW_TARGET_SESSION = "codex-session-1";
    const first = wake(root, memoryPath, request("wake-first", "2026-09-16T00:00:00.000Z"));
    const second = wake(root, memoryPath, request("wake-second", "2026-09-16T00:01:00.000Z", 320));
    publishCodexReviewWake(root, first);
    publishCodexReviewWake(root, second);
    const invalidPath = join(codexWakeInboxRoot(root), "invalid.json");
    writeFileSync(invalidPath, "{ malformed", "utf8");
    const surface = readCodexReviewWake(root);
    expect(surface).toMatchObject({
      status: "pending",
      requestDigest: first.requestDigest,
      invalidCount: 1,
      deliveryConfirmed: false,
    });
    expect(readFileSync(invalidPath, "utf8")).toBe("{ malformed");
  });

  it("CANDIDATE-CODEXWAKE-007 redelivers backlog in createdAt order without terminalizing before review", () => {
    const { root, memoryPath } = fixture();
    process.env.CODEX_REVIEW_TARGET_SESSION = "codex-session-1";
    const value = wake(root, memoryPath, request("wake-backlog", "2026-09-16T00:00:00.000Z"));
    const project = resolveProjectMemoryRoot(root);
    if (!project.ok) throw new Error(project.reason);
    const backlog = join(project.runtimeBusRoot, "codex-memory-wake", "backlog");
    mkdirSync(backlog, { recursive: true });
    const backlogPath = join(backlog, `${value.requestDigest}.json`);
    writeFileSync(
      backlogPath,
      `${JSON.stringify({
        schema: "ut-tdd.codex-memory-wake-backlog/v1",
        requestDigest: value.requestDigest,
        requestPath: value.requestPath,
        memoryPath: value.memoryPath,
        request: value.request,
        createdAt: value.request.requestedAt,
        reason: "review_wake_publish_failed",
      })}\n`,
      "utf8",
    );

    expect(readCodexReviewWake(root)).toMatchObject({
      status: "pending",
      requestDigest: value.requestDigest,
      deliveryConfirmed: false,
    });
    expect(readFileSync(backlogPath, "utf8")).toContain(value.requestDigest);
    const terminal = join(project.runtimeBusRoot, "codex-memory-wake", "terminal");
    expect(() => readdirSync(terminal)).toThrow();
  });

  it("CANDIDATE-CODEXWAKE-010 restores an expired claim for the next session", () => {
    const { root, memoryPath } = fixture();
    process.env.CODEX_REVIEW_TARGET_SESSION = "codex-session-1";
    const value = wake(root, memoryPath, request("wake-expiry", "2026-09-16T00:00:00.000Z"));
    publishCodexReviewWake(root, value);
    const surface = readCodexReviewWake(root);
    if (surface.status !== "pending") throw new Error("expected pending wake");
    const path = surface.envelopePath;
    const claimed = claimCodexReviewWake(root, path, new Date("2026-09-16T00:00:00.000Z"));
    expect(readCodexReviewWake(root, new Date("2026-09-16T00:14:59.000Z"))).toEqual({
      schema: "ut-tdd.codex-memory-wake/v1",
      status: "empty",
      deliveryConfirmed: false,
    });
    expect(readFileSync(claimed, "utf8")).toContain(value.requestDigest);
    expect(readCodexReviewWake(root, new Date("2026-09-16T00:16:00.000Z"))).toMatchObject({
      status: "pending",
      requestDigest: value.requestDigest,
    });
    expect(() => readFileSync(claimed)).toThrow();
  });

  it("CANDIDATE-CODEXWAKE-008 terminalizes and prunes only after seven days", () => {
    const { root, memoryPath } = fixture();
    process.env.CODEX_REVIEW_TARGET_SESSION = "codex-session-1";
    const value = wake(root, memoryPath, request("wake-terminal", "2026-09-16T00:00:00.000Z"));
    publishCodexReviewWake(root, value);
    const surface = readCodexReviewWake(root);
    if (surface.status !== "pending") throw new Error("expected pending wake");
    const path = surface.envelopePath;
    consumeCodexReviewWake(root, path, new Date("2026-09-16T00:00:00.000Z"));
    expect(readCodexReviewWake(root, new Date("2026-09-22T23:59:59.000Z")).status).toBe("empty");
    const project = resolveProjectMemoryRoot(root);
    if (!project.ok) throw new Error(project.reason);
    const terminal = join(project.runtimeBusRoot, "codex-memory-wake", "terminal");
    expect(readdirSync(terminal)).toHaveLength(1);
    expect(readCodexReviewWake(root, new Date("2026-09-23T00:00:00.000Z")).status).toBe("empty");
    expect(readdirSync(terminal)).toHaveLength(0);
  });

  it("CANDIDATE-CODEXWAKE-004 terminalizes from a durable receipt after derived publication fails", async () => {
    const { root, memoryPath } = fixture();
    process.env.CODEX_REVIEW_TARGET_SESSION = "codex-session-1";
    const value = wake(root, memoryPath, request("wake-receipt", "2026-09-16T00:00:00.000Z"));
    publishCodexReviewWake(root, value);
    const surface = readCodexReviewWake(root);
    if (surface.status !== "pending") throw new Error("expected pending wake");

    const projection: Extract<ReviewVerdictProjectionResult, { ok: true }> = {
      ok: true,
      path: join(root, ".ut-tdd", "review", "receipts", `${value.requestDigest}.json`),
      digest: "projection-digest",
      receipt: {
        memoryId: value.request.memoryId,
        pr: value.request.pr,
        head: value.request.exactHead,
        reviewRevision: value.request.reviewRevision,
        reviewerFamily: "codex",
        kind: "verdict",
        verdict: "PASS",
        blockingFindings: [],
        at: "2026-09-16T00:01:00.000Z",
      },
    };
    const program = new Command().exitOverride();
    registerLiveReviewCommands(program.command("review"), {
      repoRoot: () => root,
      providerAvailable: () => true,
      runReview: () => projection,
      publishReceipt: () => {
        mkdirSync(join(root, ".ut-tdd", "review", "receipts"), { recursive: true });
        writeFileSync(projection.path, `${JSON.stringify(projection.receipt)}\n`, "utf8");
        throw new Error("derived publication unavailable");
      },
    });
    const previousWrite = process.stdout.write;
    const previousExitCode = process.exitCode;
    process.stdout.write = (() => true) as typeof process.stdout.write;
    try {
      await program.parseAsync([
        "node",
        "ut-tdd",
        "review",
        "live-consume",
        "--envelope",
        surface.envelopePath,
        "--json",
      ]);
    } finally {
      process.stdout.write = previousWrite;
      process.exitCode = previousExitCode;
    }

    expect(readCodexReviewWake(root)).toEqual({
      schema: "ut-tdd.codex-memory-wake/v1",
      status: "empty",
      deliveryConfirmed: false,
    });
  });

  it("CANDIDATE-CODEXWAKE-001 rejects a conflicting canonical request instead of overwriting", () => {
    const { root } = fixture();
    const first = issueReviewRequest({
      repoRoot: root,
      request: request("wake-conflict", "2026-09-16T00:00:00.000Z"),
      strict: true,
    });
    const second = issueReviewRequest({
      repoRoot: root,
      request: request("wake-conflict", "2026-09-16T00:01:00.000Z"),
      strict: true,
    });
    if (!first.ok) throw new Error("expected first request to be issued");
    const firstBytes = readFileSync(first.path, "utf8");
    expect(second).toEqual({ ok: false, reason: "review_request_conflict" });
    expect(readFileSync(first.path, "utf8")).toBe(firstBytes);
  });

  it("CANDIDATE-CODEXWAKE-006 production composition publishes after canonical request persistence", async () => {
    const { root, memoryPath } = fixture();
    process.env.CODEX_REVIEW_TARGET_SESSION = "codex-session-1";
    const program = new Command().exitOverride();
    registerProductionLiveReviewCommands(program.command("review"), {
      repoRoot: () => root,
      providerAvailable: () => true,
      validateReviewSubject: () => ({ ok: true }),
    });
    const previousWrite = process.stdout.write;
    process.stdout.write = (() => true) as typeof process.stdout.write;
    try {
      await program.parseAsync([
        "node",
        "ut-tdd",
        "review",
        "live-dispatch",
        "--memory-id",
        "memory:codex-wake",
        "--memory-path",
        relative(root, memoryPath).replaceAll("\\", "/"),
        "--pr",
        "319",
        "--head",
        head,
        "--revision",
        "wake-production",
        "--author-family",
        "claude",
        "--json",
      ]);
    } finally {
      process.stdout.write = previousWrite;
    }
    const surface = readCodexReviewWake(root);
    expect(surface).toMatchObject({ status: "pending", pr: 319, exactHead: head });

    const hooks = JSON.parse(readFileSync(join(process.cwd(), ".codex", "hooks.json"), "utf8")) as {
      hooks?: Record<string, Array<{ hooks?: Array<{ args?: string[] }> }>>;
    };
    for (const event of ["SessionStart", "Stop"] as const) {
      expect(
        hooks.hooks?.[event]?.some((group) =>
          group.hooks?.some(
            (hook) =>
              hook.args?.[0] === "src/cli.ts" &&
              hook.args?.[1] === "hook" &&
              hook.args?.[2] === "codex-memory-wake",
          ),
        ),
      ).toBe(true);
    }
  });
});
