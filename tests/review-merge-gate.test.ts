import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectUnattestedMerges,
  evaluateMergeGate,
  loadMergeGateReceipts,
  type MergeGateReceipt,
  writeMergeGateReceipt,
} from "../src/feedback/review-merge-gate";
import type {
  PrObservation,
  ReviewReceipt,
  ReviewRequest,
} from "../src/feedback/review-dispatch";

const head = "a".repeat(40);
const otherHead = "b".repeat(40);
const now = "2026-08-03T07:00:00.000Z";

function request(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
  return {
    memoryId: "review:900:head:rev",
    pr: 900,
    exactHead: head,
    reviewRevision: "review-rvmg-1",
    authorFamily: "claude",
    requestedAt: "2026-08-03T06:30:00.000Z",
    ...overrides,
  };
}

function verdictReceipt(overrides: Partial<ReviewReceipt> = {}): ReviewReceipt {
  return {
    memoryId: "review:900:head:rev",
    pr: 900,
    head,
    reviewRevision: "review-rvmg-1",
    reviewerFamily: "codex",
    kind: "verdict",
    verdict: "PASS",
    blockingFindings: [],
    at: "2026-08-03T06:45:00.000Z",
    ...overrides,
  };
}

function observation(overrides: Partial<PrObservation> = {}): PrObservation {
  return { pr: 900, headSha: head, state: "OPEN", checksGreen: true, ...overrides };
}

describe("D2 merge gate (U-RVMG)", () => {
  it("U-RVMG-001: 非 author family の PASS + CI green + OPEN + exact HEAD 一致で通る", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [verdictReceipt()],
      observation: observation(),
      now,
    });
    expect(decision.ok).toBe(true);
    expect(decision.state).toBe("merge_ready");
    expect(decision.reasons).toEqual([]);
  });

  it("U-RVMG-002: FLAG open は deny し blocking finding を理由へ保全する", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [
        verdictReceipt({ verdict: "FLAG", blockingFindings: ["NEUTRAL treated as success"] }),
      ],
      observation: observation(),
      now,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reasons.some((reason) => reason.startsWith("blocking_finding:"))).toBe(true);
  });

  it("U-RVMG-003: verdict 無しは deny する (SLA 内でも通さない)", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [],
      observation: observation(),
      now,
    });
    expect(decision.ok).toBe(false);
    expect(decision.state).not.toBe("merge_ready");
  });

  it("U-RVMG-004: PR HEAD が依頼 HEAD から進んだら旧 verdict では通さない", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [verdictReceipt()],
      observation: observation({ headSha: otherHead }),
      now,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reasons).toContain("no_request_for_current_head");
  });

  it("U-RVMG-005: 現 HEAD の request が無ければ deny (未宣言レビューを通さない)", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [],
      receipts: [],
      observation: observation(),
      now,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reasons).toContain("no_request_for_current_head");
  });

  it("U-RVMG-006: 同一 family の自己承認 PASS は通さない", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [verdictReceipt({ reviewerFamily: "claude" })],
      observation: observation(),
      now,
    });
    expect(decision.ok).toBe(false);
  });

  it("U-RVMG-007: CI 赤 / pending は deny する", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [verdictReceipt()],
      observation: observation({ checksGreen: false }),
      now,
    });
    expect(decision.ok).toBe(false);
  });

  it("U-RVMG-008: timestamp 不正など判定不能は deny 側へ倒す (gate 故障 = fail-close)", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [verdictReceipt()],
      observation: observation(),
      now: "not-a-timestamp",
    });
    expect(decision.ok).toBe(false);
  });

  it("U-RVMG-009: observation の PR 不一致は deny する", () => {
    const decision = evaluateMergeGate({
      pr: 900,
      requests: [request()],
      receipts: [verdictReceipt()],
      observation: observation({ pr: 901 }),
      now,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reasons).toEqual(["observation_pr_mismatch"]);
  });

  it("U-RVMG-010: gate receipt は (pr, head) identity で冪等に上書きされる", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-receipt-"));
    try {
      const first = writeMergeGateReceipt({
        repoRoot,
        receipt: { kind: "merge_gate", pr: 900, head, state: "merge_ready", decidedAt: now },
      });
      const second = writeMergeGateReceipt({
        repoRoot,
        receipt: {
          kind: "merge_gate",
          pr: 900,
          head,
          state: "merge_ready",
          decidedAt: "2026-08-03T08:00:00.000Z",
        },
      });
      expect(second.path).toBe(first.path);
      expect(second.digest).toBe(first.digest);
      const loaded = loadMergeGateReceipts(repoRoot);
      expect(loaded).toHaveLength(1);
      expect(loaded[0]?.decidedAt).toBe("2026-08-03T08:00:00.000Z");
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("U-RVMG-011: 壊れた gate receipt は有効扱いしない (検知側で迂回として拾われる)", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-rvmg-broken-"));
    try {
      const written = writeMergeGateReceipt({
        repoRoot,
        receipt: { kind: "merge_gate", pr: 900, head, state: "merge_ready", decidedAt: now },
      });
      writeFileSync(written.path, "{ broken json", "utf8");
      expect(existsSync(written.path)).toBe(true);
      expect(loadMergeGateReceipts(repoRoot)).toEqual([]);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("U-RVMG-012: gate receipt の無い merge は迂回として検知される", () => {
    const findings = detectUnattestedMerges({
      observations: [observation({ state: "MERGED" })],
      gateReceipts: [],
      requests: [request()],
      receipts: [verdictReceipt()],
      now,
    });
    expect(findings.map((finding) => finding.finding)).toContain("merged_without_gate_receipt");
  });

  it("U-RVMG-013: gate receipt があり verdict 済みの merge は検知ゼロ", () => {
    const gateReceipt: MergeGateReceipt = {
      kind: "merge_gate",
      pr: 900,
      head,
      state: "merge_ready",
      decidedAt: now,
    };
    const findings = detectUnattestedMerges({
      observations: [observation({ state: "MERGED" })],
      gateReceipts: [gateReceipt],
      requests: [request()],
      receipts: [verdictReceipt()],
      now,
    });
    expect(findings).toEqual([]);
  });

  it("U-RVMG-014: verdict 無し merge と request 無し merge は merged_without_verdict として検知される", () => {
    const gateReceipt: MergeGateReceipt = {
      kind: "merge_gate",
      pr: 900,
      head,
      state: "merge_ready",
      decidedAt: now,
    };
    const verdictless = detectUnattestedMerges({
      observations: [observation({ state: "MERGED" })],
      gateReceipts: [gateReceipt],
      requests: [request()],
      receipts: [],
      now,
    });
    expect(verdictless.map((finding) => finding.finding)).toContain("merged_without_verdict");
    const unrequested = detectUnattestedMerges({
      observations: [observation({ state: "MERGED" })],
      gateReceipts: [gateReceipt],
      requests: [],
      receipts: [],
      now,
    });
    expect(unrequested.map((finding) => finding.finding)).toContain("merged_without_verdict");
  });

  it("U-RVMG-015: OPEN の PR は迂回検知の対象にならない (merge 前を汚さない)", () => {
    const findings = detectUnattestedMerges({
      observations: [observation({ state: "OPEN" })],
      gateReceipts: [],
      requests: [],
      receipts: [],
      now,
    });
    expect(findings).toEqual([]);
  });

  it("U-RVMG-016: 検知結果は (pr, head) 順で決定的に並ぶ", () => {
    const findings = detectUnattestedMerges({
      observations: [
        observation({ pr: 902, state: "MERGED" }),
        observation({ pr: 901, state: "MERGED" }),
      ],
      gateReceipts: [],
      requests: [],
      receipts: [],
      now,
    });
    expect(findings.map((finding) => finding.pr)).toEqual([901, 901, 902, 902]);
  });
});
