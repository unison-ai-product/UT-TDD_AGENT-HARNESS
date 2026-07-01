# A-156 - Research/Audit Finding Route Ledger

- **date**: 2026-07-01
- **plan**: PLAN-L7-198-research-recovery-finding-routing
- **purpose**: Research/監査 finding を読了で止めず、既存 mode へ起票候補として接続する。

## Routing Contract

| finding_type | route_signal | target mode | candidate prefix | auto create | approval |
|---|---|---|---|---|---|
| `regression` | `regression_dev` | Recovery | `PLAN-RECOVERY-` | false | human required |
| `premise-gap` | `regression_dev` | Recovery | `PLAN-RECOVERY-` | false | human required |
| `deviation` | `regression_dev` | Recovery | `PLAN-RECOVERY-` | false | human required |
| `feature-gap` | `feature_addition` | Add-feature | `PLAN-L7-` | false | route policy |
| `latent-defect` | `feature_addition` | Add-feature | `PLAN-L7-` | false | route policy |
| `smell` | `code_smell` | Refactor | `PLAN-REFACTOR-` | false | route policy |

## Initial Candidates

| source | finding | type | candidate route | required payload |
|---|---|---|---|---|
| A-144-03 / A-145-03 | VER-1: green evidence integrity depended on digest restamp rather than a bound green rerun | `premise-gap` | Recovery via `regression_dev` | root cause, rerun-bound evidence guard, trace to verification gate, L14 route |
| A-144-04 / A-145-04 | DB-1: operation telemetry tables mixed runtime provenance with projection facade/hollow columns | `premise-gap` | Recovery via `regression_dev` | root cause, provenance gate/test/schema change, trace to telemetry ingestion, L14 route |

## Boundary

This ledger does not create Recovery PLANs automatically. It records routeable candidates only.
Creation still requires human approval and a PLAN that satisfies `docs/process/modes/recovery.md`
exit: root cause, concrete guard/test/rule/hook or schema change, traceable enforcement point, and L14 route.
