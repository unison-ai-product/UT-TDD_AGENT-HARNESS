import { describe, expect, it } from "vitest";
import {
  analyzeReviewDispatch,
  DEFAULT_REVIEW_DISPATCH_SLA,
  type PrObservation,
  type ReviewDispatchEntry,
  type ReviewReceipt,
  type ReviewRequest,
} from "../src/feedback/review-dispatch";

const REQUESTED_AT = "2026-07-31T00:00:00.000Z";

function request(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
  return {
    memoryId: "memory-001",
    pr: 201,
    exactHead: "a".repeat(40),
    authorFamily: "claude",
    requestedAt: REQUESTED_AT,
    ...overrides,
  };
}

function receipt(
  kind: ReviewReceipt["kind"],
  overrides: Partial<ReviewReceipt> = {},
): ReviewReceipt {
  return {
    pr: 201,
    head: "a".repeat(40),
    reviewerFamily: "codex",
    kind,
    at: "2026-07-31T00:01:00.000Z",
    ...overrides,
  };
}

function pr(overrides: Partial<PrObservation> = {}): PrObservation {
  return {
    pr: 201,
    headSha: "a".repeat(40),
    state: "OPEN",
    checksGreen: true,
    ...overrides,
  };
}

function entry(result: { entries: ReviewDispatchEntry[] }): ReviewDispatchEntry {
  expect(result.entries).toHaveLength(1);
  return result.entries[0];
}

describe("review dispatch analyzer (U-RVDISP)", () => {
  it("U-RVDISP-001: 受領前は requested、SLA 内なら breach 無し", () => {
    const result = analyzeReviewDispatch({
      requests: [request()],
      receipts: [],
      prs: [pr()],
      now: "2026-07-31T00:10:00.000Z",
    });

    expect(entry(result).state).toBe("requested");
    expect(entry(result).breaches).toEqual([]);
    expect(entry(result).ageMinutes).toBe(10);
    expect(result.ok).toBe(true);
  });

  it("U-RVDISP-002: 受領 SLA 超過を検知し、境界ちょうどは breach にしない", () => {
    const input = { requests: [request()], receipts: [], prs: [pr()] };

    expect(
      entry(analyzeReviewDispatch({ ...input, now: "2026-07-31T00:15:00.000Z" })).breaches,
    ).toEqual([]);
    const ackLate = analyzeReviewDispatch({ ...input, now: "2026-07-31T00:16:00.000Z" });
    expect(entry(ackLate).breaches).toEqual(["ack"]);
    expect(ackLate.ok).toBe(false);
    expect(
      entry(analyzeReviewDispatch({ ...input, now: "2026-07-31T00:30:00.000Z" })).breaches,
    ).toEqual(["ack"]);
    expect(
      entry(analyzeReviewDispatch({ ...input, now: "2026-07-31T00:31:00.000Z" })).breaches,
    ).toEqual(["ack", "start"]);
    expect(
      entry(analyzeReviewDispatch({ ...input, now: "2026-07-31T01:00:00.000Z" })).breaches,
    ).toEqual(["ack", "start"]);
    expect(
      entry(analyzeReviewDispatch({ ...input, now: "2026-07-31T01:01:00.000Z" })).breaches,
    ).toEqual(["ack", "start", "verdict"]);
  });

  it("U-RVDISP-003: acknowledged receipt は ack breach を解消し、未開始なら start を検知する", () => {
    const result = analyzeReviewDispatch({
      requests: [request()],
      receipts: [receipt("acknowledged")],
      prs: [pr()],
      now: "2026-07-31T00:31:00.000Z",
    });

    expect(entry(result).state).toBe("acknowledged");
    expect(entry(result).breaches).toEqual(["start"]);
    expect(result.ok).toBe(false);
  });

  it("U-RVDISP-004: in_review から PASS verdict へ遷移する", () => {
    const reviewing = analyzeReviewDispatch({
      requests: [request()],
      receipts: [receipt("in_review")],
      prs: [pr()],
      now: "2026-07-31T00:10:00.000Z",
    });
    expect(entry(reviewing).state).toBe("in_review");

    const verdict = analyzeReviewDispatch({
      requests: [request()],
      receipts: [receipt("verdict", { verdict: "PASS" })],
      prs: [pr({ checksGreen: false })],
      now: "2026-07-31T00:10:00.000Z",
    });
    expect(entry(verdict).state).toBe("verdict");
  });

  it("U-RVDISP-005: merge_ready は PASS・HEAD 一致・green・OPEN の全条件を要する", () => {
    const base = {
      requests: [request()],
      receipts: [receipt("verdict", { verdict: "PASS" })],
      now: "2026-07-31T00:10:00.000Z",
    };

    expect(entry(analyzeReviewDispatch({ ...base, prs: [pr()] })).state).toBe("merge_ready");
    expect(
      entry(analyzeReviewDispatch({ ...base, prs: [pr({ checksGreen: false })] })).state,
    ).not.toBe("merge_ready");
    expect(
      entry(analyzeReviewDispatch({ ...base, prs: [pr({ state: "MERGED" })] })).state,
    ).not.toBe("merge_ready");
    const stale = analyzeReviewDispatch({
      ...base,
      prs: [pr({ headSha: "b".repeat(40) })],
    });
    expect(entry(stale).state).toBe("stale_head");
    expect(stale.ok).toBe(false);
  });

  it("U-RVDISP-006: PASS-WEAK は merge_ready 対象、FLAG は blocking を残す", () => {
    const base = { requests: [request()], prs: [pr()], now: "2026-07-31T00:10:00.000Z" };

    expect(
      entry(
        analyzeReviewDispatch({
          ...base,
          receipts: [receipt("verdict", { verdict: "PASS-WEAK" })],
        }),
      ).state,
    ).toBe("merge_ready");

    const flagged = analyzeReviewDispatch({
      ...base,
      receipts: [
        receipt("verdict", {
          verdict: "FLAG",
          blockingFindings: ["missing independent reviewer"],
        }),
      ],
    });
    expect(entry(flagged).state).toBe("verdict");
    expect(entry(flagged).blocking).toEqual(["missing independent reviewer"]);
    expect(flagged.ok).toBe(false);
  });

  it("U-RVDISP-007: 同一 family の自己承認 verdict は採用しない", () => {
    const result = analyzeReviewDispatch({
      requests: [request({ authorFamily: "claude" })],
      receipts: [receipt("verdict", { reviewerFamily: "claude", verdict: "PASS" })],
      prs: [pr()],
      now: "2026-07-31T00:10:00.000Z",
    });

    expect(entry(result).state).toBe("requested");
    expect(entry(result).reasons).toContain("same_family_reviewer");
    expect(result.ok).toBe(false);
  });

  it("U-RVDISP-008: exact HEAD 不一致の verdict は stale_head として採用しない", () => {
    const result = analyzeReviewDispatch({
      requests: [request()],
      receipts: [receipt("verdict", { verdict: "PASS", head: "b".repeat(40) })],
      prs: [pr()],
      now: "2026-07-31T00:10:00.000Z",
    });

    expect(entry(result).state).toBe("stale_head");
    expect(entry(result).reasons).toContain("head_mismatch");
    expect(result.ok).toBe(false);
  });

  it("U-RVDISP-009: verdict 無しで MERGED された PR を手順違反として検出する", () => {
    const result = analyzeReviewDispatch({
      requests: [request()],
      receipts: [],
      prs: [pr({ state: "MERGED" })],
      now: "2026-07-31T00:10:00.000Z",
    });

    expect(entry(result).reasons).toContain("merged_without_verdict");
    expect(result.ok).toBe(false);
  });

  it("U-RVDISP-010: 重複 request を畳み込み、entries を入力順に依存せず整列する", () => {
    const requests = [
      request({ memoryId: "memory-b", pr: 20, exactHead: "b".repeat(40) }),
      request({ memoryId: "memory-a", pr: 10, exactHead: "c".repeat(40) }),
      request({ memoryId: "memory-a", pr: 10, exactHead: "a".repeat(40) }),
      request({ memoryId: "memory-a", pr: 10, exactHead: "c".repeat(40) }),
    ];
    const input = {
      receipts: [],
      prs: [],
      now: "2026-07-31T00:10:00.000Z",
    };

    const forward = analyzeReviewDispatch({ ...input, requests });
    const reversed = analyzeReviewDispatch({ ...input, requests: [...requests].reverse() });
    expect(forward.entries).toHaveLength(3);
    expect(forward.entries.map((item: ReviewDispatchEntry) => [item.pr, item.exactHead])).toEqual([
      [10, "a".repeat(40)],
      [10, "c".repeat(40)],
      [20, "b".repeat(40)],
    ]);
    expect(JSON.stringify(forward.entries)).toBe(JSON.stringify(reversed.entries));
  });

  it("U-RVDISP-011: SLA は注入で上書きでき、既定契約は 15 / 30 / 60 分", () => {
    expect(DEFAULT_REVIEW_DISPATCH_SLA).toEqual({
      ackMinutes: 15,
      startMinutes: 30,
      verdictMinutes: 60,
    });

    const result = analyzeReviewDispatch({
      requests: [request()],
      receipts: [],
      prs: [pr()],
      now: "2026-07-31T00:04:00.000Z",
      sla: { ackMinutes: 1, startMinutes: 2, verdictMinutes: 3 },
    });
    expect(entry(result).breaches).toEqual(["ack", "start", "verdict"]);
    expect(result.ok).toBe(false);
  });

  it("U-RVDISP-012: 対応 request の無い孤児 receipt は状態を作らない", () => {
    const result = analyzeReviewDispatch({
      requests: [],
      receipts: [receipt("verdict", { verdict: "PASS" })],
      prs: [pr()],
      now: "2026-07-31T00:10:00.000Z",
    });

    expect(result.entries).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
