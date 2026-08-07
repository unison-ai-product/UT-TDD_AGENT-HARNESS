import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type GhPrMergePorts,
  type MergeGateFacts,
  runPrMerge,
} from "../src/feedback/review-merge-gate.ts";

const head = "a".repeat(40);
const otherHead = "b".repeat(40);
const now = "2026-08-07T01:00:00.000Z";

function facts(overrides: Partial<MergeGateFacts> = {}): MergeGateFacts {
  return {
    pr: 465,
    headSha: head,
    evaluatedHeadSha: head,
    state: "OPEN",
    checksGreen: true,
    ...overrides,
  };
}

function seedReview(root: string, verdict?: "PASS" | "FLAG", reviewHead = head): void {
  const requests = join(root, ".ut-tdd", "review", "requests");
  const receipts = join(root, ".ut-tdd", "review", "receipts");
  mkdirSync(requests, { recursive: true });
  mkdirSync(receipts, { recursive: true });
  writeFileSync(
    join(requests, "request.json"),
    JSON.stringify({
      memoryId: "review:465:head:1",
      pr: 465,
      exactHead: reviewHead,
      reviewRevision: "review-r1",
      authorFamily: "claude",
      requestedAt: "2026-08-07T00:30:00.000Z",
    }),
    { encoding: "utf8", flag: "w" },
  );
  if (verdict) {
    writeFileSync(
      join(receipts, "receipt.json"),
      JSON.stringify({
        memoryId: "review:465:head:1",
        pr: 465,
        head: reviewHead,
        reviewRevision: "review-r1",
        reviewerFamily: "codex",
        kind: "verdict",
        verdict,
        blockingFindings: verdict === "FLAG" ? ["finding"] : [],
        at: "2026-08-07T00:45:00.000Z",
      }),
      { encoding: "utf8", flag: "w" },
    );
  }
}

function ports(
  input: { getFacts?: () => MergeGateFacts; merge?: () => void } = {},
): GhPrMergePorts {
  return {
    getPullRequest: input.getFacts ?? (() => facts()),
    mergePullRequest: input.merge ?? (() => undefined),
  };
}

function receipt(root: string): Record<string, unknown> {
  const log = readdirSync(join(root, ".ut-tdd", "logs")).find((name) => name.endsWith(".jsonl"));
  if (!log) throw new Error("merge receipt not written");
  return JSON.parse(readFileSync(join(root, ".ut-tdd", "logs", log), "utf8").trim()) as Record<
    string,
    unknown
  >;
}

describe("D2-B PR merge gate", () => {
  it("U-RVMG-001: merge_ready の exact HEAD だけを merge し receipt を残す", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-"));
    let merged = false;
    try {
      seedReview(root, "PASS");
      const result = runPrMerge({
        repoRoot: root,
        pr: 465,
        now: () => now,
        ports: ports({
          merge: () => {
            merged = true;
          },
        }),
      });
      expect(result.ok).toBe(true);
      expect(merged).toBe(true);
      expect(receipt(root)).toMatchObject({
        pr: 465,
        headSha: head,
        verdict: "PASS",
        decision: "merge",
        reason: "merge_ready",
        timestamp: now,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([
    ["FLAG open", "FLAG" as const, "flagged"],
    ["verdict 無し", undefined, "verdict"],
  ])("U-RVMG-00x: %s は fail-close で merge せず receipt を残す", (_label, verdict, reasonPart) => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-"));
    let merged = false;
    try {
      seedReview(root, verdict);
      const result = runPrMerge({
        repoRoot: root,
        pr: 465,
        now: () => now,
        ports: ports({
          merge: () => {
            merged = true;
          },
        }),
      });
      expect(result.ok).toBe(false);
      expect(merged).toBe(false);
      expect(result.reason).toContain(reasonPart);
      expect(receipt(root)).toMatchObject({ pr: 465, headSha: head, decision: "deny" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVMG-004: HEAD mismatch は breach 側へ倒し merge しない", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-"));
    try {
      seedReview(root, "PASS");
      const result = runPrMerge({
        repoRoot: root,
        pr: 465,
        now: () => now,
        ports: ports({ getFacts: () => facts({ evaluatedHeadSha: otherHead }) }),
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain("head_mismatch");
      expect(receipt(root)).toMatchObject({ headSha: head, decision: "deny" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVMG-005: gh の PR 取得失敗は fail-close で receipt を残す", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-"));
    try {
      const result = runPrMerge({
        repoRoot: root,
        pr: 465,
        now: () => now,
        ports: ports({
          getFacts: () => {
            throw new Error("gh unavailable");
          },
        }),
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain("gh");
      expect(receipt(root)).toMatchObject({ pr: 465, headSha: null, decision: "deny" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVMG-006: merge 失敗でも wrapper receipt を残す", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-"));
    try {
      seedReview(root, "PASS");
      const result = runPrMerge({
        repoRoot: root,
        pr: 465,
        now: () => now,
        ports: ports({
          merge: () => {
            throw new Error("merge rejected");
          },
        }),
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain("merge");
      expect(receipt(root)).toMatchObject({
        pr: 465,
        headSha: head,
        verdict: "PASS",
        decision: "merge_failed",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
