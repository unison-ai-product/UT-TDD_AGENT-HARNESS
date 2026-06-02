/**
 * session-log — セッションログ + PLAN 単位ダイジェスト圧縮 (fail-OPEN)。
 *
 * 設計 (①): docs/design/harness/L6-function-design/session-log.md (PLAN-L6-03 add-design)。
 * テスト設計 (③): docs/test-design/harness/L7-unit-test-design.md §1.5 U-SLOG-001〜005。
 * PLAN: PLAN-L7-01-session-log (add-impl)。
 *
 * agent-guard と同じ hook shim + 純粋関数分離パターン。ただし **fail-OPEN** (常に 0、
 * never throws)。ログがワークフローを止めてはならない。判定本体は本ファイル、hook entry は
 * .claude/hooks/session-log.ts。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type SessionEventType =
  | "session_start"
  | "tool_use"
  | "commit"
  | "plan_switch"
  | "session_end";

export interface SessionEvent {
  ts: string; // ISO8601 (hook 受領時)
  session_id: string;
  plan_id: string | null;
  event_type: SessionEventType;
  tool?: string;
  target?: string; // path / 要約のみ (sanitize 済、値・引数は載せない)
  outcome?: "ok" | "error";
}

export interface PlanDigest {
  plan_id: string;
  sessions: string[];
  event_counts: Partial<Record<SessionEventType, number>>;
  files_touched: string[];
  commits: string[];
  failures: { ts: string; summary: string }[];
  updated_at: string;
}

export interface SessionHookInput {
  hook_event_name?: string;
  session_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
}

/** I/O・clock・branch を注入 (compressPlanDigest 以外も test 可能、now 注入で決定論)。 */
export interface SessionLogDeps {
  repoRoot: string;
  now: () => string;
  appendLine: (path: string, line: string) => void;
  readText: (path: string) => string | null;
  writeText: (path: string, content: string) => void;
  currentBranch: () => string | null;
}

const BRANCH_PLAN_RE = /^(?:add|design|feature|reverse|hotfix|poc|refactor)\/(.+)$/;
// token/key/secret/password 様の `name=value` / `name: value` を値マスク
const SECRET_RE =
  /\b([A-Za-z0-9_-]*(?:token|key|secret|password|passwd|pwd|bearer)[A-Za-z0-9_-]*\s*[=:]\s*)\S+/gi;
const MAX_SUMMARY = 120;

/** 禁則 (token/key/secret 様) をマスクし 120 文字へ truncate。durable digest への漏洩防止。 */
export function sanitize(raw: string | undefined): string {
  if (!raw) return "";
  const masked = raw.replace(SECRET_RE, "$1***");
  return masked.length > MAX_SUMMARY ? `${masked.slice(0, MAX_SUMMARY - 1)}…` : masked;
}

/** ツール名 + 対象 path のみ。引数値・ファイル内容は載せない。 */
export function summarize(input: SessionHookInput): string {
  const tool = input.tool_name ?? "";
  const ti = input.tool_input ?? {};
  const path = (ti.file_path ?? ti.path ?? ti.notebook_path) as string | undefined;
  const hint = path ? String(path) : tool === "Bash" ? "(bash)" : "";
  return sanitize(`${tool} ${hint}`.trim());
}

function isPath(s: string): boolean {
  return s.includes("/") || s.includes("\\");
}

/** session_id / plan_id を file 名に使う前に path 分離子を除去 (traversal 防止)。 */
function safeName(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]/g, "_");
}

function outcomeOf(input: SessionHookInput): "ok" | "error" | undefined {
  const r = input.tool_response as { outcome?: string } | undefined;
  if (r?.outcome === "error") return "error";
  if (r?.outcome === "ok") return "ok";
  return undefined;
}

function emptyDigest(planId: string): PlanDigest {
  return {
    plan_id: planId,
    sessions: [],
    event_counts: {},
    files_touched: [],
    commits: [],
    failures: [],
    updated_at: "",
  };
}

/**
 * U-SLOG-001: state ファイル優先 → branch fallback → 解決不能は null。throw しない。
 */
export function resolveActivePlan(deps: SessionLogDeps): string | null {
  const stateFile = join(deps.repoRoot, ".ut-tdd", "state", "current-plan");
  const fromState = deps.readText(stateFile);
  if (fromState && fromState.trim()) return fromState.trim();
  const branch = deps.currentBranch();
  const m = branch?.match(BRANCH_PLAN_RE);
  return m ? m[1] : null;
}

/**
 * U-SLOG-002: session jsonl へ 1 行 append。**never throws (fail-open)**。
 */
export function recordEvent(ev: SessionEvent, deps: SessionLogDeps): void {
  try {
    const file = join(
      deps.repoRoot,
      ".ut-tdd",
      "logs",
      "session",
      `${safeName(ev.session_id)}.jsonl`,
    );
    deps.appendLine(file, JSON.stringify(ev));
  } catch {
    // fail-open: ログ失敗で作業を止めない
  }
}

/**
 * U-SLOG-003: 純関数。session-guard で同一 (plan, session) 再適用に idempotent。
 * updated_at は max(prev, events) で巻き戻り禁止。failures は ts キーで dedupe。
 */
export function compressPlanDigest(
  events: SessionEvent[],
  planId: string,
  prev?: PlanDigest,
): PlanDigest {
  const base = prev ? structuredClone(prev) : emptyDigest(planId);
  const folded = new Set(base.sessions);
  const files = new Set(base.files_touched);
  const commits = new Set(base.commits);
  const failByTs = new Map(base.failures.map((f) => [f.ts, f]));
  const tsList: string[] = base.updated_at ? [base.updated_at] : [];

  for (const ev of events) {
    if (ev.plan_id !== planId) continue;
    tsList.push(ev.ts);
    if (folded.has(ev.session_id)) continue; // 既に畳んだ session = 再計上しない
    base.event_counts[ev.event_type] = (base.event_counts[ev.event_type] ?? 0) + 1;
    if (ev.target && isPath(ev.target)) files.add(ev.target);
    if (ev.event_type === "commit" && ev.target) commits.add(ev.target);
    if (ev.outcome === "error") failByTs.set(ev.ts, { ts: ev.ts, summary: sanitize(ev.target) });
  }
  for (const ev of events) if (ev.plan_id === planId) folded.add(ev.session_id);

  base.sessions = [...folded];
  base.files_touched = [...files];
  base.commits = [...commits];
  base.failures = [...failByTs.values()].sort((a, b) => a.ts.localeCompare(b.ts));
  base.updated_at = tsList.length ? tsList.reduce((a, b) => (a > b ? a : b)) : "";
  return base;
}

/** U-SLOG-005: session_start を append。常に 0 (fail-open)。 */
export function onSessionStart(input: SessionHookInput, deps: SessionLogDeps): number {
  try {
    recordEvent(
      {
        ts: deps.now(),
        session_id: input.session_id ?? "unknown",
        plan_id: resolveActivePlan(deps),
        event_type: "session_start",
      },
      deps,
    );
  } catch {
    /* fail-open */
  }
  return 0;
}

/** tool_use (git commit は commit) を append。常に 0 (fail-open)。 */
export function onPostToolUse(input: SessionHookInput, deps: SessionLogDeps): number {
  try {
    const cmd = String((input.tool_input as { command?: unknown })?.command ?? "");
    const isCommit = input.tool_name === "Bash" && /git\s+commit/.test(cmd);
    recordEvent(
      {
        ts: deps.now(),
        session_id: input.session_id ?? "unknown",
        plan_id: resolveActivePlan(deps),
        event_type: isCommit ? "commit" : "tool_use",
        tool: input.tool_name,
        // commit は hash 未取得 (取得可能時のみ commits へ。"Bash (bash)" 汚染を防ぐ、I-2)
        target: isCommit ? undefined : summarize(input),
        outcome: outcomeOf(input),
      },
      deps,
    );
  } catch {
    /* fail-open */
  }
  return 0;
}

/**
 * U-SLOG-004: session の events を plan 別に compress し digest を更新。
 * plan_id=null のみの session は digest を書かない。常に 0 (fail-open)。
 */
export function onStop(input: SessionHookInput, deps: SessionLogDeps): number {
  try {
    const sid = input.session_id ?? "unknown";
    const file = join(deps.repoRoot, ".ut-tdd", "logs", "session", `${safeName(sid)}.jsonl`);
    const raw = deps.readText(file);
    if (!raw) return 0;
    const events: SessionEvent[] = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line) as SessionEvent);
      } catch {
        /* 壊れた行は skip (fail-open) */
      }
    }
    const plans = new Set(
      events.map((e) => e.plan_id).filter((p): p is string => p !== null && p !== undefined),
    );
    for (const planId of plans) {
      const digestFile = join(
        deps.repoRoot,
        ".ut-tdd",
        "logs",
        "plan",
        `${safeName(planId)}.digest.json`,
      );
      const prevRaw = deps.readText(digestFile);
      let prev: PlanDigest | undefined;
      if (prevRaw) {
        try {
          prev = JSON.parse(prevRaw) as PlanDigest;
        } catch {
          prev = undefined;
        }
      }
      deps.writeText(digestFile, JSON.stringify(compressPlanDigest(events, planId, prev), null, 2));
    }
  } catch {
    /* fail-open */
  }
  return 0;
}

/** hook_event_name (正) / argv variant (fallback) で handler を選ぶ。常に 0。 */
export function dispatch(
  input: SessionHookInput,
  deps: SessionLogDeps,
  argvVariant?: string,
): number {
  const ev = input.hook_event_name ?? argvVariant ?? "";
  if (ev === "SessionStart" || ev === "start") return onSessionStart(input, deps);
  if (ev === "Stop" || ev === "stop") return onStop(input, deps);
  return onPostToolUse(input, deps); // default = PostToolUse
}

/** hook entry 用の実 I/O deps (fail-open: I/O 例外は呼び出し側 try/catch が握る)。 */
export function nodeDeps(repoRoot: string, gitBranch: () => string | null): SessionLogDeps {
  return {
    repoRoot,
    now: () => new Date().toISOString(),
    appendLine: (path, line) => {
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, `${line}\n`, "utf8");
    },
    readText: (path) => (existsSync(path) ? readFileSync(path, "utf8") : null),
    writeText: (path, content) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, "utf8");
    },
    currentBranch: gitBranch,
  };
}
