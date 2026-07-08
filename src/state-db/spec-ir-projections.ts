import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { isValidSubDocForLayer, V_MODEL_PAIRS } from "../schema";
import { isSecretLike } from "../secret";
import type { HarnessDb } from "./index";

type SpecIrSourceKind = "plan" | "design_doc" | "test_design";

interface SpecIrSource {
  kind: SpecIrSourceKind;
  path: string;
  content: string;
  metadata: Record<string, unknown>;
  sourceHash: string;
}

export interface SpecDefRow {
  spec_id: string;
  spec_kind: string;
  layer: string;
  sub_doc: string;
  owner_artifact_id: string;
  owner_path: string;
  section_anchor: string;
  title: string;
  lifecycle_status: string;
  plan_id: string;
  source_path: string;
  source_hash: string;
  indexed_at: string;
}

export interface SpecRelationRow {
  relation_id: string;
  from_spec_id: string;
  to_spec_id: string;
  relation_kind: string;
  plan_id: string;
  status: string;
  source: string;
  evidence_path: string;
  indexed_at: string;
}

export interface ScheduleEntryRow {
  schedule_entry_id: string;
  plan_id: string;
  layer: string;
  sub_doc: string;
  v_pair: string;
  predecessor_plan_ids: string;
  current_location: string;
  rag: string;
  status: string;
  blocked_reason: string;
  source_path: string;
  source_hash: string;
  indexed_at: string;
}

export interface ActivationEntryRow {
  activation_entry_id: string;
  profile_id: string;
  target_kind: string;
  target_id: string;
  scope_status: string;
  target_version: string;
  defer_reason: string;
  enabled: number;
  source_path: string;
  plan_id: string;
  indexed_at: string;
}

export interface DetectorRouteCandidateRow {
  route_candidate_id: string;
  source_table: string;
  source_id: string;
  detector_id: string;
  finding_kind: string;
  severity: string;
  subject_kind: string;
  subject_id: string;
  filing_target_id: string;
  target_layer: string;
  target_sub_doc: string;
  candidate_status: string;
  reason: string;
  evidence_path: string;
  computed_at: string;
}

export interface SpecIrFindingRow {
  finding_id: string;
  kind: string;
  severity: "error" | "warn" | "info";
  subject_id: string;
  source: string;
  status: string;
  evidence_path: string;
}

export interface SpecIrProjection {
  spec_defs: SpecDefRow[];
  spec_relations: SpecRelationRow[];
  schedule_entries: ScheduleEntryRow[];
  activation_entries: ActivationEntryRow[];
  detector_route_candidates: DetectorRouteCandidateRow[];
  findings: SpecIrFindingRow[];
}

interface SpecIrProjectionDeps {
  nowIso: () => string;
  recordProjectionEvent: (
    db: HarnessDb,
    event: { table: string; id: string; row: Record<string, unknown> },
  ) => void;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}:${value.replace(/[^A-Za-z0-9._:-]+/g, "-")}`;
}

function stableHash(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function markdownFrontmatter(content: string): string {
  if (!content.startsWith("---")) return "";
  const end = content.indexOf("\n---", 3);
  return end < 0 ? "" : content.slice(3, end);
}

function metadataFromContent(content: string): Record<string, unknown> {
  const raw = markdownFrontmatter(content);
  if (!raw.trim()) return {};
  const parsed = parseYaml(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }
  return typeof value === "string" && value.trim() !== ""
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function dependencyValues(metadata: Record<string, unknown>): string[] {
  const dependencies =
    metadata.dependencies && typeof metadata.dependencies === "object"
      ? (metadata.dependencies as Record<string, unknown>)
      : {};
  return [
    stringField(dependencies.parent),
    ...stringList(dependencies.requires),
    ...stringList(metadata.parent_design),
  ].filter(Boolean);
}

function planIdFromReference(value: string): string {
  const normalized = normalizePath(value);
  const match = normalized.match(/(PLAN-[A-Z0-9-]+[A-Za-z0-9-]*)/);
  return match?.[1] ?? "";
}

function firstHeading(content: string): string {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferLayerFromPath(path: string): string {
  return path.match(/(?:^|\/)L(\d+)[-/]/)?.[0]?.match(/L\d+/)?.[0] ?? "";
}

function inferSubDocFromPath(path: string): string {
  const name = basename(path, ".md");
  const suffix = path.match(/(?:^|\/)L\d+-([^/]+)\//)?.[1] ?? "";
  if (name === "function") return "function";
  if (name === "data") return "data";
  if (name === "architecture") return "architecture";
  if (name === "physical-data") return "physical-data";
  if (name === "function-spec") return "function-spec";
  if (suffix === "requirements" && name.includes("screen")) return "screen";
  return name;
}

function sourceKind(path: string): SpecIrSourceKind | null {
  if (path.startsWith("docs/plans/")) return "plan";
  if (path.startsWith("docs/design/harness/")) return "design_doc";
  if (path.startsWith("docs/test-design/harness/")) return "test_design";
  return null;
}

function walkMarkdown(root: string): string[] {
  if (!existsSync(root)) return [];
  const entries = readdirSync(root)
    .map((name) => join(root, name))
    .sort();
  const files: string[] = [];
  for (const entry of entries) {
    const stat = statSync(entry);
    if (stat.isDirectory()) files.push(...walkMarkdown(entry));
    if (stat.isFile() && entry.endsWith(".md")) files.push(entry);
  }
  return files;
}

export function loadSpecIrSources(repoRoot: string): SpecIrSource[] {
  return [
    ...walkMarkdown(join(repoRoot, "docs", "plans")),
    ...walkMarkdown(join(repoRoot, "docs", "design", "harness")),
    ...walkMarkdown(join(repoRoot, "docs", "test-design", "harness")),
  ].flatMap((absolutePath) => {
    const path = normalizePath(relative(repoRoot, absolutePath));
    const kind = sourceKind(path);
    if (!kind) return [];
    const content = readFileSync(absolutePath, "utf8");
    return [
      {
        kind,
        path,
        content,
        metadata: metadataFromContent(content),
        sourceHash: stableHash(content),
      },
    ];
  });
}

function sourceLayer(source: SpecIrSource): string {
  return stringField(source.metadata.layer) || inferLayerFromPath(source.path);
}

function sourceSubDoc(source: SpecIrSource): string {
  return stringField(source.metadata.sub_doc) || inferSubDocFromPath(source.path);
}

function sourcePlanId(source: SpecIrSource): string {
  return stringField(source.metadata.plan_id);
}

function sourceStatus(source: SpecIrSource): string {
  return stringField(source.metadata.status) || "active";
}

function sourceTitle(source: SpecIrSource): string {
  return (
    stringField(source.metadata.title) || firstHeading(source.content) || basename(source.path)
  );
}

export function parseSpecDefs(sources: SpecIrSource[], indexedAt: string): SpecDefRow[] {
  const defs: SpecDefRow[] = [];
  for (const source of sources) {
    const planId = sourcePlanId(source);
    const ownerArtifactId = planId || source.path;
    const layer = sourceLayer(source);
    const subDoc = sourceSubDoc(source);
    const documentSpecId = stableId("spec", `${source.path}#document`);
    defs.push({
      spec_id: documentSpecId,
      spec_kind: source.kind,
      layer,
      sub_doc: subDoc,
      owner_artifact_id: ownerArtifactId,
      owner_path: source.path,
      section_anchor: "document",
      title: sourceTitle(source),
      lifecycle_status: sourceStatus(source),
      plan_id: planId,
      source_path: source.path,
      source_hash: source.sourceHash,
      indexed_at: indexedAt,
    });
    if (source.kind === "plan") continue;
    for (const match of source.content.matchAll(/^(#{1,3})\s+(.+)$/gm)) {
      const title = match[2].trim();
      const anchor = slug(title);
      if (!anchor || anchor === "document") continue;
      defs.push({
        spec_id: stableId("spec", `${source.path}#${anchor}`),
        spec_kind: "section",
        layer,
        sub_doc: subDoc,
        owner_artifact_id: ownerArtifactId,
        owner_path: source.path,
        section_anchor: anchor,
        title,
        lifecycle_status: sourceStatus(source),
        plan_id: planId,
        source_path: source.path,
        source_hash: source.sourceHash,
        indexed_at: indexedAt,
      });
    }
  }
  return defs;
}

export function parseSpecRelations(
  sources: SpecIrSource[],
  defs: SpecDefRow[],
  indexedAt: string,
): { relations: SpecRelationRow[]; findings: SpecIrFindingRow[] } {
  const byPlanId = new Map(defs.filter((def) => def.plan_id).map((def) => [def.plan_id, def]));
  const byPath = new Map(
    defs.filter((def) => def.section_anchor === "document").map((def) => [def.owner_path, def]),
  );
  const relations: SpecRelationRow[] = [];
  const findings: SpecIrFindingRow[] = [];
  const addRelation = (input: {
    source: SpecIrSource;
    from: SpecDefRow;
    to: SpecDefRow | undefined;
    relationKind: string;
    evidencePath: string;
  }) => {
    const { source, from, to, relationKind, evidencePath } = input;
    if (!to) {
      const subject = `${from.spec_id}:${relationKind}:${evidencePath}`;
      findings.push({
        finding_id: stableId("finding:spec-ir-orphan-relation", subject),
        kind: "spec-ir-orphan-relation",
        severity: "warn",
        subject_id: subject,
        source: "spec-ir-projection",
        status: "open",
        evidence_path: source.path,
      });
      return;
    }
    const relationId = stableId("spec-relation", `${from.spec_id}:${relationKind}:${to.spec_id}`);
    relations.push({
      relation_id: relationId,
      from_spec_id: from.spec_id,
      to_spec_id: to.spec_id,
      relation_kind: relationKind,
      plan_id: sourcePlanId(source),
      status: "active",
      source: source.path,
      evidence_path: evidencePath,
      indexed_at: indexedAt,
    });
  };
  for (const source of sources.filter((item) => item.kind === "plan")) {
    const planId = sourcePlanId(source);
    const from = byPlanId.get(planId);
    if (!from) continue;
    for (const ref of dependencyValues(source.metadata)) {
      const targetPlanId = planIdFromReference(ref);
      const target = targetPlanId ? byPlanId.get(targetPlanId) : byPath.get(normalizePath(ref));
      addRelation({ source, from, to: target, relationKind: "requires", evidencePath: ref });
    }
    const pairArtifact = normalizePath(stringField(source.metadata.pair_artifact));
    if (pairArtifact) {
      addRelation({
        source,
        from,
        to: byPath.get(pairArtifact),
        relationKind: "pairs",
        evidencePath: pairArtifact,
      });
    }
  }
  return { relations, findings };
}

export function parseScheduleEntries(
  sources: SpecIrSource[],
  indexedAt: string,
): ScheduleEntryRow[] {
  return sources
    .filter((source) => source.kind === "plan" && sourcePlanId(source))
    .map((source) => {
      const planId = sourcePlanId(source);
      const status = sourceStatus(source);
      const layer = sourceLayer(source);
      const predecessors = dependencyValues(source.metadata)
        .map(planIdFromReference)
        .filter(Boolean)
        .sort();
      const rag = status === "confirmed" || status === "completed" ? "green" : "yellow";
      return {
        schedule_entry_id: stableId("schedule-entry", planId),
        plan_id: planId,
        layer,
        sub_doc: sourceSubDoc(source),
        v_pair: (V_MODEL_PAIRS as Record<string, string>)[layer] ?? "",
        predecessor_plan_ids: predecessors.join("|"),
        current_location: `${layer || "unknown"}:${status}`,
        rag,
        status,
        blocked_reason: "",
        source_path: source.path,
        source_hash: source.sourceHash,
        indexed_at: indexedAt,
      };
    });
}

export function parseActivationEntries(
  sources: SpecIrSource[],
  indexedAt: string,
): ActivationEntryRow[] {
  return sources
    .filter((source) => source.kind === "plan" && sourcePlanId(source))
    .map((source) => {
      const planId = sourcePlanId(source);
      const drive = stringField(source.metadata.drive) || "unknown";
      const mode = stringField(source.metadata.route_mode) || "forward";
      const archived = sourceStatus(source) === "archived";
      return {
        activation_entry_id: stableId("activation-entry", `${planId}:${drive}:${mode}`),
        profile_id: `drive:${drive}:mode:${mode}`,
        target_kind: "plan",
        target_id: planId,
        scope_status: archived ? "out_of_scope" : "in_scope",
        target_version: source.sourceHash,
        defer_reason: archived ? "archived plan is out of active projection scope" : "",
        enabled: archived ? 0 : 1,
        source_path: source.path,
        plan_id: planId,
        indexed_at: indexedAt,
      };
    });
}

export function analyzeSpecIrIntegrity(input: {
  defs: SpecDefRow[];
  relations: SpecRelationRow[];
  relationFindings: SpecIrFindingRow[];
  activations: ActivationEntryRow[];
}): SpecIrFindingRow[] {
  const findings = [...input.relationFindings];
  const defIds = new Set(input.defs.map((def) => def.spec_id));
  for (const def of input.defs) {
    if (
      ["L1", "L2", "L3", "L4", "L5", "L6"].includes(def.layer) &&
      !isValidSubDocForLayer(def.layer, def.sub_doc)
    ) {
      findings.push({
        finding_id: stableId(
          "finding:spec-ir-invalid-subdoc",
          `${def.spec_id}:${def.layer}:${def.sub_doc}`,
        ),
        kind: "spec-ir-invalid-subdoc",
        severity: "warn",
        subject_id: def.spec_id,
        source: "spec-ir-projection",
        status: "open",
        evidence_path: def.source_path,
      });
    }
    for (const value of Object.values(def)) {
      if (typeof value === "string" && isSecretLike(value)) {
        findings.push({
          finding_id: stableId("finding:spec-ir-secret-like-payload", def.spec_id),
          kind: "spec-ir-secret-like-payload",
          severity: "error",
          subject_id: def.spec_id,
          source: "spec-ir-projection",
          status: "open",
          evidence_path: def.source_path,
        });
      }
    }
  }
  for (const relation of input.relations) {
    if (!defIds.has(relation.from_spec_id) || !defIds.has(relation.to_spec_id)) {
      findings.push({
        finding_id: stableId("finding:spec-ir-orphan-relation", relation.relation_id),
        kind: "spec-ir-orphan-relation",
        severity: "warn",
        subject_id: relation.relation_id,
        source: "spec-ir-projection",
        status: "open",
        evidence_path: relation.evidence_path,
      });
    }
  }
  for (const activation of input.activations) {
    if (
      (activation.scope_status === "out_of_scope" || activation.scope_status === "deferred") &&
      activation.defer_reason === ""
    ) {
      findings.push({
        finding_id: stableId("finding:activation-reason-missing", activation.activation_entry_id),
        kind: "activation-reason-missing",
        severity: "warn",
        subject_id: activation.activation_entry_id,
        source: "spec-ir-projection",
        status: "open",
        evidence_path: activation.source_path,
      });
    }
  }
  return findings;
}

export function deriveDetectorRouteCandidates(
  findings: SpecIrFindingRow[],
  computedAt: string,
): DetectorRouteCandidateRow[] {
  return findings.map((finding) => ({
    route_candidate_id: stableId("detector-route-candidate", finding.finding_id),
    source_table: "findings",
    source_id: finding.finding_id,
    detector_id: "spec-ir-integrity",
    finding_kind: finding.kind,
    severity: finding.severity,
    subject_kind: "spec_ir",
    subject_id: finding.subject_id,
    filing_target_id: "routeFiling:feature_addition",
    target_layer: "L6",
    target_sub_doc: "function-spec",
    candidate_status: "non_ready",
    reason: "Spec IR integrity finding requires routeFiling SSoT evaluation before filing.",
    evidence_path: finding.evidence_path,
    computed_at: computedAt,
  }));
}

export function collectSpecIrProjection(repoRoot: string, indexedAt: string): SpecIrProjection {
  const sources = loadSpecIrSources(repoRoot);
  const defs = parseSpecDefs(sources, indexedAt);
  const relationResult = parseSpecRelations(sources, defs, indexedAt);
  const schedules = parseScheduleEntries(sources, indexedAt);
  const activations = parseActivationEntries(sources, indexedAt);
  const findings = analyzeSpecIrIntegrity({
    defs,
    relations: relationResult.relations,
    relationFindings: relationResult.findings,
    activations,
  });
  return {
    spec_defs: defs,
    spec_relations: relationResult.relations,
    schedule_entries: schedules,
    activation_entries: activations,
    detector_route_candidates: deriveDetectorRouteCandidates(findings, indexedAt),
    findings,
  };
}

export function projectSpecIr(repoRoot: string, db: HarnessDb, deps: SpecIrProjectionDeps): void {
  const projection = collectSpecIrProjection(repoRoot, deps.nowIso());
  for (const row of projection.spec_defs) {
    deps.recordProjectionEvent(db, { table: "spec_defs", id: row.spec_id, row: { ...row } });
  }
  for (const row of projection.spec_relations) {
    deps.recordProjectionEvent(db, {
      table: "spec_relations",
      id: row.relation_id,
      row: { ...row },
    });
  }
  for (const row of projection.schedule_entries) {
    deps.recordProjectionEvent(db, {
      table: "schedule_entries",
      id: row.schedule_entry_id,
      row: { ...row },
    });
  }
  for (const row of projection.activation_entries) {
    deps.recordProjectionEvent(db, {
      table: "activation_entries",
      id: row.activation_entry_id,
      row: { ...row },
    });
  }
  for (const row of projection.findings) {
    deps.recordProjectionEvent(db, { table: "findings", id: row.finding_id, row: { ...row } });
  }
  for (const row of projection.detector_route_candidates) {
    deps.recordProjectionEvent(db, {
      table: "detector_route_candidates",
      id: row.route_candidate_id,
      row: { ...row },
    });
  }
}
