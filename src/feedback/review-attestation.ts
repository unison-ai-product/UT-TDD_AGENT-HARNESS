import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ReviewReceipt } from "./review-dispatch";
import { extractVerdict, type ReviewVerdictName } from "./review-verdict-contract";

export { REVIEW_VERDICT_FILE_ENV } from "./review-verdict-contract";

export interface ReviewAttestation {
  provider: "codex" | "claude";
  role: string;
  model: string;
  pr: number;
  head: string;
  reviewRevision: string;
  startedAt: string;
  completedAt: string;
  exitCode: number;
}

export interface ReviewAttestationRequest {
  memoryId: string;
  pr: number;
  exactHead: string;
  reviewRevision: string;
  authorFamily: "codex" | "claude";
  requestedAt: string;
}

export type ReviewRequestResult =
  | { ok: true; request: ReviewAttestationRequest; path: string; digest: string }
  | { ok: false; reason: string };

export type ReviewVerdictProjectionResult =
  | { ok: true; receipt: ReviewReceipt; path: string; digest: string }
  | { ok: false; reason: string };

const HEAD_PATTERN = /^[0-9a-f]{40}$/;
const PROVIDERS = ["codex", "claude"] as const;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_TIMESTAMP_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isValidRequest(value: ReviewAttestationRequest): boolean {
  return (
    isNonEmptyString(value.memoryId) &&
    Number.isInteger(value.pr) &&
    value.pr > 0 &&
    HEAD_PATTERN.test(value.exactHead) &&
    isNonEmptyString(value.reviewRevision) &&
    PROVIDERS.includes(value.authorFamily) &&
    isTimestamp(value.requestedAt)
  );
}

function isValidAttestation(value: ReviewAttestation): boolean {
  return (
    PROVIDERS.includes(value.provider) &&
    isNonEmptyString(value.role) &&
    isNonEmptyString(value.model) &&
    Number.isInteger(value.pr) &&
    value.pr > 0 &&
    HEAD_PATTERN.test(value.head) &&
    isNonEmptyString(value.reviewRevision) &&
    isTimestamp(value.startedAt) &&
    isTimestamp(value.completedAt) &&
    Number.isInteger(value.exitCode)
  );
}

/** admission receipt と同じ、キーを再帰的に整列した JSON preimage を作る。 */
function normalizedJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(normalizedJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${normalizedJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function digest(value: unknown): string {
  return createHash("sha256").update(normalizedJson(value), "utf8").digest("hex").slice(0, 16);
}

function persist(input: {
  repoRoot: string;
  category: "requests" | "receipts";
  value: unknown;
  digestSource?: unknown;
}): {
  path: string;
  digest: string;
} {
  const { repoRoot, category, value } = input;
  const valueDigest = digest(input.digestSource ?? value);
  const directory = join(repoRoot, ".ut-tdd", "review", category);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${valueDigest}.json`);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return { path, digest: valueDigest };
}

function identityMatches(
  request: ReviewAttestationRequest,
  attestation: ReviewAttestation,
): boolean {
  return (
    request.pr === attestation.pr &&
    request.exactHead === attestation.head &&
    request.reviewRevision === attestation.reviewRevision
  );
}

/**
 * request の `authorFamily` を解決する。
 *
 * **provider (レビュアー族) を引数に取らないことが本質である。** 「著者族 = レビュアー族の反対」
 * と導出すると、D1 の同族レビュー検出
 * (`receipt.reviewerFamily === request.authorFamily`、`review-dispatch.ts`) が**恒偽**になり、
 * 「Claude が書いた成果物を Claude がレビューした」場合でも機構が発火しない。
 * 強制しているように見えて実際には検出不能という fail-open になる。
 *
 * よって著者族は provider から**独立した事実**、すなわち委譲を実行している runtime から取る。
 * 判別できない場合は `null` を返し、呼び出し側で fail-close させる (推測しない)。
 */
export function resolveReviewAuthorFamily(input: {
  explicit?: string;
  currentRuntime: "codex" | "claude" | null;
}): "codex" | "claude" | null {
  if (input.explicit !== undefined) {
    return PROVIDERS.includes(input.explicit as (typeof PROVIDERS)[number])
      ? (input.explicit as "codex" | "claude")
      : null;
  }
  return input.currentRuntime;
}

export function issueReviewRequest(input: {
  repoRoot: string;
  request: ReviewAttestationRequest;
}): ReviewRequestResult {
  if (!isValidRequest(input.request)) return { ok: false, reason: "invalid_review_request" };
  // request digest は安定識別子 (pr / exactHead / reviewRevision / authorFamily / memoryId)
  // のみで構成する。`requestedAt` を digest に入れると、同一レビュー要求の retry が別 request
  // ファイルとして併存し、D1 (`review-dispatch.ts`) の duplicate_request_conflict を偶発させる。
  // retry は同 digest → 同 path への上書き = 冪等 (requestedAt は本文 metadata として更新される)。
  const persisted = persist({
    repoRoot: input.repoRoot,
    category: "requests",
    value: input.request,
    digestSource: {
      memoryId: input.request.memoryId,
      pr: input.request.pr,
      exactHead: input.request.exactHead,
      reviewRevision: input.request.reviewRevision,
      authorFamily: input.request.authorFamily,
    },
  });
  return { ok: true, request: input.request, ...persisted };
}

export function projectReviewVerdict(input: {
  repoRoot: string;
  request: ReviewAttestationRequest;
  attestation: ReviewAttestation;
  verdictFile: string;
}): ReviewVerdictProjectionResult {
  if (input.attestation.exitCode !== 0) {
    return { ok: false, reason: "reviewer_exit_nonzero" };
  }
  if (!existsSync(input.verdictFile)) {
    return { ok: false, reason: "verdict_file_missing" };
  }
  if (!isValidRequest(input.request) || !isValidAttestation(input.attestation)) {
    return { ok: false, reason: "invalid_review_attestation" };
  }
  if (!identityMatches(input.request, input.attestation)) {
    return { ok: false, reason: "review_identity_mismatch" };
  }

  let verdictText: string;
  try {
    verdictText = readFileSync(input.verdictFile, "utf8");
  } catch {
    return { ok: false, reason: "verdict_file_unreadable" };
  }
  const extracted = extractVerdict(verdictText);
  if (!extracted.ok) return { ok: false, reason: extracted.reasons[0] ?? "verdict_invalid" };

  const receipt: ReviewReceipt = {
    memoryId: input.request.memoryId,
    pr: input.attestation.pr,
    head: input.attestation.head,
    reviewRevision: input.attestation.reviewRevision,
    reviewerFamily: input.attestation.provider,
    kind: "verdict",
    verdict: extracted.value.verdict as ReviewVerdictName,
    blockingFindings: extracted.value.blockingFindings,
    at: input.attestation.completedAt,
  };
  const persisted = persist({ repoRoot: input.repoRoot, category: "receipts", value: receipt });
  return { ok: true, receipt, ...persisted };
}
