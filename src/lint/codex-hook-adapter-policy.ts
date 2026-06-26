interface CodexRequiredHook {
  id: string;
  event: string;
  matcher?: string;
  commandParts: readonly string[];
  blockOnFailure?: boolean;
}

export const CODEX_REQUIRED = [
  {
    id: "work-guard",
    event: "PreToolUse",
    matcher: "apply_patch|write_file",
    commandParts: [".claude/hooks/work-guard.ts"],
    blockOnFailure: true,
  },
  { id: "session-start", event: "SessionStart", commandParts: ["src/cli.ts", "session start"] },
  {
    id: "post-tool-use",
    event: "PostToolUse",
    matcher: "apply_patch|write_file|exec_command|local_shell",
    commandParts: ["src/cli.ts", "hook post-tool-use"],
  },
  { id: "session-summary", event: "Stop", commandParts: ["src/cli.ts", "session summary"] },
] satisfies readonly CodexRequiredHook[];

export const CODEX_NOT_APPLICABLE = [
  {
    entrypoint: "src/cli.ts hook subagent-stop",
    reason:
      "Codex に SubagentStop event が無い (codex.exe 0.128.0 の hook event は PreToolUse/PostToolUse/SessionStart/Stop/UserPromptSubmit のみ)",
  },
] as const;

export const CODEX_DEFERRED_SURFACE = [
  {
    surface: "spawn_agent / wait_agent / list_agents / close_agent / spawn_agents_on_csv",
    claude_analog: ".claude/hooks/agent-guard.ts",
    reason:
      "Codex の sub-agent ツール族は PreToolUse tool_name として実在するが、agent-guard 相当の allowlist/model 検査は別設計が必要なため PLAN-L7-139 の follow-up として繰り延べ (未ガードの既知残面)",
  },
] as const;

/** `~/.codex/` 等 global Codex 設定への参照 (repo-relative 原則違反) を検出。 */
export const CODEX_GLOBAL_RE = /(?:^|[\s"'=])(?:~|\$HOME|%USERPROFILE%)?[\\/]?\.codex[\\/]/i;
