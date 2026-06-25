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
      "Codex 縺ｫ SubagentStop event 縺檎┌縺・(codex.exe 0.128.0 縺ｮ hook event 縺ｯ PreToolUse/PostToolUse/SessionStart/Stop/UserPromptSubmit 縺ｮ縺ｿ)",
  },
] as const;

export const CODEX_DEFERRED_SURFACE = [
  {
    surface: "spawn_agent / wait_agent / list_agents / close_agent / spawn_agents_on_csv",
    claude_analog: ".claude/hooks/agent-guard.ts",
    reason:
      "Codex 縺ｮ sub-agent 繝・・繝ｫ譌上・ PreToolUse tool_name 縺ｨ縺励※螳溷惠縺吶ｋ縺後∥gent-guard 逶ｸ蠖薙・ allowlist/model 讀懈渊縺ｯ蛻･險ｭ險医′蠢・ｦ√↑縺溘ａ PLAN-L7-139 縺ｮ follow-up 縺ｨ縺励※郢ｰ繧雁ｻｶ縺ｹ (譛ｪ繧ｬ繝ｼ繝峨・譌｢遏･谿矩擇)",
  },
] as const;

/** `~/.codex/` 遲・global Codex 險ｭ螳壹∈縺ｮ蜿ら・ (repo-relative 蜴溷援驕募渚) 繧呈､懷・縲・*/
export const CODEX_GLOBAL_RE = /(?:^|[\s"'=])(?:~|\$HOME|%USERPROFILE%)?[\\/]?\.codex[\\/]/i;
