import { parseLegacyPlanSource } from "../plan-asset/adapters/legacy-plan-inventory.ts";
import { canonicalPlanContentDigest } from "./diff-fence.ts";
import { deriveTrackedReceiptId, sha, stableJson } from "./plan-revision-command-assembler.ts";
import type { PlanAdmissionRequest } from "./policy.ts";
import {
  parseTrackedReceiptProjection,
  type TrackedReceiptRecord,
} from "./tracked-receipt-projection.ts";
import {
  admissionDecisionDigest,
  projectAdmissionForFrontmatter,
} from "./tracked-receipt-renderer.ts";

/**
 * PLAN-L6-711 §2.6 の入力形。Git / file system は一切読まない pure function の境界。
 * 取得は wrapper 側の adapter (`readRechainSnapshot`, S3) が行う。
 */
export type Oid = string;

export interface CommitObj {
  readonly oid: Oid;
  readonly parents: readonly Oid[];
  readonly tree: Oid;
}

export type TreeMap = Readonly<Record<string, Oid>>;

export interface RechainInput {
  readonly commits: {
    readonly H: CommitObj;
    readonly X: CommitObj;
    readonly R: CommitObj;
    readonly M: Oid;
    readonly base: Oid;
  };
  readonly trees: {
    readonly base: TreeMap;
    readonly H: TreeMap;
    readonly M: TreeMap;
    readonly X: TreeMap;
    readonly R: TreeMap;
  };
  readonly blobs: Readonly<Record<Oid, string>>;
  /** key = H 側の再発行対象 record の record_digest、値 = 候補 A_H (PLAN-L6-711 §2.3-6) */
  readonly admission: Readonly<Record<string, PlanAdmissionRequest>>;
}

export type RechainVerdict =
  | { readonly ok: true; readonly verifierDigest: string }
  | { readonly ok: false; readonly reasons: readonly string[] };

export const RECEIPT_PATH = "docs/governance/plan-admission-receipts.json";
const PLAN_PATH_RE = /^docs\/plans\/PLAN-[A-Za-z0-9-]+\.md$/;
/** PLAN-L6-711 §2.3-6 condition 6: command_id は H の command_id に `:rechain-<n>` (n>=1) を付けたものに限る。 */
const RECHAIN_COMMAND_SUFFIX_RE = /^:rechain-([1-9]\d*)$/;
const SECTION8_HEADING_RE = /^## 8\..*$/m;
const SECTION8_ITEM_RE = /^(\d+)\.\s(.*)$/gm;

/** PLAN-L6-711 §2.3 whitelist 検証器。全条件を満たすときだけ pass を返す (fail-close)。 */
export function verifyRechainDelta(input: RechainInput): RechainVerdict {
  const reasons: string[] = [];
  const fail = (reason: string) => reasons.push(reason);

  // --- 0. receipt を parse する (base / H / M / R) ---
  const baseReceipt = parseReceiptBlob(input, input.trees.base[RECEIPT_PATH], "base");
  const hReceipt = parseReceiptBlob(input, input.trees.H[RECEIPT_PATH], "H");
  const mReceipt = parseReceiptBlob(input, input.trees.M[RECEIPT_PATH], "M");
  const rReceipt = parseReceiptBlob(input, input.trees.R[RECEIPT_PATH], "R");
  if (!baseReceipt.ok || !hReceipt.ok || !mReceipt.ok || !rReceipt.ok) {
    for (const r of [baseReceipt, hReceipt, mReceipt, rReceipt]) if (!r.ok) fail(r.reason);
    return { ok: false, reasons };
  }
  const base = baseReceipt.records;
  const hAll = hReceipt.records;
  const mAll = mReceipt.records;
  const rAll = rReceipt.records;

  if (!isRecordPrefix(base, hAll)) fail("receipt-base-not-prefix-of-H");
  if (!isRecordPrefix(base, mAll)) fail("receipt-base-not-prefix-of-M");
  if (reasons.length > 0) return { ok: false, reasons };

  const hAppended = hAll.slice(base.length);

  // --- 1. admission 候補の対応付け (§2.3-6, U-RECHAIN-004/012) ---
  const admissionEntries = Object.entries(input.admission);
  if (admissionEntries.length !== hAppended.length) {
    fail("admission-count-mismatch");
  }
  const matched: { record: TrackedReceiptRecord; candidate: PlanAdmissionRequest }[] = [];
  for (const record of hAppended) {
    const candidate = input.admission[record.recordDigest];
    if (!candidate) {
      fail(`admission-key-unknown:${record.recordDigest}`);
      continue;
    }
    if (admissionDecisionDigest(candidate) !== record.decisionDigest) {
      fail(`admission-candidate-unverified:${record.recordDigest}`);
      continue;
    }
    matched.push({ record, candidate });
  }
  if (reasons.length > 0) return { ok: false, reasons };

  // --- 2. receipt chain の継続 (§2.3-3, U-RECHAIN-005) ---
  if (rAll.length !== mAll.length + hAppended.length) {
    fail("receipt-chain-discontinuous:length");
  } else if (!isRecordPrefix(mAll, rAll)) {
    fail("receipt-chain-discontinuous:prefix");
  }
  if (reasons.length > 0) return { ok: false, reasons };
  const rAppended = rAll.slice(mAll.length);

  // --- 3. 追加 record の対象と件数 (§2.3-3, U-RECHAIN-004) ---
  for (let i = 0; i < hAppended.length; i++) {
    const h = hAppended[i];
    const r = rAppended[i];
    if (
      !r ||
      r.binding.planId !== h.binding.planId ||
      r.binding.path !== h.binding.path ||
      r.binding.assetId !== h.binding.assetId
    ) {
      fail(`receipt-append-binding-mismatch:${h.binding.path}`);
    }
  }
  if (reasons.length > 0) return { ok: false, reasons };

  // --- 4. PLAN 単位に束ねる ---
  const planPaths = [...new Set(hAppended.map((r) => r.binding.path))];
  const revisionOffset = new Map<string, number>();
  for (const path of planPaths) {
    const latest = mAll
      .filter((r) => r.binding.path === path)
      .reduce((max, r) => Math.max(max, r.binding.revision), 0);
    revisionOffset.set(path, latest);
  }
  const addedArtifactPaths = new Set<string>();

  for (let i = 0; i < hAppended.length; i++) {
    const hRecord = hAppended[i];
    const rRecord = rAppended[i];
    const match = matched.find((m) => m.record.recordDigest === hRecord.recordDigest);
    if (!match) continue; // すでに fail 済み
    const path = hRecord.binding.path;
    const expectedRevision = (revisionOffset.get(path) ?? 0) + 1;
    revisionOffset.set(path, expectedRevision);

    const planResult = verifyPlanReapplication({
      input,
      path,
      candidate: match.candidate,
      expectedRevision,
      hRecord,
      rRecord,
    });
    if (!planResult.ok) {
      for (const reason of planResult.reasons) fail(reason);
    } else {
      for (const p of planResult.addedArtifactPaths) addedArtifactPaths.add(p);
    }
  }
  if (reasons.length > 0) return { ok: false, reasons };

  // --- 5. 成果物所有 (§2.3-5, U-RECHAIN-011) ---
  const ownershipViolations = checkArtifactOwnership(input, planPaths, addedArtifactPaths);
  for (const v of ownershipViolations) fail(v);
  if (reasons.length > 0) return { ok: false, reasons };

  // --- 6. 簿記以外の path (§2.3-1 / §2.6-2, U-RECHAIN-002/014) ---
  const bookkeepingPaths = new Set<string>([RECEIPT_PATH, ...planPaths]);
  const nonBookkeepingViolations = checkNonBookkeepingPaths(input, bookkeepingPaths);
  for (const v of nonBookkeepingViolations) fail(v);
  if (reasons.length > 0) return { ok: false, reasons };

  // --- 7. bookkeeping path は merge 時点で main 側を採る (X == M, §2.1(b)) ---
  for (const path of bookkeepingPaths) {
    if (input.trees.X[path] !== input.trees.M[path]) {
      fail(`bookkeeping-merge-not-main:${path}`);
    }
  }
  if (reasons.length > 0) return { ok: false, reasons };

  // --- 8. commit 構造 (§2.3-4 rev5, U-RECHAIN-006) ---
  const { H, X, R, M } = input.commits;
  if (R.parents.length !== 1 || R.parents[0] !== X.oid) {
    fail("commit-structure-r-parent");
  }
  if (X.parents.length !== 2 || X.parents[0] !== H.oid || X.parents[1] !== M) {
    fail("commit-structure-x-parents");
  }
  if (reasons.length > 0) return { ok: false, reasons };

  return { ok: true, verifierDigest: verifierDigestOf(input) };
}

/**
 * 入力全体の canonical digest (§2.6-5)。stableJson は key を UTF-8 byte 順で並べ替え、
 * undefined を落とす。挿入順に依存させないために JSON.stringify を使わない。
 */
export function verifierDigestOf(input: RechainInput): string {
  return `sha256:${sha(`ut-tdd.rechain-verifier.v1\n${stableJson(input)}`)}`;
}

// ---------------------------------------------------------------------------
// receipt helpers
// ---------------------------------------------------------------------------

function parseReceiptBlob(
  input: RechainInput,
  oid: Oid | undefined,
  label: string,
): { ok: true; records: readonly TrackedReceiptRecord[] } | { ok: false; reason: string } {
  if (!oid) return { ok: false, reason: `receipt-missing:${label}` };
  const content = input.blobs[oid];
  if (content === undefined) return { ok: false, reason: `receipt-blob-missing:${label}` };
  const parsed = parseTrackedReceiptProjection(content);
  if (!parsed.ok) return { ok: false, reason: `receipt-parse-invalid:${label}` };
  return { ok: true, records: parsed.value.records };
}

function isRecordPrefix(
  prefix: readonly TrackedReceiptRecord[],
  full: readonly TrackedReceiptRecord[],
): boolean {
  if (full.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (full[i].recordDigest !== prefix[i].recordDigest) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// PLAN reapplication (§2.2) + admission binding (§2.3-6)
// ---------------------------------------------------------------------------

interface PlanVerifyResult {
  ok: true;
  addedArtifactPaths: readonly string[];
}
interface PlanVerifyFailure {
  ok: false;
  reasons: readonly string[];
}

function verifyPlanReapplication(args: {
  input: RechainInput;
  path: string;
  candidate: PlanAdmissionRequest;
  expectedRevision: number;
  hRecord: TrackedReceiptRecord;
  rRecord: TrackedReceiptRecord;
}): PlanVerifyResult | PlanVerifyFailure {
  const { input, path, candidate, expectedRevision, hRecord, rRecord } = args;
  const reasons: string[] = [];

  const baseContent = readBlob(input, input.trees.base[path]);
  const hContent = readBlob(input, input.trees.H[path]);
  const mContent = readBlob(input, input.trees.M[path]);
  const rContent = readBlob(input, input.trees.R[path]);
  if (!baseContent || !hContent || !mContent || !rContent) {
    return { ok: false, reasons: [`plan-blob-missing:${path}`] };
  }

  const baseParsed = parseLegacyPlanSource(baseContent);
  const hParsed = parseLegacyPlanSource(hContent);
  const mParsed = parseLegacyPlanSource(mContent);
  const rParsed = parseLegacyPlanSource(rContent);
  if (!baseParsed || !hParsed || !mParsed || !rParsed) {
    return { ok: false, reasons: [`plan-parse-invalid:${path}`] };
  }

  // --- append-only 領域 1: frontmatter.generates ---
  const baseGenerates = asArray(baseParsed.frontmatter.generates);
  const hGenerates = asArray(hParsed.frontmatter.generates);
  const mGenerates = asArray(mParsed.frontmatter.generates);
  if (!isArrayPrefix(baseGenerates, hGenerates, stableJson)) {
    reasons.push(`plan-generates-not-append-only:${path}`);
  }
  const addedGenerates = hGenerates.slice(baseGenerates.length);
  const expectedGenerates = [...mGenerates, ...addedGenerates];
  const artifactPaths = expectedGenerates
    .map((entry) =>
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>).artifact_path
        : undefined,
    )
    .filter((p): p is string => typeof p === "string");
  if (new Set(artifactPaths).size !== artifactPaths.length) {
    reasons.push(`plan-generates-duplicate-artifact-path:${path}`);
  }

  // --- append-only 領域 2: ## 8. 節の番号付き注記 ---
  const baseSection8 = splitSection8(baseParsed.body);
  const hSection8 = splitSection8(hParsed.body);
  const mSection8 = splitSection8(mParsed.body);
  if (!isArrayPrefix(baseSection8.items, hSection8.items, (v) => v)) {
    reasons.push(`plan-section8-not-append-only:${path}`);
  }
  const addedItems = hSection8.items.slice(baseSection8.items.length);
  const expectedItems = [...mSection8.items, ...addedItems];

  // --- それ以外の領域: 3-way merge (衝突なしの場合だけ適用, §2.2-2) ---
  const otherMerge = threeWayMerge({
    base: baseSection8.other,
    h: hSection8.other,
    m: mSection8.other,
    keyOf: (v) => v,
  });
  if (!otherMerge.ok) {
    reasons.push(`plan-other-body-conflict:${path}`);
  }

  const frontmatterOtherResult = threeWayFrontmatter(
    stripKnownKeys(baseParsed.frontmatter),
    stripKnownKeys(hParsed.frontmatter),
    stripKnownKeys(mParsed.frontmatter),
  );
  if (!frontmatterOtherResult.ok) {
    reasons.push(`plan-frontmatter-conflict:${path}`);
  }

  if (reasons.length > 0) return { ok: false, reasons };

  const expectedFrontmatter: Record<string, unknown> = {
    ...(frontmatterOtherResult as { ok: true; value: Record<string, unknown> }).value,
    generates: expectedGenerates,
  };
  const expectedBody = buildSection8Body(
    (otherMerge as { ok: true; value: string }).value,
    expectedItems,
  );

  const actualFrontmatter = stripAdmissionReceipt(rParsed.frontmatter);
  if (stableJson(actualFrontmatter) !== stableJson(expectedFrontmatter)) {
    reasons.push(`plan-strip-mismatch:frontmatter:${path}`);
  }
  if (rParsed.body !== expectedBody) {
    reasons.push(`plan-strip-mismatch:body:${path}`);
  }

  // --- content_digest (§2.3-3) ---
  const rContentDigest = canonicalPlanContentDigest(rContent);
  if (!rContentDigest || rContentDigest !== rRecord.binding.contentDigest) {
    reasons.push(`plan-content-digest-mismatch:${path}`);
  }
  if (rRecord.binding.revision !== expectedRevision) {
    reasons.push(`plan-revision-mismatch:${path}`);
  }

  // --- command_id / receipt_id 束縛 (§2.3-6 condition 6) ---
  // command_id は H の command_id + `:rechain-<n>` suffix (n>=1) に限る。record 内の値を
  // 信用せず、format を fail-close で検査したうえで、receipt_id を正規式
  // (plan-revision-command-assembler.deriveTrackedReceiptId、node-plan-revision-runner.ts の
  // certificateId 計算と同一) から独立に再導出して照合する。
  // receipt_digest (certificateDigest) は ledger 側の actor / sourceCommit を必要とし、
  // `RechainInput` (§2.6 で凍結、S2 は形を追加しない) には actor が含まれないため、この pure
  // function からは bit-exact に再導出できない。最低限、H の receipt_digest をそのまま R へ
  // 使い回していないことだけを fail-close で検査する (record 内容が変わった以上、真正な再発行
  // なら receipt_digest も変わるはずである)。
  if (!isRechainCommandId(hRecord.commandId, rRecord.commandId)) {
    reasons.push(`rechain-command-id-mismatch:${path}`);
  } else if (rRecord.receiptId !== deriveTrackedReceiptId(rRecord.commandId)) {
    reasons.push(`rechain-receipt-id-mismatch:${path}`);
  }
  if (rRecord.receiptDigest === hRecord.receiptDigest) {
    reasons.push(`rechain-receipt-digest-unchanged:${path}`);
  }

  // --- admission 意味の不変 (§2.3-6, U-RECHAIN-012) ---
  const expectedAR: PlanAdmissionRequest =
    candidate.reentry && candidate.reentry.targetPlanId === hRecord.binding.planId
      ? { ...candidate, reentry: { ...candidate.reentry, targetRevision: expectedRevision } }
      : candidate;
  const decisionDigest = admissionDecisionDigest(expectedAR);
  if (decisionDigest !== rRecord.decisionDigest) {
    reasons.push(`admission-decision-digest-mismatch:${path}`);
  }
  const normalizedH = normalizeAdmissionExceptTargetRevision(candidate);
  const normalizedR = normalizeAdmissionExceptTargetRevision(expectedAR);
  if (stableJson(normalizedH) !== stableJson(normalizedR)) {
    reasons.push(`admission-field-drift:${path}`);
  }

  const actualReceiptBlock = rParsed.frontmatter.admission_receipt as
    | Record<string, unknown>
    | undefined;
  if (!actualReceiptBlock) {
    reasons.push(`plan-admission-receipt-missing:${path}`);
    return { ok: false, reasons };
  }
  const expectedProjection = projectAdmissionForFrontmatter(expectedAR);
  const projectedActual: Record<string, unknown> = {};
  for (const key of [
    "route",
    "issue",
    "origin",
    "transition",
    "reentry",
    "escape_reason",
    "supersedes",
  ]) {
    if (key in actualReceiptBlock) projectedActual[key] = actualReceiptBlock[key];
  }
  if (stableJson(projectedActual) !== stableJson(expectedProjection)) {
    reasons.push(`plan-admission-receipt-projection-mismatch:${path}`);
  }
  if (
    actualReceiptBlock.decision_digest !== decisionDigest ||
    actualReceiptBlock.receipt_id !== rRecord.receiptId ||
    actualReceiptBlock.command_id !== rRecord.commandId ||
    actualReceiptBlock.receipt_digest !== rRecord.receiptDigest ||
    actualReceiptBlock.source_digest !== rRecord.binding.contentDigest
  ) {
    reasons.push(`plan-admission-receipt-binding-mismatch:${path}`);
  }
  const binding = actualReceiptBlock.binding as Record<string, unknown> | undefined;
  if (
    !binding ||
    binding.path !== rRecord.binding.path ||
    binding.plan_id !== rRecord.binding.planId ||
    binding.asset_id !== rRecord.binding.assetId ||
    binding.revision !== rRecord.binding.revision ||
    binding.content_digest !== rRecord.binding.contentDigest
  ) {
    reasons.push(`plan-admission-receipt-binding-shape-mismatch:${path}`);
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, addedArtifactPaths: artifactPaths.slice(mGenerates.length) };
}

function isRechainCommandId(hCommandId: string, rCommandId: string): boolean {
  if (!rCommandId.startsWith(hCommandId)) return false;
  return RECHAIN_COMMAND_SUFFIX_RE.test(rCommandId.slice(hCommandId.length));
}

function normalizeAdmissionExceptTargetRevision(
  admission: PlanAdmissionRequest,
): PlanAdmissionRequest {
  if (!admission.reentry) return admission;
  return { ...admission, reentry: { ...admission.reentry, targetRevision: 0 } };
}

function readBlob(input: RechainInput, oid: Oid | undefined): string | undefined {
  if (!oid) return undefined;
  return input.blobs[oid];
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function isArrayPrefix<T>(
  prefix: readonly T[],
  full: readonly T[],
  keyOf: (v: T) => unknown,
): boolean {
  if (full.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (keyOf(full[i]) !== keyOf(prefix[i])) return false;
  }
  return true;
}

function stripKnownKeys(frontmatter: Record<string, unknown>): Record<string, unknown> {
  const { generates: _generates, admission_receipt: _receipt, ...rest } = frontmatter;
  return rest;
}

function stripAdmissionReceipt(frontmatter: Record<string, unknown>): Record<string, unknown> {
  const { admission_receipt: _receipt, ...rest } = frontmatter;
  return rest;
}

function threeWayFrontmatter(
  base: Record<string, unknown>,
  h: Record<string, unknown>,
  m: Record<string, unknown>,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  const keys = new Set<string>([...Object.keys(base), ...Object.keys(h), ...Object.keys(m)]);
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    const merged = threeWayMerge({ base: base[key], h: h[key], m: m[key], keyOf: stableJson });
    if (!merged.ok) return { ok: false };
    if (merged.value !== undefined) result[key] = merged.value;
  }
  return { ok: true, value: result };
}

function threeWayMerge<T>(input: {
  base: T;
  h: T;
  m: T;
  keyOf: (v: T) => unknown;
}): { ok: true; value: T } | { ok: false } {
  const { base, h, m, keyOf } = input;
  const bk = keyOf(base);
  const hk = keyOf(h);
  const mk = keyOf(m);
  if (hk === bk) return { ok: true, value: m };
  if (mk === bk) return { ok: true, value: h };
  if (hk === mk) return { ok: true, value: h };
  return { ok: false };
}

// ---------------------------------------------------------------------------
// ## 8. 節の分解と再構成
// ---------------------------------------------------------------------------

function splitSection8(body: string): { other: string; items: readonly string[] } {
  const match = SECTION8_HEADING_RE.exec(body);
  if (!match) return { other: body, items: [] };
  const headingEnd = match.index + match[0].length;
  const other = body.slice(0, headingEnd);
  const itemsText = body.slice(headingEnd);
  const items = [...itemsText.matchAll(SECTION8_ITEM_RE)].map((item) => item[2]);
  return { other, items };
}

function buildSection8Body(other: string, items: readonly string[]): string {
  const lines = items.map((item, index) => `${index + 1}. ${item}`);
  return `${other}\n${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// 成果物所有 (§2.3-5)
// ---------------------------------------------------------------------------

function checkArtifactOwnership(
  input: RechainInput,
  ownPlanPaths: readonly string[],
  addedArtifactPaths: ReadonlySet<string>,
): readonly string[] {
  if (addedArtifactPaths.size === 0) return [];
  const violations: string[] = [];
  const ownSet = new Set(ownPlanPaths);
  const declaredElsewhere = new Set<string>();
  for (const [path, oid] of Object.entries(input.trees.M)) {
    if (!PLAN_PATH_RE.test(path) || ownSet.has(path)) continue;
    const content = input.blobs[oid];
    if (content === undefined) continue;
    const parsed = parseLegacyPlanSource(content);
    if (!parsed) continue;
    for (const entry of asArray(parsed.frontmatter.generates)) {
      if (entry && typeof entry === "object") {
        const artifactPath = (entry as Record<string, unknown>).artifact_path;
        if (typeof artifactPath === "string") declaredElsewhere.add(artifactPath);
      }
    }
  }
  for (const artifactPath of addedArtifactPaths) {
    if (input.trees.M[artifactPath] !== undefined) {
      violations.push(`artifact-reowned-tree:${artifactPath}`);
      continue;
    }
    if (declaredElsewhere.has(artifactPath)) {
      violations.push(`artifact-reowned-generates:${artifactPath}`);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// 簿記以外の path の path-level 3-way (§2.3-1 / §2.6-2)
// ---------------------------------------------------------------------------

function checkNonBookkeepingPaths(
  input: RechainInput,
  bookkeepingPaths: ReadonlySet<string>,
): readonly string[] {
  const violations: string[] = [];
  const paths = new Set<string>([
    ...Object.keys(input.trees.base),
    ...Object.keys(input.trees.H),
    ...Object.keys(input.trees.M),
    ...Object.keys(input.trees.X),
    ...Object.keys(input.trees.R),
  ]);
  for (const path of paths) {
    if (bookkeepingPaths.has(path)) continue;
    const baseOid = input.trees.base[path];
    const hOid = input.trees.H[path];
    const mOid = input.trees.M[path];
    let expected: Oid | undefined;
    if (hOid === baseOid) {
      expected = mOid;
    } else if (mOid === baseOid) {
      expected = hOid;
    } else if (hOid === mOid) {
      expected = hOid;
    } else {
      violations.push(`nonbookkeeping-both-sides-changed:${path}`);
      continue;
    }
    if (input.trees.X[path] !== expected) violations.push(`nonbookkeeping-x-mismatch:${path}`);
    if (input.trees.R[path] !== expected) violations.push(`nonbookkeeping-r-mismatch:${path}`);
  }
  return violations;
}
