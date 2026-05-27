/** V-model 4 artifact trace lint (requirements_v1.2 §2 / §7.6). scaffold stub — 実装は後続 PLAN。 */
import type { LintResult } from "../plan/lint";

export function lintVmodel(path?: string): LintResult {
  return {
    ok: true,
    messages: [
      `vmodel lint: scaffold stub (W-model 8 directed edge / G7 trace freeze、未実装)${path ? ` target=${path}` : ""}`,
    ],
  };
}
