/**
 * Issue #1062 Red oracles. Candidate IDs and expected behavior are frozen in
 * docs/test-design/harness/L7-state-channel-consolidation-test-design.md.
 * Unimplemented candidate oracles are intentionally `it.fails` until the
 * later promotion and Green PRs; 004/005 remain ordinary tests because the
 * current CLI already satisfies those acceptance cases.
 * Candidate 017 remains incomplete; candidates 023 and 025–028 remain deferred
 * until the execution-mouth contract is merged. This Red batch does not claim
 * completion of those rows.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { buildDoctorCheckDefinitionGroups } from "../src/doctor/check-definition-groups.ts";
import type { DoctorDeps } from "../src/doctor/runtime-state.ts";
import { loadCanonicalLiveReviewRequest } from "../src/feedback/live-review-projection.ts";
import { scanPostMergeBackstop } from "../src/feedback/post-merge-backstop.ts";
import { issueReviewRequest } from "../src/feedback/review-attestation.ts";
import { canonicalize, computeReviewRevision } from "../src/feedback/review-custody-canonical.ts";
import {
  issueCustodyReceipt,
  type RunnerEnvironment,
} from "../src/feedback/review-custody-runner.ts";
import { analyzeReviewDispatch } from "../src/feedback/review-dispatch.ts";
import { runPrMerge } from "../src/feedback/review-merge-gate.ts";
import { checkHandoverBypass, type HandoverDeps } from "../src/handover/index.ts";
import type { MemoryEntry } from "../src/memory/index.ts";
import { writeMemory } from "../src/memory/service.ts";
import { buildClaudeProviderReviewInboxEntry } from "../src/runtime/claude-provider-envelope.ts";
import { ensureTrackedProjectIdentity } from "./support/project-identity-fixture.ts";
import { removeTestTree } from "./support/temp-tree.ts";

const repoRoot = process.cwd();
const cliPath = join(repoRoot, "src", "cli.ts");
const tempRoots: string[] = [];

function tempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-state-channel-"));
  tempRoots.push(root);
  ensureTrackedProjectIdentity(root, "example/repo");
  return root;
}

function runCli(cwd: string, args: readonly string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function expectStarted(result: ReturnType<typeof runCli>): void {
  expect(result.error?.message ?? "", "CLI process must start").toBe("");
  expect(result.signal, "CLI must exit normally").toBeNull();
}

function requireDefined<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new Error(`${context}: expected a defined value`);
  return value;
}

function requireOnly<T>(values: readonly T[], context: string): T {
  if (values.length !== 1)
    throw new Error(`${context}: expected one value, received ${values.length}`);
  return requireDefined(values[0], context);
}

function snapshotTree(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory())
        return [`dir:${entry.name}`, ...snapshotTree(path).map((item) => `${entry.name}/${item}`)];
      if (entry.isFile()) {
        const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
        return [`file:${entry.name}:${digest}`];
      }
      return [`other:${entry.name}`];
    });
}

function trackedPaths(cwd: string, ...paths: string[]): string[] {
  const result = spawnSync("git", ["ls-files", "--", ...paths], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
  expect(result.status).toBe(0);
  return result.stdout.split(/\r?\n/).filter(Boolean).sort();
}

function expectAcceptedDecision(decision: unknown): void {
  // L6 §6 pseudocode names the pure classifier's accept result literally.
  // This is an internal classifier oracle, not a CLI or receipt schema.
  expect(decision).toBe("accept");
}

function addDurableReason(root: string, sourcePath: string, reason: string): void {
  const path = join(root, sourcePath);
  const source = readFileSync(path, "utf8");
  const separator = source.indexOf("\n---\n", source.indexOf("---\n") + 4);
  expect(separator).toBeGreaterThan(0);
  writeFileSync(
    path,
    `${source.slice(0, separator)}\ndurable_reason: ${JSON.stringify(reason)}${source.slice(separator)}`,
  );
}

function freezeTargetSnapshot(
  root: string,
  entries: readonly { memory_id: string; source_path: string }[],
): void {
  const rows = entries
    .map((entry) => {
      const content = readFileSync(join(root, entry.source_path));
      const canonical = canonicalize({
        content_sha256: createHash("sha256").update(content).digest("hex"),
        memory_id: entry.memory_id,
      });
      expect(canonical.ok).toBe(true);
      return { memory_id: entry.memory_id, bytes: canonical.ok ? canonical.value : "" };
    })
    .sort((left, right) => left.memory_id.localeCompare(right.memory_id));
  const snapshotBytes = rows.length === 0 ? "" : `${rows.map((row) => row.bytes).join("\n")}\n`;
  const snapshotPath = join(root, ".ut-tdd", "archive", "memory-episodes", "target-snapshot.jsonl");
  const evidencePath = join(root, "docs", "migration", "state-channel-target-snapshot.json");
  mkdirSync(join(root, ".ut-tdd", "archive", "memory-episodes"), { recursive: true });
  mkdirSync(join(root, "docs", "migration"), { recursive: true });
  writeFileSync(snapshotPath, snapshotBytes, "utf8");
  const evidence = canonicalize({
    schema: "ut-tdd.state-channel-target-snapshot/v1",
    sha256: createHash("sha256").update(snapshotBytes, "utf8").digest("hex"),
    count: rows.length,
    recorded_at: "2026-10-16T00:00:00.000Z",
  });
  expect(evidence.ok).toBe(true);
  writeFileSync(evidencePath, `${evidence.ok ? evidence.value : ""}\n`, "utf8");
  const stagedEvidence = spawnSync(
    "git",
    ["add", "docs/migration/state-channel-target-snapshot.json"],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  expect(stagedEvidence.status).toBe(0);
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) removeTestTree(root);
});

describe("Issue #1062: memory becomes lesson-only", () => {
  it.fails("CANDIDATE-U-STCHAN-001: episodic project memory is rejected before any file is written", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "memory",
      "add",
      "--kind",
      "project",
      "--title",
      "PR 1055 CI と control merge",
      "--body",
      "lane state",
    ]);
    expectStarted(result);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("episodic_memory_rejected");
    expect(result.stderr).toContain("GitHub");
    expect(result.stderr).toContain("ut-tdd notify claude");
    expect(existsSync(join(root, ".ut-tdd", "memory"))).toBe(false);
  });

  it.fails("CANDIDATE-U-STCHAN-002: a durable reason admits project memory and is persisted", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "memory",
      "add",
      "--kind",
      "project",
      "--title",
      "Durable constraint",
      "--body",
      "A permanent rule.",
      "--durable-reason",
      "変わらない制約",
    ]);
    expectStarted(result);
    expect(result.status).toBe(0);
    const files = readdirSync(join(root, ".ut-tdd", "memory"));
    expect(files).toHaveLength(1);
    const memoryFile = requireOnly(files, "durable memory file");
    expect(readFileSync(join(root, ".ut-tdd", "memory", memoryFile), "utf8")).toContain(
      "durable_reason: 変わらない制約",
    );
  });

  it.fails("CANDIDATE-U-STCHAN-003: whitespace-only durable reason is rejected", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "memory",
      "add",
      "--kind",
      "project",
      "--title",
      "Blank reason",
      "--body",
      "A rule.",
      "--durable-reason",
      "   ",
    ]);
    expectStarted(result);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("episodic_memory_rejected");
    expect(existsSync(join(root, ".ut-tdd", "memory"))).toBe(false);
  });

  it("CANDIDATE-U-STCHAN-004: feedback with a PR number remains accepted", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "memory",
      "add",
      "--kind",
      "feedback",
      "--title",
      "PR #700 の重複 request は merge を塞ぐ",
      "--body",
      "Keep this lesson searchable.",
    ]);
    expectStarted(result);
    expect(result.status).toBe(0);
    const files = readdirSync(join(root, ".ut-tdd", "memory"));
    expect(files).toHaveLength(1);
    const memoryFile = requireOnly(files, "feedback memory file");
    expect(readFileSync(join(root, ".ut-tdd", "memory", memoryFile), "utf8")).toContain(
      "kind: feedback",
    );
  });

  it("CANDIDATE-U-STCHAN-005: reference and user lessons containing an issue number remain accepted", () => {
    for (const kind of ["reference", "user"] as const) {
      const root = tempRepo();
      const result = runCli(root, [
        "memory",
        "add",
        "--kind",
        kind,
        "--title",
        `Issue 898 ${kind} lesson`,
        "--body",
        "Keep this canonical lesson.",
      ]);
      expectStarted(result);
      expect(result.status).toBe(0);
      const files = readdirSync(join(root, ".ut-tdd", "memory"));
      expect(files).toHaveLength(1);
      const memoryFile = requireOnly(files, `${kind} memory file`);
      expect(readFileSync(join(root, ".ut-tdd", "memory", memoryFile), "utf8")).toContain(
        `kind: ${kind}`,
      );
    }
  });

  it.fails("CANDIDATE-U-STCHAN-006: every tracked memory record is accepted by the classifier", async () => {
    const module = await import("../src/memory/service.ts");
    const classify = (module as Record<string, unknown>).classifyMemoryAdd;
    expect(typeof classify).toBe("function");
    if (typeof classify !== "function") return;
    const tracked = spawnSync("git", ["ls-files", ".ut-tdd/memory"], {
      cwd: repoRoot,
      encoding: "utf8",
      windowsHide: true,
    });
    expect(tracked.status).toBe(0);
    const paths = tracked.stdout.split(/\r?\n/).filter(Boolean);
    expect(paths).toHaveLength(46);
    const records = paths.map((path) => {
      const text = readFileSync(join(repoRoot, path), "utf8");
      const kind = /^kind:\s*(feedback|reference|user|project)\s*$/m.exec(text)?.[1];
      const title = /^title:\s*["']?(.+?)["']?\s*$/m.exec(text)?.[1] ?? path;
      return { path, kind, title };
    });
    expect(records.every((record) => record.kind !== undefined)).toBe(true);
    expect(records.filter((record) => record.kind === "project")).toHaveLength(0);
    const decisions = records.map(({ kind, title }) =>
      (classify as (input: unknown) => unknown)({ kind, title }),
    );
    expect(decisions).toHaveLength(46);
    for (const decision of decisions) expectAcceptedDecision(decision);
  });
});

describe("Issue #1062: review custody no longer depends on memory", () => {
  it.fails("CANDIDATE-U-STCHAN-007: v2 identity has four keys and an independently derived stable digest", async () => {
    const identityInput = { pr: 283, exactHead: "a".repeat(40), authorFamily: "codex" as const };
    const identity = {
      schemaVersion: "review-request/v2",
      pr: identityInput.pr,
      exactHead: identityInput.exactHead,
      authorFamily: identityInput.authorFamily,
    };
    const independentExpected = `rv1-${createHash("sha256")
      .update(
        JSON.stringify({
          authorFamily: "codex",
          exactHead: "a".repeat(40),
          pr: 283,
          schemaVersion: "review-request/v2",
        }),
      )
      .digest("hex")}`;
    const root = tempRepo();
    const first = issueReviewRequest({
      repoRoot: root,
      request: {
        ...identityInput,
        schemaVersion: "review-request/v2",
        reviewRevision: independentExpected,
        requestedAt: "2026-10-16T00:00:00.000Z",
        invocationNonce: "nonce-first",
      } as never,
      strict: true,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const module = await import("../src/feedback/review-custody-canonical.ts");
    const buildIdentity = (module as Record<string, unknown>).reviewIdentityObjectV2;
    expect(typeof buildIdentity).toBe("function");
    if (typeof buildIdentity !== "function") return;
    expect(
      (buildIdentity as (value: typeof identityInput) => Record<string, unknown>)(identityInput),
    ).toEqual(identity);
    const second = issueReviewRequest({
      repoRoot: root,
      request: {
        ...identityInput,
        schemaVersion: "review-request/v2",
        reviewRevision: independentExpected,
        requestedAt: "2026-10-16T00:01:00.000Z",
        invocationNonce: "nonce-second",
      } as never,
      strict: true,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.digest).toBe(independentExpected.replace(/^rv1-/, ""));
    expect(second.path).toBe(first.path);
    expect(first.request.requestedAt).not.toBe(second.request.requestedAt);
    expect(first.request.invocationNonce).not.toBe(second.request.invocationNonce);
    expect(first.request).not.toHaveProperty("memoryId");
    expect(second.request).not.toHaveProperty("memoryId");
    const dispatch = analyzeReviewDispatch({
      requests: [first.request, second.request] as never,
      receipts: [],
      prs: [{ pr: 283, headSha: identityInput.exactHead, state: "OPEN", checksGreen: true }],
      now: "2026-10-16T00:02:00.000Z",
    });
    expect(dispatch.diagnostics).not.toEqual(
      expect.arrayContaining([expect.stringContaining("duplicate_request_conflict")]),
    );
    expect(dispatch.entries.flatMap((entry) => entry.reasons)).not.toContain(
      "duplicate_request_conflict",
    );
  });

  it.fails("CANDIDATE-U-STCHAN-008: changing exactHead changes the v2 identity digest", async () => {
    const module = await import("../src/feedback/review-custody-canonical.ts");
    const buildIdentity = (module as Record<string, unknown>).reviewIdentityObjectV2;
    expect(typeof buildIdentity).toBe("function");
    if (typeof buildIdentity !== "function") return;
    const base = { pr: 283, exactHead: "a".repeat(40), authorFamily: "codex" as const };
    const changed = { ...base, exactHead: "b".repeat(40) };
    const derive = (value: typeof base) => {
      const identity = (buildIdentity as (input: typeof base) => Record<string, unknown>)(value);
      const canonical = canonicalize(identity);
      expect(canonical.ok).toBe(true);
      return canonical.ok ? createHash("sha256").update(canonical.value).digest("hex") : "";
    };
    expect(derive(base)).not.toBe(derive(changed));
  });

  it("CANDIDATE-U-STCHAN-009: fixed historical v1 terminal evidence remains readable beside a v2 request", () => {
    const root = tempRepo();
    const head = "b".repeat(40);
    const legacyIdentity = {
      schemaVersion: "review-request/v1" as const,
      memoryId: "memory:project:legacy-review-283",
      pr: 283,
      exactHead: head,
      authorFamily: "codex" as const,
    };
    const revision = computeReviewRevision(legacyIdentity);
    expect(revision).toEqual({
      ok: true,
      value: "rv1-b915b3989d72d66eb7d17c388beab9eabec19743ffa4d0186e6dea0f9c96c9e9",
    });
    if (!revision.ok) throw new Error(`historical identity fixture invalid: ${revision.reason}`);
    const requests = join(root, ".ut-tdd", "review", "requests");
    const receipts = join(root, ".ut-tdd", "review", "receipts");
    mkdirSync(requests, { recursive: true });
    mkdirSync(receipts, { recursive: true });
    const historicalRequestBytes = `{
  "memoryId": "memory:project:legacy-review-283",
  "pr": 283,
  "exactHead": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "reviewRevision": "rv1-b915b3989d72d66eb7d17c388beab9eabec19743ffa4d0186e6dea0f9c96c9e9",
  "authorFamily": "codex",
  "requestedAt": "2026-10-16T00:00:00.000Z",
  "invocationNonce": "nonce-historical-v1"
}\n`;
    const historicalReceiptBytes = `{
  "memoryId": "memory:project:legacy-review-283",
  "pr": 283,
  "head": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "reviewRevision": "rv1-b915b3989d72d66eb7d17c388beab9eabec19743ffa4d0186e6dea0f9c96c9e9",
  "reviewerFamily": "claude",
  "kind": "verdict",
  "verdict": "PASS",
  "blockingFindings": [],
  "at": "2026-10-16T00:01:00.000Z"
}\n`;
    const v1Request = JSON.parse(historicalRequestBytes) as Record<string, unknown>;
    const v1Receipt = JSON.parse(historicalReceiptBytes) as Record<string, unknown>;
    expect(v1Request.memoryId).toBe(legacyIdentity.memoryId);
    expect(v1Receipt.memoryId).toBe(v1Request.memoryId);
    expect(v1Receipt.kind).toBe("verdict");
    writeFileSync(join(requests, "historical-v1.json"), historicalRequestBytes);
    writeFileSync(join(receipts, "historical-v1.json"), historicalReceiptBytes);
    // Mix a real four-key v2 identity at another head; do not invent a v2 receipt schema.
    const v2Identity = {
      schemaVersion: "review-request/v2",
      pr: 283,
      exactHead: "cccccccccccccccccccccccccccccccccccccccc",
      authorFamily: "codex",
    } as const;
    const v2Digest = createHash("sha256")
      .update(
        JSON.stringify({
          authorFamily: v2Identity.authorFamily,
          exactHead: v2Identity.exactHead,
          pr: v2Identity.pr,
          schemaVersion: v2Identity.schemaVersion,
        }),
      )
      .digest("hex");
    const v2Request = {
      ...v2Identity,
      reviewRevision: `rv1-${v2Digest}`,
      requestedAt: "2026-10-16T00:00:00.000Z",
      invocationNonce: "nonce-v2-other-head",
    };
    expect(v2Request.reviewRevision).toBe(`rv1-${v2Digest}`);
    expect(Object.keys(v2Request).sort()).toEqual([
      "authorFamily",
      "exactHead",
      "invocationNonce",
      "pr",
      "requestedAt",
      "reviewRevision",
      "schemaVersion",
    ]);
    writeFileSync(join(requests, "current-v2-other-head.json"), `${JSON.stringify(v2Request)}\n`);
    const mergeResult = runPrMerge({
      repoRoot: root,
      pr: 283,
      now: () => "2026-10-16T00:02:00.000Z",
      ports: {
        getPullRequest: () => ({
          pr: 283,
          headSha: head,
          evaluatedHeadSha: head,
          state: "OPEN",
          checksGreen: true,
        }),
        mergePullRequest: () => undefined,
      },
    });
    expect(mergeResult.ok).toBe(true);
    expect(mergeResult.decision).toBe("merge");

    const backstop = scanPostMergeBackstop({
      repoRoot: root,
      now: "2026-10-16T00:03:00.000Z",
      fetchMergedPrPage: (page) =>
        page === 1
          ? [
              {
                number: 283,
                merged_at: "2026-10-16T00:02:30.000Z",
                merge_commit_sha: "e".repeat(40),
                head: { sha: head },
              },
            ]
          : [],
    });
    expect(backstop.ok).toBe(true);
    expect(backstop.detections).toEqual([]);
  });

  it.fails("CANDIDATE-U-STCHAN-010: deprecated review memory id is ignored with a warning", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "codex",
      "--role",
      "se",
      "--task",
      "review fixture",
      "--dry-run",
      "--review-memory-id",
      "legacy-memory",
      "--review-pr",
      "283",
      "--review-head",
      "a".repeat(40),
      "--review-author-family",
      "claude",
    ]);
    expectStarted(result);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("review_memory_id_deprecated");
    expect(result.stdout).toContain('"schemaVersion":"review-request/v2"');
    expect(result.stdout).not.toContain('"memoryId"');
  });

  it.fails("CANDIDATE-U-STCHAN-011: retired review memory id fails before creating a request", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "codex",
      "--role",
      "se",
      "--task",
      "review fixture",
      "--dry-run",
      "--review-memory-id",
      "legacy-memory",
      "--review-pr",
      "283",
      "--review-head",
      "a".repeat(40),
      "--review-author-family",
      "claude",
    ]);
    expectStarted(result);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("review_memory_id_retired");
    expect(existsSync(join(root, ".ut-tdd", "review", "requests"))).toBe(false);
  });

  it.fails("CANDIDATE-U-STCHAN-012: live dispatch identity excludes task prose and preserves first task copy", () => {
    const root = tempRepo();
    const taskOne = join(root, "review-task-one.md");
    const taskTwo = join(root, "review-task-two.md");
    const firstBody = "Review only the first supplied task body.\n";
    const secondBody = "A different task body, same canonical review identity.\n";
    writeFileSync(taskOne, firstBody);
    writeFileSync(taskTwo, secondBody);
    const identity = {
      schemaVersion: "review-request/v2",
      pr: 283,
      exactHead: "a".repeat(40),
      authorFamily: "codex",
    };
    const expectedDigest = createHash("sha256")
      .update(
        JSON.stringify({
          authorFamily: identity.authorFamily,
          exactHead: identity.exactHead,
          pr: identity.pr,
          schemaVersion: identity.schemaVersion,
        }),
      )
      .digest("hex");
    const dispatch = (taskFile: string) =>
      runCli(root, [
        "review",
        "live-dispatch",
        "--task-file",
        taskFile,
        "--pr",
        String(identity.pr),
        "--head",
        identity.exactHead,
        "--revision",
        `rv1-${expectedDigest}`,
        "--author-family",
        identity.authorFamily,
        "--operation-id",
        "same-review-identity",
        "--json",
      ]);
    const first = dispatch(taskOne);
    expectStarted(first);
    expect(first.status).toBe(0);
    const second = dispatch(taskTwo);
    expectStarted(second);
    expect(second.status).toBe(0);
    expect(`${second.stderr}\n${second.stdout}`).toMatch(/warn/i);
    expect(existsSync(join(root, ".ut-tdd", "memory"))).toBe(false);
    const requestPath = join(root, ".ut-tdd", "review", "requests", `${expectedDigest}.json`);
    const taskCopyPath = join(root, ".ut-tdd", "review", "requests", `${expectedDigest}.task.md`);
    expect(existsSync(requestPath)).toBe(true);
    expect(existsSync(taskCopyPath)).toBe(true);
    expect(readFileSync(taskCopyPath, "utf8")).toBe(firstBody);
    const request = JSON.parse(readFileSync(requestPath, "utf8")) as Record<string, unknown>;
    expect(request).toMatchObject(identity);
    expect(request).not.toHaveProperty("memoryId");
    expect(request).not.toHaveProperty("memoryPath");
    expect(request).not.toHaveProperty("task");
    expect(request).not.toHaveProperty("taskFile");
    expect(
      readdirSync(join(root, ".ut-tdd", "review", "requests")).filter((name) =>
        name.endsWith(".json"),
      ),
    ).toEqual([`${expectedDigest}.json`]);
    expect(
      readdirSync(join(root, ".ut-tdd", "review", "requests")).filter((name) =>
        name.endsWith(".task.md"),
      ),
    ).toEqual([`${expectedDigest}.task.md`]);
    const inbox = join(root, ".ut-tdd", "runtime", "claude-memory-wake", "inbox");
    const notifications = readdirSync(inbox).filter((name) => name.endsWith(".json"));
    expect(notifications.length).toBeGreaterThan(0);
    const entries = notifications.map(
      (name) => JSON.parse(readFileSync(join(inbox, name), "utf8")) as Record<string, unknown>,
    );
    const reviewNotification = entries.find(
      (entry) =>
        entry.schemaVersion === "ut-tdd.notification/v1" &&
        entry.purpose === "review" &&
        entry.requestDigest === expectedDigest &&
        entry.requestPath === `.ut-tdd/review/requests/${expectedDigest}.json` &&
        entry.pr === identity.pr &&
        entry.exactHead === identity.exactHead &&
        entry.authorFamily === identity.authorFamily &&
        entry.reviewRevision === `rv1-${expectedDigest}`,
    );
    expect(reviewNotification).toBeDefined();
    expect(reviewNotification).not.toHaveProperty("memoryId");
    expect(reviewNotification).not.toHaveProperty("memoryPath");
  });

  it.fails("CANDIDATE-U-STCHAN-013: v2 request rejects an added memoryId key but accepts the exact request", async () => {
    const root = tempRepo();
    const identity = {
      schemaVersion: "review-request/v2",
      pr: 283,
      exactHead: "b".repeat(40),
      authorFamily: "codex",
    } as const;
    const digest = createHash("sha256")
      .update(
        JSON.stringify({
          authorFamily: identity.authorFamily,
          exactHead: identity.exactHead,
          pr: identity.pr,
          schemaVersion: identity.schemaVersion,
        }),
      )
      .digest("hex");
    const requestPath = `.ut-tdd/review/requests/${digest}.json`;
    mkdirSync(join(root, ".ut-tdd", "review", "requests"), { recursive: true });
    const request = {
      ...identity,
      reviewRevision: `rv1-${digest}`,
      requestedAt: "2026-10-16T00:00:00.000Z",
      invocationNonce: "nonce-v2",
    };
    const memory = writeMemory({
      repoRoot: root,
      input: {
        kind: "feedback",
        title: "Review task fixture",
        body: "A real tracked task memory supplies the current v4 envelope producer.",
      },
    });
    const envelope = buildClaudeProviderReviewInboxEntry({
      memory,
      projectId: "example/repo",
      operationId: "issue-1062-candidate-013",
      workspaceId: "d".repeat(64),
      producer: { provider: "codex", sessionId: "codex-review" },
      target: { scope: "session", provider: "claude", sessionId: "claude-review" },
      requestDigest: digest,
      requestPath,
      pr: identity.pr,
      exactHead: identity.exactHead,
      reviewRevision: request.reviewRevision,
      authorFamily: identity.authorFamily,
      now: "2026-10-16T00:00:00.000Z",
    });
    writeFileSync(join(root, requestPath), `${JSON.stringify(request)}\n`);
    expect(Object.keys(request).sort()).toEqual([
      "authorFamily",
      "exactHead",
      "invocationNonce",
      "pr",
      "requestedAt",
      "reviewRevision",
      "schemaVersion",
    ]);
    expect.soft(loadCanonicalLiveReviewRequest({ repoRoot: root, envelope })).toEqual(request);
    writeFileSync(
      join(root, requestPath),
      `${JSON.stringify({ ...request, memoryId: "legacy" })}\n`,
    );
    expect(loadCanonicalLiveReviewRequest({ repoRoot: root, envelope })).toBeNull();
  });

  it.fails("CANDIDATE-U-STCHAN-014: custody runner accepts a v2 request without memory identity env", async () => {
    const values: Record<string, string> = {
      GITHUB_REPOSITORY: "example/repo",
      UT_TDD_CUSTODY_PR: "283",
      UT_TDD_CUSTODY_PLAN_ID: "PLAN-L7-465",
      UT_TDD_CUSTODY_PLAN_REVISION: "a".repeat(64),
      UT_TDD_CUSTODY_JUDGMENT_DIGEST: "b".repeat(64),
      UT_TDD_CUSTODY_PROVIDER_EVIDENCE_REF: `d3b:${"3".repeat(64)}`,
      UT_TDD_CUSTODY_REVIEWER_FAMILY: "claude",
      UT_TDD_CUSTODY_AUTHOR_FAMILY: "codex",
      UT_TDD_CUSTODY_VERDICT: "PASS",
      GITHUB_WORKFLOW_REF: "example/repo/.github/workflows/review.yml@refs/heads/main",
      GITHUB_SHA: "c".repeat(40),
      GITHUB_RUN_ID: "12345",
      GITHUB_RUN_ATTEMPT: "1",
      UT_TDD_CUSTODY_RECEIPT_PATH: "receipt.json",
    };
    expect(values).not.toHaveProperty("UT_TDD_CUSTODY_MEMORY_ID");
    const pullRequest = {
      number: 283,
      state: "open",
      merged: false,
      merged_at: null,
      merge_commit_sha: null,
      base: { ref: "main" },
      head: { sha: "d".repeat(40), repo: { full_name: "example/repo" } },
    };
    let written = "";
    let writeCount = 0;
    const env: RunnerEnvironment = {
      get: (name) => values[name],
      runGh: () => ({ status: 0, stdout: JSON.stringify(pullRequest) }),
      readFile: () => {
        throw new Error("issue must not read an existing receipt");
      },
      writeFile: (_path, content) => {
        written = content;
        writeCount += 1;
      },
      log: () => undefined,
    };
    values.UT_TDD_CUSTODY_MEMORY_ID = "project-review-pr-283-exact-head";
    const withMemoryId = issueCustodyReceipt(env);
    expect(withMemoryId.exitCode).toBe(0);
    expect(writeCount).toBe(1);
    expect(JSON.parse(written)).toMatchObject({
      requestIdentity: { memoryId: "project-review-pr-283-exact-head" },
    });

    delete values.UT_TDD_CUSTODY_MEMORY_ID;
    written = "";
    writeCount = 0;
    let outcome: ReturnType<typeof issueCustodyReceipt> | undefined;
    let runnerError: string | undefined;
    try {
      outcome = issueCustodyReceipt(env);
    } catch (error) {
      runnerError = error instanceof Error ? error.message : String(error);
    }
    expect.soft(runnerError, "custody runner must not require memory identity env").toBeUndefined();
    expect.soft(outcome).toMatchObject({ exitCode: 0 });
    if (!outcome || outcome.exitCode !== 0) return;
    expect(writeCount).toBe(1);
    const receipt = JSON.parse(written) as Record<string, unknown>;
    expect(receipt).not.toHaveProperty("memoryId");
    expect(JSON.stringify(receipt)).not.toContain("memoryId");
  });
});

describe("Issue #1062: runtime notifications are memory-free", () => {
  it.fails("CANDIDATE-U-STCHAN-015: notify claude writes a memory-free notification v1 entry", () => {
    const root = tempRepo();
    const result = runCli(root, [
      "notify",
      "claude",
      "--ref",
      "https://github.com/example/repo/pull/283#issuecomment-1",
      "--body",
      "review is ready",
      "--operation-id",
      "notify-test",
      "--json",
    ]);
    expectStarted(result);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("ut-tdd.notification/v1");
    expect(result.stdout).toContain('"purpose":"note"');
    expect(result.stdout).not.toMatch(/memory_id|memoryPath/);
    const inbox = join(root, ".ut-tdd", "runtime", "claude-memory-wake", "inbox");
    const files = readdirSync(inbox).filter((name) => name.endsWith(".json"));
    expect(files).toHaveLength(1);
    const inboxFile = requireOnly(files, "notification inbox entry");
    const entry = JSON.parse(readFileSync(join(inbox, inboxFile), "utf8")) as Record<
      string,
      unknown
    >;
    expect(entry).toMatchObject({
      schemaVersion: "ut-tdd.notification/v1",
      purpose: "note",
      ref: "https://github.com/example/repo/pull/283#issuecomment-1",
      body: "review is ready",
    });
    expect(entry).not.toHaveProperty("memory_id");
    expect(entry).not.toHaveProperty("memoryId");
    expect(entry).not.toHaveProperty("memoryPath");
  });

  it.fails("CANDIDATE-U-STCHAN-016: notify rejects a missing, foreign-repository, or non-GitHub ref", () => {
    for (const ref of [
      undefined,
      "https://github.com/other/repo/pull/1",
      "https://example.com/x",
    ]) {
      const root = tempRepo();
      const inbox = join(root, ".ut-tdd", "runtime", "claude-memory-wake", "inbox");
      const args = ["notify", "claude", "--body", "x"];
      if (ref) args.push("--ref", ref);
      const result = runCli(root, args);
      expectStarted(result);
      expect(result.status).toBe(1);
      expect(`${result.stderr}\n${result.stdout}`).not.toMatch(/unknown command|unknown option/i);
      expect(existsSync(inbox)).toBe(false);
    }
  });

  it.fails("CANDIDATE-U-STCHAN-017: legacy inbox entry versions remain readable beside notification v1", async () => {
    const module = await import("../src/runtime/claude-memory-wake.ts");
    const decode = module.decodeClaudeInboxEntry;
    const select = module.selectClaudeInboxEntry;
    const terminal = module.evaluateClaudeInboxTerminal;
    const workspaceId = "a".repeat(64);
    const memory = {
      memory_id: "memory:feedback:legacy-inbox",
      kind: "feedback",
      title: "legacy inbox fixture",
      body: "legacy memory entry",
      tags: [],
      source_path: ".ut-tdd/memory/feedback-legacy-inbox.md",
      updated_at: "2026-10-15T00:00:00.000Z",
      content_hash: createHash("sha256").update("legacy memory entry").digest("hex"),
    } as MemoryEntry;
    const oldV3 = module.buildClaudeInboxEntry({
      memory,
      operationId: "op-v3",
      workspaceId,
      originRuntime: "codex",
      now: "2026-10-15T00:00:00.000Z",
    });
    const providerModule = await import("../src/runtime/claude-provider-envelope.ts");
    const oldV4 = providerModule.buildClaudeProviderInboxEntry({
      memory,
      projectId: "fixture-project",
      operationId: "op-v4",
      workspaceId,
      producer: { provider: "codex", sessionId: "producer" },
      target: { scope: "session", provider: "claude", sessionId: "target" },
      now: "2026-10-15T00:00:01.000Z",
    });
    const notificationV1 = {
      schemaVersion: "ut-tdd.notification/v1",
      purpose: "note",
      id: `note:${"c".repeat(64)}:workspace:${"a".repeat(64)}:op:op-note`,
      operationId: "op-note",
      projectId: "fixture-project",
      producer: { provider: "codex", sessionId: "producer" },
      target: { scope: "session", provider: "claude", sessionId: "target" },
      // Shape-valid only: L6 does not define a memory-free v1 digest recipe.
      // Do not treat this as integrity-valid until that contract is clarified.
      envelopeDigest: "d".repeat(64),
      ref: "https://github.com/example/repo/pull/283#issuecomment-1",
      body: "memory-free notification",
      targetWorkspaceId: "a".repeat(64),
      createdAt: "2026-10-15T00:00:02.000Z",
    };
    const entries = [oldV3, oldV4, notificationV1].map((entry) => decode(JSON.stringify(entry)));
    expect(entries.every((entry) => entry !== undefined)).toBe(true);
    if (entries.some((entry) => entry === undefined)) return;
    const decoded = entries as NonNullable<(typeof entries)[number]>[];
    expect(select(decoded, new Set())?.id).toBe("old-v3");
    const legacyDecision = terminal({
      entry: requireDefined(decoded[0], "v3 entry"),
      claimed: true,
    });
    expect(legacyDecision).toEqual({ terminal: true, reason: "claimed" });
    expect(select(decoded, new Set(["old-v3"]))?.id).toBe("old-v4");
    expect(terminal({ entry: requireDefined(decoded[1], "v4 entry"), claimed: true })).toEqual({
      terminal: true,
      reason: "claimed",
    });
    expect(select(decoded, new Set(["old-v3", "old-v4"]))?.id).toBe(notificationV1.id);
    expect(terminal({ entry: requireDefined(decoded[2], "v1 notification entry") })).toEqual({
      terminal: false,
    });
  });

  describe.skipIf(!(process.platform === "win32" || process.getuid?.() !== 0))(
    "CANDIDATE-U-STCHAN-018 permission-denied fixture",
    () => {
      let root: string | undefined;
      let memoryPath: string | undefined;
      let memoryFile: string | undefined;
      let permissionMayBeConfigured = false;
      let notificationResult: ReturnType<typeof runCli> | undefined;
      const protectedBytes = "permission-denied memory fixture\n";
      beforeAll(() => {
        const setupRoot = mkdtempSync(join(tmpdir(), "ut-tdd-state-channel-"));
        const setupMemoryPath = join(setupRoot, ".ut-tdd", "memory");
        const setupMemoryFile = join(setupMemoryPath, "protected.md");
        root = setupRoot;
        memoryPath = setupMemoryPath;
        memoryFile = setupMemoryFile;
        permissionMayBeConfigured = false;
        ensureTrackedProjectIdentity(setupRoot, "example/repo");
        mkdirSync(setupMemoryPath, { recursive: true });
        writeFileSync(setupMemoryFile, protectedBytes);

        if (process.platform === "win32") {
          // Set the cleanup flag first: even a partially applied ACL is reset by
          // afterAll, and setup failures cannot be swallowed by `it.fails`.
          permissionMayBeConfigured = true;
          const deny = spawnSync(
            "icacls",
            [setupMemoryPath, "/deny", `${process.env.USERNAME}:(OI)(CI)(RX)`, "/T", "/C"],
            {
              encoding: "utf8",
              windowsHide: true,
            },
          );
          expect(deny.error?.message ?? "", "icacls deny must start").toBe("");
          expect(deny.signal, "icacls deny must exit normally").toBeNull();
          expect(deny.status, String(deny.stderr)).toBe(0);
        } else {
          permissionMayBeConfigured = true;
          chmodSync(setupMemoryPath, 0);
        }

        expect(
          () => readdirSync(setupMemoryPath),
          "memory directory read must be denied",
        ).toThrow();
        notificationResult = runCli(setupRoot, [
          "notify",
          "claude",
          "--ref",
          "https://github.com/example/repo/pull/283#issuecomment-1",
          "--body",
          "review is ready",
        ]);
        // Process-spawn / signal failures are setup failures, not accepted Red.
        expectStarted(notificationResult);
        expect(notificationResult.status, "CLI must exit normally").not.toBeNull();
      });

      afterAll(() => {
        try {
          if (memoryPath && memoryFile && permissionMayBeConfigured) {
            if (process.platform === "win32") {
              const reset = spawnSync("icacls", [memoryPath, "/reset", "/T", "/C"], {
                encoding: "utf8",
                windowsHide: true,
              });
              expect(reset.error?.message ?? "", "icacls reset must start").toBe("");
              expect(reset.signal, "icacls reset must exit normally").toBeNull();
              expect(reset.status, reset.stderr).toBe(0);
            } else {
              chmodSync(memoryPath, 0o700);
            }
            expect(readFileSync(memoryFile, "utf8")).toBe(protectedBytes);
          }
        } finally {
          if (root) removeTestTree(root);
        }
      });

      it.fails("CANDIDATE-U-STCHAN-018: notify succeeds with the memory directory unreadable", () => {
        // Before the notify command exists, this is only a command-surface Red:
        // the expected failure is this success assertion. Once implemented,
        // a zero exit under the verified deny fixture is the non-reference oracle.
        expect(notificationResult?.status).toBe(0);
      });
    },
  );
});

describe("Issue #1062: handover prose is retired", () => {
  it.fails("CANDIDATE-U-STCHAN-019: handover writes only CURRENT.json and dry-run is non-mutating", () => {
    const root = tempRepo();
    mkdirSync(join(root, ".ut-tdd", "handover", "provider"), { recursive: true });
    mkdirSync(join(root, ".ut-tdd", "handover", "archive"), { recursive: true });
    mkdirSync(join(root, "docs", "handover"), { recursive: true });
    writeFileSync(join(root, ".ut-tdd", "handover", ".gitkeep"), "");
    writeFileSync(
      join(root, ".ut-tdd", "handover", "CURRENT.json"),
      '{"active_plan":"PLAN-L7-04"}\n',
    );
    writeFileSync(join(root, ".ut-tdd", "handover", "provider", "current.json"), "{}\n");
    writeFileSync(join(root, "docs", "handover", "existing.md"), "tracked historical prose\n");
    const beforeDry = {
      runtime: snapshotTree(join(root, ".ut-tdd", "handover")),
      docs: snapshotTree(join(root, "docs", "handover")),
      tracked: trackedPaths(root, ".ut-tdd/handover", "docs/handover"),
    };
    const dry = runCli(root, ["handover", "--dry-run"]);
    expectStarted(dry);
    expect(dry.status).toBe(0);
    expect({
      runtime: snapshotTree(join(root, ".ut-tdd", "handover")),
      docs: snapshotTree(join(root, "docs", "handover")),
      tracked: trackedPaths(root, ".ut-tdd/handover", "docs/handover"),
    }).toEqual(beforeDry);
    const beforeRun = {
      runtime: snapshotTree(join(root, ".ut-tdd", "handover")),
      docs: snapshotTree(join(root, "docs", "handover")),
      tracked: trackedPaths(root, ".ut-tdd/handover", "docs/handover"),
    };
    const run = runCli(root, ["handover"]);
    expectStarted(run);
    expect(run.status).toBe(0);
    expect(existsSync(join(root, ".ut-tdd", "handover", "CURRENT.json"))).toBe(true);
    expect(snapshotTree(join(root, "docs", "handover"))).toEqual(beforeRun.docs);
    expect(trackedPaths(root, ".ut-tdd/handover", "docs/handover")).toEqual(beforeRun.tracked);
    const runtimeFilesAfter = snapshotTree(join(root, ".ut-tdd", "handover"));
    const runtimeEntriesWithoutCurrent = (entries: string[]) =>
      entries.filter((entry) => !entry.startsWith("file:CURRENT.json:"));
    expect(runtimeEntriesWithoutCurrent(runtimeFilesAfter)).toEqual(
      runtimeEntriesWithoutCurrent(beforeRun.runtime),
    );
    expect(runtimeFilesAfter).toHaveLength(beforeRun.runtime.length);
    expect(runtimeFilesAfter.find((entry) => entry.startsWith("file:CURRENT.json:"))).toMatch(
      /^file:CURRENT\.json:/,
    );
    const pointer = JSON.parse(
      readFileSync(join(root, ".ut-tdd", "handover", "CURRENT.json"), "utf8"),
    );
    expect(pointer).not.toHaveProperty("latest_doc");
    expect(pointer).not.toHaveProperty("doc_entry_count");
  });

  it.fails("CANDIDATE-U-STCHAN-020: the isolated doctor handover-prose definition reports an advisory count", () => {
    const root = tempRepo();
    const handover = join(root, ".ut-tdd", "handover");
    mkdirSync(join(handover, "provider"), { recursive: true });
    mkdirSync(join(handover, "archive"), { recursive: true });
    writeFileSync(join(handover, "CURRENT.json"), "{}\n");
    writeFileSync(join(handover, ".gitkeep"), "");
    writeFileSync(join(handover, "close-20261009.md"), "old prose\n");
    writeFileSync(join(handover, "x.sh"), "# old\n");
    const deps: DoctorDeps = {
      repoRoot: root,
      now: "2026-10-16T00:00:00.000Z",
      readText: (path) => (existsSync(path) ? readFileSync(path, "utf8") : null),
      listDir: (path) => (existsSync(path) ? readdirSync(path) : []),
      worktreeTopology: { facts: [], adminEntries: [] },
    };
    const definition = buildDoctorCheckDefinitionGroups(deps)
      .flatMap((group) => group.definitions)
      .find((entry) => entry.id === "handover-prose");
    expect(
      definition,
      "the handover-prose check must be an isolated doctor definition",
    ).toBeDefined();
    if (!definition) return;
    const result = definition.run();
    expect(result.ok).toBe(true);
    expect(result.messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/handover-prose.*2.*advisory/)]),
    );
  });

  it.fails("CANDIDATE-U-STCHAN-021: pointer without doc_entry_count does not trigger a handover bypass warning", () => {
    const files = new Map<string, string>([
      ["/repo/.ut-tdd/handover/CURRENT.json", '{"active_plan":"PLAN-L7-04"}\n'],
    ]);
    const deps: HandoverDeps = {
      repoRoot: "/repo",
      now: () => "2026-10-16T00:00:00.000Z",
      readText: (path) => files.get(path) ?? null,
      writeText: (path, text) => files.set(path, text),
      listDir: (path) =>
        [...files.keys()]
          .filter((entry) => entry.startsWith(`${path}/`))
          .map((entry) => entry.slice(path.length + 1)),
    };
    expect(checkHandoverBypass(deps)).toEqual([]);
  });
});

describe("Issue #1062: migration is frozen, verifiable, and atomic", () => {
  it.fails("CANDIDATE-U-STCHAN-022: dry-run selects only frozen untracked project episodes", () => {
    const root = tempRepo();
    const add = (kind: "feedback" | "project", title: string, body: string) =>
      writeMemory({ repoRoot: root, input: { kind, title, body } });
    const trackedFeedback = add("feedback", "Tracked feedback PR 701", "Keep this lesson.");
    const staged = spawnSync("git", ["add", trackedFeedback.source_path], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    expect(staged.status).toBe(0);
    const untrackedFeedback = add("feedback", "PR 700 durable feedback", "Do not migrate lessons.");
    const numbered = add(
      "project",
      "PR 702 episodic note",
      "Untracked project episode with a number.",
    );
    const unnumbered = add(
      "project",
      "Unnumbered episodic note",
      "Untracked project episode without a number.",
    );
    const referenced = add(
      "project",
      "Open review task anchor",
      "An open review task still references this memory.",
    );
    const durableBeforeFreeze = add(
      "project",
      "Frozen durable invariant",
      "A pre-cutover permanent constraint.",
    );
    addDurableReason(root, durableBeforeFreeze.source_path, "pre-existing durable invariant");
    freezeTargetSnapshot(root, [numbered, unnumbered, referenced, durableBeforeFreeze]);
    const durableAfterFreeze = add(
      "project",
      "Post-cutover durable invariant",
      "A later accepted permanent constraint.",
    );
    addDurableReason(root, durableAfterFreeze.source_path, "accepted after the frozen snapshot");
    mkdirSync(join(root, ".ut-tdd", "review", "requests"), { recursive: true });
    const openRequest = {
      schemaVersion: "review-request/v1",
      memoryId: referenced.memory_id,
      pr: 283,
      exactHead: "a".repeat(40),
      reviewRevision: "rv1-open-request",
      authorFamily: "codex",
      requestedAt: "2026-10-16T00:00:00.000Z",
    };
    writeFileSync(
      join(root, ".ut-tdd", "review", "requests", "legacy-open.json"),
      `${JSON.stringify(openRequest)}\n`,
      "utf8",
    );
    const indexed = runCli(root, ["memory", "list", "--query", "durable invariant"]);
    expectStarted(indexed);
    expect(indexed.status).toBe(0);
    expect(indexed.stdout).toContain(durableBeforeFreeze.title);
    expect(indexed.stdout).toContain(durableAfterFreeze.title);
    const snapshotText = readFileSync(
      join(root, ".ut-tdd", "archive", "memory-episodes", "target-snapshot.jsonl"),
      "utf8",
    );
    const snapshotRows = snapshotText
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
    expect(snapshotRows.map((row: { memory_id: string }) => row.memory_id).sort()).toEqual(
      [
        numbered.memory_id,
        unnumbered.memory_id,
        referenced.memory_id,
        durableBeforeFreeze.memory_id,
      ].sort(),
    );
    expect(
      snapshotRows.every(
        (row: Record<string, unknown>) =>
          Object.keys(row).sort().join(",") === "content_sha256,memory_id" &&
          typeof row.content_sha256 === "string" &&
          /^[0-9a-f]{64}$/.test(row.content_sha256),
      ),
    ).toBe(true);
    expect(snapshotRows.map((row: { memory_id: string }) => row.memory_id)).not.toContain(
      durableAfterFreeze.memory_id,
    );
    const evidence = JSON.parse(
      readFileSync(join(root, "docs", "migration", "state-channel-target-snapshot.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(Object.keys(evidence).sort()).toEqual(["count", "recorded_at", "schema", "sha256"]);
    expect(evidence).toMatchObject({
      schema: "ut-tdd.state-channel-target-snapshot/v1",
      count: 4,
      sha256: createHash("sha256").update(snapshotText, "utf8").digest("hex"),
    });
    const durableBeforeFreezeBytes = readFileSync(join(root, durableBeforeFreeze.source_path));
    const before = {
      memory: snapshotTree(join(root, ".ut-tdd", "memory")),
      tracked: trackedPaths(
        root,
        ".ut-tdd/memory",
        "docs/migration/state-channel-target-snapshot.json",
      ),
      snapshot: readFileSync(
        join(root, ".ut-tdd", "archive", "memory-episodes", "target-snapshot.jsonl"),
        "utf8",
      ),
      evidence: readFileSync(
        join(root, "docs", "migration", "state-channel-target-snapshot.json"),
        "utf8",
      ),
      db: runCli(root, ["db", "status", "--json"]),
    };
    expectStarted(before.db);
    expect(before.db.status).toBe(0);

    const result = runCli(root, ["memory", "retire", "--dry-run", "--json"]);
    expectStarted(result);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout) as Record<string, unknown>;
    const reportText = JSON.stringify(report);
    expect(reportText).toContain(numbered.memory_id);
    expect(reportText).toContain(unnumbered.memory_id);
    expect(reportText).toContain(referenced.memory_id);
    expect(reportText).toContain(durableBeforeFreeze.memory_id);
    expect(reportText).toContain(durableAfterFreeze.memory_id);
    expect(reportText).toContain("skip");
    expect(reportText).toContain("feedback");
    expect(report.total).toBe(7);
    expect(report.categories).toBeInstanceOf(Array);
    const categories = report.categories as Array<{ count: number }>;
    expect(categories.reduce((sum, category) => sum + category.count, 0)).toBe(7);
    expect(
      existsSync(join(root, ".ut-tdd", "archive", "memory-episodes", "target-snapshot.jsonl")),
    ).toBe(true);
    expect(existsSync(join(root, numbered.source_path))).toBe(true);
    expect(existsSync(join(root, unnumbered.source_path))).toBe(true);
    expect(existsSync(join(root, durableBeforeFreeze.source_path))).toBe(true);
    expect(existsSync(join(root, durableAfterFreeze.source_path))).toBe(true);
    expect(readFileSync(join(root, durableBeforeFreeze.source_path))).toEqual(
      durableBeforeFreezeBytes,
    );
    expect(trackedPaths(root, trackedFeedback.source_path)).toEqual([trackedFeedback.source_path]);
    expect(trackedPaths(root, untrackedFeedback.source_path)).toEqual([]);
    for (const title of [durableBeforeFreeze.title, durableAfterFreeze.title]) {
      const search = runCli(root, ["memory", "list", "--query", title]);
      expectStarted(search);
      expect(search.status).toBe(0);
      expect(search.stdout).toContain(title);
    }
    const afterDb = runCli(root, ["db", "status", "--json"]);
    expectStarted(afterDb);
    expect(afterDb.status).toBe(0);
    expect({
      memory: snapshotTree(join(root, ".ut-tdd", "memory")),
      tracked: trackedPaths(
        root,
        ".ut-tdd/memory",
        "docs/migration/state-channel-target-snapshot.json",
      ),
      snapshot: readFileSync(
        join(root, ".ut-tdd", "archive", "memory-episodes", "target-snapshot.jsonl"),
        "utf8",
      ),
      evidence: readFileSync(
        join(root, "docs", "migration", "state-channel-target-snapshot.json"),
        "utf8",
      ),
      db: afterDb.stdout,
    }).toEqual({
      memory: before.memory,
      tracked: before.tracked,
      snapshot: before.snapshot,
      evidence: before.evidence,
      db: before.db.stdout,
    });
  });

  it.fails("CANDIDATE-U-STCHAN-024: real-repository migration dry-run is read-only and accounts for all files", () => {
    const paths = [".ut-tdd/memory", ".ut-tdd/handover"] as const;
    const before = {
      memory: snapshotTree(join(repoRoot, paths[0])),
      handover: snapshotTree(join(repoRoot, paths[1])),
      tracked: trackedPaths(repoRoot, ...paths),
      db: runCli(repoRoot, ["db", "status", "--json"]),
    };
    expectStarted(before.db);
    expect(before.db.status).toBe(0);
    const memoryRun = runCli(repoRoot, ["memory", "retire", "--dry-run", "--json"]);
    expectStarted(memoryRun);
    expect(memoryRun.status).toBe(0);
    const handoverRun = runCli(repoRoot, ["handover", "archive", "--dry-run", "--json"]);
    expectStarted(handoverRun);
    expect(handoverRun.status).toBe(0);
    const memoryReport = JSON.parse(memoryRun.stdout);
    const handoverReport = JSON.parse(handoverRun.stdout);
    expect(before.tracked.filter((path) => path.startsWith(".ut-tdd/memory/")).length).toBe(46);
    expect(memoryReport.total).toBe(
      memoryReport.categories.reduce((sum: number, row: { count: number }) => sum + row.count, 0),
    );
    expect(memoryReport.total).toBe(readdirSync(join(repoRoot, paths[0])).length);
    expect(
      memoryReport.categories.some(
        (row: { count: number }) => row.count === 46 && JSON.stringify(row).includes("tracked"),
      ),
    ).toBe(true);
    expect(handoverReport.total).toBe(
      handoverReport.categories.reduce((sum: number, row: { count: number }) => sum + row.count, 0),
    );
    expect(handoverReport.total).toBe(readdirSync(join(repoRoot, paths[1])).length);
    const afterDb = runCli(repoRoot, ["db", "status", "--json"]);
    expectStarted(afterDb);
    expect(afterDb.status).toBe(0);
    expect({
      memory: snapshotTree(join(repoRoot, paths[0])),
      handover: snapshotTree(join(repoRoot, paths[1])),
      tracked: trackedPaths(repoRoot, ...paths),
      db: afterDb.stdout,
    }).toEqual({
      memory: before.memory,
      handover: before.handover,
      tracked: before.tracked,
      db: before.db.stdout,
    });
  });

  // CANDIDATE-U-STCHAN-023 / 025–028 are intentionally deferred until the
  // execution-mouth clarification in L6 §7.1 is merged; do not guess an API.
});
