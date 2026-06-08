import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const SERIAL_REASONS = ["file_conflict", "downstream_dependency", "shared_state"] as const;
const MODE_PATTERN = /\[(並列|直列)\]|\[(荳ｦ蛻|逶ｴ蛻)/;
const SERIAL_MODE_PATTERN = /\[直列\]|\[逶ｴ蛻/;
const REVIEW_PATTERN = /review|レビュー|繝ｬ繝薙Η繝ｼ|self|pmo-sonnet/i;

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

export function lintPlan(path?: string, repoRoot: string = process.cwd()): LintResult {
  const result = analyzePlanSchedule(loadPlanScheduleDocs(repoRoot, path));
  return { ok: result.ok, messages: planScheduleMessages(result) };
}
