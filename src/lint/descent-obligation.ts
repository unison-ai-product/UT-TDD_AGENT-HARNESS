import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { normalizePath } from "./shared";

export const DESCENT_LAYERS = [
  "L0",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
  "L7",
  "L8",
  "L9",
  "L10",
  "L11",
  "L12",
  "L13",
  "L14",
] as const;

export type Layer = (typeof DESCENT_LAYERS)[number];
export type ArtifactRole = "requirement" | "design" | "test-design" | "source" | "test";
export type ArtifactStatus = "active" | "park" | "defer" | "placeholder";
export type DescentRuleKind = "descent" | "pair" | "impl-guard";
export type ObligationCondition = "active" | "impl-present";
export type RuleFrom = Layer | "*";
export type ObligationStatus = "satisfied" | "deferred" | "unmet";
export type FindingCode = "untraceable" | "duplicate-key" | "invalid-defer";

export interface AdjacencyRule {
  from: RuleFrom;
  to: Layer;
  kind: DescentRuleKind;
  condition: ObligationCondition;
  note: string;
}

export interface DescentAdjacency {
  rules: AdjacencyRule[];
}

export interface TraceKeyedArtifact {
  traceKey: string;
  layer: Layer;
  role: ArtifactRole;
  path: string;
  status: ArtifactStatus;
}

export interface DeferEntry {
  traceKey: string;
  fromLayer: Layer;
  waitingLayer: Layer;
  waitingSpec: string;
  dischargeCondition: string;
  owner: string;
}

export interface Obligation {
  traceKey: string;
  fromLayer: Layer;
  requiredLayer: Layer;
  kind: DescentRuleKind;
  reason: string;
}

export interface GradedObligation extends Obligation {
  status: ObligationStatus;
  defer?: DeferEntry;
}

export interface ImplAheadViolation {
  traceKey: string;
  landedAt: Layer;
  waitingLayer: Layer;
  waitingSpec: string;
  owner: string;
}

export interface ChainSummary {
  traceKey: string;
  complete: boolean;
  firstGap: Layer | null;
  layers: Layer[];
}

export interface DescentFinding {
  code: FindingCode;
  traceKey: string;
  layer?: Layer;
  role?: ArtifactRole;
  path?: string;
  detail: string;
}

export interface DescentResult {
  ok: boolean;
  obligations: GradedObligation[];
  implAhead: ImplAheadViolation[];
  chains: ChainSummary[];
  findings: DescentFinding[];
}

export const DEFAULT_DESCENT_ADJACENCY: DescentAdjacency = {
  rules: [
    { from: "L1", to: "L3", kind: "descent", condition: "active", note: "requirements to FR" },
    { from: "L3", to: "L4", kind: "descent", condition: "active", note: "FR to basic design" },
    {
      from: "L4",
      to: "L5",
      kind: "descent",
      condition: "active",
      note: "basic to detailed design",
    },
    {
      from: "L5",
      to: "L6",
      kind: "descent",
      condition: "active",
      note: "detailed to function design",
    },
    {
      from: "L6",
      to: "L7",
      kind: "pair",
      condition: "active",
      note: "function design to unit test design",
    },
    {
      from: "L5",
      to: "L8",
      kind: "pair",
      condition: "impl-present",
      note: "implementation needs integration test design",
    },
    {
      from: "L4",
      to: "L9",
      kind: "pair",
      condition: "impl-present",
      note: "implementation needs system test design",
    },
    {
      from: "L3",
      to: "L12",
      kind: "pair",
      condition: "impl-present",
      note: "implementation needs acceptance/deploy evidence",
    },
    {
      from: "*",
      to: "L4",
      kind: "impl-guard",
      condition: "impl-present",
      note: "implementation cannot bypass basic design",
    },
    {
      from: "*",
      to: "L5",
      kind: "impl-guard",
      condition: "impl-present",
      note: "implementation cannot bypass detailed design",
    },
    {
      from: "*",
      to: "L6",
      kind: "impl-guard",
      condition: "impl-present",
      note: "implementation cannot bypass function design",
    },
    {
      from: "*",
      to: "L7",
      kind: "impl-guard",
      condition: "impl-present",
      note: "implementation cannot bypass unit test design",
    },
  ],
};

const DOC_FR_TRACE_RE = /\bFR-L1-(\d+)(?:(?:[〜～]|\.\.)(?:FR-L1-)?(\d+)|((?:\/\d+)+))?/g;
const U_FR_TRACE_RE = /\bU-FR-L1-(\d+)(?:(?:[〜～]|\.\.)(?:U-FR-L1-)?(\d+))?/g;
const EXPLICIT_IMPLEMENTATION_TRACE_RE = /@ut-tdd-trace\s+(FR-L1-\d+)/g;
const ACTIVE_STATUSES = new Set<ArtifactStatus>(["active"]);
const IMPL_ROLES = new Set<ArtifactRole>(["source", "test"]);
const OPEN_DEFER_LAYERS = new Set<Layer>(["L4", "L5", "L6", "L7"]);

function layerRank(layer: Layer): number {
  return DESCENT_LAYERS.indexOf(layer);
}

function isLayer(value: string): value is Layer {
  return (DESCENT_LAYERS as readonly string[]).includes(value);
}

function isActiveArtifact(artifact: TraceKeyedArtifact): boolean {
  return ACTIVE_STATUSES.has(artifact.status);
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function stableObligationKey(obligation: Obligation): string {
  return [
    obligation.traceKey,
    obligation.fromLayer,
    obligation.requiredLayer,
    obligation.kind,
  ].join("|");
}

function traceKeys(text: string, pattern = /\bFR-L1-\d+\b/g): string[] {
  return uniq(text.match(pattern) ?? []).sort();
}

function frId(raw: string): string {
  return `FR-L1-${Number(raw).toString().padStart(2, "0")}`;
}

function boundedRange(startRaw: string, endRaw: string): string[] {
  const start = Number(startRaw);
  const end = Number(endRaw);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end - start > 100) {
    return [frId(startRaw)];
  }
  const ids: string[] = [];
  for (let n = start; n <= end; n++) ids.push(frId(String(n)));
  return ids;
}

function expandedFrTraceKeys(text: string): string[] {
  const ids: string[] = [];
  for (const match of text.matchAll(DOC_FR_TRACE_RE)) {
    const [, start, end, slashGroup] = match;
    if (end) ids.push(...boundedRange(start, end));
    else if (slashGroup) {
      ids.push(frId(start));
      ids.push(...slashGroup.slice(1).split("/").map(frId));
    } else {
      ids.push(frId(start));
    }
  }
  return ids;
}

function expandedUnitFrTraceKeys(text: string): string[] {
  const ids: string[] = [];
  for (const match of text.matchAll(U_FR_TRACE_RE)) {
    const [, start, end] = match;
    ids.push(...(end ? boundedRange(start, end) : [frId(start)]));
  }
  return ids;
}

function documentTraceKeys(text: string): string[] {
  return uniq([...expandedFrTraceKeys(text), ...expandedUnitFrTraceKeys(text)]).sort();
}

function explicitImplementationTraceKeys(text: string): string[] {
  return uniq([...text.matchAll(EXPLICIT_IMPLEMENTATION_TRACE_RE)].map((match) => match[1])).sort();
}

function groupByTrace(artifacts: TraceKeyedArtifact[]): Map<string, TraceKeyedArtifact[]> {
  const groups = new Map<string, TraceKeyedArtifact[]>();
  for (const artifact of artifacts) {
    if (!artifact.traceKey.trim()) continue;
    const list = groups.get(artifact.traceKey) ?? [];
    list.push(artifact);
    groups.set(artifact.traceKey, list);
  }
  return groups;
}

function landedLayer(artifacts: TraceKeyedArtifact[]): Layer {
  return (
    artifacts
      .filter((artifact) => isActiveArtifact(artifact) && IMPL_ROLES.has(artifact.role))
      .map((artifact) => artifact.layer)
      .sort((a, b) => layerRank(a) - layerRank(b))[0] ?? "L7"
  );
}

function validDefer(defer: DeferEntry): boolean {
  return defer.dischargeCondition.trim().length > 0 && defer.owner.trim().length > 0;
}

function frontmatter(content: string): Record<string, unknown> {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end < 0) return {};
  try {
    const parsed = parseYaml(content.slice(3, end));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function metadataStatus(metadata: Record<string, unknown>, content: string): ArtifactStatus {
  const raw = String(metadata.status ?? "").toLowerCase();
  if (raw === "park" || raw === "parked") return "park";
  if (raw === "defer" || raw === "deferred") return "defer";
  if (raw === "placeholder" || raw === "stub") return "placeholder";
  if (/\bplaceholder_deps\b/i.test(content) && /\bstatus:\s*placeholder\b/i.test(content)) {
    return "placeholder";
  }
  return "active";
}

function recursiveFiles(root: string, predicate: (path: string) => boolean): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...recursiveFiles(path, predicate));
    else if (predicate(path)) out.push(path);
  }
  return out.sort();
}

function inferDocLayer(path: string): Layer | null {
  const normalized = normalizePath(path);
  const match = normalized.match(/\bL(\d+)(?:-|\/)/);
  if (match && isLayer(`L${match[1]}`)) return `L${match[1]}` as Layer;
  if (normalized.includes("L1-requirements") || normalized.includes("requirements")) return "L1";
  if (normalized.includes("L3-functional")) return "L3";
  if (normalized.includes("L4-basic")) return "L4";
  if (normalized.includes("L5-detailed")) return "L5";
  if (normalized.includes("L6-function")) return "L6";
  if (normalized.includes("L7-unit")) return "L7";
  if (normalized.includes("L8-integration")) return "L8";
  if (normalized.includes("L9-system")) return "L9";
  if (normalized.includes("L12")) return "L12";
  return null;
}

function inferDocRole(path: string, layer: Layer): ArtifactRole {
  const normalized = normalizePath(path);
  if (normalized.includes("/test-design/")) return "test-design";
  if (layer === "L1" || normalized.includes("requirements")) return "requirement";
  return "design";
}

function artifactRowsForFile(repoRoot: string, path: string): TraceKeyedArtifact[] {
  const content = readFileSync(path, "utf8");
  const metadata = frontmatter(content);
  const rel = normalizePath(relative(repoRoot, path));
  const isTest = rel.startsWith("tests/");
  const isSource = rel.startsWith("src/");
  const layer = isTest || isSource ? "L7" : inferDocLayer(rel);
  if (!layer) return [];
  const role: ArtifactRole = isTest ? "test" : isSource ? "source" : inferDocRole(rel, layer);
  const status = metadataStatus(metadata, content);
  const keys =
    isTest || isSource ? explicitImplementationTraceKeys(content) : documentTraceKeys(content);
  return keys
    .filter(
      (traceKey) =>
        !(
          layer === "L1" &&
          traceKey.startsWith("FR-L1-") &&
          !rel.endsWith("L1-requirements/functional-requirements.md")
        ),
    )
    .map((traceKey) => ({ traceKey, layer, role, path: rel, status }));
}

function deferRowsForFile(repoRoot: string, path: string): DeferEntry[] {
  const content = readFileSync(path, "utf8");
  if (!/\b(?:placeholder_deps|explicit_l7_defer)\b/i.test(content)) return [];
  const rel = normalizePath(relative(repoRoot, path));
  const fromLayer = inferDocLayer(rel) ?? "L6";
  const rows: DeferEntry[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (!/\b(?:placeholder_deps|explicit_l7_defer)\b/i.test(line)) continue;
    const waitingMatch = line.match(/waiting_layer\s*[:=]\s*"?((?:L\d+))"?/i);
    const waitingLayer = waitingMatch && isLayer(waitingMatch[1]) ? waitingMatch[1] : "L7";
    const keys = traceKeys(line);
    for (const traceKey of keys) {
      rows.push({
        traceKey,
        fromLayer,
        waitingLayer,
        waitingSpec: line.trim().slice(0, 240),
        dischargeCondition: /owner\s*[:=]/i.test(line) ? line.trim() : "documented discharge",
        owner: /owner\s*[:=]\s*"?([^",}]+)/i.exec(line)?.[1]?.trim() ?? "documented",
      });
    }
  }
  return rows;
}

export function loadDescentAdjacency(root = process.cwd()): DescentAdjacency {
  const path = join(root, ".ut-tdd", "descent-adjacency.json");
  if (!existsSync(path)) return DEFAULT_DESCENT_ADJACENCY;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as DescentAdjacency;
    if (Array.isArray(parsed.rules)) return parsed;
  } catch {
    return DEFAULT_DESCENT_ADJACENCY;
  }
  return DEFAULT_DESCENT_ADJACENCY;
}

export function loadTraceKeyedArtifacts(root = process.cwd()): TraceKeyedArtifact[] {
  const docRoots = [join(root, "docs", "design"), join(root, "docs", "test-design")];
  const files = [
    ...docRoots.flatMap((dir) => recursiveFiles(dir, (path) => path.endsWith(".md"))),
    ...recursiveFiles(join(root, "src"), (path) => path.endsWith(".ts")),
  ];
  return files.flatMap((path) => artifactRowsForFile(root, path));
}

export function loadDeferLedger(root = process.cwd()): DeferEntry[] {
  const files = [
    ...recursiveFiles(join(root, "docs", "design"), (path) => path.endsWith(".md")),
    ...recursiveFiles(join(root, "docs", "test-design"), (path) => path.endsWith(".md")),
    ...recursiveFiles(join(root, "docs", "plans"), (path) => path.endsWith(".md")),
  ];
  return files.flatMap((path) => deferRowsForFile(root, path));
}

export function generateObligations(
  artifacts: TraceKeyedArtifact[],
  adjacency: DescentAdjacency,
): Obligation[] {
  const obligations = new Map<string, Obligation>();
  for (const [traceKey, group] of groupByTrace(artifacts)) {
    const active = group.filter(isActiveArtifact);
    const activeLayers = new Set(active.map((artifact) => artifact.layer));
    const hasImpl = active.some((artifact) => IMPL_ROLES.has(artifact.role));
    const landedAt = landedLayer(group);
    for (const rule of adjacency.rules) {
      if (rule.condition === "active") {
        if (rule.from === "*") continue;
        if (!activeLayers.has(rule.from)) continue;
        const obligation: Obligation = {
          traceKey,
          fromLayer: rule.from,
          requiredLayer: rule.to,
          kind: rule.kind,
          reason: `${rule.from}->${rule.to} ${rule.kind}: ${rule.note}`,
        };
        obligations.set(stableObligationKey(obligation), obligation);
        continue;
      }
      if (!hasImpl) continue;
      if (rule.from !== "*" && !activeLayers.has(rule.from)) continue;
      const fromLayer = rule.from === "*" ? landedAt : rule.from;
      const obligation: Obligation = {
        traceKey,
        fromLayer,
        requiredLayer: rule.to,
        kind: rule.kind,
        reason: `${rule.from}->${rule.to} ${rule.kind}: ${rule.note}`,
      };
      obligations.set(stableObligationKey(obligation), obligation);
    }
  }
  return [...obligations.values()].sort(
    (a, b) =>
      a.traceKey.localeCompare(b.traceKey) ||
      layerRank(a.requiredLayer) - layerRank(b.requiredLayer) ||
      a.kind.localeCompare(b.kind),
  );
}

export function analyzeDescentObligations(
  artifacts: TraceKeyedArtifact[],
  adjacency: DescentAdjacency,
  defers: DeferEntry[],
): DescentResult {
  const findings: DescentFinding[] = [];
  const traceable = artifacts.filter((artifact) => {
    if (artifact.traceKey.trim().length > 0) return true;
    findings.push({
      code: "untraceable",
      traceKey: "",
      layer: artifact.layer,
      role: artifact.role,
      path: artifact.path,
      detail: "artifact has no traceKey and is excluded from descent obligation analysis",
    });
    return false;
  });

  const seen = new Map<string, TraceKeyedArtifact>();
  for (const artifact of traceable) {
    if (!IMPL_ROLES.has(artifact.role)) continue;
    const key = `${artifact.traceKey}|${artifact.layer}|${artifact.role}`;
    const previous = seen.get(key);
    if (previous && previous.path !== artifact.path) {
      findings.push({
        code: "duplicate-key",
        traceKey: artifact.traceKey,
        layer: artifact.layer,
        role: artifact.role,
        path: artifact.path,
        detail: `duplicate trace/layer/role also declared by ${previous.path}`,
      });
    } else {
      seen.set(key, artifact);
    }
  }

  const byTrace = groupByTrace(traceable);
  const obligations = generateObligations(traceable, adjacency);
  const unmetLayers = new Set<string>();
  const graded = obligations.map((obligation): GradedObligation => {
    const group = byTrace.get(obligation.traceKey) ?? [];
    const hasImpl = group.some(
      (artifact) => isActiveArtifact(artifact) && IMPL_ROLES.has(artifact.role),
    );
    const satisfied = group.some(
      (artifact) => isActiveArtifact(artifact) && artifact.layer === obligation.requiredLayer,
    );
    if (satisfied) return { ...obligation, status: "satisfied" };
    const defer = defers.find(
      (entry) =>
        entry.traceKey === obligation.traceKey && entry.waitingLayer === obligation.requiredLayer,
    );
    if (defer && !validDefer(defer)) {
      findings.push({
        code: "invalid-defer",
        traceKey: defer.traceKey,
        layer: defer.waitingLayer,
        detail: "defer entry must include dischargeCondition and owner",
      });
      unmetLayers.add(`${obligation.traceKey}|${obligation.requiredLayer}`);
      return { ...obligation, status: "unmet", defer };
    }
    if (defer && !hasImpl) return { ...obligation, status: "deferred", defer };
    unmetLayers.add(`${obligation.traceKey}|${obligation.requiredLayer}`);
    return { ...obligation, status: "unmet", defer };
  });

  const implAhead: ImplAheadViolation[] = [];
  for (const [traceKey, group] of byTrace) {
    const hasImpl = group.some(
      (artifact) => isActiveArtifact(artifact) && IMPL_ROLES.has(artifact.role),
    );
    if (!hasImpl) continue;
    const landedAt = landedLayer(group);
    for (const defer of defers.filter(
      (entry) =>
        entry.traceKey === traceKey &&
        OPEN_DEFER_LAYERS.has(entry.waitingLayer) &&
        validDefer(entry) &&
        !unmetLayers.has(`${traceKey}|${entry.waitingLayer}`),
    )) {
      implAhead.push({
        traceKey,
        landedAt,
        waitingLayer: defer.waitingLayer,
        waitingSpec: defer.waitingSpec,
        owner: defer.owner,
      });
    }
  }

  const chains = [...byTrace.entries()]
    .map(([traceKey, group]): ChainSummary => {
      const traceObligations = graded.filter((obligation) => obligation.traceKey === traceKey);
      const gaps = traceObligations
        .filter((obligation) => obligation.status === "unmet")
        .map((obligation) => obligation.requiredLayer)
        .sort((a, b) => layerRank(a) - layerRank(b));
      const traceFindings = findings.some((finding) => finding.traceKey === traceKey);
      const traceImplAhead = implAhead.some((violation) => violation.traceKey === traceKey);
      return {
        traceKey,
        complete: gaps.length === 0 && !traceFindings && !traceImplAhead,
        firstGap: gaps[0] ?? null,
        layers: uniq([
          ...group.filter(isActiveArtifact).map((artifact) => artifact.layer),
          ...traceObligations.map((obligation) => obligation.requiredLayer),
        ]).sort((a, b) => layerRank(a) - layerRank(b)),
      };
    })
    .sort((a, b) => a.traceKey.localeCompare(b.traceKey));

  const ok =
    graded.every((obligation) => obligation.status !== "unmet") &&
    implAhead.length === 0 &&
    findings.length === 0;
  return { ok, obligations: graded, implAhead, chains, findings };
}

export function descentObligationMessages(result: DescentResult): string[] {
  if (result.ok) {
    return [
      `descent-obligation - OK (graded=${result.obligations.length}, chains=${result.chains.length})`,
    ];
  }
  const messages: string[] = [];
  for (const finding of result.findings.slice(0, 8)) {
    messages.push(
      `descent-obligation - violation: ${finding.code} ${finding.traceKey || "-"} ${finding.layer ?? "-"} ${finding.role ?? "-"}: ${finding.detail}`,
    );
  }
  for (const obligation of result.obligations.filter((row) => row.status === "unmet").slice(0, 8)) {
    messages.push(
      `descent-obligation - unmet: ${obligation.traceKey} requires ${obligation.requiredLayer} (${obligation.kind}) from ${obligation.fromLayer}: ${obligation.reason}`,
    );
  }
  for (const violation of result.implAhead.slice(0, 8)) {
    messages.push(
      `descent-obligation - impl-ahead: ${violation.traceKey} landed at ${violation.landedAt} while ${violation.waitingLayer} defer remains open (${violation.waitingSpec})`,
    );
  }
  return messages;
}
