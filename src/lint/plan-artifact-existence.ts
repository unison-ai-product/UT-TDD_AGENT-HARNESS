/**
 * plan-artifact-existence lint — 「PLAN が confirmed/completed/accepted (= 完了宣言) なのに、その
 * `generates` で宣言した artifact がディスク上に実在しない」phantom-artifact / false-completion を
 * 機械検出する (hard、doctor.ok 連動)。
 *
 * 動機 (PO /goal 2026-06-15、絶対的 absence-blindness 掃討): merged-plan-status (PLAN-L7-54) は
 * 「artifact が merge 済みなのに PLAN が draft」を検出するが、その **鏡像** = 「PLAN は完了済みなのに
 * artifact が不在」は全 gate を素通りしていた:
 *   - merged-plan-status は status が未 confirm のときだけ発火するため、confirmed/completed を skip。
 *   - impl-plan-trace は src→PLAN 方向 (孤児 src) のみで、PLAN→artifact 実在 (欠落) を見ない。
 *   - review-evidence は証跡の有無を見るだけで artifact 実在は見ない。
 * 結果、completed の PLAN が `generates: src/foo.ts` を宣言していても foo.ts が未作成 / 後に削除されて
 * いれば、state DB は plan_registry を completed・artifact_registry を欠損のまま投影し、人手 grep でしか
 * 気付けない (= L7-53 phantom 放置と同型の false-confidence)。設計の柱3 (state DB をフィードバック機構に)
 * と柱6 (テストなし完了宣言禁止の機械担保) の観点で、この不整合は機械が fail-close で surface すべき。
 *
 * 検出規則: status が confirmed/completed/accepted の PLAN について、その `generates[].artifact_path`
 * のうち **実在しない (existsSync=false)** パスがあれば「phantom-artifact」violation とする。draft 等
 * 未確定 status は対象外 (まだ作っていなくて当然 = false-positive 回避)。artifact_type は限定しない
 * (src / tests / design doc / test-design いずれも「完了」したなら実在すべき)。
 *
 * merged-plan-status との関係 = PLAN↕artifact 実在マトリクスを 2 gate で完結させる相補:
 *   - merged-plan-status: artifact 実在 × 未 confirm → 「merge したら confirm せよ」。
 *   - plan-artifact-existence (本 gate): 完了 × artifact 不在 → 「完了と言うなら artifact を実在させよ」。
 *
 * 純関数 (analyzePlanArtifactExistence) + I/O loader (loadPlanArtifactExistenceInput) を分離。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { loadReviewPlans } from "./review-evidence";
import { normalizePath } from "./shared";

/** 完了宣言とみなす status。これらは generates 全件が実在すべき。 */
const COMPLETED_STATUSES: ReadonlySet<string> = new Set(["confirmed", "completed", "accepted"]);

export interface PlanArtifactRow {
  planId: string;
  status: string;
  /** generates で宣言され、かつ repo に実在しない (= phantom) artifact パス集合。 */
  missingArtifacts: string[];
}

export interface PlanArtifactExistenceInput {
  plans: PlanArtifactRow[];
}

export interface PlanArtifactExistenceViolation {
  planId: string;
  status: string;
  artifacts: string[];
}

export interface PlanArtifactExistenceResult {
  violations: PlanArtifactExistenceViolation[];
  ok: boolean;
}

/** 完了 status かつ generates に不在 artifact を含む PLAN を violation として返す。 */
export function analyzePlanArtifactExistence(
  input: PlanArtifactExistenceInput,
): PlanArtifactExistenceResult {
  const violations = input.plans
    .filter((p) => COMPLETED_STATUSES.has(p.status.toLowerCase()) && p.missingArtifacts.length > 0)
    .map((p) => ({ planId: p.planId, status: p.status, artifacts: p.missingArtifacts }))
    .sort((a, b) => a.planId.localeCompare(b.planId));
  return { violations, ok: violations.length === 0 };
}

interface PlanFrontmatterGenerates {
  generates?: { artifact_path?: string }[];
}

/** frontmatter の generates[].artifact_path を正規化して返す (artifact_type 不問)。 */
function generatesArtifactPaths(content: string): string[] {
  // CRLF 許容 (Windows-first、.claude/CLAUDE.md Guard Rule)。`\n` 固定だと CRLF 保存の PLAN を
  // 無言で skip し phantom を見逃す (false-negative)。`\r?\n` で frontmatter 区切りを両対応。
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return [];
  let fm: PlanFrontmatterGenerates;
  try {
    fm = (parseYaml(m[1]) as PlanFrontmatterGenerates) ?? {};
  } catch {
    return [];
  }
  return (fm.generates ?? [])
    .map((g) => g.artifact_path ?? "")
    .filter((p) => p.length > 0)
    .map((p) => normalizePath(p));
}

export function loadPlanArtifactExistenceInput(repoRoot: string): PlanArtifactExistenceInput {
  const plans: PlanArtifactRow[] = [];
  let reviewPlans: ReturnType<typeof loadReviewPlans>;
  try {
    reviewPlans = loadReviewPlans(repoRoot);
  } catch {
    return { plans: [] }; // docs/plans 不在は空 (fail-open、他 lint と同方針)
  }
  const plansDir = join(repoRoot, "docs", "plans");
  for (const rp of reviewPlans) {
    // archived は完了後に成果物を整理・削除することがある (phantom false-positive) → 対象外。
    if (rp.status === "archived") continue;
    if (!COMPLETED_STATUSES.has(rp.status.toLowerCase())) continue;
    let content = "";
    try {
      content = readFileSync(join(plansDir, rp.file), "utf8");
    } catch {
      continue;
    }
    const missingArtifacts = generatesArtifactPaths(content).filter(
      (p) => !existsSync(join(repoRoot, p)),
    );
    plans.push({ planId: rp.plan_id, status: rp.status, missingArtifacts });
  }
  return { plans };
}

export function planArtifactExistenceMessages(r: PlanArtifactExistenceResult): string[] {
  if (r.ok) {
    return ["plan-artifact-existence — OK (完了 status の全 PLAN で generates artifact が実在)"];
  }
  return r.violations.map(
    (v) =>
      `plan-artifact-existence - violation: PLAN ${v.planId} は status=${v.status} (完了宣言) なのに generates artifact が不在: ${v.artifacts.join(", ")} → artifact を作成するか PLAN を draft に戻せ`,
  );
}
