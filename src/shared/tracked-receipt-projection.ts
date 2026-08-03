import { createHash } from "node:crypto";
import { PLAN_ID_PATTERN } from "../schema/plan-id";

interface AdmissionReceiptProjection {
  commandId: string;
  receiptId: string;
  receiptDigest: string;
  decisionDigest: string;
  binding: {
    path: string;
    planId: string;
    assetId: string;
    revision: number;
    contentDigest: string;
  };
}

interface AdmissionProjectionPort {
  lookup(commandId: string): AdmissionReceiptProjection | undefined;
  validate(): { ok: boolean; findings: readonly { code: string; detail?: string }[] };
}

export const TRACKED_RECEIPT_SCHEMA = "ut-tdd.plan-admission-receipts/v1" as const;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const PLAN_PATH = /^docs\/plans\/PLAN-[A-Za-z0-9-]+\.md$/;
const PLAN_ID = PLAN_ID_PATTERN;
const ASSET_ID = /^plan:[a-z0-9][a-z0-9:-]{2,127}$/;

/**
 * Git管理されたhash chainは改ざん検出材料であり、発行者の真正性を証明しない。
 * trusted issuer/signatureの検証は別portの責務で、この型を認証済み証拠として扱ってはならない。
 */
export interface IntegrityOnlyTrustBoundary {
  integrity: "hash_chain_verified";
  issuerAuthenticity: "not_verified";
}

export interface TrackedReceiptRecord extends AdmissionReceiptProjection {
  sequence: number;
  previousRecordDigest: string | null;
  recordDigest: string;
}

export interface TrackedReceiptProjectionFile {
  schemaVersion: typeof TRACKED_RECEIPT_SCHEMA;
  records: readonly TrackedReceiptRecord[];
}

export type TrackedReceiptParseResult =
  | {
      ok: true;
      value: TrackedReceiptProjectionFile & AdmissionProjectionPort & IntegrityOnlyTrustBoundary;
    }
  | { ok: false; errors: readonly string[] };

type JsonObject = Record<string, unknown>;

export function trackedReceiptRecordDigest(
  record: Omit<TrackedReceiptRecord, "recordDigest">,
): string {
  const canonical = JSON.stringify({
    sequence: record.sequence,
    previous_record_digest: record.previousRecordDigest,
    command_id: record.commandId,
    receipt_id: record.receiptId,
    receipt_digest: record.receiptDigest,
    decision_digest: record.decisionDigest,
    binding: {
      path: record.binding.path,
      plan_id: record.binding.planId,
      asset_id: record.binding.assetId,
      revision: record.binding.revision,
      content_digest: record.binding.contentDigest,
    },
  });
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

/** Strict parser used by CI/pre-push adapters. It performs no filesystem I/O. */
export function parseTrackedReceiptProjection(text: string): TrackedReceiptParseResult {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["projection-json-invalid"] };
  }
  if (!isExactObject(root, ["schema_version", "records"])) {
    return { ok: false, errors: ["projection-root-shape-invalid"] };
  }
  const errors: string[] = [];
  if (root.schema_version !== TRACKED_RECEIPT_SCHEMA)
    errors.push("projection-schema-version-invalid");
  if (!Array.isArray(root.records))
    return { ok: false, errors: [...errors, "projection-records-invalid"] };

  const records: TrackedReceiptRecord[] = [];
  const commandIds = new Set<string>();
  const receiptIds = new Set<string>();
  const pathRevisions = new Set<string>();
  let previous: string | null = null;
  for (const [index, candidate] of root.records.entries()) {
    const prefix = `record[${index}]`;
    const parsed = parseRecord(candidate, prefix, errors);
    if (!parsed) continue;
    if (parsed.sequence !== index + 1) errors.push(`${prefix}:sequence-not-canonical`);
    if (parsed.previousRecordDigest !== previous)
      errors.push(`${prefix}:previous-record-digest-mismatch`);
    if (parsed.recordDigest !== trackedReceiptRecordDigest(parsed))
      errors.push(`${prefix}:record-digest-mismatch`);
    if (commandIds.has(parsed.commandId)) errors.push(`${prefix}:command-id-duplicate`);
    if (receiptIds.has(parsed.receiptId)) errors.push(`${prefix}:receipt-id-duplicate`);
    // 一意性は (path, asset, revision)。sealed lineage 移行 (issue #143 /
    // PLAN-RECOVERY-16 §2) 後の successor asset は同一 path の revision を 1 から
    // 再開するため、asset を含めないと successor の正規 revise が duplicate で
    // fail-close する (issue #157 実測)。同一 asset 内の二重 binding は引き続き拒否。
    const pathRevision = `${parsed.binding.path}\u0000${parsed.binding.assetId}\u0000${parsed.binding.revision}`;
    if (pathRevisions.has(pathRevision)) errors.push(`${prefix}:path-revision-duplicate`);
    commandIds.add(parsed.commandId);
    receiptIds.add(parsed.receiptId);
    pathRevisions.add(pathRevision);
    previous = parsed.recordDigest;
    records.push(parsed);
  }
  if (errors.length > 0) return { ok: false, errors };
  const byCommand = new Map(records.map((record) => [record.commandId, record]));
  return {
    ok: true,
    value: {
      schemaVersion: TRACKED_RECEIPT_SCHEMA,
      records,
      integrity: "hash_chain_verified",
      issuerAuthenticity: "not_verified",
      lookup: (commandId) => byCommand.get(commandId),
      validate: () => ({ ok: true, findings: [] }),
    },
  };
}

function parseRecord(
  value: unknown,
  prefix: string,
  errors: string[],
): TrackedReceiptRecord | undefined {
  const keys = [
    "sequence",
    "previous_record_digest",
    "record_digest",
    "command_id",
    "receipt_id",
    "receipt_digest",
    "decision_digest",
    "binding",
  ];
  if (!isExactObject(value, keys)) {
    errors.push(`${prefix}:shape-invalid`);
    return undefined;
  }
  if (
    !isExactObject(value.binding, ["path", "plan_id", "asset_id", "revision", "content_digest"])
  ) {
    errors.push(`${prefix}:binding-shape-invalid`);
    return undefined;
  }
  const binding = value.binding;
  const valid =
    Number.isSafeInteger(value.sequence) &&
    Number(value.sequence) > 0 &&
    (value.previous_record_digest === null || isSha(value.previous_record_digest)) &&
    isSha(value.record_digest) &&
    nonEmpty(value.command_id) &&
    nonEmpty(value.receipt_id) &&
    isSha(value.receipt_digest) &&
    isSha(value.decision_digest) &&
    typeof binding.path === "string" &&
    PLAN_PATH.test(binding.path) &&
    typeof binding.plan_id === "string" &&
    PLAN_ID.test(binding.plan_id) &&
    typeof binding.asset_id === "string" &&
    ASSET_ID.test(binding.asset_id) &&
    Number.isSafeInteger(binding.revision) &&
    Number(binding.revision) > 0 &&
    isSha(binding.content_digest);
  if (!valid) {
    errors.push(`${prefix}:field-invalid`);
    return undefined;
  }
  return {
    sequence: value.sequence as number,
    previousRecordDigest: value.previous_record_digest as string | null,
    recordDigest: value.record_digest as string,
    commandId: value.command_id as string,
    receiptId: value.receipt_id as string,
    receiptDigest: value.receipt_digest as string,
    decisionDigest: value.decision_digest as string,
    binding: {
      path: binding.path as string,
      planId: binding.plan_id as string,
      assetId: binding.asset_id as string,
      revision: binding.revision as number,
      contentDigest: binding.content_digest as string,
    },
  };
}

function isExactObject(value: unknown, expectedKeys: readonly string[]): value is JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value as object).sort();
  const expected = [...expectedKeys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isSha(value: unknown): value is string {
  return typeof value === "string" && SHA256.test(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}
