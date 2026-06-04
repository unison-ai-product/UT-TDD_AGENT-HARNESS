/**
 * agent-slots — Layer-2 実行オーケストレーションの状態機構 (IMP-050)。
 *
 * HELIX `cli/lib/agent_slots.py` (SQLite) を ADR-001 準拠で TS-native 再実装。
 * SQLite は持ち込まず `.ut-tdd/state/agent-slots.json` (Slot[]) を単一 state とする
 * (Windows ネイティブ互換 + bun 単独実行、bash/python3 不要)。
 *
 * 用途: subagent / team member の fire→release を機械記録し、
 *   - 並列実行数の超過 warn (agent-guard 助言 / .claude/CLAUDE.md「上限 8」)
 *   - stale slot (released されず放置) の doctor surface
 *   - peak_parallel 統計
 * を提供する。IMP-049 (直列/並列判定の強制・記録) の機械支援本体。
 *
 * 全関数 fail-open (never throws): 記録の失敗でワークフローを止めない。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type SlotStatus = "running" | "completed" | "failed" | "cancelled";
export type SlotSource = "agent_guard" | "team_runner" | "manual";

export interface Slot {
  slot_id: string;
  /** subagent_type または engine 名 (例 pmo-sonnet / codex-se)。 */
  agent_kind: string;
  role: string | null;
  slot_source: SlotSource;
  fired_at: string;
  released_at: string | null;
  status: SlotStatus;
  exit_code: number | null;
}

/** I/O・clock・id 注入 (test 可能、session-log の deps パターン踏襲)。 */
export interface AgentSlotsDeps {
  repoRoot: string;
  now: () => string;
  readText: (path: string) => string | null;
  writeText: (path: string, content: string) => void;
  newId: () => string;
}

/** .claude/CLAUDE.md「依存しないタスクは並列投入、default 上限 8」と整合。 */
export const DEFAULT_MAX_PARALLEL = 8;
/** HELIX list_stale_slots と同じ既定閾値 (分)。 */
export const DEFAULT_STALE_MINUTES = 5;

const STATE_REL = join(".ut-tdd", "state", "agent-slots.json");

function statePath(repoRoot: string): string {
  return join(repoRoot, STATE_REL);
}

/** state を読む。不在/壊れ → [] (never throws)。 */
export function loadSlots(deps: AgentSlotsDeps): Slot[] {
  try {
    const raw = deps.readText(statePath(deps.repoRoot));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Slot[]) : [];
  } catch {
    return [];
  }
}

function saveSlots(slots: Slot[], deps: AgentSlotsDeps): void {
  try {
    deps.writeText(statePath(deps.repoRoot), `${JSON.stringify(slots, null, 2)}\n`);
  } catch {
    // fail-open: 記録失敗で停止しない
  }
}

/** running slot を fire し記録。返り値 = 生成した Slot。 */
export function fireSlot(
  input: { agent_kind: string; role?: string | null; slot_source: SlotSource },
  deps: AgentSlotsDeps,
): Slot {
  const slot: Slot = {
    slot_id: deps.newId(),
    agent_kind: input.agent_kind,
    role: input.role ?? null,
    slot_source: input.slot_source,
    fired_at: deps.now(),
    released_at: null,
    status: "running",
    exit_code: null,
  };
  const slots = loadSlots(deps);
  slots.push(slot);
  saveSlots(slots, deps);
  return slot;
}

/** slot を terminal status へ release。対象なし → false (idempotent)。 */
export function releaseSlot(
  slotId: string,
  status: Exclude<SlotStatus, "running">,
  exitCode: number | null,
  deps: AgentSlotsDeps,
): boolean {
  const slots = loadSlots(deps);
  const slot = slots.find((s) => s.slot_id === slotId && s.released_at === null);
  if (!slot) return false;
  slot.status = status;
  slot.exit_code = exitCode;
  slot.released_at = deps.now();
  saveSlots(slots, deps);
  return true;
}

/** running かつ未 release の slot。 */
export function listActiveSlots(deps: AgentSlotsDeps): Slot[] {
  return loadSlots(deps).filter((s) => s.status === "running" && s.released_at === null);
}

/**
 * agent_guard 由来の stale active slot (fired_at が閾値分を超過) を status=cancelled で失効。
 * 返り値 = 失効させた件数。never throws (fail-open)。
 *
 * **なぜ必要か**: Claude Code subagent には release hook が無く (agent-guard は PreToolUse のみ)、
 * `recordGuardFire` の遅延失効は「次の fire」でしか走らない。よって**セッション最後の guard slot は
 * 後続 fire が無く永久に running で残り**、doctor が毎回 stale warn を出す (release 漏れの構造原因)。
 * SessionStart でこれを呼び、前セッションの dangling slot を self-heal する
 * (forced-stop の `scanDanglingStops` と同型の後追い記録)。閾値は recordGuardFire / doctor と統一。
 */
export function sweepStaleGuardSlots(
  deps: AgentSlotsDeps,
  staleMinutes = DEFAULT_STALE_MINUTES,
): number {
  try {
    const nowIso = deps.now();
    const now = Date.parse(nowIso);
    if (Number.isNaN(now)) return 0;
    const slots = loadSlots(deps);
    let swept = 0;
    for (const s of slots) {
      // listActiveSlots と同じ AND 条件 (running && 未 release) で対象集合を一致させる (I-1)。
      if (s.slot_source !== "agent_guard" || s.status !== "running" || s.released_at !== null)
        continue;
      const fired = Date.parse(s.fired_at);
      if (Number.isNaN(fired)) continue; // fired_at が不正値の slot は触らずスキップ (corrupt 防止)
      if ((now - fired) / 60_000 > staleMinutes) {
        s.status = "cancelled";
        s.released_at = nowIso;
        s.exit_code = null;
        swept++;
      }
    }
    if (swept > 0) saveSlots(slots, deps);
    return swept;
  } catch {
    return 0;
  }
}

/** active かつ fired_at が閾値 (分) を超えて放置されている slot (stale)。 */
export function listStaleSlots(
  deps: AgentSlotsDeps,
  thresholdMinutes = DEFAULT_STALE_MINUTES,
): Slot[] {
  const now = Date.parse(deps.now());
  if (Number.isNaN(now)) return [];
  return listActiveSlots(deps).filter((s) => {
    const fired = Date.parse(s.fired_at);
    if (Number.isNaN(fired)) return false;
    return (now - fired) / 60_000 > thresholdMinutes;
  });
}

/**
 * 与えた slot 群の同時実行ピーク数 (sweep-line)。fire=+1 / release=-1。
 * released_at が null の slot は「現在も実行中」として終端を +∞ 扱い (max まで開いたまま)。
 */
export function peakParallel(slots: Slot[]): number {
  const events: { t: number; delta: number }[] = [];
  for (const s of slots) {
    const fired = Date.parse(s.fired_at);
    if (Number.isNaN(fired)) continue;
    events.push({ t: fired, delta: 1 });
    const rel = s.released_at ? Date.parse(s.released_at) : Number.POSITIVE_INFINITY;
    events.push({ t: Number.isNaN(rel) ? Number.POSITIVE_INFINITY : rel, delta: -1 });
  }
  // 同時刻は release(-1) を fire(+1) より先に処理 (隣接区間で重複カウントしない)。
  events.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let cur = 0;
  let peak = 0;
  for (const e of events) {
    cur += e.delta;
    if (cur > peak) peak = cur;
  }
  return peak;
}

/** 並列上限超過判定 (active 数が max 以上なら超過)。agent-guard 助言に使う。 */
export function exceedsParallelLimit(deps: AgentSlotsDeps, max = DEFAULT_MAX_PARALLEL): boolean {
  return listActiveSlots(deps).length >= max;
}

/**
 * agent-guard (PreToolUse(Agent)) 助言用: subagent fire を記録し、並列超過なら warn を返す。
 * Claude Code subagent には release hook が無いため、agent_guard 由来の stale slot を
 * 先に自動失効 (status=cancelled) させて「直近 staleMinutes 以内の同時 fire 数」を近似する。
 * never throws (fail-open)。返り値: { activeCount, exceeded } (exceeded=true で warn 表示推奨)。
 */
export function recordGuardFire(
  agentKind: string,
  deps: AgentSlotsDeps,
  max = DEFAULT_MAX_PARALLEL,
  staleMinutes = DEFAULT_STALE_MINUTES,
): { activeCount: number; exceeded: boolean } {
  try {
    const nowIso = deps.now();
    const now = Date.parse(nowIso);
    // I-2: stale 失効 → 新規 fire を 1 回の load→save にまとめ lost-update 窓を閉じる。
    const slots = loadSlots(deps);
    for (const s of slots) {
      // sweepStaleGuardSlots / listActiveSlots と対象集合を一致 (running && 未 release、I-1)。
      if (s.slot_source !== "agent_guard" || s.status !== "running" || s.released_at !== null)
        continue;
      const fired = Date.parse(s.fired_at);
      if (Number.isNaN(fired) || Number.isNaN(now)) continue;
      if ((now - fired) / 60_000 > staleMinutes) {
        s.status = "cancelled";
        s.released_at = nowIso;
        s.exit_code = null;
      }
    }
    slots.push({
      slot_id: deps.newId(),
      agent_kind: agentKind,
      role: null,
      slot_source: "agent_guard",
      fired_at: nowIso,
      released_at: null,
      status: "running",
      exit_code: null,
    });
    saveSlots(slots, deps);
    const activeCount = slots.filter(
      (s) => s.slot_source === "agent_guard" && s.status === "running" && s.released_at === null,
    ).length;
    // I-1: exceedsParallelLimit (>= max) と判定を統一。上限に達したら warn。
    return { activeCount, exceeded: activeCount >= max };
  } catch {
    return { activeCount: 0, exceeded: false };
  }
}

export function nodeAgentSlotsDeps(repoRoot: string): AgentSlotsDeps {
  // M-1: idSeq を closure に閉じ込め module 状態を持たない (テスト間リセット不能を回避)。
  let idSeq = 0;
  return {
    repoRoot,
    now: () => new Date().toISOString(),
    readText: (p) => (existsSync(p) ? readFileSync(p, "utf8") : null),
    writeText: (p, c) => {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, c, "utf8");
    },
    // 単調増加 seq + ISO 時刻で衝突回避 (Math.random に依存しない)。
    newId: () => `slot-${new Date().toISOString().replace(/[^0-9]/g, "")}-${idSeq++}`,
  };
}
