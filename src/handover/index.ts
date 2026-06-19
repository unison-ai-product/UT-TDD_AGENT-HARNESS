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
  activePlanStale,
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
  /** IMP-078 gap①: ut-tdd handover 由来の証跡 (手書き bypass 検知)。手書き pointer は欠落。 */
  generated_by?: string;
  /** IMP-078 gap①: 生成時の markdown entry 数 (手書き追記 = 増分 mismatch 検知)。 */
  doc_entry_count?: number;
}

/** runHandover が CURRENT.json に刻む生成元署名 (手書き bypass 検知の基準値、単一正本)。 */
export const GENERATED_BY = "ut-tdd-handover";

/** handover markdown の `# Session Handover` entry 数を数える (bypass 検知の照合値)。 */
export function countHandoverEntries(md: string | null): number {
  if (!md) return 0;
  return (md.match(/^# Session Handover\b/gm) ?? []).length;
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
  /** IMP-078 gap④: 指定 session が触れた digest のみへ絞る (前 session の PLAN 混入を排除)。 */
  sessionId?: string;
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
/** current-plan marker の相対 path (PLAN-L7-83: drift reconcile 時の `written` 計上に使う)。 */
const CURRENT_PLAN_REL = join(".ut-tdd", "state", "current-plan");

/**
 * PLAN-L7-83: 同日 markdown の累積上限。runHandover は 1 件 append する前提なので、
 * append 後に entry 数がこの値を超えないよう、append 前に既存を (MAX-1) まで圧縮する。
 */
export const MAX_SAME_DAY_ENTRIES = 4;

/** resolveHandoverScope の絞り込みオプション (IMP-048、後方互換: 無指定は dedup のみ)。 */
export interface HandoverScopeOpts {
  /** active_plan が解決できたとき、同 family (bare ⊂ slug) の digest のみへ絞る。 */
  scopeToActive?: boolean;
  /** IMP-078 gap④: 指定 session が触れた digest のみへ絞る (session 横断ノイズ排除)。 */
  scopeToSession?: string;
}

/**
 * IMP-078 gap④: 直近 session_id を session jsonl 群から解決 (最新 event ts の session)。
 * handover CLI は session_id を直接受け取れないため、ログから「いま回している session」を推定する。
 * never throws (fail-open、解決不能は null)。
 */
export function latestSessionId(deps: HandoverDeps): string | null {
  try {
    const dir = join(deps.repoRoot, ".ut-tdd", "logs", "session");
    let best: { sid: string; ts: string } | null = null;
    for (const name of deps.listDir(dir)) {
      if (!name.endsWith(".jsonl")) continue;
      const text = deps.readText(join(dir, name));
      if (!text) continue;
      const lines = text.split("\n").filter((l) => l.trim());
      const last = lines[lines.length - 1];
      if (!last) continue;
      try {
        // ts は ISO8601 (nodeDeps.now が常に ISO 出力) = 辞書順比較が時系列順と一致。
        const ev = JSON.parse(last) as { ts?: string; session_id?: string };
        if (ev.ts && ev.session_id && (!best || ev.ts > best.ts)) {
          best = { sid: ev.session_id, ts: ev.ts };
        }
      } catch {
        // 壊れ行 skip
      }
    }
    return best?.sid ?? null;
  } catch {
    return null;
  }
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
  // IMP-078 gap④: session scope を最優先 (前 session の PLAN 混入を排除)。
  // 当該 session が触れた digest が無ければ全件 fallback (空 handover を避ける)。
  if (opts.scopeToSession) {
    const sid = opts.scopeToSession;
    const scoped = digests.filter((d) => d.sessions?.includes(sid));
    if (scoped.length > 0) digests = scoped;
  }
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
export interface BuildPointerInput {
  scope: HandoverScope;
  latestDoc: string | null;
  status: HandoverStatus;
  now: string;
}

export function buildPointer(input: BuildPointerInput): HandoverPointer {
  const { scope, latestDoc, status, now } = input;
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

/** render オプション (A-138 ITEM-4: 同日累積の slim 化、cross_agent TL 裏取り済)。 */
export interface HandoverRenderOpts {
  /**
   * 同日 2 件目以降のエントリで §1 PLAN サマリ / §2 成果物を「初出エントリ参照」の slim stub へ縮約する。
   * §1 は全 PLAN registry の反復が肥大の主因 (unscoped 生成時)、§2 も full file 一覧で重複するため。
   * `# Session Handover` header は 1 エントリ 1 個を維持するので `countHandoverEntries`/`doc_entry_count`
   * の bypass 検知契約は不変 (A-138 ITEM-4 で TL/Codex が header 数不変を裏取り)。§3-§6 は per-session 固有
   * のため slim 化しない。
   */
  slimSummary?: boolean;
}

/**
 * U-HOVER-004: 純関数。§6.8.5 の 6 セクション markdown を render。③-⑥ は TODO placeholder。
 * 自由テキスト (summary / deliverables) に sanitize を再適用 (defense-in-depth、tracked md への流出ゼロ)。
 * slimSummary=true のとき §1/§2 を参照 stub に縮約する (同日累積の肥大抑制、A-138 ITEM-4)。
 */
export function renderHandoverScaffold(doc: HandoverDoc, opts: HandoverRenderOpts = {}): string {
  const lines: string[] = [];
  lines.push(`# Session Handover — ${doc.date}`, "");
  lines.push("## §1 PLAN サマリ", "");
  if (opts.slimSummary) {
    lines.push(
      "- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)",
    );
  } else {
    if (doc.plans.length === 0) lines.push("- (digest なし)");
    for (const p of doc.plans) {
      lines.push(`- \`${sanitize(p.plan_id)}\` (${sanitize(p.kind)}): ${sanitize(p.summary)}`);
    }
  }
  lines.push("", "## §2 成果物 (commit / files)", "");
  if (opts.slimSummary) {
    lines.push("- (同日 first entry 参照 — 本 session の commit/file は §3 Next Action に記載)");
  } else {
    if (doc.deliverables.length === 0) lines.push("- (なし)");
    for (const d of doc.deliverables) {
      lines.push(`- \`${sanitize(d.plan_id)}\``);
      for (const c of d.commits) lines.push(`  - commit: ${sanitize(c)}`);
      for (const f of d.files) lines.push(`  - file: ${sanitize(f)}`);
    }
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

const NON_CLOSED_RESIDUAL_STATUSES = new Set(["gap", "scheduled", "parked", "po decision"]);
const NO_NEXT_ACTION_PATTERNS = [
  /\bno\s+next\s+action\b/i,
  /次に着手する作業はなし/,
  /次.*作業.*なし/,
  /未了.*なし/,
  /残(?:件|り|る)?.*なし/,
];

function normalizeStatus(raw: string): string {
  return raw.replace(/`/g, "").trim().toLowerCase();
}

function residualStatusesFromAudit(md: string | null): string[] {
  if (!md) return [];
  const statuses: string[] = [];
  let inResidualTable = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^##\s+Residual Feature Buckets\b/.test(line)) {
      inResidualTable = true;
      continue;
    }
    if (inResidualTable && /^##\s+/.test(line)) break;
    if (!inResidualTable) continue;
    if (!/^\|\s*R\d+\s*\|/.test(line)) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    const status = normalizeStatus(cells[cells.length - 2] ?? "");
    if (status) statuses.push(status);
  }
  return statuses;
}

function noNextActionLines(md: string): string[] {
  return md
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNo: index + 1 }))
    .filter(({ line }) => line && NO_NEXT_ACTION_PATTERNS.some((pattern) => pattern.test(line)))
    .map(({ line, lineNo }) => `${lineNo}: ${line}`);
}

/**
 * PLAN-L3-04: residual rows が非 closed の間は、handover の広域な
 * "no next action" 完了表現を警告する。CURRENT.json の latest_doc だけを対象にし、
 * 過去 handover の無関係な文言までは拾わない。
 */
export function checkHandoverCompletionWording(deps: HandoverDeps): string[] {
  const pointer = readPointer(deps);
  if (!pointer?.latest_doc) return [];

  const audit = deps.readText(
    join(deps.repoRoot, ".ut-tdd", "audit", "A-133-upstream-vmodel-coverage-audit.md"),
  );
  const nonClosed = residualStatusesFromAudit(audit).filter((status) =>
    NON_CLOSED_RESIDUAL_STATUSES.has(status),
  );
  if (nonClosed.length === 0) return [];

  const md = deps.readText(join(deps.repoRoot, pointer.latest_doc));
  if (!md) return [];
  const lines = noNextActionLines(md);
  if (lines.length === 0) return [];

  const summary = [...new Set(nonClosed)].sort().join(", ");
  return [
    `handover completion wording: residual rows remain non-closed (${summary}) but ${pointer.latest_doc} says no next action (${lines.join("; ")})`,
  ];
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
  // IMP-078 gap②: current-plan marker が古い → 解決した active_plan が最新作業を指していない恐れ。
  if (activePlanStale(toSessionDeps(deps), deps.now(), maxHours)) {
    warnings.push(
      `active-plan marker stale: current-plan が ${maxHours}h 以上未更新 (解決値 ${scope.active_plan} が最新作業と乖離の恐れ) → \`ut-tdd plan use <id>\` で更新`,
    );
  }
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

/**
 * docs/plans/<plan_id>.md の frontmatter から kind/title を軽量抽出 (無ければ plan_id fallback)。
 * IMP-078 gap⑤: 完全一致が無い bare id (`PLAN-L7-04`) は同 family の slug 付き正本
 * (`PLAN-L7-04-handover-mechanism.md`) を listDir で family 解決し、`(unknown)` ゴーストを防ぐ。
 */
function readPlanMeta(planId: string, deps: HandoverDeps): PlanMeta {
  const plansDir = join(deps.repoRoot, "docs", "plans");
  let raw = deps.readText(join(plansDir, `${planId}.md`));
  if (!raw) {
    const match = deps
      .listDir(plansDir)
      // basename のみ対象 (archive/ 等サブディレクトリ配下の同名 PLAN を誤解決しない、review Important)。
      .filter(
        (n) =>
          n.endsWith(".md") &&
          !n.includes("/") &&
          !n.includes("\\") &&
          sameFamilyPlan(planId, n.replace(/\.md$/, "")),
      )
      .sort((a, b) => b.length - a.length)[0]; // 最も具体的な slug を正本
    if (match) raw = deps.readText(join(plansDir, match));
  }
  if (!raw) return { plan_id: planId, kind: "unknown", title: planId };
  const kind = raw.match(/^kind:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
  const title = raw.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1]?.trim() ?? planId;
  return { plan_id: planId, kind, title };
}

/**
 * IMP-078 gap①: handover が `ut-tdd handover` 機構を経ず手書き bypass されたかを検知 (fail-open, 純判定)。
 * checkHandoverDiscipline (presence/stale/drift) と責務分離し、bypass のみを surface する。
 * ① CURRENT.json が generated_by 署名を持たない = 手書き pointer / ② latest_doc の entry 数が
 * pointer.doc_entry_count を超える = 機構を経ない手書き追記。pointer 不在は対象外 (discipline が担う)。
 * **検知範囲 (意図的な部分検知)**: entry **数**の増加のみを見る。既存 entry の §3-§6 **内容書換え**は
 * 検知対象外 (md hash 化は durable noise が大きいため不採用)。完全検知でない点は将来拡張の余地。
 */
export function checkHandoverBypass(deps: HandoverDeps): string[] {
  const warnings: string[] = [];
  const pointer = readPointer(deps);
  if (!pointer) return warnings; // 不在は checkHandoverDiscipline の「未生成」が担当
  if (pointer.generated_by !== GENERATED_BY) {
    warnings.push(
      "handover bypass: CURRENT.json が ut-tdd handover 由来でない (手書き) → `ut-tdd handover` で生成し直す",
    );
    return warnings; // 手書き pointer の doc_entry_count は信頼できないので entry 照合は skip
  }
  if (pointer.latest_doc) {
    const md = deps.readText(join(deps.repoRoot, pointer.latest_doc));
    if (md && countHandoverEntries(md) > (pointer.doc_entry_count ?? 0)) {
      warnings.push(
        `handover bypass: ${pointer.latest_doc} が手書き追記されている (entry 数 mismatch) → \`ut-tdd handover\` で再生成`,
      );
    }
  }
  return warnings;
}

/**
 * U-HOVER-014: 同日 markdown の累積上限化 (純関数、PLAN-L7-83)。
 * runHandover が 1 件 append する前提で、append 後に `# Session Handover` entry 数が
 * `maxEntries` を超えないよう既存を `(maxEntries-1)` まで圧縮する。A-138 の「1 ファイル 1
 * registry anchor」を尊重し、**anchor (entry[0]、full §1) + 直近 (maxEntries-2) entry を残し、
 * 中間 entry を 1 行 breadcrumb へ畳む** (剪定分は git 履歴に全保全 = no silent cap)。
 * breadcrumb は `# Session Handover` に一致しないので `countHandoverEntries`/`doc_entry_count`
 * の bypass 検知契約は不変。圧縮不要 (entry 数 ≤ maxEntries-1 / header 不在) は入力をそのまま返す。
 * **idempotent**: 過去の prune で挿入した breadcrumb は再 prune 前に除去する。さもないと breadcrumb が
 * 保持 anchor (entry[0]) の slice 末尾へ吸収され、同日反復 handover で breadcrumb が線形累積する
 * (cross_agent review 指摘、PLAN-L7-83)。
 */
export function boundSameDayEntries(md: string, maxEntries: number): string {
  // entry 数 (= header 数) が上限内なら圧縮不要 = 入力不変 (breadcrumb 除去もしない)。
  if (countHandoverEntries(md) <= maxEntries - 1) return md;
  // 既存 breadcrumb (+ その直前 separator) を除去してから再 prune (idempotent、累積防止)。
  const stripped = md.replace(/\n+---\n+<!-- ut-tdd handover:[^\n]*-->/g, "");
  const positions: number[] = [];
  const re = /^# Session Handover\b/gm;
  let m: RegExpExecArray | null = re.exec(stripped);
  while (m !== null) {
    positions.push(m.index);
    m = re.exec(stripped);
  }
  const count = positions.length;
  const entries = positions.map((p, i) =>
    stripped
      .slice(p, i + 1 < positions.length ? positions[i + 1] : stripped.length)
      .replace(/\s*$/, ""),
  );
  const keepRecent = Math.max(0, maxEntries - 2);
  const retain = new Set<number>([0]);
  for (let i = count - keepRecent; i < count; i++) if (i > 0) retain.add(i);
  const preamble = positions[0] > 0 ? stripped.slice(0, positions[0]).replace(/\s*$/, "") : "";
  const prunedCount = count - retain.size;
  const parts: string[] = [];
  if (preamble) parts.push(preamble);
  let breadcrumbInserted = false;
  for (let i = 0; i < count; i++) {
    if (retain.has(i)) {
      parts.push(entries[i]);
    } else if (!breadcrumbInserted) {
      parts.push(
        `<!-- ut-tdd handover: ${prunedCount} 件の同日中間エントリを累積抑制のため剪定 (git 履歴に保全) -->`,
      );
      breadcrumbInserted = true;
    }
  }
  return `${parts.join("\n\n---\n\n")}\n`;
}

/**
 * U-HOVER-007: orchestration。scope → scaffold → md 追記/新規 (dry-run は書かない) → CURRENT.json 更新。
 * complete=true → status=completed + active_plan = args.planId ?? scope.active_plan。
 * dry-run 非破壊 (written=[]) / 既存 md は追記 (上書きしない) / CURRENT.json は単一上書き。
 * PLAN-L7-83: append 前に boundSameDayEntries で同日 entry を上限へ圧縮し、書込後に current-plan
 * marker を pointer へ reconcile する (complete→clear / --plan→sync) ので drift は構造的に残らない。
 */
export function runHandover(args: HandoverArgs, deps: HandoverDeps): HandoverResult {
  const scope = resolveHandoverScope(deps, {
    scopeToActive: args.scopeToActive,
    scopeToSession: args.sessionId,
  });
  const planMeta = scope.digests.map((d) => readPlanMeta(d.plan_id, deps));
  const doc = scaffoldFromDigests(scope.digests, planMeta, args.date);

  const docRel = join("docs", "handover", `session-handover-${args.date}.md`);
  const docAbs = join(deps.repoRoot, docRel);
  const status: HandoverStatus = args.complete ? "completed" : "in_progress";
  const effectiveScope: HandoverScope = {
    active_plan: args.planId ?? scope.active_plan,
    digests: scope.digests,
  };
  // 追記後の最終 md (dryRun でも would-be 内容で entry 数を算出 = bypass 照合基準)。docAbs read は非破壊。
  // 同日 2 件目以降 (existing 非 null) は §1/§2 を slim 化して累積肥大を抑える (A-138 ITEM-4、header 数不変)。
  // PLAN-L7-83: さらに append 前に entry 数を上限へ圧縮し、同日 doc の無制限肥大を防ぐ。
  const existing = deps.readText(docAbs);
  const bounded = existing != null ? boundSameDayEntries(existing, MAX_SAME_DAY_ENTRIES) : existing;
  const content = renderHandoverScaffold(doc, { slimSummary: bounded != null });
  const next = bounded ? `${bounded.replace(/\s*$/, "")}\n\n---\n\n${content}\n` : `${content}\n`;
  // IMP-078 gap①: generated_by 署名 + entry 数を刻む (手書き bypass を checkHandoverBypass が検知できる)。
  const pointer: HandoverPointer = {
    ...buildPointer({ scope: effectiveScope, latestDoc: docRel, status, now: deps.now() }),
    generated_by: GENERATED_BY,
    doc_entry_count: countHandoverEntries(next),
  };

  const written: string[] = [];
  if (!args.dryRun) {
    deps.writeText(docAbs, next);
    written.push(docRel);
    writePointer(pointer, deps);
    written.push(POINTER_PATH);
    // PLAN-L7-83: drift 恒久解消。CURRENT.json を書いたら current-plan marker も coherent に保つ。
    // complete → marker clear (完了 = active plan 無し → resolveActivePlan→null → drift 判定対象外)。
    // --plan 明示の in_progress → marker をその plan へ同期 (override 由来の drift を防ぐ)。
    // plain in_progress (--plan 無し) は marker=scope source なので無変更 (無駄書き回避)。
    const sdeps = toSessionDeps(deps);
    if (status === "completed") {
      setActivePlan(null, sdeps);
      written.push(CURRENT_PLAN_REL);
    } else if (args.planId) {
      setActivePlan(args.planId, sdeps);
      written.push(CURRENT_PLAN_REL);
    }
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
