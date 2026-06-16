# A-138 HELIX Separation Check

Date: 2026-06-16

Goal: verify that PLAN-L7-68 does not pull HELIX runtime state or legacy `helix` command dispatch back into UT-TDD-owned execution surfaces.

## Scope

Checked UT-TDD-owned runtime and test surfaces:

- `src`
- `tests`
- `docs/handover`
- `.ut-tdd/handover`
- `.ut-tdd/audit`
- active design/PLAN references touched by PLAN-L7-68

Vendor snapshots and archive docs are historical/reference material and are not product runtime.

## Findings

| Check | Result | Notes |
|---|---|---|
| Provider binary override names | pass | Runtime uses `UT_TDD_CODEX_BIN` and `UT_TDD_CLAUDE_BIN`. |
| Legacy provider override names in runtime/test/handover | pass | Narrow search over `src`, `tests`, `docs/handover`, and `.ut-tdd/handover` has zero literal hits for old provider override/raw-wrapper names. |
| Legacy raw-wrapper env coupling | pass | `adapterExecutionEnv` strips legacy raw-wrapper env names before provider execution and does not emit them. |
| `helix codex` / `helix claude` execution route in product code | pass | Remaining hits are negative fixtures for asset-drift tests or historical/design text describing forbidden residue. |
| Provider JSON vs explicit handover | pass | Provider handover packages have `handover_kind: "mechanical"`; explicit judgement is in `docs/handover/session-handover-2026-06-16.md`. |

## Evidence Commands

```powershell
rg -n "HELIX_CODEX_BIN|HELIX_CLAUDE_BIN|HELIX_ALLOW_RAW|HELIX_RAW_.*REASON" src tests docs\handover .ut-tdd\handover --glob '!vendor/**'
rg -n "\bhelix\s+(codex|claude|team|handover|plan|gate|doctor|review|code|sprint|skill)\b" src tests .claude docs\templates docs\skills --glob '!vendor/**'
```

The first command returned no matches. The second command returned only negative test fixtures and rule assertions that detect forbidden legacy command residue.

## Conclusion

HELIX remains only as historical terminology, migration context, or negative-test residue in the checked scope. PLAN-L7-68 does not depend on HELIX runtime state.
