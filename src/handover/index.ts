/**
 * handover — session-log PLAN digest → handover 生成。
 *   ① 機械ポインタ `.ut-tdd/handover/CURRENT.json` (今どこ、機械可読 SSoT)
 *   ② チーム記録 `docs/handover/session-handover-<date>.md` (次どう、人間判断 scaffold)
 *
 * 設計 (①): docs/design/harness/L6-function-design/handover-mechanism.md (PLAN-L6-06 add-design)。
 * テスト設計 (③): docs/test-design/harness/L7-unit-test-design.md §1.8 U-HOVER-001〜007。
 * PLAN: PLAN-L7-04-handover-mechanism (add-impl)。
 *
 * 設計判断: 機械が答えられる「今どこ」(CURRENT.json) と 人間が書く「次どう」(markdown ③-⑥) を
 * 型で分離し、AI が Next Action を捏造しない。current-plan 活性化 (Gap B) の writer は循環 import
 * 回避のため session-log.ts に置き、本 module は import 再利用する (PLAN §1.1)。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  inferPlanFromCommit,
  nodeDeps,
  type PlanDigest,
  resolveActivePlan,
  type SessionLogDeps,
  sanitize,
  setActivePlan,
} from "../runtime/session-log";

// Gap B 活性化 API を handover 表層からも再 export (CLI が import するため)。
export { inferPlanFromCommit, resolveActivePlan, setActivePlan };

export type HandoverStatus = "in_progress" | "completed";

/** .ut-tdd/logs/plan/<id>.digest.json の読取 subset (session-log PlanDigest 互換)。 */
export type PlanDigestRef = Pick<
  PlanDigest,
  "plan_id" | "sessions" | "commits" | "files_touched" | "failures" | "updated_at"
>;

/** .ut-tdd/handover/CURRENT.json — 機械ポインタ (gitignored、単一 SSoT)。 */
export interface HandoverPointer {
  active_plan: string | null;
  status: HandoverStatus;
  latest_doc: string | null;
  digest_summary: { commits: number; files: number; failures: number } | null;
  updated_at: string;
}

/** markdown 1 entry の論理内容 (③-⑥ は human placeholder)。 */
export interface HandoverDoc {
  date: string;
  plans: { plan_id: string; kind: string; summary: string }[];
  deliverables: { plan_id: string; commits: string[]; files: string[] }[];
  next_actions: string[];
  carry: string[];
  po_decisions: string[];
  do_not_break: string[];
}

export interface PlanMeta {
  plan_id: string;
  kind: string;
  title: string;
}

export interface HandoverScope {
  active_plan: string | null;
  digests: PlanDigestRef[];
}

export interface HandoverArgs {
  date: string;
  dryRun?: boolean;
  complete?: boolean;
  planId?: string;
  /** IMP-048: true なら §1-§2 を active plan family の digest のみへ絞る (multi-plan ノイズ低減)。 */
  scopeToActive?: boolean;
}

export interface HandoverResult {
  content: string;
  pointer: HandoverPointer;
  written: string[];
}

/** I/O・clock 注入 (session-log / setup の deps パターン踏襲)。 */
export interface HandoverDeps {
  repoRoot: string;
  now: () => string;
  readText: (path: string) => string | null;
  writeText: (path: string, content: string) => void;
  listDir: (dir: string) => string[]; // handover は走査が責務 = 必須 (session-log の optional と異なる)
}

const HANDOVER_DIR = join(".ut-tdd", "handover");
const POINTER_PATH = join(HANDOVER_DIR, "CURRENT.json");
const PLAN_DIGEST_DIR = join(".ut-tdd", "logs", "plan");

/** resolveHandoverScope の絞り込みオプション (IMP-048、後方互換: 無指定は dedup のみ)。 */
export interface HandoverScopeOpts {
  /** active_plan が解決できたとき、同 family (bare ⊂ slug) の digest のみへ絞る。 */
  scopeToActive?: boolean;
}

/**
 * IMP-048: bare plan_id (`PLAN-L7-04`) を slug 付き正本 (`PLAN-L7-04-handover-mechanism`) へ畳む。
 * `a` が `b` の `-` 境界 prefix なら同一 family。bare は inferPlanFromCommit が commit から拾う変種で、
 * 同じ PLAN を `unknown` ゴーストとして二重計上していた (session-2 handover で実証)。
 * 対称 (sameFamilyPlan(a,b) === sameFamilyPlan(b,a))。呼び出し側は引数順を意識しなくてよい。
 */
export function sameFamilyPlan(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return long.startsWith(`${short}-`);
}

/** family ごとに最長 (= 最も具体的な slug) を正本 id とし digest を union 集約する。 */
export function dedupeDigests(raw: PlanDigestRef[]): PlanDigestRef[] {
  const groups: PlanDigestRef[][] = [];
  for (const d of raw) {
    const g = groups.find((grp) => grp.some((x) => sameFamilyPlan(x.plan_id, d.plan_id)));
    if (g) g.push(d);
    else groups.push([d]);
  }
  // 推移的マージ (I-1): bare 無しで slug 2 種が来ると初回 grouping では別 group になりうる
  // (例 `-a` と `-b` は family 否定)。listDir の順序非依存にするため group 同士を収束まで結合。
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (groups[i].some((x) => groups[j].some((y) => sameFamilyPlan(x.plan_id, y.plan_id)))) {
          groups[i].push(...groups[j]);
          groups.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  // string はそのまま、failures (object) は固定順フィールド列挙でキー化 (M-1: プロパティ順非依存)。
  const keyOf = (x: unknown): string =>
    typeof x === "string"
      ? x
      : JSON.stringify([(x as { ts?: string }).ts, (x as { summary?: string }).summary]);
  const uniq = <T>(xs: T[]): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const x of xs) {
      const k = keyOf(x);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(x);
    }
    return out;
  };
  return groups.map((grp) => {
    const canonical = grp.reduce((a, b) => (b.plan_id.length > a.plan_id.length ? b : a));
    return {
      plan_id: canonical.plan_id,
      sessions: uniq(grp.flatMap((d) => d.sessions ?? [])),
      commits: uniq(grp.flatMap((d) => d.commits ?? [])),
      files_touched: uniq(grp.flatMap((d) => d.files_touched ?? [])),
      failures: uniq(grp.flatMap((d) => d.failures ?? [])),
      updated_at: grp.reduce((a, b) => (b.updated_at > a.updated_at ? b : a)).updated_at,
    };
  });
}

/**
 * U-HOVER-001: current-plan + 直近 digest 群から対象 PLAN・digest を集める。never throws。
 * resolveActivePlan (session-log) を current-plan 解決に再利用 (state→branch→null)。
 * IMP-048: 収集後は常に dedup (bare/slug ゴースト除去)。opts.scopeToActive で active family へ絞る。
 */
export function resolveHandoverScope(
  deps: HandoverDeps,
  opts: HandoverScopeOpts = {},
): HandoverScope {
  let active_plan: string | null = null;
  try {
    // resolveActivePlan は SessionLogDeps を要求するが readText/repoRoot のみ使う経路。
    active_plan = resolveActivePlan(toSessionDeps(deps));
  } catch {
    active_plan = null;
  }
  const raw: PlanDigestRef[] = [];
  try {
    const dir = join(deps.repoRoot, PLAN_DIGEST_DIR);
    for (const name of deps.listDir(dir)) {
      if (!name.endsWith(".digest.json")) continue;
      const text = deps.readText(join(dir, name));
      if (!text) continue;
      try {
        const d = JSON.parse(text) as PlanDigestRef;
        if (d?.plan_id) raw.push(d);
      } catch {
        // 壊れ JSON は skip (fail-open)
      }
    }
  } catch {
    // listDir 失敗等 → digests は空のまま
  }
  let digests = dedupeDigests(raw);
  if (opts.scopeToActive && active_plan) {
    const ap = active_plan;
    const scoped = digests.filter((d) => sameFamilyPlan(d.plan_id, ap));
    // active family が digest に無い場合は全件にフォールバック (空 handover を避ける)。
    if (scoped.length > 0) digests = scoped;
  }
  return { active_plan, digests };
}

/**
 * U-HOVER-002: 純関数。digest_summary は digests 非空なら active_plan の null/非 null に関わらず集計、
 * 空のときのみ null。digest_summary=null は「digest 不在」を意味し active_plan 未設定とは独立。
 */
export function buildPointer(
  scope: HandoverScope,
  latestDoc: string | null,
  status: HandoverStatus,
  now: string,
): HandoverPointer {
  const digest_summary =
    scope.digests.length > 0
      ? {
          commits: scope.digests.reduce((n, d) => n + (d.commits?.length ?? 0), 0),
          files: scope.digests.reduce((n, d) => n + (d.files_touched?.length ?? 0), 0),
          failures: scope.digests.reduce((n, d) => n + (d.failures?.length ?? 0), 0),
        }
      : null;
  return {
    active_plan: scope.active_plan,
    status,
    latest_doc: latestDoc,
    digest_summary,
    updated_at: now,
  };
}

/**
 * U-HOVER-003: 純関数。digest → deliverables / planMeta → plans.summary。
 * ③-⑥ (next_actions/carry/po_decisions/do_not_break) は空配列 = human 記入のため scaffold しない。
 */
export function scaffoldFromDigests(
  digests: PlanDigestRef[],
  planMeta: PlanMeta[],
  date: string,
): HandoverDoc {
  const metaById = new Map(planMeta.map((m) => [m.plan_id, m]));
  return {
    date,
    plans: digests.map((d) => {
      const m = metaById.get(d.plan_id);
      return {
        plan_id: d.plan_id,
        kind: m?.kind ?? "unknown",
        summary: m?.title ?? d.plan_id,
      };
    }),
    deliverables: digests.map((d) => ({
      plan_id: d.plan_id,
      commits: d.commits ?? [],
      files: d.files_touched ?? [],
    })),
    next_actions: [],
    carry: [],
    po_decisions: [],
    do_not_break: [],
  };
}

const TODO = (s: string): string => `<!-- TODO(human): ${s} -->`;

/**
 * U-HOVER-004: 純関数。§6.8.5 の 6 セクション markdown を render。③-⑥ は TODO placeholder。
 * 自由テキスト (summary / deliverables) に sanitize を再適用 (defense-in-depth、tracked md への流出ゼロ)。
 */
export function renderHandoverScaffold(doc: HandoverDoc): string {
  const lines: string[] = [];
  lines.push(`# Session Handover — ${doc.date}`, "");
  lines.push("## §1 PLAN サマリ", "");
  if (doc.plans.length === 0) lines.push("- (digest なし)");
  for (const p of doc.plans) {
    lines.push(`- \`${sanitize(p.plan_id)}\` (${sanitize(p.kind)}): ${sanitize(p.summary)}`);
  }
  lines.push("", "## §2 成果物 (commit / files)", "");
  if (doc.deliverables.length === 0) lines.push("- (なし)");
  for (const d of doc.deliverables) {
    lines.push(`- \`${sanitize(d.plan_id)}\``);
    for (const c of d.commits) lines.push(`  - commit: ${sanitize(c)}`);
    for (const f of d.files) lines.push(`  - file: ${sanitize(f)}`);
  }
  lines.push("", "## §3 Next Action", "", TODO("順序付き次手"), "");
  lines.push("## §4 carry (未了・先送り)", "", TODO("carry"), "");
  lines.push("## §5 未了 PO 判断", "", TODO("escalation"), "");
  lines.push("## §6 壊さない / 再発させない", "", TODO("壊さない注意"), "");
  return lines.join("\n");
}

/**
 * U-HOVER-005: 純関数。updated_at が maxHours を超えたら stale。
 * precondition: ISO8601 (Date.parse 可)。数値差分判定 (辞書順比較でない)。境界 (=maxHours) は stale でない。
 */
export function handoverStale(updated_at: string | null, now: string, maxHours = 24): boolean {
  if (!updated_at) return true;
  const u = Date.parse(updated_at);
  const n = Date.parse(now);
  if (Number.isNaN(u) || Number.isNaN(n)) return true;
  return (n - u) / 3_600_000 > maxHours;
}

/** CURRENT.json を読む (不在/壊れ → null、never throws)。 */
export function readPointer(deps: {
  repoRoot: string;
  readText: (p: string) => string | null;
}): HandoverPointer | null {
  try {
    const raw = deps.readText(join(deps.repoRoot, POINTER_PATH));
    if (!raw) return null;
    return JSON.parse(raw) as HandoverPointer;
  } catch {
    return null;
  }
}

/**
 * IMP-047: handover-on-completion 規律の機械 surface (fail-open, 純判定)。
 * PLAN 活動 (active_plan + digest あり) があるのに CURRENT.json が未生成/stale/別 plan を指す場合に
 * warning を返す。Stop-hook / plan lint / doctor が共有する。空配列 = 規律 OK。
 * 「PLAN 完了/節目なのに handover 追記なし」を agent 記憶でなく機械が surface する (§6.8.5)。
 */
export function checkHandoverDiscipline(deps: HandoverDeps, maxHours = 24): string[] {
  const warnings: string[] = [];
  const scope = resolveHandoverScope(deps);
  // 活動が無ければ規律対象外 (digest 不在 = まだ何もしていない)。
  if (!scope.active_plan || scope.digests.length === 0) return warnings;
  const pointer = readPointer(deps);
  if (!pointer) {
    warnings.push(
      `handover 未生成: active plan ${scope.active_plan} の活動があるが CURRENT.json が無い → \`ut-tdd handover\` を実行`,
    );
    return warnings;
  }
  if (handoverStale(pointer.updated_at, deps.now(), maxHours)) {
    warnings.push(
      `handover stale: CURRENT.json が ${maxHours}h 以上未更新 (active=${scope.active_plan}) → \`ut-tdd handover\` で更新`,
    );
  }
  // I-2: pointer.active_plan=null は complete=true + planId 省略時の正常形 (完了済で active 無し)。
  // drift は「別 PLAN を指している」ケースのみ問題なので非 null 時だけ判定する (null は無音で正常)。
  if (pointer.active_plan !== null && !sameFamilyPlan(pointer.active_plan, scope.active_plan)) {
    warnings.push(
      `handover ポインタ drift: CURRENT.json は ${pointer.active_plan} を指すが現 active は ${scope.active_plan} → \`ut-tdd handover\` で同期`,
    );
  }
  return warnings;
}

/** CURRENT.json を JSON 上書き (単一機械ポインタ、append しない)。 */
export function writePointer(
  pointer: HandoverPointer,
  deps: { repoRoot: string; writeText: (p: string, c: string) => void },
): void {
  deps.writeText(join(deps.repoRoot, POINTER_PATH), `${JSON.stringify(pointer, null, 2)}\n`);
}

/** docs/plans/<plan_id>.md の frontmatter から kind/title を軽量抽出 (無ければ plan_id fallback)。 */
function readPlanMeta(planId: string, deps: HandoverDeps): PlanMeta {
  const raw = deps.readText(join(deps.repoRoot, "docs", "plans", `${planId}.md`));
  if (!raw) return { plan_id: planId, kind: "unknown", title: planId };
  const kind = raw.match(/^kind:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
  const title = raw.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1]?.trim() ?? planId;
  return { plan_id: planId, kind, title };
}

/**
 * U-HOVER-007: orchestration。scope → scaffold → md 追記/新規 (dry-run は書かない) → CURRENT.json 更新。
 * complete=true → status=completed + active_plan = args.planId ?? scope.active_plan。
 * dry-run 非破壊 (written=[]) / 既存 md は追記 (上書きしない) / CURRENT.json は単一上書き。
 */
export function runHandover(args: HandoverArgs, deps: HandoverDeps): HandoverResult {
  const scope = resolveHandoverScope(deps, { scopeToActive: args.scopeToActive });
  const planMeta = scope.digests.map((d) => readPlanMeta(d.plan_id, deps));
  const doc = scaffoldFromDigests(scope.digests, planMeta, args.date);
  const content = renderHandoverScaffold(doc);

  const docRel = join("docs", "handover", `session-handover-${args.date}.md`);
  const docAbs = join(deps.repoRoot, docRel);
  const status: HandoverStatus = args.complete ? "completed" : "in_progress";
  const effectiveScope: HandoverScope = {
    active_plan: args.planId ?? scope.active_plan,
    digests: scope.digests,
  };
  const pointer = buildPointer(effectiveScope, docRel, status, deps.now());

  const written: string[] = [];
  if (!args.dryRun) {
    const existing = deps.readText(docAbs);
    const next = existing
      ? `${existing.replace(/\s*$/, "")}\n\n---\n\n${content}\n`
      : `${content}\n`;
    deps.writeText(docAbs, next);
    written.push(docRel);
    writePointer(pointer, deps);
    written.push(POINTER_PATH);
  }
  return { content, pointer, written };
}

/**
 * resolveActivePlan/setActivePlan が要求する SessionLogDeps 形へ橋渡し (readText/writeText/repoRoot のみ使用)。
 * currentBranch は null 固定 — handover scope は current-plan state のみを正本とし、branch fallback は使わない
 * (handover は branch=main の solo/main 直で動くのが主用途で branch から PLAN は読めないため、意図的)。
 */
function toSessionDeps(deps: HandoverDeps): SessionLogDeps {
  return {
    repoRoot: deps.repoRoot,
    now: deps.now,
    appendLine: () => {},
    readText: deps.readText,
    writeText: deps.writeText,
    currentBranch: () => null,
    listDir: deps.listDir,
  };
}

export function nodeHandoverDeps(repoRoot: string): HandoverDeps {
  return {
    repoRoot,
    now: () => new Date().toISOString(),
    readText: (p) => (existsSync(p) ? readFileSync(p, "utf8") : null),
    writeText: (p, c) => {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, c);
    },
    listDir: (dir) => (existsSync(dir) ? readdirSync(dir) : []),
  };
}

/** CLI `ut-tdd plan use` 用: current-plan を session-log の nodeDeps 経由で書く/clear。 */
export function setActivePlanCli(
  repoRoot: string,
  planId: string | null,
  gitBranch: () => string | null,
): void {
  setActivePlan(planId, nodeDeps(repoRoot, gitBranch));
}
