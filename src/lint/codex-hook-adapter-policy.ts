import { wrapperHookCommand } from "./project-hook";

interface CodexRequiredHook {
  id: string;
  event: string;
  matcher?: string;
  commandParts: readonly string[];
  wrapperCommand: string;
  blockOnFailure?: boolean;
}

interface CodexDeferredSurface {
  surface: string;
  claude_analog: string;
  reason: string;
}

// wrapper 形式 (setup 生成 .codex/hooks.json の正規形) は Claude 側 project-hook の
// wrapperCommand を構築時に共有する (単一定義源、PLAN-RECOVERY-06)。文字列複製ではなく
// import 参照なので Claude/Codex の wrapper 配線は定義上分岐できない。
export const CODEX_REQUIRED = [
  {
    id: "agent-guard",
    event: "PreToolUse",
    matcher: "spawn_agent|spawn_agents_on_csv",
    commandParts: ["node", "dist/hooks/agent-guard.mjs"],
    wrapperCommand: wrapperHookCommand("agent-guard"),
    blockOnFailure: true,
  },
  {
    id: "work-guard",
    event: "PreToolUse",
    matcher: "apply_patch|write_file",
    commandParts: ["node", "dist/hooks/work-guard.mjs"],
    wrapperCommand: wrapperHookCommand("work-guard"),
    blockOnFailure: true,
  },
  {
    id: "session-start",
    event: "SessionStart",
    commandParts: ["node", "dist/ut-tdd.mjs", "session start"],
    wrapperCommand: wrapperHookCommand("session-start"),
  },
  {
    id: "post-tool-use",
    event: "PostToolUse",
    matcher: "apply_patch|write_file|exec_command|local_shell",
    commandParts: ["node", "dist/ut-tdd.mjs", "hook post-tool-use"],
    wrapperCommand: wrapperHookCommand("post-tool-use"),
  },
  {
    id: "session-summary",
    event: "Stop",
    commandParts: ["node", "dist/ut-tdd.mjs", "session summary"],
    wrapperCommand: wrapperHookCommand("session-summary"),
  },
] satisfies readonly CodexRequiredHook[];

export const CODEX_NOT_APPLICABLE = [
  {
    entrypoint: "dist/ut-tdd.mjs hook subagent-stop",
    reason:
      "Codex に SubagentStop event が無い (codex.exe 0.128.0 の hook event は PreToolUse/PostToolUse/SessionStart/Stop/UserPromptSubmit のみ)",
  },
] as const;

export const CODEX_DEFERRED_SURFACE: readonly CodexDeferredSurface[] = [];

/** `~/.codex/` 等 global Codex 設定への参照 (repo-relative 原則違反) を検出。 */
export const CODEX_GLOBAL_RE = /(?:^|[\s"'=])(?:~|\$HOME|%USERPROFILE%)?[\\/]?\.codex[\\/]/i;
