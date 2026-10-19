/**
 * handover — session-log PLAN digest → 機械ポインタ `.ut-tdd/handover/CURRENT.json` (今どこ、機械可読 SSoT)。
 * 散文 scaffold (`docs/handover/session-handover-<date>.md`) の生成は #1062 段階6 で停止した。
 *
 * 設計 (①): docs/design/harness/L6-function-design/handover-mechanism.md (PLAN-L6-06 add-design)。
 * テスト設計 (③): docs/test-design/harness/L7-unit-test-design.md §1.8 U-HOVER-001〜007。
 * PLAN: PLAN-L7-04-handover-mechanism (add-impl)。
 *
 * 設計判断: 機械が答えられる「今どこ」(CURRENT.json) だけを書く。current-plan 活性化 (Gap B) の writer は循環 import
 * 回避のため session-log.ts に置き、本 module は import 再利用する (PLAN §1.1)。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { computeOutstandingWork } from "../lint/outstanding.ts";
import {
  activePlanStale,
  inferPlanFromCommit,
  nodeDeps,
  resolveActivePlan,
  type SessionLogDeps,
  setActivePlan,
} from "../runtime/session-log.ts";
import { ensureDir } from "../shared/fs.ts";
import {
  CURRENT_PLAN_REL,
  GENERATED_BY,
  PLAN_DIGEST_DIR,
  POINTER_PATH,
} from "./handover-constants.ts";
import type {
  BuildPointerInput,
  HandoverArgs,
  HandoverDeps,
  HandoverPointer,
  HandoverResult,
  HandoverScope,
  HandoverScopeOpts,
  HandoverStatus,
  PlanDigestRef,
} from "./handover-types.ts";

export { GENERATED_BY } from "./handover-constants.ts";
export type {
  BuildPointerInput,
  HandoverArgs,
  HandoverDeps,
  HandoverPointer,
  HandoverResult,
  HandoverScope,
  HandoverScopeOpts,
  HandoverStatus,
  PlanDigestRef,
} from "./handover-types.ts";
// Gap B 活性化 API を handover 表層からも再 export (CLI が import するため)。
export { inferPlanFromCommit, resolveActivePlan, setActivePlan };

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
export function buildPointer(input: BuildPointerInput): HandoverPointer {
  const { scope, status, now } = input;
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
    digest_summary,
    updated_at: now,
  };
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
 * IMP-078 gap①: handover が `ut-tdd handover` 機構を経ず手書きされた pointer かを検知 (fail-open, 純判定)。
 * CURRENT.json が generated_by 署名を持たない = 手書き pointer を surface する。pointer 不在は対象外
 * (checkHandoverDiscipline が担当)。散文 md の entry 数照合 (`doc_entry_count`) は #1062 段階6 で撤去した
 * (L6 state-channel-consolidation §5.2)。
 */
export function checkHandoverBypass(deps: HandoverDeps): string[] {
  const pointer = readPointer(deps);
  if (!pointer || pointer.generated_by === GENERATED_BY) return [];
  return [
    "handover bypass: CURRENT.json が ut-tdd handover 由来でない (手書き) → `ut-tdd handover` で生成し直す",
  ];
}

/**
 * orchestration。scope → pointer → CURRENT.json 更新 (dry-run は書かない)。
 * 書くのは `.ut-tdd/handover/CURRENT.json` だけ (散文 scaffold の生成は #1062 段階6 で停止)。
 * complete=true → status=completed + active_plan = args.planId ?? scope.active_plan。
 * 書込後に current-plan marker を pointer へ reconcile する (complete→clear / --plan→sync) ので drift は構造的に残らない。
 */
export function runHandover(args: HandoverArgs, deps: HandoverDeps): HandoverResult {
  const scope = resolveHandoverScope(deps, {
    scopeToActive: args.scopeToActive,
    scopeToSession: args.sessionId,
  });
  const status: HandoverStatus = args.complete ? "completed" : "in_progress";
  const effectiveScope: HandoverScope = {
    active_plan: args.planId ?? scope.active_plan,
    digests: scope.digests,
  };
  // PLAN-L7-98 (Q1): 未了の正の集計を CURRENT.json へ additive 記録 (session 再開時に「完了主張」を機械照合可能に)。
  const pointer: HandoverPointer = {
    ...buildPointer({ scope: effectiveScope, status, now: deps.now() }),
    generated_by: GENERATED_BY,
    outstanding: computeOutstandingWork(deps.repoRoot),
  };

  const written: string[] = [];
  if (!args.dryRun) {
    writePointer(pointer, deps);
    written.push(POINTER_PATH);
    // PLAN-L7-83: drift 恒久解消。CURRENT.json を書いたら current-plan marker も coherent に保つ。
    // complete → marker clear、--plan 明示の in_progress → その plan へ同期、plain in_progress は無変更。
    const sdeps = toSessionDeps(deps);
    if (status === "completed") {
      setActivePlan(null, sdeps);
      written.push(CURRENT_PLAN_REL);
    } else if (args.planId) {
      setActivePlan(args.planId, sdeps);
      written.push(CURRENT_PLAN_REL);
    }
  }
  return { pointer, written };
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
      ensureDir(dirname(p), { recursive: true });
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
