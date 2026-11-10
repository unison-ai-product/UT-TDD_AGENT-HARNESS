import type { LintResult } from "../plan/lint.ts";

export interface ClaudeVersionFloorCheckDeps {
  readPathClaudeVersion?: () => string | null;
}

export function checkClaudeVersionFloor(_deps: ClaudeVersionFloorCheckDeps = {}): LintResult {
  return {
    ok: false,
    messages: ["doctor: claude-version-floor — violation: stub"],
  };
}
