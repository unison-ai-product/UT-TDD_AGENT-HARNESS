import { spawnSync } from "node:child_process";
import type { LintResult } from "../plan/lint.ts";
import { evaluateClaudeVersion } from "../runtime/claude-version-check.ts";
import { CLAUDE_CODE_VERSION_FLOOR } from "../runtime/claude-version-floor.ts";

export interface ClaudeVersionFloorCheckDeps {
  readPathClaudeVersion?: () => string | null;
}

function readPathClaudeVersion(): string | null {
  const isWindows = process.platform === "win32";
  const result = spawnSync(
    isWindows ? (process.env.ComSpec ?? "cmd.exe") : "claude",
    isWindows ? ["/d", "/s", "/c", "claude --version"] : ["--version"],
    {
      encoding: "utf8",
      timeout: 5_000,
      windowsHide: true,
    },
  );
  if (result.error || result.status !== 0) return null;
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`.match(/\b\d+\.\d+\.\d+\b/)?.[0] ?? null;
}

export function checkClaudeVersionFloor(deps: ClaudeVersionFloorCheckDeps = {}): LintResult {
  let version: string | null = null;
  try {
    version = (deps.readPathClaudeVersion ?? readPathClaudeVersion)();
  } catch {
    version = null;
  }
  const status = evaluateClaudeVersion(version);
  return {
    ok: true,
    messages:
      status === "below"
        ? [
            `doctor: claude-version-floor - WARN: PATH の claude の版 (${version}) is below ${CLAUDE_CODE_VERSION_FLOOR}; update Claude Code.`,
          ]
        : ["doctor: claude-version-floor - OK"],
  };
}
