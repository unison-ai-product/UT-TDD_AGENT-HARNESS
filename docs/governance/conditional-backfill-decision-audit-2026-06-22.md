# Conditional backfill decision 監査 (2026-06-22)

この監査は、active な `refactor`、`retrofit`、`troubleshoot` PLAN のうち、Reverse PLAN による
back-fill がなく、かつ明示的な `backprop_decision: not_required` も宣言していないものを記録する。

2026-06-22 以降、新規または更新される conditional-kind PLAN は `backfill-pairing` reason
`conditionalDecisionMissing` で guard される。PLAN は Reverse PLAN によって back-fill されるか、
requirements/design/test-design backprop が不要な理由を `backprop_decision_reason` で説明したうえで
`backprop_decision: not_required` を宣言しなければならない。

下記の legacy entry は、各 entry が次のいずれかになるまで visible debt として残す。

- contract/design/test backprop を routing する Reverse PLAN と pair する。
- `backprop_decision: not_required` と具体的な理由を追記する。
- 元の kind が誤りだった場合は再分類する。

## Legacy debt 一覧

| PLAN | kind | 観測した問題 |
|---|---|---|
| PLAN-L7-05-biome-debt | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-68-provider-dispatch-portability | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-69-encoding-corruption-expanded-guard | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-73-claude-native-semver-resolution | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-74-task-risk-whole-word-match | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-76-review-remediation-reliability | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-77-codex-stdin-prompt-dispatch | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-78-claude-stdin-prompt-dispatch | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-79-mcp-launcher-argv-tokenization | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-80-session-digest-event-watermark | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-81-codex-wrapper-parity-gate | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-83-handover-drift-and-accumulation | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-85-review-readonly-guard | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-86-merged-plan-status-deliverable-scope | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-87-merged-plan-status-kind-independent | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-88-handover-summary-injection-cap | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-89-plan-errata-supersession-gate | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-90-ci-readability-gitignored-artifact | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-91-hollow-deliverable-detection | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-92-plan-body-substance-gate | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-93-plan-completion-drift-gate | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-95-lint-wiring-meta-gate | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-96-screen-db-projection | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-98-handover-outstanding-reconciliation | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-99-sub-doc-catalog-drift-gate | refactor | Reverse link も no-backprop decision も記録されていない。 |
| PLAN-L7-100-standard-deliverable-section-structure | troubleshoot | Reverse link も no-backprop decision も記録されていない。 |

## 解決記録 (2026-06-24)

上記 26 件の legacy entry のうち 25 件は、各 PLAN に `backprop_decision: not_required` と具体的な理由を
記録して disposition 済みである。いずれも harness 自身の self-application tooling
(lint gate / runtime dispatch / guard / governance mechanism) であり、harness の enforcement を強化するだけで、
product の外部 requirement / design / test-design contract を変更しないため、upstream backprop target は存在しない。
この処置後、`backfill-pairing` advisory `conditional kind may require Reverse` はこれらを列挙しなくなった。

残る `PLAN-L7-96-screen-db-projection` は意図的に open のまま残す。この PLAN は discard と requirements re-issue が予定された
central-UI / screen work に属しており、その作業の中で解決する。archive により active-plan scan から除外される。

表の行は `legacyAuditGaps` allowlist と audit の sync check を green に保つために残す。これは historical baseline の記録であり、
open debt の一覧ではない。

## 現在の remediation

`src/lint/backfill-pairing.ts` は上記の表を legacy baseline として扱い、Reverse back-fill または明示的な
no-backprop decision のどちらも持たない新規 conditional-kind PLAN を fail させる。
