/**
 * 工程表 registry — PLAN-DISCOVERY-05 (poc spike)。
 *
 * master-hub PLAN frontmatter の `roadmap:` block を読み、第一級登録工程表として扱う:
 *  - extractRoadmap / parseRoadmap: frontmatter から roadmap を抽出・schema 検証。
 *  - checkSpanExistence: span.plan_id が docs/plans に実在するか (孤児 span = 統制漏れ)。
 *  - computeGateProgress: 各層内ゲートの到達状況 (直前 span PLAN が全 confirmed か) を surface。
 *  - loadRoadmaps: docs/plans/ の登録工程表を全 load (doctor surface 用)。
 *
 * 配置 = src/lint (既存 module、新 src/roadmap module を作ると module-drift 孤児になるため spike は
 * lint 配下に寄せる。S4 confirmed 後に dedicated module 化を Reverse で判断)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { type Roadmap, roadmapSchema, validateRoadmapStructure } from "../schema/roadmap";
import { fmValue } from "./shared";

/** content から frontmatter block (先頭 `---` 〜 次 `---`) のテキストを返す。無ければ null。 */
function frontmatterBlock(content: string): string | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m?.[1] ?? null;
}

/** frontmatter YAML から `roadmap:` subtree (raw) を抽出。無ければ null。 */
export function extractRoadmap(content: string): unknown {
  const fm = frontmatterBlock(content);
  if (fm === null) return null;
  let doc: unknown;
  try {
    doc = parseYaml(fm);
  } catch {
    return null;
  }
  if (!doc || typeof doc !== "object") return null;
  const roadmap = (doc as Record<string, unknown>).roadmap;
  return roadmap ?? null;
}

/**
 * roadmap を抽出 + schema + 構造整合検証。errors = YAML parse 失敗 ∪ schema 違反 ∪ 構造 issue。
 * roadmap 不在 (frontmatter なし / roadmap key なし) は {null, []}。
 * I-2: YAML 破損を無音スキップせず errors に surface する (「検出したフリ」防止、coverage≠substance)。
 */
export function parseRoadmap(content: string): { roadmap: Roadmap | null; errors: string[] } {
  const fm = frontmatterBlock(content);
  if (fm === null) return { roadmap: null, errors: [] };
  let doc: unknown;
  try {
    doc = parseYaml(fm);
  } catch (e) {
    return { roadmap: null, errors: [`frontmatter YAML parse error: ${String(e)}`] };
  }
  if (!doc || typeof doc !== "object") return { roadmap: null, errors: [] };
  const raw = (doc as Record<string, unknown>).roadmap;
  if (raw === undefined || raw === null) return { roadmap: null, errors: [] };
  const parsed = roadmapSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      roadmap: null,
      errors: parsed.error.issues.map((i) => `${i.path.join(".") || "roadmap"}: ${i.message}`),
    };
  }
  const structure = validateRoadmapStructure(parsed.data);
  return { roadmap: parsed.data, errors: structure.map((s) => s.message) };
}

/** span.plan_id が既知 PLAN 集合に実在するか。実在しない span = 孤児 (統制漏れ)。 */
export function checkSpanExistence(roadmap: Roadmap, knownPlanIds: Set<string>): string[] {
  return roadmap.spans
    .filter((s) => !knownPlanIds.has(s.plan_id))
    .map((s) => `工程表 span PLAN 不在 (孤児): ${s.plan_id}`);
}

export interface GateProgress {
  gateId: string;
  totalSpans: number;
  confirmedSpans: number;
  reached: boolean;
}

/**
 * 各層内ゲートの到達状況。gate に到達 = その直前 (before_gate) の span PLAN が**全て** confirmed。
 * span 0 の gate は vacuous reached を避け未到達扱い (coverage≠substance、空集合で偽 green を出さない)。
 */
export function computeGateProgress(
  roadmap: Roadmap,
  statusOf: (planId: string) => string | null,
): GateProgress[] {
  return roadmap.gates.map((g) => {
    const spans = roadmap.spans.filter((s) => s.before_gate === g.id);
    const confirmedSpans = spans.filter((s) => statusOf(s.plan_id) === "confirmed").length;
    const reached = spans.length > 0 && confirmedSpans === spans.length;
    return { gateId: g.id, totalSpans: spans.length, confirmedSpans, reached };
  });
}

export interface RoadmapRecord {
  planId: string;
  file: string;
  roadmap: Roadmap;
  errors: string[];
}

/** docs/plans/ から `roadmap:` block を持つ登録工程表を全 load。 */
export function loadRoadmaps(repoRoot: string = process.cwd()): RoadmapRecord[] {
  const dir = join(repoRoot, "docs", "plans");
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const records: RoadmapRecord[] = [];
  for (const f of files) {
    const content = readFileSync(join(dir, f), "utf8");
    const { roadmap, errors } = parseRoadmap(content);
    if (roadmap) {
      records.push({
        planId: fmValue(content, "plan_id") ?? f.replace(/\.md$/, ""),
        file: `docs/plans/${f}`,
        roadmap,
        errors,
      });
    }
  }
  return records;
}
