import { canonicalField, sha256 } from "./canonical-frame";

export type DocumentMembershipRuleId =
  | "doc-disposition-missing"
  | "doc-disposition-phantom"
  | "doc-disposition-duplicate";

export interface DocumentClosureFinding {
  readonly findingId: string;
  readonly ruleId: DocumentMembershipRuleId;
  readonly subjectIdentity: string;
  readonly evidenceDigest: string;
  readonly exitCode: 1;
}

export interface DocumentSnapshotView {
  readonly snapshotDigest: string;
  readonly members: readonly { readonly path: string }[];
}

export interface DocumentDispositionLedgerView {
  readonly records: readonly { readonly baselinePath: string }[];
}

export interface AnalyzeRepositoryDocumentClosureInput {
  readonly baselineSnapshot: DocumentSnapshotView;
  readonly finalSnapshot: DocumentSnapshotView;
  readonly ledger: DocumentDispositionLedgerView;
  readonly policyRevision: string;
}

export interface DocumentClosureResult {
  readonly finalSnapshotDigest: string;
  readonly findings: readonly DocumentClosureFinding[];
  readonly routeRequirements: readonly never[];
  readonly closure: "closed" | "blocked";
  readonly exitCode: 0 | 1;
}

const encoder = new TextEncoder();

function compareUtf8(left: string, right: string): number {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.min(leftBytes.byteLength, rightBytes.byteLength);
  for (let index = 0; index < length; index += 1) {
    const difference = leftBytes[index] - rightBytes[index];
    if (difference !== 0) return difference;
  }
  return leftBytes.byteLength - rightBytes.byteLength;
}

function finding(
  ruleId: DocumentMembershipRuleId,
  subjectIdentity: string,
  input: AnalyzeRepositoryDocumentClosureInput,
): DocumentClosureFinding {
  const evidenceDigest = sha256([
    canonicalField("baseline_snapshot_digest", input.baselineSnapshot.snapshotDigest),
    canonicalField("final_snapshot_digest", input.finalSnapshot.snapshotDigest),
    canonicalField("policy_revision", input.policyRevision),
    canonicalField("subject_identity", subjectIdentity),
  ]);
  const findingId = `document-closure-finding:sha256:${sha256([
    canonicalField("rule_id", ruleId),
    canonicalField("subject_identity", subjectIdentity),
    canonicalField("evidence_digest", evidenceDigest),
    canonicalField("policy_revision", input.policyRevision),
  ])}`;
  return { findingId, ruleId, subjectIdentity, evidenceDigest, exitCode: 1 };
}

function count(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function caseFoldCollisions(paths: readonly string[]): readonly string[][] {
  const groups = new Map<string, Set<string>>();
  for (const path of paths) {
    const folded = path.toLowerCase();
    const group = groups.get(folded) ?? new Set<string>();
    group.add(path);
    groups.set(folded, group);
  }
  return [...groups.values()]
    .map((group) => [...group].sort(compareUtf8))
    .filter((group) => group.length > 1)
    .sort((left, right) => compareUtf8(left.join("|"), right.join("|")));
}

export function analyzeRepositoryDocumentClosure(
  input: AnalyzeRepositoryDocumentClosureInput,
): DocumentClosureResult {
  const baselinePaths = input.baselineSnapshot.members.map(({ path }) => path);
  const recordPaths = input.ledger.records.map(({ baselinePath }) => baselinePath);
  const recordCounts = count(recordPaths);
  const invalidPaths = new Set<string>();
  const findings: DocumentClosureFinding[] = [];

  for (const [path, occurrences] of recordCounts) {
    if (occurrences < 2) continue;
    invalidPaths.add(path);
    findings.push(finding("doc-disposition-duplicate", path, input));
  }

  for (const collision of caseFoldCollisions([...baselinePaths, ...recordPaths])) {
    for (const path of collision) invalidPaths.add(path);
    findings.push(finding("doc-disposition-duplicate", collision.join("|"), input));
  }

  const recordSet = new Set(recordPaths);
  for (const path of baselinePaths) {
    if (!recordSet.has(path) && !invalidPaths.has(path)) {
      findings.push(finding("doc-disposition-missing", path, input));
    }
  }

  const baselineSet = new Set(baselinePaths);
  for (const path of recordSet) {
    if (!baselineSet.has(path) && !invalidPaths.has(path)) {
      findings.push(finding("doc-disposition-phantom", path, input));
    }
  }

  findings.sort(
    (left, right) =>
      compareUtf8(left.ruleId, right.ruleId) ||
      compareUtf8(left.subjectIdentity, right.subjectIdentity) ||
      compareUtf8(left.findingId, right.findingId),
  );

  return {
    finalSnapshotDigest: input.finalSnapshot.snapshotDigest,
    findings,
    routeRequirements: [],
    closure: findings.length === 0 ? "closed" : "blocked",
    exitCode: findings.length === 0 ? 0 : 1,
  };
}
