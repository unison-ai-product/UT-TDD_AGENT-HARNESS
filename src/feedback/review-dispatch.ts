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
  reviewRevision: string;
  authorFamily: ReviewerFamily;
  requestedAt: string;
}

export interface ReviewReceipt {
  memoryId: string;
  pr: number;
  head: string;
  reviewRevision: string;
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
  reviewRevision: string;
  authorFamily: ReviewerFamily;
  reviewerFamily?: ReviewerFamily;
  state: ReviewDispatchState;
  breaches: SlaBreach[];
  ageMinutes: number | null;
  blocking: string[];
  reasons: string[];
}

export interface ReviewDispatchResult {
  entries: ReviewDispatchEntry[];
  diagnostics: string[];
  ok: boolean;
}

interface DispatchAnalysis {
  entry: ReviewDispatchEntry;
  hasVerdict: boolean;
  hasHeadMismatch: boolean;
}

const RECEIPT_SEQUENCE: ReviewReceiptKind[] = ["acknowledged", "in_review", "verdict"];
const REVIEWER_FAMILIES: ReviewerFamily[] = ["claude", "codex"];
const RECEIPT_KINDS: ReviewReceiptKind[] = ["acknowledged", "in_review", "verdict"];
const VERDICTS: ReviewVerdict[] = ["PASS", "PASS-WEAK", "FLAG"];
const PR_STATES: PrObservation["state"][] = ["OPEN", "MERGED", "CLOSED"];
const HEAD_PATTERN = /^[0-9a-f]{40}$/;
const EXPLICIT_ZONE_TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

/**
 * GitHub/API/PLAN の既存 producer が出す、timezone 明示済み ISO timestamp を読む。
 * timezone 無し文字列だけは runtime の local timezone で意味が変わるため拒否する。
 */
function parseExplicitZoneTimestamp(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = EXPLICIT_ZONE_TIMESTAMP_PATTERN.exec(value);
  if (match == null) return undefined;
  const [, year, month, day, hour, minute, second, , zone] = match;
  const yearValue = Number(year);
  const monthValue = Number(month);
  const dayValue = Number(day);
  const daysInMonth = new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
  if (
    monthValue < 1 ||
    monthValue > 12 ||
    dayValue < 1 ||
    dayValue > daysInMonth ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59
  ) {
    return undefined;
  }
  if (zone !== "Z") {
    const [offsetHour, offsetMinute] = zone.slice(1).split(":").map(Number);
    if (offsetHour > 23 || offsetMinute > 59) return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareRequests(left: ReviewRequest, right: ReviewRequest): number {
  return (
    left.pr - right.pr ||
    compareText(left.exactHead, right.exactHead) ||
    compareText(left.memoryId, right.memoryId) ||
    compareText(left.reviewRevision, right.reviewRevision) ||
    compareText(left.authorFamily, right.authorFamily) ||
    compareText(left.requestedAt, right.requestedAt)
  );
}

function compareReceipts(left: ReviewReceipt, right: ReviewReceipt): number {
  const leftAt = parseExplicitZoneTimestamp(left.at);
  const rightAt = parseExplicitZoneTimestamp(right.at);
  if (leftAt != null && rightAt != null && leftAt !== rightAt) {
    return leftAt - rightAt;
  }
  return (
    compareText(left.at, right.at) ||
    compareText(left.kind, right.kind) ||
    compareText(left.reviewerFamily, right.reviewerFamily) ||
    compareText(left.head, right.head) ||
    compareText(left.memoryId, right.memoryId) ||
    compareText(left.reviewRevision, right.reviewRevision) ||
    compareText(left.verdict ?? "", right.verdict ?? "") ||
    compareText(
      (left.blockingFindings ?? []).join("\u0000"),
      (right.blockingFindings ?? []).join("\u0000"),
    )
  );
}

function identityKey(value: {
  memoryId: string;
  pr: number;
  exactHead: string;
  reviewRevision: string;
}): string {
  return JSON.stringify([value.memoryId, value.pr, value.exactHead, value.reviewRevision]);
}

function timestampContentKey(value: string): string {
  const instant = parseExplicitZoneTimestamp(value);
  return instant == null ? `invalid:${value}` : `instant:${instant}`;
}

function requestContentKey(request: ReviewRequest): string {
  return JSON.stringify([
    request.memoryId,
    request.pr,
    request.exactHead,
    request.reviewRevision,
    request.authorFamily,
    timestampContentKey(request.requestedAt),
  ]);
}

function receiptContentKey(receipt: ReviewReceipt): string {
  return JSON.stringify([
    receipt.memoryId,
    receipt.pr,
    receipt.head,
    receipt.reviewRevision,
    receipt.reviewerFamily,
    receipt.kind,
    receipt.verdict ?? null,
    receipt.blockingFindings ?? null,
    timestampContentKey(receipt.at),
  ]);
}

function observationContentKey(observation: PrObservation): string {
  return JSON.stringify([
    observation.pr,
    observation.headSha,
    observation.state,
    observation.checksGreen,
  ]);
}

function uniqueRequests(requests: ReviewRequest[]): {
  requests: ReviewRequest[];
  conflictingIdentities: Set<string>;
} {
  const seen = new Map<string, string>();
  const conflictingIdentities = new Set<string>();
  const result: ReviewRequest[] = [];
  for (const request of [...requests].sort(compareRequests)) {
    const key = identityKey(request);
    const contentKey = requestContentKey(request);
    const previousContentKey = seen.get(key);
    if (previousContentKey != null) {
      if (previousContentKey !== contentKey) conflictingIdentities.add(key);
      continue;
    }
    seen.set(key, contentKey);
    result.push(request);
  }
  return { requests: result, conflictingIdentities };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidHead(value: unknown): value is string {
  return typeof value === "string" && HEAD_PATTERN.test(value);
}

function isValidPr(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidTimestamp(value: unknown, nowMs: number): string | undefined {
  const timestamp = parseExplicitZoneTimestamp(value);
  if (timestamp == null) return "invalid_timestamp";
  if (Number.isFinite(nowMs) && timestamp > nowMs) return "future_timestamp";
  return undefined;
}

function hasOwn(value: object, property: string): boolean {
  return Object.hasOwn(value, property);
}

function validateRequest(request: ReviewRequest, nowMs: number): string[] {
  const reasons = new Set<string>();
  if (!isNonEmptyString(request.memoryId)) reasons.add("empty_identity");
  if (!isValidPr(request.pr)) reasons.add("invalid_request_fields");
  if (!isValidHead(request.exactHead)) reasons.add("invalid_head");
  if (!isNonEmptyString(request.reviewRevision)) reasons.add("empty_review_revision");
  if (!REVIEWER_FAMILIES.includes(request.authorFamily)) reasons.add("invalid_request_fields");
  const timestampReason = isValidTimestamp(request.requestedAt, nowMs);
  if (timestampReason) reasons.add(timestampReason);
  return [...reasons];
}

function validateReceipt(receipt: ReviewReceipt, nowMs: number): string[] {
  const reasons = new Set<string>();
  if (!isNonEmptyString(receipt.memoryId)) reasons.add("empty_identity");
  if (!isValidPr(receipt.pr)) reasons.add("invalid_receipt_fields");
  if (!isValidHead(receipt.head)) reasons.add("invalid_head");
  if (!isNonEmptyString(receipt.reviewRevision)) reasons.add("empty_review_revision");
  if (!REVIEWER_FAMILIES.includes(receipt.reviewerFamily)) reasons.add("invalid_receipt_fields");
  if (!RECEIPT_KINDS.includes(receipt.kind)) reasons.add("invalid_receipt_fields");
  const timestampReason = isValidTimestamp(receipt.at, nowMs);
  if (timestampReason) reasons.add(timestampReason);

  const hasVerdict = hasOwn(receipt, "verdict");
  const hasBlockingFindings = hasOwn(receipt, "blockingFindings");
  if (receipt.kind !== "verdict" && (hasVerdict || hasBlockingFindings)) {
    reasons.add("unexpected_verdict_fields");
  }
  if (receipt.kind === "verdict") {
    if (!hasVerdict || !VERDICTS.includes(receipt.verdict as ReviewVerdict)) {
      reasons.add("missing_verdict");
    } else if (receipt.verdict === "FLAG") {
      const findings = receipt.blockingFindings;
      if (
        !Array.isArray(findings) ||
        findings.length === 0 ||
        findings.some((finding) => !isNonEmptyString(finding))
      ) {
        reasons.add("flag_without_blocking_findings");
      }
    } else if (
      hasBlockingFindings &&
      (!Array.isArray(receipt.blockingFindings) || receipt.blockingFindings.length > 0)
    ) {
      reasons.add("blocking_findings_on_pass");
    }
  }
  return [...reasons];
}

function validateObservation(observation: PrObservation): boolean {
  return (
    isValidPr(observation.pr) &&
    isValidHead(observation.headSha) &&
    PR_STATES.includes(observation.state) &&
    typeof observation.checksGreen === "boolean"
  );
}

function validateSla(sla: ReviewDispatchSla): boolean {
  if (sla == null || typeof sla !== "object") return false;
  return [sla.ackMinutes, sla.startMinutes, sla.verdictMinutes].every(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
}

function elapsedMinutes(requestedAt: string, nowMs: number): number | null {
  const requestedMs = parseExplicitZoneTimestamp(requestedAt);
  return requestedMs != null && Number.isFinite(nowMs)
    ? Math.max(0, (nowMs - requestedMs) / 60_000)
    : null;
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

/** 1 件の request を判定するための観測入力 (coding-rule max-source-params のため object にまとめる)。 */
interface DispatchObservationContext {
  receipts: ReviewReceipt[];
  prs: PrObservation[];
  nowMs: number;
  sla: ReviewDispatchSla;
  globalReasons: string[];
  duplicateRequestConflict: boolean;
}

function analyzeRequest(
  request: ReviewRequest,
  context: DispatchObservationContext,
): DispatchAnalysis {
  const { receipts, prs, nowMs, sla, globalReasons, duplicateRequestConflict } = context;
  const reasons = new Set([...globalReasons, ...validateRequest(request, nowMs)]);
  if (duplicateRequestConflict) reasons.add("duplicate_request_conflict");
  const requestTimestamp = parseExplicitZoneTimestamp(request.requestedAt);
  const candidates = receipts.filter(
    (receipt) =>
      receipt.memoryId === request.memoryId &&
      receipt.pr === request.pr &&
      receipt.head === request.exactHead &&
      receipt.reviewRevision === request.reviewRevision,
  );
  for (const receipt of candidates) {
    for (const reason of validateReceipt(receipt, nowMs)) reasons.add(reason);
  }
  const relevantReceipts = candidates
    .filter((receipt) => validateReceipt(receipt, nowMs).length === 0)
    .sort(compareReceipts);

  const receiptByKind = new Map<ReviewReceiptKind, ReviewReceipt>();
  const deduplicatedReceipts: ReviewReceipt[] = [];
  for (const receipt of relevantReceipts) {
    const previous = receiptByKind.get(receipt.kind);
    if (previous == null) {
      receiptByKind.set(receipt.kind, receipt);
      deduplicatedReceipts.push(receipt);
      continue;
    }
    if (receiptContentKey(previous) !== receiptContentKey(receipt)) {
      reasons.add("duplicate_receipt_conflict");
    }
  }

  const stageReceipts = new Map<ReviewReceiptKind, ReviewReceipt>();
  for (const receipt of deduplicatedReceipts) {
    if (!stageReceipts.has(receipt.kind)) stageReceipts.set(receipt.kind, receipt);
  }
  for (let index = 1; index < RECEIPT_SEQUENCE.length; index += 1) {
    const previous = stageReceipts.get(RECEIPT_SEQUENCE[index - 1]);
    const current = stageReceipts.get(RECEIPT_SEQUENCE[index]);
    const previousAt = previous && parseExplicitZoneTimestamp(previous.at);
    const currentAt = current && parseExplicitZoneTimestamp(current.at);
    if (previousAt != null && currentAt != null && currentAt <= previousAt) {
      reasons.add("receipt_not_after_previous_state");
    }
  }

  const acceptedReceipts: ReviewReceipt[] = [];
  for (const receipt of deduplicatedReceipts) {
    if (receipt.reviewerFamily === request.authorFamily) {
      reasons.add("same_family_reviewer");
      continue;
    }
    const receiptAt = parseExplicitZoneTimestamp(receipt.at);
    if (receiptAt == null) {
      reasons.add("invalid_timestamp");
      continue;
    }
    if (requestTimestamp != null && receiptAt < requestTimestamp) {
      reasons.add("receipt_before_request");
      continue;
    }
    const previous = acceptedReceipts.at(-1);
    const previousAt = previous && parseExplicitZoneTimestamp(previous.at);
    if (previousAt != null && receiptAt <= previousAt) {
      reasons.add("receipt_not_after_previous_state");
      continue;
    }
    const expectedKind = RECEIPT_SEQUENCE[acceptedReceipts.length];
    if (receipt.kind !== expectedKind) {
      reasons.add("out_of_order_receipt");
      const receiptIndex = RECEIPT_SEQUENCE.indexOf(receipt.kind);
      if (receiptIndex > acceptedReceipts.length) {
        for (let index = acceptedReceipts.length; index < receiptIndex; index += 1) {
          reasons.add(`missing_${RECEIPT_SEQUENCE[index]}`);
        }
      }
      continue;
    }
    acceptedReceipts.push(receipt);
  }

  const verdictReceipt =
    acceptedReceipts.at(-1)?.kind === "verdict" ? acceptedReceipts.at(-1) : undefined;
  const hasVerdict = verdictReceipt != null;
  const hasAcknowledged = acceptedReceipts.length >= 1;
  const hasStarted = acceptedReceipts.length >= 2;
  const ageMinutes = elapsedMinutes(request.requestedAt, nowMs);
  const breaches: SlaBreach[] = [];
  if (!hasAcknowledged && (ageMinutes == null || ageMinutes > sla.ackMinutes)) breaches.push("ack");
  if (!hasStarted && (ageMinutes == null || ageMinutes > sla.startMinutes)) breaches.push("start");
  if (!hasVerdict && (ageMinutes == null || ageMinutes > sla.verdictMinutes)) {
    breaches.push("verdict");
  }

  const blocking =
    verdictReceipt?.verdict === "FLAG" ? [...(verdictReceipt.blockingFindings ?? [])] : [];
  if (verdictReceipt?.verdict === "FLAG") reasons.add("flagged");

  const observationCandidates = prs.filter((observation) => observation.pr === request.pr);
  for (const candidate of observationCandidates) {
    if (!validateObservation(candidate)) reasons.add("invalid_pr_observation");
  }
  const observationsByContent = new Map<string, PrObservation>();
  for (const candidate of observationCandidates.filter(validateObservation)) {
    observationsByContent.set(observationContentKey(candidate), candidate);
  }
  if (observationsByContent.size > 1) reasons.add("duplicate_pr_observation_conflict");
  const observation = observationFor(request, [...observationsByContent.values()]);
  if (observation == null) reasons.add("pr_observation_missing");
  const hasObservationHeadMismatch =
    observation != null && observation.headSha !== request.exactHead;
  if (hasObservationHeadMismatch) reasons.add("head_mismatch");
  if (observation?.state === "MERGED" && !hasVerdict) reasons.add("merged_without_verdict");

  let state: ReviewDispatchState =
    acceptedReceipts.length === 3
      ? "verdict"
      : acceptedReceipts.length === 2
        ? "in_review"
        : acceptedReceipts.length === 1
          ? "acknowledged"
          : "requested";
  const hasHeadMismatch = hasObservationHeadMismatch;
  if (hasHeadMismatch) {
    state = "stale_head";
  } else if (
    reasons.size === 0 &&
    acceptedReceipts.length === 3 &&
    (verdictReceipt?.verdict === "PASS" || verdictReceipt?.verdict === "PASS-WEAK") &&
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
      reviewRevision: request.reviewRevision,
      authorFamily: request.authorFamily,
      reviewerFamily: acceptedReceipts.at(-1)?.reviewerFamily,
      state,
      breaches,
      ageMinutes,
      blocking,
      reasons: [...reasons].sort(compareText),
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
  const nowMs = parseExplicitZoneTimestamp(input.now);
  const sla = input.sla ?? DEFAULT_REVIEW_DISPATCH_SLA;
  const globalReasons = new Set<string>();
  const diagnostics = new Set<string>();
  if (nowMs == null) globalReasons.add("invalid_timestamp");
  if (input.sla === null || !validateSla(sla)) globalReasons.add("invalid_sla");
  const requestIdentities = new Set(input.requests.map(identityKey));
  const requestedPrs = new Set(input.requests.map((request) => request.pr));
  for (const receipt of input.receipts) {
    const receiptIdentity = identityKey({
      memoryId: receipt.memoryId,
      pr: receipt.pr,
      exactHead: receipt.head,
      reviewRevision: receipt.reviewRevision,
    });
    if (!requestIdentities.has(receiptIdentity)) {
      const reasons = validateReceipt(receipt, nowMs ?? Number.NaN);
      const diagnosticIdentity = `${receipt.memoryId}@${receipt.pr}@${receipt.head}@${receipt.reviewRevision}`;
      if (reasons.length === 0) {
        diagnostics.add(`orphan_receipt:unmatched_identity:${diagnosticIdentity}`);
      } else {
        for (const reason of reasons) {
          diagnostics.add(`orphan_receipt:${reason}:${diagnosticIdentity}`);
        }
      }
    }
  }
  for (const observation of input.prs) {
    if (!requestedPrs.has(observation.pr)) {
      diagnostics.add(
        validateObservation(observation)
          ? `orphan_pr_observation:unmatched_pr:${observation.pr}@${observation.headSha}`
          : `orphan_pr_observation:invalid_pr_observation:${observation.pr}@${observation.headSha}`,
      );
    }
  }

  const unique = uniqueRequests(input.requests);
  const analyses = unique.requests.map((request) =>
    analyzeRequest(request, {
      receipts: input.receipts,
      prs: input.prs,
      nowMs: nowMs ?? Number.NaN,
      sla,
      globalReasons: [...globalReasons],
      duplicateRequestConflict: unique.conflictingIdentities.has(identityKey(request)),
    }),
  );
  analyses.sort(
    (left, right) =>
      left.entry.pr - right.entry.pr ||
      compareText(left.entry.exactHead, right.entry.exactHead) ||
      compareText(left.entry.memoryId, right.entry.memoryId) ||
      compareText(left.entry.reviewRevision, right.entry.reviewRevision),
  );

  return {
    entries: analyses.map(({ entry }) => entry),
    diagnostics: [...diagnostics].sort(compareText),
    ok:
      globalReasons.size === 0 &&
      analyses.every(({ entry }) => entry.breaches.length === 0 && entry.reasons.length === 0),
  };
}

export function reviewDispatchMessages(result: ReviewDispatchResult): string[] {
  const messages: string[] = [];
  for (const entry of result.entries) {
    for (const breach of entry.breaches) {
      messages.push(
        `review-dispatch — SLA超過: PR #${entry.pr} ${breach} (${entry.memoryId}@${entry.reviewRevision}#${entry.exactHead})`,
      );
    }
    for (const reason of entry.reasons) {
      const detail =
        reason === "same_family_reviewer"
          ? "同一 reviewer family の receipt は受理しない"
          : reason === "head_mismatch"
            ? "request・receipt・PR の exact HEAD が一致しない"
            : reason === "merged_without_verdict"
              ? "verdict 無しで PR が MERGED になった"
              : reason === "flagged"
                ? `FLAG verdict (${entry.blocking.join(", ") || "blocking finding なし"})`
                : reason;
      messages.push(
        `review-dispatch — 手順違反: PR #${entry.pr} ${detail} (${entry.memoryId}@${entry.reviewRevision}#${entry.exactHead})`,
      );
    }
  }
  for (const diagnostic of result.diagnostics) {
    messages.push(`review-dispatch — 未帰属診断: ${diagnostic}`);
  }
  const uniqueMessages = [...new Set(messages)];
  return uniqueMessages.length > 0 ? uniqueMessages : ["review-dispatch — OK"];
}
