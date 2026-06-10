/**
 * Cross-artifact relation graph projection (A-124/A-125、PLAN-L7-32 塊C span)。
 *
 * L6-31 (module-drift.md addendum) の契約 `collectRelationGraphProjection` を実装する。
 * requirements / PLAN / design / test-design / source / test / DB table / verification-profile を
 * 安定 node ID + typed edge へ正規化した **rebuildable projection** を返す。projection は authoring
 * source ではなく、raw MCP response / browser trace / screenshot / provider transcript / secret /
 * credential を行へ複製しない (sanitization invariant、U-RELGRAPH-003)。
 *
 * 本 span = collect (U-RELGRAPH-001..003)。analyzeRelationImpact (004..006) と
 * exportRelationDiagram / verification-evidence-projection (PLAN-L7-36) は別 span。
 */

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
  | "upstream"; // db-table -> requirement/adr/plan

export type RelationFindingCode = "orphan-table" | "redacted-evidence";

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
    pushNode(nodes, { id, kind: "db-table", label: table.name });
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
    findings: findings.sort((a, b) => a.code.localeCompare(b.code) || (a.nodeId ?? "").localeCompare(b.nodeId ?? "")),
  };
}

function sortEdges(list: RelationEdge[]): RelationEdge[] {
  return list.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind),
  );
}
