import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { analyzeG1Trace, g1TraceMessages, g1TraceOk, loadG1TraceDocs } from "../lint/g1-trace";
import { analyzeG3Trace, g3TraceMessages, g3TraceOk, loadDocs } from "../lint/g3-trace";
import { type Frontmatter, frontmatterSchema } from "../schema/frontmatter";

export interface LintResult {
  ok: boolean;
  messages: string[];
}

export interface PlanScheduleDoc {
  file: string;
  content: string;
}

export interface PlanScheduleViolation {
  file: string;
  step?: string;
  reason: "missing_mode" | "missing_serial_reason" | "missing_review_step" | "missing_impl_plan";
}

export interface PlanScheduleResult {
  violations: PlanScheduleViolation[];
  checked: number;
  ok: boolean;
}

export interface PlanGovernanceDoc {
  file: string;
  content: string;
}

export interface PlanGovernanceViolation {
  file: string;
  reason:
    | "missing_frontmatter"
    | "invalid_frontmatter"
    | "duplicate_plan_id"
    | "missing_sub_doc"
    | "invalid_sub_doc"
    | "duplicate_layer_sub_doc"
    | "skip_sub_doc_reason"
    | "parent_missing"
    | "parent_drive_mismatch"
    | "requires_missing"
    | "requires_not_ready"
    | "parent_design_missing";
  detail?: string;
}

export interface PlanGovernanceResult {
  violations: PlanGovernanceViolation[];
  checked: number;
  ok: boolean;
}

const SERIAL_REASONS = ["file_conflict", "downstream_dependency", "shared_state"] as const;
const MODE_PATTERN = /\[(並列|直列)\]|\[(荳ｦ蛻|逶ｴ蛻)/;
const SERIAL_MODE_PATTERN = /\[直列\]|\[逶ｴ蛻/;
const REVIEW_PATTERN = /review|レビュー|繝ｬ繝薙Η繝ｼ|self|pmo-sonnet/i;

const DESIGN_LAYERS_REQUIRING_SUB_DOC = new Set(["L1", "L2", "L3", "L4", "L5", "L6"]);
const VALID_SUB_DOCS: Record<string, Set<string>> = {
  L1: new Set(["business", "functional", "nfr", "technical", "screen"]),
  L2: new Set(["screen-list", "screen-flow", "ui-element", "wireframe"]),
  L3: new Set(["business", "functional", "nfr"]),
  L4: new Set(["data", "architecture", "function", "external-if"]),
  L5: new Set(["physical-data", "module-decomposition", "internal-processing", "if-detail"]),
  L6: new Set(["function-spec", "class-design", "edge-case"]),
};
const INTERNAL_ASSET_EXTENSION_PLAN_IDS = new Set([
  "PLAN-L4-10-internal-asset-master",
  "PLAN-L4-11-roster",
  "PLAN-L4-12-skill-pack",
  "PLAN-L4-13-drift-lint",
  "PLAN-L5-05-roster",
  "PLAN-L5-06-skill",
  "PLAN-L5-07-drift",
]);
const READY_DEPENDENCY_STATUSES = new Set(["confirmed", "completed"]);

function section(content: string, start: RegExp, end: RegExp): string {
  const m = content.match(start);
  if (!m || m.index === undefined) return "";
  const rest = content.slice(m.index + m[0].length);
  const e = rest.search(end);
  return e < 0 ? rest : rest.slice(0, e);
}

export function extractScheduleSection(content: string): string {
  return section(
    content,
    /^##\s*(?:§|ﾂｧ)?3\b[^\n]*(工程表|蟾･遞玖｡ｨ|陝ｾ・･驕樒事・｡・ｨ)[^\n]*\n/m,
    /^##\s/m,
  );
}

function stepBlocks(schedule: string): { heading: string; body: string }[] {
  const matches = [...schedule.matchAll(/^###\s+Step\s+\d+:\s*(.+)$/gm)];
  return matches.map((m, index) => {
    const start = (m.index ?? 0) + m[0].length;
    const end =
      index + 1 < matches.length ? (matches[index + 1].index ?? schedule.length) : schedule.length;
    return { heading: m[1].trim(), body: schedule.slice(start, end) };
  });
}

export function analyzePlanSchedule(docs: PlanScheduleDoc[]): PlanScheduleResult {
  const violations: PlanScheduleViolation[] = [];
  for (const doc of docs) {
    const schedule = extractScheduleSection(doc.content);
    const steps = stepBlocks(schedule);
    if (steps.length === 0) continue;
    let hasReview = false;
    for (const step of steps) {
      const full = `${step.heading}\n${step.body}`;
      if (!MODE_PATTERN.test(step.heading)) {
        violations.push({ file: doc.file, step: step.heading, reason: "missing_mode" });
      }
      if (SERIAL_MODE_PATTERN.test(step.heading) && !SERIAL_REASONS.some((r) => full.includes(r))) {
        violations.push({
          file: doc.file,
          step: step.heading,
          reason: "missing_serial_reason",
        });
      }
      if (REVIEW_PATTERN.test(step.heading)) hasReview = true;
    }
    if (!hasReview) violations.push({ file: doc.file, reason: "missing_review_step" });
    if (!/^##\s*(?:§|ﾂｧ)?3\.1[^\n]*(実装計画|螳溯｣・ｨ育判|陞ｳ貅ｯ)/m.test(doc.content)) {
      violations.push({ file: doc.file, reason: "missing_impl_plan" });
    }
  }
  return { violations, checked: docs.length, ok: violations.length === 0 };
}

export function loadPlanScheduleDocs(
  repoRoot: string = process.cwd(),
  target?: string,
): PlanScheduleDoc[] {
  if (target) {
    const p = join(repoRoot, target);
    return [{ file: target, content: readFileSync(p, "utf8") }];
  }
  const plansDir = join(repoRoot, "docs", "plans");
  return readdirSync(plansDir)
    .filter((f) => f.startsWith("PLAN-") && f.endsWith(".md"))
    .map((f) => ({
      file: join("docs", "plans", f),
      content: readFileSync(join(plansDir, f), "utf8"),
    }));
}

export function planScheduleMessages(result: PlanScheduleResult): string[] {
  if (result.violations.length === 0) {
    return [`plan-schedule — OK (§工程表 checked=${result.checked}, §G.4 minimal slice)`];
  }
  const sample = result.violations
    .slice(0, 8)
    .map((v) => `${v.file}${v.step ? `:${v.step}` : ""}:${v.reason}`)
    .join(", ");
  return [
    `plan-schedule — ⚠ §工程表 violation ${result.violations.length} 件 (${sample})。Step の [並列]/[直列]、直列理由、review Step、§3.1 実装計画を確認 (IMP-081)`,
  ];
}

function markdownFrontmatter(content: string): string | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

function parsePlanFrontmatter(doc: PlanGovernanceDoc): Record<string, unknown> | null {
  const raw = markdownFrontmatter(doc.content);
  if (!raw) return null;
  const parsed = parseYaml(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function normalizePlanRef(ref: string): string {
  const normalized = ref.replaceAll("\\", "/");
  const basename = normalized.split("/").at(-1) ?? normalized;
  return basename.endsWith(".md") ? basename.slice(0, -3) : basename;
}

function isPlanRef(ref: string): boolean {
  const normalized = ref.replaceAll("\\", "/");
  return normalizePlanRef(normalized).startsWith("PLAN-") || normalized.includes("/docs/plans/");
}

function pathExists(repoRoot: string | undefined, ref: string): boolean {
  if (!repoRoot) return true;
  return existsSync(join(repoRoot, ref));
}

function boolField(value: unknown): boolean {
  return value === true;
}

function schemaIssueSummary(issue: {
  path: (string | number)[];
  code: string;
  received?: unknown;
}): string {
  const path = issue.path.join(".") || "(root)";
  const received =
    typeof issue.received === "string" || typeof issue.received === "number"
      ? `(${String(issue.received)})`
      : "";
  return `${path}:${issue.code}${received}`;
}

export function analyzePlanGovernance(
  docs: PlanGovernanceDoc[],
  repoRoot?: string,
): PlanGovernanceResult {
  const violations: PlanGovernanceViolation[] = [];
  const parsed = new Map<
    string,
    { file: string; raw: Record<string, unknown>; parsed?: Frontmatter }
  >();
  const byPlanId = new Map<string, string[]>();

  for (const doc of docs) {
    const raw = parsePlanFrontmatter(doc);
    if (!raw) {
      violations.push({ file: doc.file, reason: "missing_frontmatter" });
      continue;
    }
    const schemaResult = frontmatterSchema.safeParse(raw);
    if (!schemaResult.success) {
      violations.push({
        file: doc.file,
        reason: "invalid_frontmatter",
        detail: schemaResult.error.issues.slice(0, 3).map(schemaIssueSummary).join(" | "),
      });
    }
    const planId = stringField(raw.plan_id);
    if (planId) {
      byPlanId.set(planId, [...(byPlanId.get(planId) ?? []), doc.file]);
      parsed.set(doc.file, {
        file: doc.file,
        raw,
        ...(schemaResult.success ? { parsed: schemaResult.data } : {}),
      });
    }
  }

  for (const [planId, files] of byPlanId) {
    if (files.length > 1) {
      for (const file of files)
        violations.push({ file, reason: "duplicate_plan_id", detail: planId });
    }
  }

  const byRef = new Map<
    string,
    { file: string; raw: Record<string, unknown>; parsed?: Frontmatter }
  >();
  for (const entry of parsed.values()) {
    const planId = stringField(entry.raw.plan_id);
    if (planId) byRef.set(planId, entry);
    byRef.set(normalizePlanRef(entry.file), entry);
  }

  const layerSubDoc = new Map<string, string[]>();
  for (const entry of parsed.values()) {
    const raw = entry.raw;
    const planId = stringField(raw.plan_id) ?? entry.file;
    const kind = stringField(raw.kind);
    const layer = stringField(raw.layer);
    const status = stringField(raw.status);
    const subDoc = stringField(raw.sub_doc);
    const isMasterHub = boolField(raw.master_hub);
    const isInternalAssetExtension = INTERNAL_ASSET_EXTENSION_PLAN_IDS.has(planId);

    if (kind === "design" && layer && DESIGN_LAYERS_REQUIRING_SUB_DOC.has(layer) && !isMasterHub) {
      if (!subDoc) {
        violations.push({ file: entry.file, reason: "missing_sub_doc", detail: planId });
      } else if (!VALID_SUB_DOCS[layer]?.has(subDoc)) {
        violations.push({
          file: entry.file,
          reason: "invalid_sub_doc",
          detail: `${layer}/${subDoc}`,
        });
      } else if (status !== "archived" && !isInternalAssetExtension) {
        const key = `${layer}/${subDoc}`;
        layerSubDoc.set(key, [...(layerSubDoc.get(key) ?? []), entry.file]);
      }
    }

    if (Array.isArray(raw.skip_sub_doc)) {
      for (const skip of raw.skip_sub_doc) {
        if (skip && typeof skip === "object") {
          const reason = stringField((skip as Record<string, unknown>).reason);
          if (!reason || reason.length < 10) {
            violations.push({ file: entry.file, reason: "skip_sub_doc_reason", detail: planId });
          }
        }
      }
    }

    const deps =
      raw.dependencies && typeof raw.dependencies === "object"
        ? (raw.dependencies as Record<string, unknown>)
        : {};
    const parent = stringField(deps.parent);
    if ((kind === "add-design" || kind === "add-impl") && parent) {
      const parentRecord = byRef.get(normalizePlanRef(parent));
      if (!parentRecord) {
        violations.push({ file: entry.file, reason: "parent_missing", detail: parent });
      } else {
        const parentDrive = stringField(parentRecord.raw.drive);
        const drive = stringField(raw.drive);
        if (drive && parentDrive && drive !== parentDrive && parentDrive !== "fullstack") {
          violations.push({
            file: entry.file,
            reason: "parent_drive_mismatch",
            detail: `${drive} != ${parentDrive}`,
          });
        }
      }
    }

    for (const req of stringArray(deps.requires)) {
      if (!isPlanRef(req)) {
        if (!pathExists(repoRoot, req)) {
          violations.push({ file: entry.file, reason: "requires_missing", detail: req });
        }
        continue;
      }
      const required = byRef.get(normalizePlanRef(req));
      if (!required) {
        violations.push({ file: entry.file, reason: "requires_missing", detail: req });
      } else if (!READY_DEPENDENCY_STATUSES.has(stringField(required.raw.status) ?? "")) {
        violations.push({
          file: entry.file,
          reason: "requires_not_ready",
          detail: `${req} status=${stringField(required.raw.status) ?? "-"}`,
        });
      }
    }

    const parentDesign = stringField(raw.parent_design);
    if (
      (kind === "impl" || kind === "add-impl") &&
      parentDesign &&
      !pathExists(repoRoot, parentDesign)
    ) {
      violations.push({ file: entry.file, reason: "parent_design_missing", detail: parentDesign });
    }
  }

  for (const [key, files] of layerSubDoc) {
    if (files.length > 1) {
      for (const file of files)
        violations.push({ file, reason: "duplicate_layer_sub_doc", detail: key });
    }
  }

  return { violations, checked: docs.length, ok: violations.length === 0 };
}

export function planGovernanceMessages(result: PlanGovernanceResult): string[] {
  if (result.violations.length === 0) {
    return [`plan-governance - OK (frontmatter/cross-record checked=${result.checked})`];
  }
  const byReason = new Map<string, number>();
  for (const v of result.violations) byReason.set(v.reason, (byReason.get(v.reason) ?? 0) + 1);
  const summary = [...byReason.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reason, count]) => `${reason}=${count}`)
    .join(", ");
  const sample = result.violations
    .slice(0, 8)
    .map((v) => `${v.file}:${v.reason}${v.detail ? `(${v.detail})` : ""}`)
    .join(", ");
  return [
    `plan-governance - violation ${result.violations.length} item(s) across ${result.checked} PLAN(s): ${summary}`,
    `plan-governance - sample: ${sample}`,
  ];
}

export function loadPlanGovernanceDocs(
  repoRoot: string = process.cwd(),
  target?: string,
): PlanGovernanceDoc[] {
  return loadPlanScheduleDocs(repoRoot, target);
}

export function lintPlan(path?: string, repoRoot: string = process.cwd()): LintResult {
  const result = analyzePlanSchedule(loadPlanScheduleDocs(repoRoot, path));
  return { ok: result.ok, messages: planScheduleMessages(result) };
}

export function lintPlanGate(
  gate: string | undefined,
  path?: string,
  repoRoot: string = process.cwd(),
): LintResult {
  if (!gate || gate === "schedule") return lintPlan(path, repoRoot);

  if (gate === "governance" || gate === "frontmatter") {
    const result = analyzePlanGovernance(loadPlanGovernanceDocs(repoRoot, path), repoRoot);
    return { ok: result.ok, messages: planGovernanceMessages(result) };
  }

  if (path) {
    return {
      ok: false,
      messages: [
        `plan-lint - violation: gate ${gate} is repository-level and does not accept path`,
      ],
    };
  }

  if (gate === "G3-trace") {
    try {
      const result = analyzeG3Trace(loadDocs(repoRoot));
      return { ok: g3TraceOk(result), messages: g3TraceMessages(result) };
    } catch (e) {
      return {
        ok: false,
        messages: [`g3-trace - violation: required docs could not be read (${String(e)})`],
      };
    }
  }

  if (gate === "G1-trace") {
    try {
      const result = analyzeG1Trace(loadG1TraceDocs(repoRoot));
      return { ok: g1TraceOk(result), messages: g1TraceMessages(result) };
    } catch (e) {
      return {
        ok: false,
        messages: [`g1-trace - violation: required docs could not be read (${String(e)})`],
      };
    }
  }

  return { ok: false, messages: [`plan-lint - violation: unsupported gate ${gate}`] };
}

export function lintPlanWithGate(
  path?: string,
  repoRoot: string = process.cwd(),
  gate?: string,
): LintResult {
  return lintPlanGate(gate, path, repoRoot);
}
