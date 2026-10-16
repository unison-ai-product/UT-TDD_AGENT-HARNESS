import { analyzeWindowsHide, loadWindowsHideInput } from "../lint/windows-hide.ts";
import type { LintResult } from "../plan/lint.ts";

export function checkWindowsHide(repoRoot: string): LintResult {
  try {
    const result = analyzeWindowsHide(loadWindowsHideInput(repoRoot));
    return { ok: result.ok, messages: result.messages };
  } catch (error) {
    return {
      ok: false,
      messages: [`windows-hide - violation: required source could not be read (${String(error)})`],
    };
  }
}
