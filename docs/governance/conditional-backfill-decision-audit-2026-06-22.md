# Conditional Backfill Decision Audit (2026-06-22)

This audit records active `refactor`, `retrofit`, and `troubleshoot` PLANs that
do not have a Reverse PLAN back-fill and do not declare an explicit
`backprop_decision: not_required`.

From 2026-06-22 onward, new or updated conditional-kind PLANs are guarded by the
`backfill-pairing` reason `conditionalDecisionMissing`: a PLAN must either be
back-filled by a Reverse PLAN, or declare `backprop_decision: not_required` with
`backprop_decision_reason` explaining why no requirements/design/test-design
backprop is needed.

Legacy entries below remain visible debt until each entry is either:

- paired with a Reverse PLAN that routes the contract/design/test backprop;
- updated with `backprop_decision: not_required` plus a concrete reason; or
- reclassified if the original kind was incorrect.

## Legacy Debt

| PLAN | kind | observed issue |
|---|---|---|
| PLAN-L7-05-biome-debt | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-68-provider-dispatch-portability | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-69-encoding-corruption-expanded-guard | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-73-claude-native-semver-resolution | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-74-task-risk-whole-word-match | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-76-review-remediation-reliability | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-77-codex-stdin-prompt-dispatch | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-78-claude-stdin-prompt-dispatch | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-79-mcp-launcher-argv-tokenization | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-80-session-digest-event-watermark | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-81-codex-wrapper-parity-gate | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-83-handover-drift-and-accumulation | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-85-review-readonly-guard | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-86-merged-plan-status-deliverable-scope | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-87-merged-plan-status-kind-independent | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-88-handover-summary-injection-cap | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-89-plan-errata-supersession-gate | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-90-ci-readability-gitignored-artifact | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-91-hollow-deliverable-detection | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-92-plan-body-substance-gate | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-93-plan-completion-drift-gate | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-95-lint-wiring-meta-gate | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-96-screen-db-projection | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-98-handover-outstanding-reconciliation | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-99-sub-doc-catalog-drift-gate | refactor | No Reverse link or no-backprop decision recorded. |
| PLAN-L7-100-standard-deliverable-section-structure | troubleshoot | No Reverse link or no-backprop decision recorded. |

## Resolution (2026-06-24)

25 of the 26 legacy entries above were dispositioned by recording
`backprop_decision: not_required` plus a concrete reason in each PLAN: every one
is internal harness self-application tooling (lint gate / runtime dispatch /
guard / governance mechanism) that hardens the harness's own enforcement and
does not change the product's external requirement / design / test-design
contract, so there is no upstream backprop target. After this, the
`backfill-pairing` advisory `conditional kind may require Reverse` no longer
lists them.

The remaining entry, `PLAN-L7-96-screen-db-projection`, is intentionally left
open here: it belongs to the central-UI / screen work slated for discard and
requirements re-issue, and is resolved under that effort (archive removes it
from the active-plan scan).

The table rows are retained so the `legacyAuditGaps` allowlist↔audit sync check
stays green; they record historical baseline, not open debt.

## Current Remediation

`src/lint/backfill-pairing.ts` treats the table above as the legacy baseline and
fails any new conditional-kind PLAN without either Reverse back-fill or an
explicit no-backprop decision.
