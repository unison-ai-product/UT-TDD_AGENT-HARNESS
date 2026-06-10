/**
 * Cross-artifact relation graph projection (A-124/A-125、PLAN-L7-32 塊C span)。
 *
 * L6-31 (module-drift.md addendum) の契約 `collectRelationGraphProjection` を実装する。
 * requirements / PLAN / design / test-design / source / test / DB table / verification-profile を
 * 安定 node ID + typed edge へ正規化した **rebuildable projection** を返す。projection は authoring
 * source ではなく、raw MCP response / browser trace / screenshot / provider transcript / secret /
 * credential を行へ複製しない (sanitization invariant、U-RELGRAPH-003)。
 *
 * 本 span = collect (U-RELGRAPH-001..003) + analyzeRelationImpact (004..006)。
 * exportRelationDiagram / verification-evidence-projection (PLAN-L7-36) は別 span。
 */
import { normalizePath } from "./shared";

/** projection node の種別。L6-31 契約の node kind 列に対応する。 */
export type RelationNodeKind =
  | "requirement"
  | "plan"
  | "design"
  | "test-design"
  | "source"
  | "test"
  | "db-table"
  | "verification-profile"
  | "external-tool"
  | "diagram";

/** typed edge の種別 (artifact 間の関係)。 */
export type RelationEdgeKind =
  | "derives-from" // plan -> requirement
  | "generates" // plan -> source
  | "pairs" // design -> test-design
  | "covered-by" // source -> test
  | "upstream" // db-table -> requirement/adr/plan
  | "behavioral-contract"; // design -> source (設計変更が source test を要求する印)

export type RelationFindingCode =
  | "orphan-table"
  | "redacted-evidence"
  | "missing-projection" // 変更 path に対応 node が projection に無い (impact 解析不能)
  | "stale-edge" // edge の端点 node が projection に存在しない (整合崩れ)
  | "missing-test-coverage"; // source 変更 node に sibling test edge が無い

export interface RelationNode {
  /** 安定 node ID = `${kind}:${key}`。 */
  id: string;
  kind: RelationNodeKind;
  /** repo-relative path (file-backed node のみ)。 */
  path?: string;
  /** 表示用 label (任意)。 */
  label?: string;
}

export interface RelationEdge {
  from: string;
  to: string;
  kind: RelationEdgeKind;
}

export interface RelationFinding {
  code: RelationFindingCode;
  severity: "error" | "warn" | "info";
  message: string;
  nodeId?: string;
  evidencePath?: string;
}

export interface RequirementInput {
  id: string;
  path?: string;
}

export interface PlanInput {
  id: string;
  path?: string;
  /** 紐づく requirement id 集合 (derives-from edge)。 */
  requirements?: string[];
  /** 生成する source path 集合 (generates edge)。 */
  generates?: string[];
}

export interface DesignDocInput {
  id: string;
  path: string;
  /** ペアとなる test-design id (pairs edge)。 */
  pairs?: string;
  /** この設計が behavioral contract を持つ source path 集合 (behavioral-contract edge)。
   *  設定すると、その design 変更は source test 追加を要求する (U-RELGRAPH-005 conditional)。 */
  behavioralContract?: string[];
}

export interface TestDesignDocInput {
  id: string;
  path: string;
}

export interface SourceFileInput {
  path: string;
  /** この source を覆う test path 集合 (covered-by edge)。 */
  tests?: string[];
}

export interface TestFileInput {
  path: string;
}

export interface DbTableInput {
  name: string;
  /** 上流 node ID 集合 (`requirement:...` / `plan:...` / `adr:...` 等)。空なら orphan finding。 */
  upstream?: string[];
  /** physical-data / migration doc path (file-backed)。変更 path 突合用 (U-RELGRAPH-005)。 */
  path?: string;
}

/**
 * A-125 verification evidence の text/metadata fixture。raw な機微フィールドは
 * projection へ複製せず、classification / count / evidence path / redacted summary のみ残す。
 */
export interface VerificationEvidenceInput {
  id: string;
  evidencePath: string;
  classification: string;
  summary?: string;
  /** 以下は機微 raw payload。projection 行へ複製しない (redact + count のみ)。 */
  rawMcpResponse?: string;
  browserTrace?: string;
  providerTranscript?: string;
  secret?: string;
  screenshotBlob?: string;
}

export interface RelationGraphSourceSet {
  requirements?: RequirementInput[];
  plans?: PlanInput[];
  designDocs?: DesignDocInput[];
  testDesignDocs?: TestDesignDocInput[];
  sourceFiles?: SourceFileInput[];
  tests?: TestFileInput[];
  dbTables?: DbTableInput[];
  verificationEvidence?: VerificationEvidenceInput[];
}

/** sanitized verification-profile projection 行 (raw payload を持たない)。 */
export interface VerificationProfileRow {
  nodeId: string;
  classification: string;
  evidencePath: string;
  redactedSummary: string;
  /** redact した機微フィールド数。 */
  redactedFieldCount: number;
}

export interface RelationGraphProjection {
  nodes: RelationNode[];
  edges: RelationEdge[];
  verificationProfiles: VerificationProfileRow[];
  findings: RelationFinding[];
}

function nodeId(kind: RelationNodeKind, key: string): string {
  return `${kind}:${key}`;
}

/** (kind,id,path) を一意化しながら node を accumulate する。 */
function pushNode(seen: Map<string, RelationNode>, node: RelationNode): void {
  const dedupKey = `${node.kind}|${node.id}|${node.path ?? ""}`;
  if (!seen.has(dedupKey)) {
    seen.set(dedupKey, node);
  }
}

/** (from,to,kind) を一意化しながら edge を accumulate する。 */
function pushEdge(seen: Map<string, RelationEdge>, edge: RelationEdge): void {
  const dedupKey = `${edge.from}|${edge.to}|${edge.kind}`;
  if (!seen.has(dedupKey)) {
    seen.set(dedupKey, edge);
  }
}

const SENSITIVE_FIELDS: ReadonlyArray<keyof VerificationEvidenceInput> = [
  "rawMcpResponse",
  "browserTrace",
  "providerTranscript",
  "secret",
  "screenshotBlob",
];

function projectVerificationEvidence(input: VerificationEvidenceInput): {
  row: VerificationProfileRow;
  node: RelationNode;
  finding: RelationFinding;
} {
  const id = nodeId("verification-profile", input.id);
  const redactedFieldCount = SENSITIVE_FIELDS.filter(
    (field) => typeof input[field] === "string" && input[field] !== "",
  ).length;
  return {
    node: { id, kind: "verification-profile", path: input.evidencePath, label: input.classification },
    row: {
      nodeId: id,
      classification: input.classification,
      evidencePath: input.evidencePath,
      redactedSummary: input.summary ?? "",
      redactedFieldCount,
    },
    finding: {
      code: "redacted-evidence",
      severity: "info",
      message: `verification evidence ${input.id}: redacted ${redactedFieldCount} sensitive field(s); only classification/count/path/summary retained`,
      nodeId: id,
      evidencePath: input.evidencePath,
    },
  };
}

/**
 * source set を node + typed edge の正規化 projection へ変換する (rebuildable、authoring source でない)。
 * 行は (kind,id,path) / (from,to,kind) で一意化し、決定的順序で返す。
 */
export function collectRelationGraphProjection(
  input: RelationGraphSourceSet,
): RelationGraphProjection {
  const nodes = new Map<string, RelationNode>();
  const edges = new Map<string, RelationEdge>();
  const findings: RelationFinding[] = [];
  const verificationProfiles: VerificationProfileRow[] = [];

  for (const req of input.requirements ?? []) {
    pushNode(nodes, { id: nodeId("requirement", req.id), kind: "requirement", path: req.path });
  }
  for (const td of input.testDesignDocs ?? []) {
    pushNode(nodes, { id: nodeId("test-design", td.id), kind: "test-design", path: td.path });
  }
  for (const src of input.sourceFiles ?? []) {
    pushNode(nodes, { id: nodeId("source", src.path), kind: "source", path: src.path });
    for (const test of src.tests ?? []) {
      pushEdge(edges, {
        from: nodeId("source", src.path),
        to: nodeId("test", test),
        kind: "covered-by",
      });
    }
  }
  for (const test of input.tests ?? []) {
    pushNode(nodes, { id: nodeId("test", test.path), kind: "test", path: test.path });
  }
  for (const design of input.designDocs ?? []) {
    pushNode(nodes, { id: nodeId("design", design.id), kind: "design", path: design.path });
    if (design.pairs) {
      pushEdge(edges, {
        from: nodeId("design", design.id),
        to: nodeId("test-design", design.pairs),
        kind: "pairs",
      });
    }
    for (const src of design.behavioralContract ?? []) {
      pushEdge(edges, {
        from: nodeId("design", design.id),
        to: nodeId("source", src),
        kind: "behavioral-contract",
      });
    }
  }
  for (const plan of input.plans ?? []) {
    pushNode(nodes, { id: nodeId("plan", plan.id), kind: "plan", path: plan.path });
    for (const req of plan.requirements ?? []) {
      pushEdge(edges, {
        from: nodeId("plan", plan.id),
        to: nodeId("requirement", req),
        kind: "derives-from",
      });
    }
    for (const src of plan.generates ?? []) {
      pushEdge(edges, {
        from: nodeId("plan", plan.id),
        to: nodeId("source", src),
        kind: "generates",
      });
    }
  }
  for (const table of input.dbTables ?? []) {
    const id = nodeId("db-table", table.name);
    pushNode(nodes, { id, kind: "db-table", path: table.path, label: table.name });
    const upstream = table.upstream ?? [];
    for (const up of upstream) {
      pushEdge(edges, { from: id, to: up, kind: "upstream" });
    }
    if (upstream.length === 0) {
      findings.push({
        code: "orphan-table",
        severity: "warn",
        message: `db table ${table.name} has no upstream requirement/ADR/PLAN reference`,
        nodeId: id,
      });
    }
  }
  for (const evidence of input.verificationEvidence ?? []) {
    const projected = projectVerificationEvidence(evidence);
    pushNode(nodes, projected.node);
    verificationProfiles.push(projected.row);
    findings.push(projected.finding);
  }

  return {
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: sortEdges([...edges.values()]),
    verificationProfiles: verificationProfiles.sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
    findings: sortFindings(findings),
  };
}

function sortEdges(list: RelationEdge[]): RelationEdge[] {
  return [...list].sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind),
  );
}

function sortFindings(list: RelationFinding[]): RelationFinding[] {
  return [...list].sort(
    (a, b) => a.code.localeCompare(b.code) || (a.nodeId ?? "").localeCompare(b.nodeId ?? ""),
  );
}

// ---- analyzeRelationImpact (U-RELGRAPH-004..006) -------------------------------

/** 変更が要求する follow-up action の種別。 */
export type RelationImpactActionKind =
  | "require-sibling-test"
  | "review-design-contract"
  | "review-l7-oracle"
  | "update-plan"
  | "reverse-backprop"
  | "update-paired-artifact"
  | "update-plan-dod"
  | "record-trace-freeze-evidence"
  | "rebuild-db-table"
  | "review-upstream";

export interface RelationImpactAction {
  kind: RelationImpactActionKind;
  /** action が関係する node ID (変更 node または波及先)。 */
  nodeId: string;
  reason: string;
}

export interface RelationImpactInput {
  /** repo-relative の変更 path 集合。 */
  changedPaths: string[];
  /** collectRelationGraphProjection が返した projection。 */
  projection: RelationGraphProjection;
}

export interface RelationImpactResult {
  /** 変更 path に直接対応する node。 */
  changedNodes: RelationNode[];
  /** edge を辿って波及する node。 */
  impacted: RelationNode[];
  actions: RelationImpactAction[];
  findings: RelationFinding[];
  ok: boolean;
}

interface GraphIndex {
  nodeById: Map<string, RelationNode>;
  edgesFrom: Map<string, RelationEdge[]>;
  edgesTo: Map<string, RelationEdge[]>;
}

function appendEdge(map: Map<string, RelationEdge[]>, key: string, edge: RelationEdge): void {
  const existing = map.get(key);
  if (existing) {
    existing.push(edge);
  } else {
    map.set(key, [edge]);
  }
}

function buildIndex(projection: RelationGraphProjection): GraphIndex {
  const nodeById = new Map<string, RelationNode>();
  for (const node of projection.nodes) {
    nodeById.set(node.id, node);
  }
  const edgesFrom = new Map<string, RelationEdge[]>();
  const edgesTo = new Map<string, RelationEdge[]>();
  for (const edge of projection.edges) {
    appendEdge(edgesFrom, edge.from, edge);
    appendEdge(edgesTo, edge.to, edge);
  }
  return { nodeById, edgesFrom, edgesTo };
}

function targets(edges: RelationEdge[] | undefined, kind: RelationEdgeKind, index: GraphIndex): RelationNode[] {
  return (edges ?? [])
    .filter((e) => e.kind === kind)
    .map((e) => index.nodeById.get(e.to))
    .filter((n): n is RelationNode => n !== undefined);
}

function sources(edges: RelationEdge[] | undefined, kind: RelationEdgeKind, index: GraphIndex): RelationNode[] {
  return (edges ?? [])
    .filter((e) => e.kind === kind)
    .map((e) => index.nodeById.get(e.from))
    .filter((n): n is RelationNode => n !== undefined);
}

interface Expansion {
  impacted: RelationNode[];
  actions: RelationImpactAction[];
  findings: RelationFinding[];
}

function expandSource(node: RelationNode, index: GraphIndex): Expansion {
  const tests = targets(index.edgesFrom.get(node.id), "covered-by", index);
  const plans = sources(index.edgesTo.get(node.id), "generates", index);
  const actions: RelationImpactAction[] = [
    { kind: "review-design-contract", nodeId: node.id, reason: "source change requires L6 design contract review" },
    { kind: "reverse-backprop", nodeId: node.id, reason: "lower-layer source change may need reverse/backprop to design/requirement" },
  ];
  const findings: RelationFinding[] = [];
  if (tests.length > 0) {
    for (const t of tests) {
      actions.push({ kind: "require-sibling-test", nodeId: t.id, reason: "sibling test must cover the source change" });
      actions.push({ kind: "review-l7-oracle", nodeId: t.id, reason: "L7 unit oracle must reflect the source change" });
    }
  } else {
    actions.push({ kind: "require-sibling-test", nodeId: node.id, reason: "no sibling test in projection — add coverage" });
    findings.push({
      code: "missing-test-coverage",
      severity: "warn",
      message: `source ${node.path ?? node.id} has no sibling test (covered-by) edge`,
      nodeId: node.id,
    });
  }
  for (const p of plans) {
    actions.push({ kind: "update-plan", nodeId: p.id, reason: "owning PLAN must record the source change" });
  }
  return { impacted: [...tests, ...plans], actions, findings };
}

function expandDesignLike(node: RelationNode, index: GraphIndex): Expansion {
  const isDesign = node.kind === "design";
  // design -> test-design (pairs)。test-design 変更時は逆引きで paired design を得る。
  const paired = isDesign
    ? targets(index.edgesFrom.get(node.id), "pairs", index)
    : sources(index.edgesTo.get(node.id), "pairs", index);
  // behavioral contract は design 側が宣言する (design -> source の edge)。design 変更は自身の
  // edge を、test-design 変更は paired design の edge を辿る (test-design 自体は contract を持たない)。
  const contractOwners = isDesign ? [node] : paired;
  const behavioralSources = dedupeNodes(
    contractOwners.flatMap((owner) =>
      targets(index.edgesFrom.get(owner.id), "behavioral-contract", index),
    ),
  );
  const actions: RelationImpactAction[] = [
    { kind: "update-plan-dod", nodeId: node.id, reason: "design/test-design change updates the owning PLAN DoD" },
    { kind: "record-trace-freeze-evidence", nodeId: node.id, reason: "design/test-design change requires trace-freeze evidence" },
  ];
  for (const p of paired) {
    actions.push({ kind: "update-paired-artifact", nodeId: p.id, reason: "paired design⇔test-design artifact must stay consistent" });
  }
  // behavioral contract edge が無ければ source test を要求しない (U-RELGRAPH-005 conditional)。
  for (const src of behavioralSources) {
    actions.push({ kind: "require-sibling-test", nodeId: src.id, reason: "behavioral-contract edge requires source test update" });
  }
  return { impacted: [...paired, ...behavioralSources], actions, findings: [] };
}

function expandDbTable(node: RelationNode, index: GraphIndex): Expansion {
  const upstreamEdges = (index.edgesFrom.get(node.id) ?? []).filter((e) => e.kind === "upstream");
  const actions: RelationImpactAction[] = [
    { kind: "rebuild-db-table", nodeId: node.id, reason: "physical-data change requires DB table rebuild contract check" },
  ];
  const impacted: RelationNode[] = [];
  for (const edge of upstreamEdges) {
    // upstream は requirement/ADR/PLAN を指す。ADR 等は projection に未 materialize でも
    // review action は要る (review は edge target id 基準、impacted は実在 node のみ)。
    actions.push({ kind: "review-upstream", nodeId: edge.to, reason: "DB table change must trace to upstream requirement/ADR/PLAN" });
    const target = index.nodeById.get(edge.to);
    if (target) {
      impacted.push(target);
    }
  }
  return { impacted, actions, findings: [] };
}

function expandNode(node: RelationNode, index: GraphIndex): Expansion {
  if (node.kind === "source") {
    return expandSource(node, index);
  }
  if (node.kind === "design" || node.kind === "test-design") {
    return expandDesignLike(node, index);
  }
  if (node.kind === "db-table") {
    return expandDbTable(node, index);
  }
  return { impacted: [], actions: [], findings: [] };
}

function detectStaleEdges(projection: RelationGraphProjection, index: GraphIndex): RelationFinding[] {
  const findings: RelationFinding[] = [];
  for (const edge of projection.edges) {
    // from (edge の所有 node) は kind を問わず projection 内に実在すべき。
    // to は構造 edge では実在必須だが、upstream の target (requirement/ADR/PLAN) のみ
    // 未 materialize な外部 governance 参照を許す (ADR は node kind を持たない)。
    const targetExternal = edge.kind === "upstream";
    const dangling =
      !index.nodeById.has(edge.from) || (!targetExternal && !index.nodeById.has(edge.to));
    if (dangling) {
      findings.push({
        code: "stale-edge",
        severity: "error",
        message: `stale edge ${edge.from} -[${edge.kind}]-> ${edge.to}: endpoint node missing from projection`,
        nodeId: edge.from,
      });
    }
  }
  return findings;
}

function dedupeNodes(list: RelationNode[]): RelationNode[] {
  const seen = new Map<string, RelationNode>();
  for (const n of list) {
    if (!seen.has(n.id)) {
      seen.set(n.id, n);
    }
  }
  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function dedupeActions(list: RelationImpactAction[]): RelationImpactAction[] {
  const seen = new Map<string, RelationImpactAction>();
  for (const a of list) {
    const key = `${a.kind}|${a.nodeId}`;
    if (!seen.has(key)) {
      seen.set(key, a);
    }
  }
  return [...seen.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.nodeId.localeCompare(b.nodeId));
}

/**
 * 変更 path を projection node へ突合し、edge を辿って波及 node + 必須 follow-up action を返す。
 * projection に node が無い変更 path / 端点欠落 edge は finding + ok=false にし、
 * 弱い analyzeChangeImpact へ無音で fallback しない (U-RELGRAPH-006)。
 */
export function analyzeRelationImpact(input: RelationImpactInput): RelationImpactResult {
  const index = buildIndex(input.projection);
  const nodeByPath = new Map<string, RelationNode>();
  for (const node of input.projection.nodes) {
    if (node.path) {
      nodeByPath.set(normalizePath(node.path), node);
    }
  }

  const changedNodes: RelationNode[] = [];
  const impacted: RelationNode[] = [];
  const actions: RelationImpactAction[] = [];
  const findings: RelationFinding[] = detectStaleEdges(input.projection, index);

  for (const raw of input.changedPaths) {
    const path = normalizePath(raw);
    const node = nodeByPath.get(path);
    if (!node) {
      findings.push({
        code: "missing-projection",
        severity: "error",
        message: `changed path ${path} has no relation-graph node; impact cannot be analyzed (no silent change-impact fallback)`,
      });
      continue;
    }
    changedNodes.push(node);
    const expansion = expandNode(node, index);
    impacted.push(...expansion.impacted);
    actions.push(...expansion.actions);
    findings.push(...expansion.findings);
  }

  const sortedFindings = sortFindings(findings);
  return {
    changedNodes: dedupeNodes(changedNodes),
    impacted: dedupeNodes(impacted),
    actions: dedupeActions(actions),
    findings: sortedFindings,
    ok: !sortedFindings.some((f) => f.severity === "error"),
  };
}
