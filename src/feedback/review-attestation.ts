import { createHash } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, writeFileSync, writeSync } from "node:fs";
import { join } from "node:path";
import { ensureDir } from "../shared/fs.ts";
import type { ReviewReceipt } from "./review-dispatch.ts";
import { extractVerdict, type ReviewVerdictName } from "./review-verdict-contract.ts";
import {
  assertReviewVerdictPath,
  canonicalJson,
  canonicalReviewRevision,
  isStrictReviewRequest,
  REVIEW_VERDICT_SCHEMA_VERSION,
  type ReviewVerdictEnvelope,
  recordReviewAttemptFailure,
  reviewIdentityDigest,
} from "./review-verdict-custody.ts";

export { REVIEW_VERDICT_FILE_ENV } from "./review-verdict-contract.ts";

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
  attempt?: number;
  invocationNonce?: string;
}

export interface ReviewAttestationRequest {
  memoryId: string;
  pr: number;
  exactHead: string;
  reviewRevision: string;
  authorFamily: "codex" | "claude";
  requestedAt: string;
  invocationNonce?: string;
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

export function isValidReviewRequest(value: ReviewAttestationRequest): boolean {
  return (
    isNonEmptyString(value.memoryId) &&
    Number.isSafeInteger(value.pr) &&
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
    Number.isSafeInteger(value.pr) &&
    value.pr > 0 &&
    HEAD_PATTERN.test(value.head) &&
    isNonEmptyString(value.reviewRevision) &&
    isTimestamp(value.startedAt) &&
    isTimestamp(value.completedAt) &&
    Number.isInteger(value.exitCode)
  );
}

export function reviewRequestDigest(request: ReviewAttestationRequest): string {
  return reviewIdentityDigest(request);
}

export function canonicalizeReviewRequest(
  request: ReviewAttestationRequest,
): ReviewAttestationRequest {
  const revision = request.reviewRevision.startsWith("rv1-")
    ? request.reviewRevision
    : canonicalReviewRevision(request);
  const invocationNonce =
    request.invocationNonce ??
    `nonce-${reviewIdentityDigest({ ...request, reviewRevision: revision }).slice(0, 32)}`;
  return { ...request, reviewRevision: revision, invocationNonce };
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
  const valueDigest =
    input.category === "requests"
      ? reviewRequestDigest((input.digestSource ?? value) as ReviewAttestationRequest)
      : createHash("sha256")
          .update(canonicalJson(input.digestSource ?? value), "utf8")
          .digest("hex");
  const directory = join(repoRoot, ".ut-tdd", "review", category);
  ensureDir(directory, { recursive: true });
  const path = join(directory, `${valueDigest}.json`);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return { path, digest: valueDigest };
}

function writeReceiptCreateExclusive(
  path: string,
  receipt: ReviewReceipt,
):
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "verdict_identity_conflict" | "receipt_unreadable" } {
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  try {
    const fd = openSync(path, "wx", 0o600);
    try {
      writeSync(fd, serialized, undefined, "utf8");
    } finally {
      closeSync(fd);
    }
    return { ok: true };
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST")
      return { ok: false, reason: "receipt_unreadable" };
    try {
      const existing = JSON.parse(readFileSync(path, "utf8")) as unknown;
      return canonicalJson(existing) === canonicalJson(receipt)
        ? { ok: true }
        : { ok: false, reason: "verdict_identity_conflict" };
    } catch {
      return { ok: false, reason: "receipt_unreadable" };
    }
  }
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
  /** legacy D1 fixtures may retain arbitrary revision ids; live custody always opts into v1. */
  strict?: boolean;
}): ReviewRequestResult {
  if (!isValidReviewRequest(input.request)) return { ok: false, reason: "invalid_review_request" };
  const request = input.strict
    ? canonicalizeReviewRequest(input.request)
    : input.request.invocationNonce
      ? input.request
      : {
          ...input.request,
          invocationNonce: `nonce-${reviewIdentityDigest(input.request).slice(0, 32)}`,
        };
  if (request.reviewRevision.startsWith("rv1-") && !isStrictReviewRequest(request)) {
    return { ok: false, reason: "invalid_review_revision" };
  }
  // request digest は安定識別子 (pr / exactHead / reviewRevision / authorFamily / memoryId)
  // のみで構成する。`requestedAt` を digest に入れると、同一レビュー要求の retry が別 request
  // ファイルとして併存し、D1 (`review-dispatch.ts`) の duplicate_request_conflict を偶発させる。
  // retry は同 digest → 同 path への上書き = 冪等 (requestedAt は本文 metadata として更新される)。
  const persisted = persist({
    repoRoot: input.repoRoot,
    category: "requests",
    value: request,
    digestSource: {
      memoryId: request.memoryId,
      pr: request.pr,
      exactHead: request.exactHead,
      reviewRevision: request.reviewRevision,
      authorFamily: request.authorFamily,
    } as ReviewAttestationRequest,
  });
  return { ok: true, request, ...persisted };
}

export function projectReviewVerdict(input: {
  repoRoot: string;
  request: ReviewAttestationRequest;
  attestation: ReviewAttestation;
  verdictFile: string;
}): ReviewVerdictProjectionResult {
  if (input.attestation.exitCode !== 0) {
    if (input.request.reviewRevision.startsWith("rv1-")) {
      const match = /[\\/]attempt-([1-9][0-9]*)[\\/]verdict\.txt$/.exec(input.verdictFile);
      if (match) {
        const outcome = recordReviewAttemptFailure({
          repoRoot: input.repoRoot,
          request: input.request,
          attempt: Number(match[1]),
          provider: input.attestation.provider,
          model: input.attestation.model,
          exitCode: input.attestation.exitCode,
          verdictPath: input.verdictFile,
          now: input.attestation.completedAt,
        });
        if (!outcome.ok) return outcome;
      }
    }
    // file欠落だけでは permission拒否、認証失敗、timeout、reviewer拒否を識別できない。
    // 書込不能を捏造せず、provider failure後にverdictが無いという観測事実だけをtyped化する。
    if (
      input.attestation.provider === "claude" &&
      input.request.reviewRevision.startsWith("rv1-") &&
      !existsSync(input.verdictFile)
    ) {
      return { ok: false, reason: "verdict_absent_after_provider_failure" };
    }
    return { ok: false, reason: "reviewer_exit_nonzero" };
  }
  if (!existsSync(input.verdictFile)) {
    return { ok: false, reason: "verdict_file_missing" };
  }
  if (!isValidReviewRequest(input.request) || !isValidAttestation(input.attestation)) {
    return { ok: false, reason: "invalid_review_attestation" };
  }
  if (!identityMatches(input.request, input.attestation)) {
    return { ok: false, reason: "review_identity_mismatch" };
  }

  const strictCustody = input.request.reviewRevision.startsWith("rv1-");
  if (strictCustody && !isStrictReviewRequest(input.request)) {
    return { ok: false, reason: "verdict_identity_mismatch" };
  }
  const expectedProvider = input.request.authorFamily === "codex" ? "claude" : "codex";
  if (strictCustody && input.attestation.provider !== expectedProvider) {
    return { ok: false, reason: "same_family_reviewer_denied" };
  }
  let expectedAttempt: number | undefined;
  if (strictCustody) {
    const match = /[\\/]attempt-([1-9][0-9]*)[\\/]verdict\.txt$/.exec(input.verdictFile);
    expectedAttempt = match ? Number(match[1]) : undefined;
    if (!expectedAttempt || !Number.isSafeInteger(expectedAttempt)) {
      return { ok: false, reason: "verdict_path_identity_mismatch" };
    }
    try {
      assertReviewVerdictPath({
        repoRoot: input.repoRoot,
        requestDigest: reviewRequestDigest(input.request),
        attempt: expectedAttempt,
        verdictPath: input.verdictFile,
      });
    } catch {
      return { ok: false, reason: "verdict_path_identity_mismatch" };
    }
  }

  let verdictText: string;
  try {
    verdictText = readFileSync(input.verdictFile, "utf8");
  } catch {
    return { ok: false, reason: "verdict_file_unreadable" };
  }
  if (strictCustody) {
    const envelope = parseReviewVerdictEnvelope(verdictText);
    if (!envelope.ok) return envelope;
    const expected: ReviewVerdictEnvelope = {
      schemaVersion: REVIEW_VERDICT_SCHEMA_VERSION,
      requestDigest: reviewRequestDigest(input.request),
      attempt: expectedAttempt as number,
      pr: input.request.pr,
      exactHead: input.request.exactHead,
      reviewRevision: input.request.reviewRevision,
      reviewerProvider: input.attestation.provider,
      reviewerModel: input.attestation.model,
      invocationNonce: input.request.invocationNonce ?? "",
    };
    for (const key of Object.keys(expected) as Array<keyof ReviewVerdictEnvelope>) {
      if (envelope.value[key] !== expected[key])
        return { ok: false, reason: "verdict_identity_mismatch" };
    }
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
  if (strictCustody) {
    const directory = join(input.repoRoot, ".ut-tdd", "review", "receipts");
    ensureDir(directory, { recursive: true });
    const path = join(directory, `${reviewRequestDigest(input.request)}.json`);
    if (existsSync(path)) {
      try {
        const existing = JSON.parse(readFileSync(path, "utf8")) as unknown;
        if (canonicalJson(existing) !== canonicalJson(receipt)) {
          return { ok: false, reason: "verdict_identity_conflict" };
        }
      } catch {
        return { ok: false, reason: "receipt_unreadable" };
      }
    } else {
      const persisted = writeReceiptCreateExclusive(path, receipt);
      if (!persisted.ok) return persisted;
    }
    return { ok: true, receipt, path, digest: reviewRequestDigest(input.request) };
  }
  const persisted = persist({ repoRoot: input.repoRoot, category: "receipts", value: receipt });
  return { ok: true, receipt, ...persisted };
}

function parseReviewVerdictEnvelope(
  text: string,
): { ok: true; value: ReviewVerdictEnvelope } | { ok: false; reason: string } {
  const values = new Map<string, string>();
  const fields = [
    "schema_version",
    "request_digest",
    "attempt",
    "pr",
    "exact_head",
    "review_revision",
    "reviewer_provider",
    "reviewer_model",
    "invocation_nonce",
  ];
  for (const line of text.split(/\r?\n/)) {
    const match = /^([a-z_]+):[ \t]*(.*)$/.exec(line);
    if (!match) continue;
    if (!fields.includes(match[1])) return { ok: false, reason: "verdict_identity_mismatch" };
    if (values.has(match[1])) return { ok: false, reason: "verdict_identity_mismatch" };
    values.set(match[1], match[2].trim());
  }
  if (fields.some((field) => !values.has(field)))
    return { ok: false, reason: "verdict_identity_mismatch" };
  const attempt = Number(values.get("attempt"));
  const pr = Number(values.get("pr"));
  if (!Number.isSafeInteger(attempt) || attempt < 1 || !Number.isSafeInteger(pr) || pr < 1) {
    return { ok: false, reason: "verdict_identity_mismatch" };
  }
  const provider = values.get("reviewer_provider");
  if (provider !== "codex" && provider !== "claude")
    return { ok: false, reason: "verdict_identity_mismatch" };
  return {
    ok: true,
    value: {
      schemaVersion: values.get("schema_version") as typeof REVIEW_VERDICT_SCHEMA_VERSION,
      requestDigest: values.get("request_digest") as string,
      attempt,
      pr,
      exactHead: values.get("exact_head") as string,
      reviewRevision: values.get("review_revision") as string,
      reviewerProvider: provider,
      reviewerModel: values.get("reviewer_model") as string,
      invocationNonce: values.get("invocation_nonce") as string,
    },
  };
}
