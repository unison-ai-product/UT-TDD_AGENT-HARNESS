---
doc_type: pair-map
layer: cross-layer
executed_at_layer: L7
status: draft
issue: 1019
---

# V 字の対の対応表

この表は、設計還流 (#958) の移し先の正本である。設計文書の内容をどの検証文書へ移すかは、本表の行が一意に決める。
対の工程は `src/schema/index.ts` の `V_MODEL_PAIRS` (L1→L14、L2→L10、L3→L12、L4→L9、L5→L8、L6→L7) による。

## 状態の集計 (表 1、設計文書 67 本)

| 状態 | 件数 |
|---|---|
| 対あり | 59 |
| 節が無い | 3 |
| 文書が無い | 5 |

判定基準: 対の文書は設計文書の frontmatter の `pair_artifact` による。`pair_artifact` が無ければ「文書が無い」。
あっても、その検証文書に設計文書の名前 (拡張子なしのファイル名) が 1 度も出てこなければ「節が無い」。
名前の言及は節の存在の近似であり、節の中身が足りているかの判定ではない。

「文書が無い」5 件の内訳: README 2 本 (L2、L3: 索引)、`L3-functional/roadmap.md` (工程横断の検証ロードマップ)、
`L4-basic-design/tokens.yaml`、`L5-detailed-design/node-toolchain-provenance-registry-v1.json` (データファイル)。
索引・データ・工程横断の文書は、対を持つ設計文書ではない可能性がある。対の対象外とするかは別途判断する。

## 表 1: 設計文書と検証文書の対

| 設計文書 | 層 | 対の工程 | 対になる検証文書 | 状態 |
|---|---|---|---|---|
| `docs/design/harness/L1-requirements/business-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L1-requirements/functional-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L1-requirements/nfr.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L1-requirements/screen-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L1-requirements/technical-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md` | L1 | L14 | `docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 0 行) | 節が無い |
| `docs/design/harness/L2-screen/README.md` | L2 | L10 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L2-screen/business-flow.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L2-screen/screen-detail.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L2-screen/screen-flow.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L2-screen/screen-list.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L2-screen/ui-element.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L2-screen/wireframe.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L3-functional/README.md` | L3 | L12 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L3-functional/business-detail.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` (設計文書名の言及 7 行) | 対あり |
| `docs/design/harness/L3-functional/functional-requirements.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L3-functional/nfr-grade.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` (設計文書名の言及 7 行) | 対あり |
| `docs/design/harness/L3-functional/roadmap.md` | L3 | L12 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L3-functional/screen-functional.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` (設計文書名の言及 0 行) | 節が無い |
| `docs/design/harness/L4-basic-design/architecture.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 13 行) | 対あり |
| `docs/design/harness/L4-basic-design/data.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 11 行) | 対あり |
| `docs/design/harness/L4-basic-design/external-if.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 9 行) | 対あり |
| `docs/design/harness/L4-basic-design/function.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 14 行) | 対あり |
| `docs/design/harness/L4-basic-design/repository-placement.md` | L4 | L9 | `docs/test-design/harness/L9-repository-placement-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L4-basic-design/security.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L4-basic-design/tokens.yaml` | L4 | L9 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L4-basic-design/ui-standard.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 0 行) | 節が無い |
| `docs/design/harness/L5-detailed-design/if-detail.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` (設計文書名の言及 5 行) | 対あり |
| `docs/design/harness/L5-detailed-design/internal-processing.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` (設計文書名の言及 12 行) | 対あり |
| `docs/design/harness/L5-detailed-design/module-decomposition.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` (設計文書名の言及 7 行) | 対あり |
| `docs/design/harness/L5-detailed-design/node-toolchain-provenance-registry-v1.json` | L5 | L8 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L5-detailed-design/physical-data.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` (設計文書名の言及 10 行) | 対あり |
| `docs/design/harness/L5-detailed-design/ui-detail.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L6-function-design/agent-slots.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L6-function-design/backfill-pairing.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L6-function-design/consumer-trace-gates.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L6-function-design/context.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 9 行) | 対あり |
| `docs/design/harness/L6-function-design/cross-review-enforcement.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/descent-obligation.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L6-function-design/design-protection-diff-gate.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L6-function-design/edge-case.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 7 行) | 対あり |
| `docs/design/harness/L6-function-design/forced-stop-feedback.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/fr-unit-coverage.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 4 行) | 対あり |
| `docs/design/harness/L6-function-design/function-spec.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 25 行) | 対あり |
| `docs/design/harness/L6-function-design/gate-confirm.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/governance-enforcement.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/graph.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 20 行) | 対あり |
| `docs/design/harness/L6-function-design/handover-mechanism.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/memory.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 49 行) | 対あり |
| `docs/design/harness/L6-function-design/module-drift.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 15 行) | 対あり |
| `docs/design/harness/L6-function-design/oracle-test-citation-trace.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L6-function-design/plan-schedule-lint.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/release-channel-manifest.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 1 行) | 対あり |
| `docs/design/harness/L6-function-design/review-evidence-stale.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 2 行) | 対あり |
| `docs/design/harness/L6-function-design/review-evidence.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 11 行) | 対あり |
| `docs/design/harness/L6-function-design/screen-spec.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/secret.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 23 行) | 対あり |
| `docs/design/harness/L6-function-design/session-log.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 9 行) | 対あり |
| `docs/design/harness/L6-function-design/setup-solo-team.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/skill-admission.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/skill-index.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 6 行) | 対あり |
| `docs/design/harness/L6-function-design/test-before-review.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 3 行) | 対あり |
| `docs/design/harness/L6-function-design/vmodel-pair-freeze.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` (設計文書名の言及 8 行) | 対あり |

## 表 2: 工程単体の文書の置き場

設計文書と対にならない工程の文書。置き場の正本は `docs/templates/vmodel/` の各テンプレートの `disposition_target`。

| 工程 | テンプレート | 置き場 | 実在 |
|---|---|---|---|
| L0 | `docs/templates/vmodel/L0-charter.md` | `docs/design/harness/L0-planning/charter.md` | あり (#1019 で新設) |
| L10 | `docs/templates/vmodel/L10-ux-validation.md` | `docs/test-design/harness/L10-ux-validation-test-design.md` | あり |
| L11 | `docs/templates/vmodel/L11-trace-uat.md` | `docs/process/evidence/g11-uat-review-design.md` | あり |
| L13 | `docs/templates/vmodel/L13-production-observation.md` | `docs/process/evidence/g13-post-deploy-verification-design.md` | あり |

注記: `docs/design/harness/L10-ux/visual-design.md` は L2 の子の設計文書であり、置き場の移動は PLAN の退役のときに行う。
