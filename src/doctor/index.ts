/** 統合検証 doctor (requirements_v1.2 §7 / §7.8.5). scaffold stub — 検出器は後続 PLAN。 */
import { detectMode } from "../runtime/detect";
import type { LintResult } from "../plan/lint";

export function runDoctor(): LintResult {
  const d = detectMode();
  return {
    ok: true,
    messages: [
      `doctor: mode=${d.mode} (claude=${d.claude}, codex=${d.codex})`,
      "doctor: scaffold stub (横断検出 relation-graph / drift / regression は後続 PLAN)",
    ],
  };
}
