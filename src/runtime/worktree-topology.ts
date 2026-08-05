import { createHash } from "node:crypto";

export const TOPOLOGY_FORMAT_VERSION = 1;

export type TopologyFindingKind =
  | "link_broken"
  | "dir_missing"
  | "orphan_admin"
  | "collector_parse_error"
  | "collector_command_error"
  | "path_escape"
  | "reachability_unavailable";

export interface TopologyFinding {
  kind: TopologyFindingKind;
  operation: string;
  evidenceCode: string;
  worktreePathKey?: string;
  adminPathKey?: string;
}

export interface TopologyIdentity {
  worktreePathKey: string;
  adminPathKey: string;
  headOid: string;
  isMain: boolean;
}

export interface WorktreeFact extends TopologyIdentity {
  directoryObserved: boolean;
  worktreeToAdminOk: boolean;
  adminToWorktreeOk: boolean;
  dirty: boolean;
  branch?: string;
  mergedIntoMain: boolean;
  detachedReachable?: boolean;
}

export interface WorktreeAdminEntry {
  adminPathKey: string;
  registered: boolean;
}

export interface WorktreeTopologyInput {
  facts: readonly WorktreeFact[];
  adminEntries: readonly WorktreeAdminEntry[];
  observations?: readonly TopologyFinding[];
}

export interface WorktreeTopologyCounts {
  total: number;
  main: number;
  dirty: number;
  detached: number;
  merged: number;
  active: number;
}

export interface WorktreeTopologyReport {
  ok: boolean;
  findings: TopologyFinding[];
  counts: WorktreeTopologyCounts;
  retirable: string[];
  healthy: number;
  identities: TopologyIdentity[];
  digest: string;
}

export interface AllowedPathRemap {
  fromPrefix: string;
  toPrefix: string;
}

export function normalizeTopologyPath(value: string): string {
  const normalized = value.replace(/\\/g, "/").replace(/\/+$/, "");
  return /^[a-z]:\//.test(normalized)
    ? `${normalized[0].toUpperCase()}${normalized.slice(1)}`
    : normalized;
}

function compareText(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function identityKey(identity: TopologyIdentity): string {
  return [
    identity.worktreePathKey,
    identity.adminPathKey,
    identity.headOid,
    identity.isMain ? "1" : "0",
  ]
    .map((value) => `${Buffer.byteLength(value, "utf8")}:${value}`)
    .join("|");
}

export function canonicalIdentities(identities: readonly TopologyIdentity[]): TopologyIdentity[] {
  return [...identities].sort((left, right) => compareText(identityKey(left), identityKey(right)));
}

function frame(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  return Buffer.concat([length, bytes]);
}

export function topologyDigest(identities: readonly TopologyIdentity[]): string {
  const payload = canonicalIdentities(identities).flatMap((identity) => [
    frame(identity.worktreePathKey),
    frame(identity.adminPathKey),
    frame(identity.headOid),
    frame(identity.isMain ? "1" : "0"),
  ]);
  return createHash("sha256").update("topology-v1:").update(Buffer.concat(payload)).digest("hex");
}

function findingKey(finding: TopologyFinding): string {
  return [
    finding.kind,
    finding.operation,
    finding.evidenceCode,
    finding.worktreePathKey ?? "",
    finding.adminPathKey ?? "",
  ].join("\u0000");
}

function liveness(fact: WorktreeFact): "dirty" | "detached" | "merged" | "active" {
  if (fact.dirty) return "dirty";
  if (!fact.branch) return "detached";
  return fact.mergedIntoMain ? "merged" : "active";
}

export function analyzeWorktreeTopology(input: WorktreeTopologyInput): WorktreeTopologyReport {
  const findings = new Map<string, TopologyFinding>();
  const add = (finding: TopologyFinding): void => void findings.set(findingKey(finding), finding);
  for (const observation of input.observations ?? []) add(observation);
  for (const fact of input.facts) {
    if (!fact.directoryObserved)
      add({
        kind: "dir_missing",
        operation: "stat-worktree",
        evidenceCode: "directory_missing",
        worktreePathKey: fact.worktreePathKey,
        adminPathKey: fact.adminPathKey,
      });
    if (!fact.isMain && !fact.worktreeToAdminOk)
      add({
        kind: "link_broken",
        operation: "worktree-gitdir",
        evidenceCode: "gitdir_mismatch",
        worktreePathKey: fact.worktreePathKey,
        adminPathKey: fact.adminPathKey,
      });
    if (!fact.isMain && !fact.adminToWorktreeOk)
      add({
        kind: "link_broken",
        operation: "admin-gitdir",
        evidenceCode: "back_pointer_mismatch",
        worktreePathKey: fact.worktreePathKey,
        adminPathKey: fact.adminPathKey,
      });
    if (!fact.isMain && !fact.branch && fact.detachedReachable === undefined)
      add({
        kind: "reachability_unavailable",
        operation: "reachability",
        evidenceCode: "unobserved",
        worktreePathKey: fact.worktreePathKey,
        adminPathKey: fact.adminPathKey,
      });
  }
  for (const entry of input.adminEntries)
    if (!entry.registered)
      add({
        kind: "orphan_admin",
        operation: "admin-enumeration",
        evidenceCode: "unregistered",
        adminPathKey: entry.adminPathKey,
      });
  const findingList = [...findings.values()].sort((left, right) =>
    compareText(findingKey(left), findingKey(right)),
  );
  const unsafeWorktrees = new Set(
    findingList.map((finding) => finding.worktreePathKey).filter(Boolean),
  );
  const counts: WorktreeTopologyCounts = {
    total: input.facts.length,
    main: 0,
    dirty: 0,
    detached: 0,
    merged: 0,
    active: 0,
  };
  const retirable: string[] = [];
  for (const fact of input.facts) {
    if (fact.isMain) {
      counts.main += 1;
      continue;
    }
    const state = liveness(fact);
    counts[state] += 1;
    if (unsafeWorktrees.has(fact.worktreePathKey)) continue;
    if (state === "merged" || (state === "detached" && fact.detachedReachable === true))
      retirable.push(fact.worktreePathKey);
  }
  retirable.sort(compareText);
  const identities = canonicalIdentities(
    input.facts
      .filter((fact) => !unsafeWorktrees.has(fact.worktreePathKey))
      .map(({ worktreePathKey, adminPathKey, headOid, isMain }) => ({
        worktreePathKey,
        adminPathKey,
        headOid,
        isMain,
      })),
  );
  return {
    ok: findingList.length === 0,
    findings: findingList,
    counts,
    retirable,
    healthy: identities.length,
    identities,
    digest: topologyDigest(identities),
  };
}

function pathMatchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function remapTopologyIdentities(
  identities: readonly TopologyIdentity[],
  remaps: readonly AllowedPathRemap[],
): TopologyIdentity[] {
  const normalized = remaps.map((remap) => ({
    fromPrefix: normalizeTopologyPath(remap.fromPrefix),
    toPrefix: normalizeTopologyPath(remap.toPrefix),
  }));
  if (new Set(normalized.map((remap) => remap.fromPrefix)).size !== normalized.length)
    throw new Error("duplicate remap prefix");
  const apply = (path: string): string => {
    const matches = normalized
      .filter((remap) => pathMatchesPrefix(path, remap.fromPrefix))
      .sort((a, b) => b.fromPrefix.length - a.fromPrefix.length);
    if (matches.length > 1 && matches[0].fromPrefix.length === matches[1].fromPrefix.length)
      throw new Error("ambiguous remap prefix");
    if (matches.length === 0) return path;
    const match = matches[0];
    const suffix = path.slice(match.fromPrefix.length);
    if (suffix.split("/").includes("..")) throw new Error("remap path escape");
    return `${match.toPrefix}${suffix}`;
  };
  const result = identities.map((identity) => ({
    ...identity,
    worktreePathKey: apply(identity.worktreePathKey),
    adminPathKey: apply(identity.adminPathKey),
  }));
  if (new Set(result.map(identityKey)).size !== result.length)
    throw new Error("remap identity collision");
  return canonicalIdentities(result);
}
