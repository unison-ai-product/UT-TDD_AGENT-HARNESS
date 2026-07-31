/**
 * PR #201 が reviews=0 / comments=0 のまま merge され、verdict 無し merge が発生した。
 * また PR #202 では全 green・freeze 済みでも verdict 待ちが train 全体を止めた。
 * この検査は、同様の手順違反と待ち時間の見落としを dispatch 状態として機械的に検出する。
 * 関連する実測 incident は #189 (verdict 前 merge) である。
 */

export type ReviewDispatchState =
  | "requested"
  | "acknowledged"
  | "in_review"
  | "verdict"
  | "stale_head"
  | "merge_ready";

export type ReviewerFamily = "claude" | "codex";
export type ReviewVerdict = "PASS" | "PASS-WEAK" | "FLAG";
export type SlaBreach = "ack" | "start" | "verdict";
export type ReviewReceiptKind = "acknowledged" | "in_review" | "verdict";

export interface ReviewRequest {
  memoryId: string;
  pr: number;
  exactHead: string;
  authorFamily: ReviewerFamily;
  requestedAt: string;
}

export interface ReviewReceipt {
  pr: number;
  head: string;
  reviewerFamily: ReviewerFamily;
  kind: ReviewReceiptKind;
  verdict?: ReviewVerdict;
  blockingFindings?: string[];
  at: string;
}

export interface PrObservation {
  pr: number;
  headSha: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  checksGreen: boolean;
}

export interface ReviewDispatchSla {
  ackMinutes: number;
  startMinutes: number;
  verdictMinutes: number;
}

export const DEFAULT_REVIEW_DISPATCH_SLA: ReviewDispatchSla = {
  ackMinutes: 15,
  startMinutes: 30,
  verdictMinutes: 60,
};

export interface ReviewDispatchEntry {
  memoryId: string;
  pr: number;
  exactHead: string;
  authorFamily: ReviewerFamily;
  reviewerFamily?: ReviewerFamily;
  state: ReviewDispatchState;
  breaches: SlaBreach[];
  ageMinutes: number;
  blocking: string[];
  reasons: string[];
}

export interface ReviewDispatchResult {
  entries: ReviewDispatchEntry[];
  ok: boolean;
}

interface DispatchAnalysis {
  entry: ReviewDispatchEntry;
  hasVerdict: boolean;
  hasHeadMismatch: boolean;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareRequests(left: ReviewRequest, right: ReviewRequest): number {
  return (
    left.pr - right.pr ||
    compareText(left.exactHead, right.exactHead) ||
    compareText(left.memoryId, right.memoryId) ||
    compareText(left.authorFamily, right.authorFamily) ||
    compareText(left.requestedAt, right.requestedAt)
  );
}

function compareReceipts(left: ReviewReceipt, right: ReviewReceipt): number {
  const leftAt = Date.parse(left.at);
  const rightAt = Date.parse(right.at);
  if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt) {
    return leftAt - rightAt;
  }
  return (
    compareText(left.at, right.at) ||
    compareText(left.kind, right.kind) ||
    compareText(left.reviewerFamily, right.reviewerFamily) ||
    compareText(left.head, right.head) ||
    compareText(left.verdict ?? "", right.verdict ?? "")
  );
}

function uniqueRequests(requests: ReviewRequest[]): ReviewRequest[] {
  const seen = new Set<string>();
  const result: ReviewRequest[] = [];
  for (const request of [...requests].sort(compareRequests)) {
    const key = `${request.memoryId}\u0000${request.exactHead}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(request);
  }
  return result;
}

function elapsedMinutes(requestedAt: string, now: string): number {
  return Math.max(0, (Date.parse(now) - Date.parse(requestedAt)) / 60_000);
}

function observationFor(request: ReviewRequest, prs: PrObservation[]): PrObservation | undefined {
  return [...prs]
    .filter((observation) => observation.pr === request.pr)
    .sort(
      (left, right) =>
        Number(right.headSha === request.exactHead) - Number(left.headSha === request.exactHead) ||
        compareText(left.headSha, right.headSha) ||
        compareText(left.state, right.state) ||
        Number(left.checksGreen) - Number(right.checksGreen),
    )[0];
}

function analyzeRequest(
  request: ReviewRequest,
  receipts: ReviewReceipt[],
  prs: PrObservation[],
  now: string,
  sla: ReviewDispatchSla,
): DispatchAnalysis {
  const reasons: string[] = [];
  const relevantReceipts = receipts.filter((receipt) => receipt.pr === request.pr);
  const acceptedReceipts: ReviewReceipt[] = [];

  for (const receipt of relevantReceipts) {
    if (receipt.kind === "verdict" && receipt.reviewerFamily === request.authorFamily) {
      reasons.push("same_family_reviewer");
      continue;
    }
    if (receipt.head !== request.exactHead) {
      reasons.push("head_mismatch");
      continue;
    }
    acceptedReceipts.push(receipt);
  }

  const observation = observationFor(request, prs);
  const hasHeadMismatch =
    relevantReceipts.some((receipt) => receipt.head !== request.exactHead) ||
    (observation != null && observation.headSha !== request.exactHead);
  if (observation != null && observation.headSha !== request.exactHead) {
    reasons.push("head_mismatch");
  }

  const verdictReceipt = acceptedReceipts
    .filter((receipt) => receipt.kind === "verdict")
    .sort(compareReceipts)
    .at(-1);
  const inReviewReceipt = acceptedReceipts
    .filter((receipt) => receipt.kind === "in_review")
    .sort(compareReceipts)
    .at(-1);
  const acknowledgedReceipt = acceptedReceipts
    .filter((receipt) => receipt.kind === "acknowledged")
    .sort(compareReceipts)
    .at(-1);

  const hasVerdict = verdictReceipt != null;
  const hasStarted = hasVerdict || inReviewReceipt != null;
  const hasAcknowledged = hasStarted || acknowledgedReceipt != null;
  const ageMinutes = elapsedMinutes(request.requestedAt, now);
  const breaches: SlaBreach[] = [];
  if (!hasAcknowledged && ageMinutes > sla.ackMinutes) breaches.push("ack");
  if (!hasStarted && ageMinutes > sla.startMinutes) breaches.push("start");
  if (!hasVerdict && ageMinutes > sla.verdictMinutes) breaches.push("verdict");

  const blocking =
    verdictReceipt?.verdict === "FLAG" ? [...(verdictReceipt.blockingFindings ?? [])] : [];
  if (verdictReceipt?.verdict === "FLAG") reasons.push("flagged");

  let state: ReviewDispatchState = hasVerdict
    ? "verdict"
    : inReviewReceipt != null
      ? "in_review"
      : acknowledgedReceipt != null
        ? "acknowledged"
        : "requested";

  if (observation?.state === "MERGED" && !hasVerdict) {
    reasons.push("merged_without_verdict");
  }
  if (hasHeadMismatch) {
    state = "stale_head";
  } else if (
    verdictReceipt?.verdict !== undefined &&
    (verdictReceipt.verdict === "PASS" || verdictReceipt.verdict === "PASS-WEAK") &&
    observation?.headSha === request.exactHead &&
    observation.checksGreen &&
    observation.state === "OPEN"
  ) {
    state = "merge_ready";
  }

  return {
    entry: {
      memoryId: request.memoryId,
      pr: request.pr,
      exactHead: request.exactHead,
      authorFamily: request.authorFamily,
      reviewerFamily:
        verdictReceipt?.reviewerFamily ??
        inReviewReceipt?.reviewerFamily ??
        acknowledgedReceipt?.reviewerFamily,
      state,
      breaches,
      ageMinutes,
      blocking,
      reasons: [...new Set(reasons)],
    },
    hasVerdict,
    hasHeadMismatch,
  };
}

export function analyzeReviewDispatch(input: {
  requests: ReviewRequest[];
  receipts: ReviewReceipt[];
  prs: PrObservation[];
  now: string;
  sla?: ReviewDispatchSla;
}): ReviewDispatchResult {
  const sla = input.sla ?? DEFAULT_REVIEW_DISPATCH_SLA;
  const analyses = uniqueRequests(input.requests).map((request) =>
    analyzeRequest(request, input.receipts, input.prs, input.now, sla),
  );
  analyses.sort(
    (left, right) =>
      left.entry.pr - right.entry.pr ||
      compareText(left.entry.exactHead, right.entry.exactHead) ||
      compareText(left.entry.memoryId, right.entry.memoryId),
  );

  return {
    entries: analyses.map(({ entry }) => entry),
    ok: analyses.every(({ entry }) => entry.breaches.length === 0 && entry.reasons.length === 0),
  };
}

export function reviewDispatchMessages(result: ReviewDispatchResult): string[] {
  const messages: string[] = [];
  for (const entry of result.entries) {
    for (const breach of entry.breaches) {
      messages.push(`review-dispatch — SLA超過: PR #${entry.pr} ${breach} (${entry.memoryId})`);
    }
    for (const reason of entry.reasons) {
      const detail =
        reason === "same_family_reviewer"
          ? "同一 reviewer family の verdict は受理しない"
          : reason === "head_mismatch"
            ? "request・receipt・PR の exact HEAD が一致しない"
            : reason === "merged_without_verdict"
              ? "verdict 無しで PR が MERGED になった"
              : reason === "flagged"
                ? `FLAG verdict (${entry.blocking.join(", ") || "blocking finding なし"})`
                : reason;
      messages.push(`review-dispatch — 手順違反: PR #${entry.pr} ${detail}`);
    }
  }
  return messages.length > 0 ? messages : ["review-dispatch — OK"];
}
