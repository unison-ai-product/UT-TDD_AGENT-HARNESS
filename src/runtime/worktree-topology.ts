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
  /** collector が realpath.native で解決した実体path。指定時は identity key より優先する。 */
  worktreeRealPath?: string;
  adminRealPath?: string;
  directoryObserved: boolean;
  worktreeToAdminOk: boolean;
  adminToWorktreeOk: boolean;
  dirty: boolean;
  branch?: string;
  mergedIntoMain: boolean;
  /** detached HEAD を含むref列挙が成功した場合だけ true。 */
  reachabilityObserved?: boolean;
  /** `git for-each-ref --contains <HEAD>` の完全なref name。 */
  containingRefs?: readonly string[];
  /** symbolic refを観測した場合の解決先。未解決aliasはfail-safeで到達性不明とする。 */
  symbolicRefTargets?: Readonly<Record<string, string>>;
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

export interface TopologyComparisonResult {
  accepted: boolean;
  reason?: "finding_present" | "unsafe_remap" | "identity_mismatch";
  beforeDigest?: string;
  afterDigest?: string;
}

export function normalizeTopologyPath(value: string): string {
  const separators = value.replace(/\\/g, "/");
  const driveNormalized = /^[a-zA-Z]:\//.test(separators)
    ? `${separators[0].toUpperCase()}${separators.slice(1)}`
    : separators;
  if (driveNormalized === "/" || /^[A-Z]:\/$/.test(driveNormalized)) return driveNormalized;
  return driveNormalized.replace(/\/+$/, "");
}

function canonicalIdentity(identity: TopologyIdentity): TopologyIdentity {
  return {
    ...identity,
    worktreePathKey: normalizeTopologyPath(identity.worktreePathKey),
    adminPathKey: normalizeTopologyPath(identity.adminPathKey),
  };
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
  return identities
    .map(canonicalIdentity)
    .sort((left, right) => compareText(identityKey(left), identityKey(right)));
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

const RETAINED_REF = /^(?:refs\/heads\/|refs\/remotes\/origin\/|refs\/tags\/)/;
const MAIN_REFS = new Set(["refs/heads/main", "refs/remotes/origin/main"]);

export function isDetachedHeadRetained(fact: WorktreeFact): boolean | undefined {
  if (fact.branch) return undefined;
  if (fact.reachabilityObserved !== true || !fact.containingRefs) return undefined;
  let unresolvedAlias = false;
  for (const ref of fact.containingRefs) {
    const resolved = ref === "refs/remotes/origin/HEAD" ? fact.symbolicRefTargets?.[ref] : ref;
    if (!resolved) {
      unresolvedAlias = true;
      continue;
    }
    if (RETAINED_REF.test(resolved) && !MAIN_REFS.has(resolved)) return true;
  }
  return unresolvedAlias ? undefined : false;
}

export function analyzeWorktreeTopology(input: WorktreeTopologyInput): WorktreeTopologyReport {
  const facts = input.facts.map((fact) => ({
    ...fact,
    worktreePathKey: normalizeTopologyPath(fact.worktreeRealPath ?? fact.worktreePathKey),
    adminPathKey: normalizeTopologyPath(fact.adminRealPath ?? fact.adminPathKey),
  }));
  const findings = new Map<string, TopologyFinding>();
  const add = (finding: TopologyFinding): void => void findings.set(findingKey(finding), finding);
  for (const observation of input.observations ?? []) add(observation);
  for (const fact of facts) {
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
    if (!fact.isMain && !fact.branch && isDetachedHeadRetained(fact) === undefined)
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
        adminPathKey: normalizeTopologyPath(entry.adminPathKey),
      });
  const findingList = [...findings.values()].sort((left, right) =>
    compareText(findingKey(left), findingKey(right)),
  );
  const unsafeWorktrees = new Set(
    findingList.map((finding) => finding.worktreePathKey).filter(Boolean),
  );
  const counts: WorktreeTopologyCounts = {
    total: facts.length,
    main: 0,
    dirty: 0,
    detached: 0,
    merged: 0,
    active: 0,
  };
  const retirable: string[] = [];
  for (const fact of facts) {
    if (fact.isMain) {
      counts.main += 1;
      continue;
    }
    const state = liveness(fact);
    counts[state] += 1;
    if (unsafeWorktrees.has(fact.worktreePathKey)) continue;
    if (state === "merged" || (state === "detached" && isDetachedHeadRetained(fact) === true))
      retirable.push(fact.worktreePathKey);
  }
  retirable.sort(compareText);
  const identities = canonicalIdentities(
    facts
      .filter((fact) => !unsafeWorktrees.has(fact.worktreePathKey))
      .map(
        ({ worktreePathKey, adminPathKey, worktreeRealPath, adminRealPath, headOid, isMain }) => ({
          worktreePathKey: worktreeRealPath ?? worktreePathKey,
          adminPathKey: adminRealPath ?? adminPathKey,
          headOid,
          isMain,
        }),
      ),
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
  if (prefix === "/") return path.startsWith("/");
  if (/^[A-Z]:\/$/.test(prefix)) return path.startsWith(prefix);
  return path === prefix || path.startsWith(`${prefix}/`);
}

function joinCanonicalPrefix(prefix: string, suffix: string): string {
  if (!suffix) return prefix;
  const child = suffix.replace(/^\/+/, "");
  return normalizeTopologyPath(prefix.endsWith("/") ? `${prefix}${child}` : `${prefix}/${child}`);
}

export function remapTopologyIdentities(
  identities: readonly TopologyIdentity[],
  remaps: readonly AllowedPathRemap[],
): TopologyIdentity[] {
  const normalized = remaps.map((remap) => ({
    fromPrefix: normalizeTopologyPath(remap.fromPrefix),
    toPrefix: normalizeTopologyPath(remap.toPrefix),
  }));
  const absolute = (path: string): boolean => path.startsWith("/") || /^[A-Z]:\//.test(path);
  const unsafePrefix = normalized.some(
    (remap) =>
      !absolute(remap.fromPrefix) ||
      !absolute(remap.toPrefix) ||
      remap.fromPrefix.split("/").includes("..") ||
      remap.toPrefix.split("/").includes(".."),
  );
  if (unsafePrefix) throw new Error("remap path escape");
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
    return joinCanonicalPrefix(match.toPrefix, suffix);
  };
  const result = canonicalIdentities(identities).map((identity) => ({
    ...identity,
    worktreePathKey: apply(identity.worktreePathKey),
    adminPathKey: apply(identity.adminPathKey),
  }));
  if (new Set(result.map(identityKey)).size !== result.length)
    throw new Error("remap identity collision");
  const worktreePaths = result.map((identity) => identity.worktreePathKey);
  const adminPaths = result.map((identity) => identity.adminPathKey);
  if (
    new Set(worktreePaths).size !== worktreePaths.length ||
    new Set(adminPaths).size !== adminPaths.length ||
    worktreePaths.some((path) => adminPaths.includes(path))
  )
    throw new Error("remap path collision");
  return canonicalIdentities(result);
}

export function compareTopologySnapshots(
  before: WorktreeTopologyReport,
  after: WorktreeTopologyReport,
  remaps: readonly AllowedPathRemap[] = [],
): TopologyComparisonResult {
  if (before.findings.length > 0 || after.findings.length > 0)
    return { accepted: false, reason: "finding_present" };
  let remapped: TopologyIdentity[];
  try {
    remapped = remapTopologyIdentities(before.identities, remaps);
  } catch {
    return { accepted: false, reason: "unsafe_remap" };
  }
  const beforeDigest = topologyDigest(remapped);
  const afterDigest = topologyDigest(after.identities);
  return {
    accepted: beforeDigest === afterDigest,
    ...(beforeDigest === afterDigest ? {} : { reason: "identity_mismatch" as const }),
    beforeDigest,
    afterDigest,
  };
}
