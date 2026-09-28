import { describe, expect, it } from "vitest";
import { parse as parseYaml, stringify } from "yaml";
import { canonicalPlanContentDigest } from "../src/plan-admission/diff-fence.ts";
import type { PlanDraftCommand } from "../src/plan-admission/plan-draft-service.ts";
import {
  deriveTrackedReceiptId,
  sha,
  stableJson,
} from "../src/plan-admission/plan-revision-command-assembler.ts";
import type { PlanAdmissionRequest } from "../src/plan-admission/policy.ts";
import {
  type CommitObj,
  RECEIPT_PATH,
  type RechainInput,
  type TreeMap,
  verifierDigestOf,
  verifyRechainDelta,
} from "../src/plan-admission/rechain-verifier.ts";
import {
  parseTrackedReceiptProjection,
  TRACKED_RECEIPT_SCHEMA,
  type TrackedReceiptRecord,
  trackedReceiptRecordDigest,
} from "../src/plan-admission/tracked-receipt-projection.ts";
import {
  type TrackedReceiptDraftPayload,
  type TrackedReceiptDraftReceipt,
  TrackedReceiptRenderer,
  type TrackedReceiptProjectionReader,
} from "../src/plan-admission/tracked-receipt-renderer.ts";

// ---------------------------------------------------------------------------
// fixture helpers (すべて in-memory。実 repository / process.cwd() は読まない)
// ---------------------------------------------------------------------------

const PLAN_ID = "PLAN-L6-999-rechain-test";
const PLAN_PATH = `docs/plans/${PLAN_ID}.md`;
const ASSET_ID = "plan:test:rechain999";
const OTHER_PLAN_ID = "PLAN-L6-888-other";
const OTHER_PLAN_PATH = `docs/plans/${OTHER_PLAN_ID}.md`;
const UNTOUCHED_PATH = "src/example/untouched.ts";

function baseFrontmatterOther(): Record<string, unknown> {
  return {
    plan_id: PLAN_ID,
    title: "rechain test",
    kind: "add-design",
    layer: "L6",
    drive: "agent",
    route_signal: "feature_addition",
    route_mode: "add-feature",
    status: "draft",
    sub_doc: "function-spec",
    // frontmatterSchema (§1.8 / §1.9 / §1.10 E) の必須項目。TrackedReceiptRenderer.render() の
    // selfVerify() は frontmatterSchema.safeParse を通すため、fixture もこれを満たす必要がある。
    agent_slots: [{ role: "tl", slot_label: "TL - rechain verifier fixture" }],
    dependencies: { parent: "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md" },
  };
}

function bodyFor(items: readonly string[]): string {
  const list = items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return `# rechain test\n\n本文固定テキスト。\n\n## 8. 記録\n${list}\n`;
}

function admissionFor(
  revision: number,
  overrides?: Partial<PlanAdmissionRequest>,
): PlanAdmissionRequest {
  return {
    routeSignal: "feature_addition",
    routeMode: "add-feature",
    kind: "add-design",
    layer: "L6",
    drive: "agent",
    branch: "work/add-feature-issue999-s2-rechain-verifier",
    status: "draft",
    subDoc: "function-spec",
    issue: {
      provider: "github",
      issueId: 999,
      episodeId: "E4-999-rechain",
      projectionState: "unprojected",
    },
    origin: {
      planId: "PLAN-RECOVERY-16-plan-revision-authoring",
      revision: 7,
      digest: `sha256:${"a".repeat(64)}`,
    },
    reentry: { targetPlanId: PLAN_ID, targetRevision: revision, phase: "forward_merge" },
    escapeReason: "S2 実装のための再検証",
    ...overrides,
  };
}

interface RevisionInput {
  frontmatterOther: Record<string, unknown>;
  generates: readonly unknown[];
  items: readonly string[];
  admission: PlanAdmissionRequest;
  binding: { path: string; planId: string; assetId: string; revision: number };
  commandId: string;
  admittedAt: string;
  /** この PLAN 資産の直前までの確定 record 列 (このチェーンで初めての場合は省略 = []). */
  priorRecords?: readonly TrackedReceiptRecord[];
}

/**
 * PLAN-L6-711 §2.3-6 condition 6 / Codex Sol r1 FLAG (PR #724 finding 2): admission_receipt の
 * frontmatter/projection 構造を fixture 側で手組みせず、production の
 * `TrackedReceiptRenderer.render()` (tracked-receipt-renderer.ts) をそのまま呼んで生成する。
 * renderer/verifier の shape drift が green のまま埋もれることを防ぐ。
 */
function makeRevision(params: RevisionInput): { content: string; record: TrackedReceiptRecord } {
  const fm = { ...params.frontmatterOther, generates: params.generates };
  const body = bodyFor(params.items);
  const preSource = `---\n${stringify(fm)}---\n${body}`;
  const priorRecords = params.priorRecords ?? [];
  const reader: TrackedReceiptProjectionReader = { read: () => receiptFile(priorRecords) };
  const renderer = new TrackedReceiptRenderer(reader);
  const receipt: TrackedReceiptDraftReceipt = {
    assetId: params.binding.assetId,
    revision: params.binding.revision,
    certificateId: deriveTrackedReceiptId(params.commandId),
    commandPayloadDigest: `sha256:${sha(`${params.commandId}-command-payload`)}`,
    // certificateDigest (receipt_digest) は production では ledger の actor / sourceCommit に
    // 依存する opaque 値であり、renderer 自身も計算しない (呼出し側が既に計算済みの値を渡す)。
    // fixture では commandId から決定的に導き、H/R で必ず異なる値になることだけを保証する。
    certificateDigest: sha(`${params.commandId}-cert`),
  };
  const command: PlanDraftCommand<TrackedReceiptDraftPayload> = {
    commandId: params.commandId,
    commandPayloadDigest: receipt.commandPayloadDigest,
    planId: params.binding.planId,
    recordedAt: params.admittedAt,
    payload: { admission: params.admission },
    source: { path: params.binding.path, content: preSource },
    projectionPath: RECEIPT_PATH,
  };
  const [source, projection] = renderer.render(command, receipt);
  const parsedProjection = parseTrackedReceiptProjection(projection.content);
  if (!parsedProjection.ok)
    throw new Error(`fixture-projection-invalid:${parsedProjection.errors.join(",")}`);
  const record = parsedProjection.value.records.at(-1);
  if (!record) throw new Error("fixture-projection-empty");
  return { content: source.content, record };
}

function toJsonRecord(record: TrackedReceiptRecord): Record<string, unknown> {
  return {
    sequence: record.sequence,
    previous_record_digest: record.previousRecordDigest,
    record_digest: record.recordDigest,
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
  };
}

function receiptFile(records: readonly TrackedReceiptRecord[]): string {
  return `${JSON.stringify(
    { schema_version: TRACKED_RECEIPT_SCHEMA, records: records.map(toJsonRecord) },
    null,
    2,
  )}\n`;
}

/** content-addressed な fake blob store。同内容は同 oid。 */
function makeBlobStore() {
  const blobs: Record<string, string> = {};
  const put = (content: string): string => {
    const oid = sha(content).slice(0, 40);
    blobs[oid] = content;
    return oid;
  };
  return { blobs, put };
}

const COMMITS = {
  base: "commit-base-0000000000000000000000",
  H: "commit-H-0000000000000000000000000",
  X: "commit-X-0000000000000000000000000",
  R: "commit-R-0000000000000000000000000",
  M: "commit-M-0000000000000000000000000",
};

function commitObjs(): { H: CommitObj; X: CommitObj; R: CommitObj } {
  return {
    H: { oid: COMMITS.H, parents: [COMMITS.base], tree: "tree-H" },
    X: { oid: COMMITS.X, parents: [COMMITS.H, COMMITS.M], tree: "tree-X" },
    R: { oid: COMMITS.R, parents: [COMMITS.X], tree: "tree-R" },
  };
}

interface Baseline {
  input: RechainInput;
  hRecord: TrackedReceiptRecord;
  rRecord: TrackedReceiptRecord;
  admissionH: PlanAdmissionRequest;
  blobs: Record<string, string>;
}

/** Set A: 同一 PLAN に対する main 側の同時改訂は無い、単純な正系 fixture。
 * `extraGenerates` は U-RECHAIN-001 が要求する「generates 追加 2 件」を満たすための追加分
 * (default では追加しない。既存 16 oracle の期待値を変えないため)。 */
function buildBaseline(
  overrides: {
    extraGenerates?: readonly { artifact_path: string; artifact_type: string }[];
  } = {},
): Baseline {
  const { blobs, put } = makeBlobStore();

  const baseGenerates = [{ artifact_path: PLAN_PATH, artifact_type: "markdown_doc" }];
  const baseItems = ["起票 (rev 1)。"];
  const baseFm = baseFrontmatterOther();
  const baseBody = bodyFor(baseItems);
  const baseContent = `---\n${stringify({ ...baseFm, generates: baseGenerates })}---\n${baseBody}`;
  const baseReceiptContent = receiptFile([]);

  const untouchedV1 = "export const value = 1;\n";
  const untouchedV2 = "export const value = 2; // main が更新\n";

  const admissionH = admissionFor(1);
  const hGenerates = [
    ...baseGenerates,
    { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
    ...(overrides.extraGenerates ?? []),
  ];
  const hItems = [...baseItems, "rev 2 (S2): 検証器を実装した。"];
  const { content: hContent, record: hRecord } = makeRevision({
    frontmatterOther: baseFm,
    generates: hGenerates,
    items: hItems,
    admission: admissionH,
    binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
    commandId: "plan-revise:issue-999:s2:plan:r1:h1",
    admittedAt: "2026-09-28T00:00:00.000Z",
  });

  const admissionR = admissionH; // revision 変化なし (M 側に同一 PLAN の競合なし)
  const { content: rContent, record: rRecord } = makeRevision({
    frontmatterOther: baseFm,
    generates: hGenerates,
    items: hItems,
    admission: admissionR,
    binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
    commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
    admittedAt: "2026-09-28T01:00:00.000Z",
  });
  const rReceiptContent = receiptFile([rRecord]);
  const hReceiptContent = receiptFile([hRecord]);
  const mReceiptContent = receiptFile([]);

  const baseTree: TreeMap = {
    [PLAN_PATH]: put(baseContent),
    [RECEIPT_PATH]: put(baseReceiptContent),
    [UNTOUCHED_PATH]: put(untouchedV1),
  };
  const hTree: TreeMap = {
    [PLAN_PATH]: put(hContent),
    [RECEIPT_PATH]: put(hReceiptContent),
    [UNTOUCHED_PATH]: baseTree[UNTOUCHED_PATH],
  };
  const mTree: TreeMap = {
    [PLAN_PATH]: baseTree[PLAN_PATH],
    [RECEIPT_PATH]: put(mReceiptContent),
    [UNTOUCHED_PATH]: put(untouchedV2),
  };
  const xTree: TreeMap = {
    [PLAN_PATH]: mTree[PLAN_PATH],
    [RECEIPT_PATH]: mTree[RECEIPT_PATH],
    [UNTOUCHED_PATH]: mTree[UNTOUCHED_PATH],
  };
  const rTree: TreeMap = {
    [PLAN_PATH]: put(rContent),
    [RECEIPT_PATH]: put(rReceiptContent),
    [UNTOUCHED_PATH]: xTree[UNTOUCHED_PATH],
  };

  const input: RechainInput = {
    commits: { ...commitObjs(), M: COMMITS.M, base: COMMITS.base },
    trees: { base: baseTree, H: hTree, M: mTree, X: xTree, R: rTree },
    blobs,
    admission: { [hRecord.recordDigest]: admissionH },
  };

  return { input, hRecord, rRecord, admissionH, blobs };
}

// テストでは tree/blob/admission を局所的に上書きするため、readonly を外した深いコピーを返す。
type Mutable<T> = T extends PlanAdmissionRequest
  ? T
  : { -readonly [K in keyof T]: Mutable<T[K]> };
function clone(input: RechainInput): Mutable<RechainInput> {
  return JSON.parse(JSON.stringify(input)) as Mutable<RechainInput>;
}

// ---------------------------------------------------------------------------
// U-RECHAIN-012c: PlanAdmissionRequest の各 field を個別に改変する table-driven oracle
// (§2.3-6 condition 6 / CANDIDATE-U-RECHAIN-012 の全 field 展開)。
// ---------------------------------------------------------------------------

/** JSON round-trip での深い draft コピーに dot-path で値を書き込む (union literal 型を迂回する)。 */
function setDraftPath(draft: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".");
  let cursor: Record<string, unknown> = draft;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const next = cursor[key];
    const nextObject: Record<string, unknown> =
      next && typeof next === "object" ? { ...(next as Record<string, unknown>) } : {};
    cursor[key] = nextObject;
    cursor = nextObject;
  }
  cursor[segments[segments.length - 1]] = value;
}

function mutateAdmissionField(
  admission: PlanAdmissionRequest,
  path: string,
  value: unknown,
): PlanAdmissionRequest {
  const draft = JSON.parse(JSON.stringify(admission)) as Record<string, unknown>;
  setDraftPath(draft, path, value);
  return draft as unknown as PlanAdmissionRequest;
}

/** PLAN-L6-711 §2.3-6 condition 6 / U-RECHAIN-012 が列挙する全 field。reentry.targetRevision は
 * 唯一の許容差分なので対象外。 */
const ADMISSION_FIELD_MUTATIONS: readonly { field: string; path: string; value: unknown }[] = [
  { field: "routeMode", path: "routeMode", value: "reverse" },
  { field: "kind", path: "kind", value: "reverse" },
  { field: "layer", path: "layer", value: "cross" },
  { field: "workflowPhase", path: "workflowPhase", value: "R1" },
  { field: "routeSignal", path: "routeSignal", value: "regression" },
  { field: "drive", path: "drive", value: "human" },
  { field: "branch", path: "branch", value: "work/mutated-branch-for-test" },
  { field: "status", path: "status", value: "confirmed" },
  { field: "subDoc", path: "subDoc", value: "test-design" },
  {
    field: "issue",
    path: "issue",
    value: {
      provider: "github",
      issueId: 12345,
      episodeId: "E4-999-mutated",
      projectionState: "unprojected",
    },
  },
  {
    field: "origin",
    path: "origin",
    value: {
      planId: "PLAN-L6-777-mutated",
      revision: 99,
      digest: `sha256:${"f".repeat(64)}`,
    },
  },
  { field: "transitionDirection", path: "transitionDirection", value: "implementation_to_design" },
  { field: "implementationDisposition", path: "implementationDisposition", value: "preserved" },
  { field: "reentry.targetPlanId", path: "reentry.targetPlanId", value: OTHER_PLAN_ID },
  { field: "reentry.phase", path: "reentry.phase", value: "not-forward-merge" },
  {
    field: "implementationTarget",
    path: "implementationTarget",
    value: { targetPlanId: OTHER_PLAN_ID, targetRevision: 1 },
  },
  { field: "escapeReason", path: "escapeReason", value: "改変された理由 (table-driven)" },
  { field: "supersedes", path: "supersedes", value: ["PLAN-L6-777-old"] },
];

/**
 * H の tracked receipt を保ったまま、R の receipt record の一部 field だけを書き換え、
 * `record_digest` と frontmatter `admission_receipt` (command_id/receipt_id/receipt_digest) を
 * 自己整合に揃え直す。攻撃者が record 内部の digest chain だけを再計算して verifier を
 * 通そうとするケースを再現する (U-RECHAIN-012d〜f)。
 */
function forgeRReceiptRecord(
  input: RechainInput,
  mutate: (record: Record<string, unknown>) => void,
): Mutable<RechainInput> {
  const tampered = clone(input);
  const rPlanOid = tampered.trees.R[PLAN_PATH];
  const rReceiptOid = tampered.trees.R[RECEIPT_PATH];
  const planContent = tampered.blobs[rPlanOid];
  const receiptParsed = JSON.parse(tampered.blobs[rReceiptOid]) as {
    schema_version: string;
    records: Record<string, unknown>[];
  };
  const recordJson = receiptParsed.records[receiptParsed.records.length - 1];
  mutate(recordJson);
  recordJson.record_digest = trackedReceiptRecordDigestFromJson(recordJson);
  const newReceiptContent = `${JSON.stringify(receiptParsed, null, 2)}\n`;
  const newReceiptOid = sha(newReceiptContent).slice(0, 40);
  tampered.blobs[newReceiptOid] = newReceiptContent;
  tampered.trees.R[RECEIPT_PATH] = newReceiptOid;

  // frontmatter の admission_receipt も同じ値へ揃え、自己整合な偽造にする (record 内 digest を
  // 信用しない検証だけを単独で確かめるため。plan-admission-receipt-binding-mismatch を道連れに
  // しない)。
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(planContent);
  if (!match) throw new Error("fixture-plan-content-unparseable");
  const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
  frontmatter.admission_receipt = {
    ...(frontmatter.admission_receipt as Record<string, unknown>),
    command_id: recordJson.command_id,
    receipt_id: recordJson.receipt_id,
    receipt_digest: recordJson.receipt_digest,
  };
  const newPlanContent = `---\n${stringify(frontmatter)}---\n${match[2]}`;
  const newPlanOid = sha(newPlanContent).slice(0, 40);
  tampered.blobs[newPlanOid] = newPlanContent;
  tampered.trees.R[PLAN_PATH] = newPlanOid;
  return tampered;
}

// ---------------------------------------------------------------------------
// U-RECHAIN-001: 簿記のみの re-chain は pass する
// ---------------------------------------------------------------------------

describe("verifyRechainDelta", () => {
  it("U-RECHAIN-001: 簿記のみの re-chain (receipt 1件・generates追加2件・§8注記1行) は pass する", () => {
    const { input } = buildBaseline({
      extraGenerates: [
        { artifact_path: "tests/rechain-verifier.test.ts", artifact_type: "test_code" },
      ],
    });
    const verdict = verifyRechainDelta(input);
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.verifierDigest.startsWith("sha256:")).toBe(true);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-002: PLAN / receipt 以外の path に R が 1 byte 追加 → fail
  // -------------------------------------------------------------------------
  it("U-RECHAIN-002: R が非簿記 path に 1 byte 追加すると fail する", () => {
    const { input, blobs } = buildBaseline();
    const tampered = clone(input);
    const tamperedContent = "export const value = 2; // main が更新\n// 手で追記\n";
    const oid = sha(tamperedContent).slice(0, 40);
    tampered.blobs = { ...blobs, [oid]: tamperedContent };
    tampered.trees = {
      ...tampered.trees,
      R: { ...tampered.trees.R, [UNTOUCHED_PATH]: oid },
    };
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("nonbookkeeping-r-mismatch"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-003: PLAN 本文の append-only 領域外に手で変更 → fail
  // -------------------------------------------------------------------------
  it("U-RECHAIN-003: append-only 領域外を手で書き換えた R は fail する", () => {
    const { input, hRecord } = buildBaseline();
    const admissionR = input.admission[hRecord.recordDigest];

    const tamperedFm = { ...baseFrontmatterOther(), title: "rechain test (手で改変)" };
    const generates = [
      { artifact_path: PLAN_PATH, artifact_type: "markdown_doc" },
      { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
    ];
    const items = ["起票 (rev 1)。", "rev 2 (S2): 検証器を実装した。"];
    const { content: tamperedContent, record: tamperedRecord } = makeRevision({
      frontmatterOther: tamperedFm,
      generates,
      items,
      admission: admissionR,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
      admittedAt: "2026-09-28T01:00:00.000Z",
    });

    const tampered = clone(input);
    const oid = sha(tamperedContent).slice(0, 40);
    tampered.blobs[oid] = tamperedContent;
    tampered.trees.R[PLAN_PATH] = oid;
    const receiptOid = sha(receiptFile([tamperedRecord])).slice(0, 40);
    tampered.blobs[receiptOid] = receiptFile([tamperedRecord]);
    tampered.trees.R[RECEIPT_PATH] = receiptOid;

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(
        verdict.reasons.some(
          (r) => r.startsWith("plan-frontmatter-conflict") || r.startsWith("plan-strip-mismatch"),
        ),
      ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-004: 追加 record の数・対象が H と異なる → fail
  // -------------------------------------------------------------------------
  it("U-RECHAIN-004a: admission map の件数が H の追加 record 数と異なると fail する", () => {
    const { input } = buildBaseline();
    const tampered = clone(input);
    tampered.admission = {};
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasons).toContain("admission-count-mismatch");
  });

  it("U-RECHAIN-004b: R の追加 record が別 PLAN を bind すると fail する", () => {
    const { input, hRecord } = buildBaseline();
    const admissionR = input.admission[hRecord.recordDigest];
    const generates = [
      { artifact_path: PLAN_PATH, artifact_type: "markdown_doc" },
      { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
    ];
    const items = ["起票 (rev 1)。", "rev 2 (S2): 検証器を実装した。"];
    const { record: wrongPlanRecord } = makeRevision({
      frontmatterOther: { ...baseFrontmatterOther(), plan_id: OTHER_PLAN_ID },
      generates,
      items,
      admission: admissionR,
      binding: {
        path: OTHER_PLAN_PATH,
        planId: OTHER_PLAN_ID,
        assetId: "plan:test:other888",
        revision: 1,
      },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
      admittedAt: "2026-09-28T01:00:00.000Z",
    });
    const tampered = clone(input);
    const oid = sha(receiptFile([wrongPlanRecord])).slice(0, 40);
    tampered.blobs[oid] = receiptFile([wrongPlanRecord]);
    tampered.trees.R[RECEIPT_PATH] = oid;

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("receipt-append-binding-mismatch"))).toBe(
        true,
      );
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-005: content_digest 不一致 / chain 不連続 → fail
  // -------------------------------------------------------------------------
  it("U-RECHAIN-005a: record の content_digest が R の PLAN と不一致なら fail する", () => {
    const { input } = buildBaseline();
    const tampered = clone(input);
    const rReceiptOid = tampered.trees.R[RECEIPT_PATH];
    const parsed = JSON.parse(tampered.blobs[rReceiptOid]);
    parsed.records[0].binding.content_digest = `sha256:${"0".repeat(64)}`;
    // record_digest はもう再計算できない (private) ので、record_digest も無効値へ揃えて
    // "parse失敗" ではなく "digestが一致しない" 経路を通す代わりに、record自体を破棄せず
    // digest再計算関数を使って作り直す。
    const rebuilt = trackedReceiptRecordDigestFromJson(parsed.records[0]);
    parsed.records[0].record_digest = rebuilt;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    const newOid = sha(newContent).slice(0, 40);
    tampered.blobs[newOid] = newContent;
    tampered.trees.R[RECEIPT_PATH] = newOid;

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(
        verdict.reasons.some(
          (r) =>
            r.startsWith("plan-content-digest-mismatch") ||
            r.startsWith("plan-admission-receipt-binding"),
        ),
      ).toBe(true);
  });

  it("U-RECHAIN-005b: R の receipt chain が M の tail と不連続なら fail する", () => {
    const { input } = buildBaseline();
    const tampered = clone(input);
    const rReceiptOid = tampered.trees.R[RECEIPT_PATH];
    const parsed = JSON.parse(tampered.blobs[rReceiptOid]);
    parsed.records[0].previous_record_digest = `sha256:${"9".repeat(64)}`;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    const newOid = sha(newContent).slice(0, 40);
    tampered.blobs[newOid] = newContent;
    tampered.trees.R[RECEIPT_PATH] = newOid;

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasons.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-006: commit 構造 (親の直接束縛)
  // -------------------------------------------------------------------------
  it("U-RECHAIN-006a: R の親が X でないと fail する (余分な commit を挟む)", () => {
    const { input } = buildBaseline();
    const tampered = clone(input);
    tampered.commits.R = { ...tampered.commits.R, parents: ["commit-extra-0000000000000000"] };
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasons).toContain("commit-structure-r-parent");
  });

  it("U-RECHAIN-006b: X の親の順序が逆だと fail する", () => {
    const { input } = buildBaseline();
    const tampered = clone(input);
    tampered.commits.X = { ...tampered.commits.X, parents: [COMMITS.M, COMMITS.H] };
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasons).toContain("commit-structure-x-parents");
  });

  it("U-RECHAIN-006c: (正系) commits.M が H 分岐後の 2+ commit (merge commit を含む履歴) を指していても、oid/親構造の束縛だけで pass する (件数ベースではない)", () => {
    // RechainInput は commits.M を不透明な oid としてしか運ばない (§2.6-1)。M が実際に
    // 何本の commit (merge commit を含む) を経て origin/main へ積まれていても、検証器の
    // §2.3-4 (rev 5) 判定は X.parents[1] === M / R.parents === [X] という親 oid の束縛だけで
    // 決まり、`H..R` の commit 数 (--first-parent なし) では判定しない (m1 の反証: 件数判定
    // だったら M の内部 commit 数で結果が変わってしまう)。buildBaseline() の commits.M は
    // その「不透明な多 commit 履歴を指す 1 個の oid」の代表例であり、これがそのまま pass
    // することが本 oracle の正系である。
    const { input } = buildBaseline();
    const verdict = verifyRechainDelta(input);
    expect(verdict.ok).toBe(true);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-007: main と PR の双方が append-only 領域へ追記 → 決定的に連結
  // -------------------------------------------------------------------------
  it("U-RECHAIN-007: main と PR の双方が generates/§8 に追記した場合、連結されて pass する", () => {
    const { blobs, put } = makeBlobStore();
    const baseFm = baseFrontmatterOther();
    const baseGenerates = [{ artifact_path: PLAN_PATH, artifact_type: "markdown_doc" }];
    const baseItems = ["起票 (rev 1)。"];
    const baseContent = `---\n${stringify({ ...baseFm, generates: baseGenerates })}---\n${bodyFor(baseItems)}`;

    // main 側で既に別 PR が revision 1 として同じ PLAN を改訂済み
    const concurrentGenerates = [
      ...baseGenerates,
      { artifact_path: "docs/plans/PLAN-L6-999-concurrent-note.md", artifact_type: "markdown_doc" },
    ];
    const concurrentItems = [...baseItems, "rev 2 (concurrent): 別 PR が先に merge した。"];
    const admissionConcurrent = admissionFor(1);
    const { content: mContent, record: mRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: concurrentGenerates,
      items: concurrentItems,
      admission: admissionConcurrent,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
      commandId: "plan-revise:issue-777:concurrent:plan:r1:c1",
      admittedAt: "2026-09-28T00:30:00.000Z",
    });

    // PR 側 (H) は base から自分の追加だけを append する
    const admissionH = admissionFor(1);
    const hGenerates = [
      ...baseGenerates,
      { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
    ];
    const hItems = [...baseItems, "rev 2 (S2): 検証器を実装した。"];
    const { content: hContent, record: hRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: hGenerates,
      items: hItems,
      admission: admissionH,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1",
      admittedAt: "2026-09-28T00:00:00.000Z",
    });

    // R は M (= concurrent 済み) の後ろへ PR の追加分だけを revision 2 として連結する
    const expectedGenerates = [...concurrentGenerates, hGenerates[hGenerates.length - 1]];
    const expectedItems = [...concurrentItems, hItems[hItems.length - 1]];
    if (!admissionH.reentry) throw new Error("fixture-admission-missing-reentry");
    const admissionR = { ...admissionH, reentry: { ...admissionH.reentry, targetRevision: 2 } };
    const { content: rContent, record: rRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: expectedGenerates,
      items: expectedItems,
      admission: admissionR,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 2 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
      admittedAt: "2026-09-28T01:00:00.000Z",
      priorRecords: [mRecord],
    });

    const baseTree: TreeMap = {
      [PLAN_PATH]: put(baseContent),
      [RECEIPT_PATH]: put(receiptFile([])),
    };
    const hTree: TreeMap = {
      [PLAN_PATH]: put(hContent),
      [RECEIPT_PATH]: put(receiptFile([hRecord])),
    };
    const mTree: TreeMap = {
      [PLAN_PATH]: put(mContent),
      [RECEIPT_PATH]: put(receiptFile([mRecord])),
    };
    const xTree: TreeMap = { [PLAN_PATH]: mTree[PLAN_PATH], [RECEIPT_PATH]: mTree[RECEIPT_PATH] };
    const rTree: TreeMap = {
      [PLAN_PATH]: put(rContent),
      [RECEIPT_PATH]: put(receiptFile([mRecord, rRecord])),
    };

    const input: RechainInput = {
      commits: { ...commitObjs(), M: COMMITS.M, base: COMMITS.base },
      trees: { base: baseTree, H: hTree, M: mTree, X: xTree, R: rTree },
      blobs,
      admission: { [hRecord.recordDigest]: admissionH },
    };

    const verdict = verifyRechainDelta(input);
    expect(verdict.ok).toBe(true);

    // mutation: 連結順を逆にする (PR の追加を先頭へ) → byte 不一致で fail する
    const reversedGenerates = [hGenerates[hGenerates.length - 1], ...concurrentGenerates];
    const reversedItems = [hItems[hItems.length - 1], ...concurrentItems];
    const { content: reversedContent, record: reversedRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: reversedGenerates,
      items: reversedItems,
      admission: admissionR,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 2 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
      admittedAt: "2026-09-28T01:00:00.000Z",
      priorRecords: [mRecord],
    });
    const badInput = clone(input);
    const oid = sha(reversedContent).slice(0, 40);
    badInput.blobs[oid] = reversedContent;
    badInput.trees.R[PLAN_PATH] = oid;
    const receiptOid = sha(receiptFile([mRecord, reversedRecord])).slice(0, 40);
    badInput.blobs[receiptOid] = receiptFile([mRecord, reversedRecord]);
    badInput.trees.R[RECEIPT_PATH] = receiptOid;

    const badVerdict = verifyRechainDelta(badInput);
    expect(badVerdict.ok).toBe(false);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-011: 成果物所有 (待機中に main が再所有した path)
  // -------------------------------------------------------------------------
  it("U-RECHAIN-011a: PR が追加した artifact_path が M の tree に既存なら fail する", () => {
    const { input, blobs } = buildBaseline();
    const tampered = clone(input);
    const conflictingContent = "// 既に main 側で作成された\n";
    const oid = sha(conflictingContent).slice(0, 40);
    tampered.blobs = { ...blobs, [oid]: conflictingContent };
    tampered.trees.M = { ...tampered.trees.M, "src/plan-admission/rechain-verifier.ts": oid };
    tampered.trees.X = { ...tampered.trees.X, "src/plan-admission/rechain-verifier.ts": oid };
    tampered.trees.R = { ...tampered.trees.R, "src/plan-admission/rechain-verifier.ts": oid };

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("artifact-reowned-tree"))).toBe(true);
  });

  it("U-RECHAIN-011b: PR が追加した artifact_path を別 PLAN が M で既に宣言していれば fail する", () => {
    const { input, blobs } = buildBaseline();
    const otherPlanContent = `---\n${stringify({
      plan_id: OTHER_PLAN_ID,
      title: "other",
      kind: "add-design",
      layer: "L6",
      drive: "agent",
      route_signal: "feature_addition",
      route_mode: "add-feature",
      status: "draft",
      generates: [
        { artifact_path: OTHER_PLAN_PATH, artifact_type: "markdown_doc" },
        { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
      ],
    })}---\n${bodyFor(["起票。"])}`;
    const oid = sha(otherPlanContent).slice(0, 40);
    const tampered = clone(input);
    tampered.blobs = { ...blobs, [oid]: otherPlanContent };
    tampered.trees.M = { ...tampered.trees.M, [OTHER_PLAN_PATH]: oid };

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("artifact-reowned-generates"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-012: admission の意味の不変
  // -------------------------------------------------------------------------
  it("U-RECHAIN-012a: A_H の digest が H の tracked decision_digest と一致しない候補は fail する", () => {
    const { input, hRecord } = buildBaseline();
    const tampered = clone(input);
    const wrongCandidate = admissionFor(1, { escapeReason: "改変された理由" });
    tampered.admission = { [hRecord.recordDigest]: wrongCandidate };
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("admission-candidate-unverified"))).toBe(
        true,
      );
  });

  it("U-RECHAIN-012b: R の admission が A_H から reentry.targetRevision 以外で改変されていれば fail する (record 内 digest を信用しない)", () => {
    const { input, hRecord } = buildBaseline();
    const admissionH = input.admission[hRecord.recordDigest];
    const forgedAdmission = { ...admissionH, escapeReason: "偽装された理由" };
    const generates = [
      { artifact_path: PLAN_PATH, artifact_type: "markdown_doc" },
      { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
    ];
    const items = ["起票 (rev 1)。", "rev 2 (S2): 検証器を実装した。"];
    const { content: forgedContent, record: forgedRecord } = makeRevision({
      frontmatterOther: baseFrontmatterOther(),
      generates,
      items,
      admission: forgedAdmission,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
      admittedAt: "2026-09-28T01:00:00.000Z",
    });
    const tampered = clone(input);
    const oid = sha(forgedContent).slice(0, 40);
    tampered.blobs[oid] = forgedContent;
    tampered.trees.R[PLAN_PATH] = oid;
    const receiptOid = sha(receiptFile([forgedRecord])).slice(0, 40);
    tampered.blobs[receiptOid] = receiptFile([forgedRecord]);
    tampered.trees.R[RECEIPT_PATH] = receiptOid;

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(
        verdict.reasons.some(
          (r) =>
            r.startsWith("admission-decision-digest-mismatch") ||
            r.startsWith("admission-field-drift"),
        ),
      ).toBe(true);
  });

  it.each(ADMISSION_FIELD_MUTATIONS)(
    "U-RECHAIN-012c: PlanAdmissionRequest.$field を改変した候補は、digest を正しく再計算しても H の tracked decision_digest と一致せず fail する ($field)",
    ({ path, value }) => {
      const { input, hRecord } = buildBaseline();
      const admissionH = input.admission[hRecord.recordDigest];
      const mutated = mutateAdmissionField(admissionH, path, value);
      const tampered = clone(input);
      tampered.admission = { [hRecord.recordDigest]: mutated };
      const verdict = verifyRechainDelta(tampered);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok)
        expect(verdict.reasons.some((r) => r.startsWith("admission-candidate-unverified"))).toBe(
          true,
        );
    },
  );

  // -------------------------------------------------------------------------
  // U-RECHAIN-012 拡張 (Codex Sol r1 FLAG, PR #724): command_id / receipt_id / receipt_digest を
  // record 内の値だけで信用せず、H から独立に再導出して束縛する (§2.3-6 condition 6)。
  // -------------------------------------------------------------------------
  it("U-RECHAIN-012d: R の command_id が H の command_id + :rechain-<n> 以外なら、record と frontmatter を自己整合に揃え直しても fail する", () => {
    const { input } = buildBaseline();
    const tampered = forgeRReceiptRecord(input, (record) => {
      record.command_id = "plan-revise:attacker:arbitrary-command-id";
    });
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("rechain-command-id-mismatch"))).toBe(true);
  });

  it("U-RECHAIN-012e: command_id の suffix 形式が正しくても、receipt_id が正規式 (certificate:sha(command_id)) と一致しなければ fail する", () => {
    const { input, hRecord } = buildBaseline();
    const tampered = forgeRReceiptRecord(input, (record) => {
      record.command_id = `${hRecord.commandId}:rechain-1`;
      record.receipt_id = "certificate:0000000000000000000000000000000000000000";
    });
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("rechain-receipt-id-mismatch"))).toBe(true);
  });

  it("U-RECHAIN-012f: R の receipt_digest が H 自身の receipt_digest をそのまま使い回していれば fail する", () => {
    const { input, hRecord } = buildBaseline();
    const tampered = forgeRReceiptRecord(input, (record) => {
      record.receipt_digest = hRecord.receiptDigest;
    });
    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("rechain-receipt-digest-unchanged"))).toBe(
        true,
      );
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-014: 非簿記 path の両側変更は git merge が成立しても fail する
  // -------------------------------------------------------------------------
  it("U-RECHAIN-014: 非簿記 path を H と M の両側が別々に変えていれば、git merge が成立していても fail する", () => {
    const { input, blobs } = buildBaseline();
    const tampered = clone(input);
    const hSideChange = "export const value = 1; // PR 側の変更\n";
    const mSideChange = "export const value = 2; // main 側の変更\n";
    const mergedLookingResult = "export const value = 3; // 両側を git が自動 merge した体\n";
    const hOid = sha(hSideChange).slice(0, 40);
    const mOid = sha(mSideChange).slice(0, 40);
    const mergedOid = sha(mergedLookingResult).slice(0, 40);
    tampered.blobs = {
      ...blobs,
      [hOid]: hSideChange,
      [mOid]: mSideChange,
      [mergedOid]: mergedLookingResult,
    };
    tampered.trees.H = { ...tampered.trees.H, [UNTOUCHED_PATH]: hOid };
    tampered.trees.M = { ...tampered.trees.M, [UNTOUCHED_PATH]: mOid };
    tampered.trees.X = { ...tampered.trees.X, [UNTOUCHED_PATH]: mergedOid };
    tampered.trees.R = { ...tampered.trees.R, [UNTOUCHED_PATH]: mergedOid };

    const verdict = verifyRechainDelta(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok)
      expect(verdict.reasons.some((r) => r.startsWith("nonbookkeeping-both-sides-changed"))).toBe(
        true,
      );
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-015: base = merge-base(H, M) (stacked PR)
  // -------------------------------------------------------------------------
  it("U-RECHAIN-015: base に先行 merge 済みの stacked PR (C) を含めれば、PR 自身の追加だけが再適用されて pass する", () => {
    const { blobs, put } = makeBlobStore();
    const baseFm = baseFrontmatterOther();
    const ancientGenerates = [{ artifact_path: PLAN_PATH, artifact_type: "markdown_doc" }];
    const ancientItems = ["起票 (rev 1)。"];
    const ancientContent = `---\n${stringify({ ...baseFm, generates: ancientGenerates })}---\n${bodyFor(ancientItems)}`;
    const ancientReceiptContent = receiptFile([]);

    // C: 先に stacked PR A が merge 済みの状態 (merge-base はここになる)
    const cGenerates = [
      ...ancientGenerates,
      { artifact_path: "src/plan-admission/stacked-a-module.ts", artifact_type: "source_module" },
    ];
    const cItems = [...ancientItems, "rev 2 (stacked PR A): 先行実装。"];
    const admissionC = admissionFor(1);
    const { content: cContent, record: cRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: cGenerates,
      items: cItems,
      admission: admissionC,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 1 },
      commandId: "plan-revise:issue-700:stacked-a:plan:r1:c1",
      admittedAt: "2026-09-27T00:00:00.000Z",
    });
    const realBaseTree: TreeMap = {
      [PLAN_PATH]: put(cContent),
      [RECEIPT_PATH]: put(receiptFile([cRecord])),
    };
    const ancientBaseTree: TreeMap = {
      [PLAN_PATH]: put(ancientContent),
      [RECEIPT_PATH]: put(ancientReceiptContent),
    };

    // H: PR B は C の上に自分の追加だけを積む
    const admissionH = admissionFor(2);
    const hGenerates = [
      ...cGenerates,
      { artifact_path: "src/plan-admission/rechain-verifier.ts", artifact_type: "source_module" },
    ];
    const hItems = [...cItems, "rev 3 (S2): 検証器を実装した。"];
    const { content: hContent, record: hRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: hGenerates,
      items: hItems,
      admission: admissionH,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 2 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1",
      admittedAt: "2026-09-28T00:00:00.000Z",
      priorRecords: [cRecord],
    });
    const hTree: TreeMap = {
      [PLAN_PATH]: put(hContent),
      [RECEIPT_PATH]: put(receiptFile([cRecord, hRecord])),
    };

    // M: C の merge 後、他に誰もこの PLAN を触っていない
    const mTree: TreeMap = realBaseTree;
    const xTree: TreeMap = { [PLAN_PATH]: mTree[PLAN_PATH], [RECEIPT_PATH]: mTree[RECEIPT_PATH] };

    const admissionR = admissionH; // revision 変化なし (M 側の latest は base と同じ 1)
    const { content: rContent, record: rRecord } = makeRevision({
      frontmatterOther: baseFm,
      generates: hGenerates,
      items: hItems,
      admission: admissionR,
      binding: { path: PLAN_PATH, planId: PLAN_ID, assetId: ASSET_ID, revision: 2 },
      commandId: "plan-revise:issue-999:s2:plan:r1:h1:rechain-1",
      admittedAt: "2026-09-28T01:00:00.000Z",
      priorRecords: [cRecord],
    });
    const rTree: TreeMap = {
      [PLAN_PATH]: put(rContent),
      [RECEIPT_PATH]: put(receiptFile([cRecord, rRecord])),
    };

    const goodInput: RechainInput = {
      commits: { ...commitObjs(), M: COMMITS.M, base: "commit-C" },
      trees: { base: realBaseTree, H: hTree, M: mTree, X: xTree, R: rTree },
      blobs,
      admission: { [hRecord.recordDigest]: admissionH },
    };
    const verdict = verifyRechainDelta(goodInput);
    expect(verdict.ok).toBe(true);

    // mutation: base を C 以前 (ancient) に戻すと、C の追加が PR 自身の追加として
    // 二重に数えられ、admission の対応が崩れて fail する。
    const badInput: RechainInput = {
      ...goodInput,
      commits: { ...goodInput.commits, base: "commit-ancient" },
      trees: { ...goodInput.trees, base: ancientBaseTree },
    };
    const badVerdict = verifyRechainDelta(badInput);
    expect(badVerdict.ok).toBe(false);
    if (!badVerdict.ok) expect(badVerdict.reasons).toContain("admission-count-mismatch");
  });

  // -------------------------------------------------------------------------
  // U-RECHAIN-016: verifierDigest は入力の canonical digest であり、key の挿入順に依存しない
  // -------------------------------------------------------------------------
  it("U-RECHAIN-016: verifierDigest は stableJson による canonical digest で、key の挿入順に依存しない", () => {
    const { input: inputA } = buildBaseline();
    const inputB: RechainInput = {
      ...inputA,
      blobs: Object.fromEntries(Object.entries(inputA.blobs).reverse()),
      admission: Object.fromEntries(Object.entries(inputA.admission).reverse()),
    };

    const verdictA = verifyRechainDelta(inputA);
    const verdictB = verifyRechainDelta(inputB);
    expect(verdictA.ok).toBe(true);
    expect(verdictB.ok).toBe(true);
    if (!verdictA.ok || !verdictB.ok) return;
    expect(verdictA.verifierDigest).toBe(verdictB.verifierDigest);
    expect(verdictA.verifierDigest).toBe(verifierDigestOf(inputA));
    expect(verdictA.verifierDigest).toBe(
      `sha256:${sha(`ut-tdd.rechain-verifier.v1\n${stableJson(inputA)}`)}`,
    );

    // mutation: JSON.stringify は key の挿入順に依存するため、挿入順を変えた入力からは
    // 異なる digest になってしまう (stableJson を使わなければ決定的にならないことの確認)。
    const jsonDigestA = sha(`ut-tdd.rechain-verifier.v1\n${JSON.stringify(inputA)}`);
    const jsonDigestB = sha(`ut-tdd.rechain-verifier.v1\n${JSON.stringify(inputB)}`);
    expect(jsonDigestA).not.toBe(jsonDigestB);

    // mutation: domain separator (schema version 行) を変えると、同じ stableJson(input) でも
    // 異なる digest になる (§2.6-5 の "先頭行は domain separator 兼 schema version" の固定)。
    const differentVersionDigest = `sha256:${sha(`ut-tdd.rechain-verifier.v2\n${stableJson(inputA)}`)}`;
    expect(verdictA.verifierDigest).not.toBe(differentVersionDigest);
  });
});

function trackedReceiptRecordDigestFromJson(record: Record<string, unknown>): string {
  return trackedReceiptRecordDigest({
    sequence: record.sequence as number,
    previousRecordDigest: record.previous_record_digest as string | null,
    commandId: record.command_id as string,
    receiptId: record.receipt_id as string,
    receiptDigest: record.receipt_digest as string,
    decisionDigest: record.decision_digest as string,
    binding: {
      path: (record.binding as Record<string, unknown>).path as string,
      planId: (record.binding as Record<string, unknown>).plan_id as string,
      assetId: (record.binding as Record<string, unknown>).asset_id as string,
      revision: (record.binding as Record<string, unknown>).revision as number,
      contentDigest: (record.binding as Record<string, unknown>).content_digest as string,
    },
  });
}
