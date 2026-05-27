/** PLAN lint (requirements_v1.2 §1 / §7.6). scaffold stub — 実装は後続 PLAN。 */
export interface LintResult {
  ok: boolean;
  messages: string[];
}

export function lintPlan(path?: string): LintResult {
  return {
    ok: true,
    messages: [
      `plan lint: scaffold stub (未実装、ADR-001 TS rebuild)${path ? ` target=${path}` : ""}`,
    ],
  };
}
