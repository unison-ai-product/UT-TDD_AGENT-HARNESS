/**
 * 実行モード検出 (requirements_v1.2 §7.1 / 構想書 §2.1.1, §2.1.2.1).
 * CLI binary (PATH) + 現在 runtime の env signal で mode を確定する。
 * config ファイル (.claude / AGENTS.md) の有無は mode 切替の主信号にしない (§7.8 注記)。
 */
import { execFileSync } from "node:child_process";

export type ExecutionMode = "standalone" | "claude-only" | "codex-only" | "hybrid";

export interface RuntimeDetection {
  mode: ExecutionMode;
  claude: boolean;
  codex: boolean;
  /** いま自分がどの runtime 内で実行されているか (env signal) */
  currentRuntime: "claude" | "codex" | null;
  availableRuntimes: string[];
  missingRuntimes: string[];
}

/** binary が PATH 上にあるか (where / which)。capability probe は将来追加。 */
function onPath(bin: string): boolean {
  const finder = process.platform === "win32" ? "where" : "which";
  try {
    execFileSync(finder, [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function detectMode(): RuntimeDetection {
  const inClaude = process.env["CLAUDECODE"] === "1";
  const inCodex = Boolean(process.env["CODEX_SANDBOX"] ?? process.env["CODEX_HOME"]);

  const claude = inClaude || onPath("claude");
  const codex = inCodex || onPath("codex");

  let mode: ExecutionMode;
  if (claude && codex) mode = "hybrid";
  else if (claude) mode = "claude-only";
  else if (codex) mode = "codex-only";
  else mode = "standalone";

  const currentRuntime: RuntimeDetection["currentRuntime"] = inClaude
    ? "claude"
    : inCodex
      ? "codex"
      : null;

  const available: string[] = [];
  const missing: string[] = [];
  (claude ? available : missing).push("claude");
  (codex ? available : missing).push("codex");

  return { mode, claude, codex, currentRuntime, availableRuntimes: available, missingRuntimes: missing };
}
