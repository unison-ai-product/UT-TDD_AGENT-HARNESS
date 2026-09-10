import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { isValidReviewRequest, reviewRequestDigest } from "./review-attestation.ts";
import {
  analyzeReviewDispatch,
  type ReviewReceipt,
  type ReviewRequest,
} from "./review-dispatch.ts";
import { canonicalJson } from "./review-verdict-custody.ts";

export type ReviewProjectionIssueReason =
  | "directory_unreadable"
  | "malformed_json"
  | "schema_invalid"
  | "filename_digest_mismatch"
  | "duplicate_conflict"
  | "receipt_without_request"
  | "identity_mismatch"
  | "flagged";

export interface ReviewProjectionIssue {
  readonly digest: string;
  readonly reason: ReviewProjectionIssueReason;
}

export interface ReviewProjectionReconciliationResult {
  readonly ok: boolean;
  readonly pending: string[];
  readonly consumed: string[];
  readonly issues: ReviewProjectionIssue[];
}

interface LoadedJson {
  readonly digest: string;
  readonly value: unknown;
  readonly canonical: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const DIGEST_FILE = /^([a-f0-9]{64})\.json$/;
const RECEIPT_SCHEMA_REASONS = [
  "empty_identity",
  "invalid_receipt_fields",
  "invalid_head",
  "empty_review_revision",
  "invalid_timestamp",
  "future_timestamp",
  "missing_verdict",
  "flag_without_blocking_findings",
  "blocking_findings_on_pass",
];

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function issue(digest: string, reason: ReviewProjectionIssueReason): ReviewProjectionIssue {
  return { digest, reason };
}

function readJsonDirectories(
  directories: readonly string[],
  issues: ReviewProjectionIssue[],
): LoadedJson[] {
  const loaded: LoadedJson[] = [];
  for (const directory of [...directories].sort(compareText)) {
    if (!existsSync(directory)) continue;
    let names: string[];
    try {
      names = readdirSync(directory).sort(compareText);
    } catch {
      issues.push(issue(basename(directory), "directory_unreadable"));
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const match = DIGEST_FILE.exec(name);
      const digest = match?.[1] ?? name.slice(0, -5);
      if (match == null) {
        issues.push(issue(digest, "filename_digest_mismatch"));
        continue;
      }
      try {
        const value = JSON.parse(readFileSync(join(directory, name), "utf8")) as unknown;
        loaded.push({ digest, value, canonical: canonicalJson(value) });
      } catch {
        issues.push(issue(digest, "malformed_json"));
      }
    }
  }
  return loaded;
}

function uniqueArtifacts(
  artifacts: readonly LoadedJson[],
  issues: ReviewProjectionIssue[],
): Map<string, LoadedJson> {
  const byDigest = new Map<string, LoadedJson>();
  for (const artifact of artifacts) {
    const existing = byDigest.get(artifact.digest);
    if (existing != null && existing.canonical !== artifact.canonical) {
      issues.push(issue(artifact.digest, "duplicate_conflict"));
      continue;
    }
    byDigest.set(artifact.digest, artifact);
  }
  return byDigest;
}

function hasIssue(issues: readonly ReviewProjectionIssue[], digest: string): boolean {
  return issues.some((entry) => entry.digest === digest);
}

/**
 * Reconcile repository-local request/receipt projections by canonical request identity.
 * A shared basename is only a lookup hint: analyzeReviewDispatch remains the authority
 * for the four-field identity and cross-family terminal-verdict rules.
 */
export function reconcileReviewProjection(input: {
  readonly requestDirectories: readonly string[];
  readonly receiptDirectories: readonly string[];
  readonly now: string;
}): ReviewProjectionReconciliationResult {
  const issues: ReviewProjectionIssue[] = [];
  const requests = uniqueArtifacts(readJsonDirectories(input.requestDirectories, issues), issues);
  const receipts = uniqueArtifacts(readJsonDirectories(input.receiptDirectories, issues), issues);
  const validRequests = new Map<string, ReviewRequest>();

  for (const [digest, artifact] of requests) {
    const candidate = artifact.value as ReviewRequest;
    if (candidate == null || typeof candidate !== "object" || !isValidReviewRequest(candidate)) {
      issues.push(issue(digest, "schema_invalid"));
    } else if (reviewRequestDigest(candidate) !== digest) {
      issues.push(issue(digest, "filename_digest_mismatch"));
    } else {
      validRequests.set(digest, candidate);
    }
  }

  for (const digest of receipts.keys()) {
    if (!requests.has(digest)) issues.push(issue(digest, "receipt_without_request"));
  }

  const pending: string[] = [];
  const consumed: string[] = [];
  for (const [digest, request] of validRequests) {
    const artifact = receipts.get(digest);
    if (artifact == null || hasIssue(issues, digest)) {
      pending.push(digest);
      continue;
    }
    if (!isRecord(artifact.value)) {
      issues.push(issue(digest, "schema_invalid"));
      pending.push(digest);
      continue;
    }
    const result = analyzeReviewDispatch({
      requests: [request],
      receipts: [artifact.value as unknown as ReviewReceipt],
      prs: [{ pr: request.pr, headSha: request.exactHead, state: "OPEN", checksGreen: true }],
      now: input.now,
    });
    const schemaInvalid = [
      ...result.diagnostics,
      ...result.entries.flatMap((entry) => entry.reasons),
    ].some((diagnostic) =>
      RECEIPT_SCHEMA_REASONS.some(
        (reason) => diagnostic === reason || diagnostic.includes(`:${reason}:`),
      ),
    );
    if (schemaInvalid) {
      issues.push(issue(digest, "schema_invalid"));
      pending.push(digest);
    } else if (result.entries[0]?.reasons.includes("flagged")) {
      issues.push(issue(digest, "flagged"));
      pending.push(digest);
    } else if (result.entries[0]?.state !== "merge_ready") {
      issues.push(issue(digest, "identity_mismatch"));
      pending.push(digest);
    } else {
      consumed.push(digest);
    }
  }

  const sortedIssues = [
    ...new Map(issues.map((entry) => [`${entry.digest}:${entry.reason}`, entry])).values(),
  ].sort(
    (left, right) =>
      compareText(left.digest, right.digest) || compareText(left.reason, right.reason),
  );
  return {
    ok: sortedIssues.length === 0,
    pending: pending.sort(compareText),
    consumed: consumed.sort(compareText),
    issues: sortedIssues,
  };
}
