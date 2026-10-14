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
| 対あり (実在する節または検証項目を列に明記) | 57 |
| 言及のみ (節・検証項目を特定できない) | 2 |
| 節が無い | 3 |
| 文書が無い | 5 |

判定基準: 対の文書は設計文書の frontmatter の `pair_artifact` による。`pair_artifact` が無ければ「文書が無い」。
名前の言及の数は節の存在の証拠にしない。「検証文書と対応先」列には、検証文書の実在する見出し (行番号付き) か検証項目 ID (行番号付き) を書く。
見出しにも ID にもならない言及 (frontmatter、冒頭の引用、全体の列挙) は対応先に数えない。
- 対あり: 設計文書名を含む見出し、検証項目 ID の行、§5 対応表の行、§2 量閉じ一覧の項、または専用の節の中の言及のいずれかで、対応先を列に書けたもの。
- 言及のみ: 言及はあるが、frontmatter や冒頭の引用だけで節・検証項目を特定できないもの。
- 節が無い: 検証文書に設計文書の名前 (拡張子なしのファイル名) が 1 度も出てこないもの。
対応先が実在する節でも、その節の中身が足りているかの判定ではない。

「文書が無い」5 件の内訳: README 2 本 (L2、L3: 索引)、`L3-functional/roadmap.md` (工程横断の検証ロードマップ)、
`L4-basic-design/tokens.yaml`、`L5-detailed-design/node-toolchain-provenance-registry-v1.json` (データファイル)。
索引・データ・工程横断の文書は、対を持つ設計文書ではない可能性がある。対の対象外とするかは別途判断する。

## 表 1: 設計文書と検証文書の対

| 設計文書 | 層 | 対の工程 | 検証文書と対応先 (見出し・検証項目 ID) | 状態 |
|---|---|---|---|---|
| `docs/design/harness/L1-requirements/business-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` : 見出し「business sub-doc (BR-*) — docs/design/harness/L1」(109 行) | 対あり |
| `docs/design/harness/L1-requirements/functional-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` : 見出し「functional sub-doc (FR-L1-*) — docs/design/harne」(116 行) | 対あり |
| `docs/design/harness/L1-requirements/nfr.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` : 見出し「nfr sub-doc (NFR-*) — docs/design/harness/L1-req」(156 行) | 対あり |
| `docs/design/harness/L1-requirements/screen-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` : 見出し「screen sub-doc (SR-*) — docs/design/harness/L1-r」(125 行) | 対あり |
| `docs/design/harness/L1-requirements/technical-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` : 見出し「technical sub-doc (TR-*) — docs/design/harness/L」(150 行) | 対あり |
| `docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md` | L1 | L14 | `docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md` (節・検証項目を特定できる言及なし) | 言及のみ |
| `docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md` | L1 | L14 | `docs/test-design/harness/L14-operational-test-design.md` (設計文書名の言及 0 行) | 節が無い |
| `docs/design/harness/L2-screen/README.md` | L2 | L10 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L2-screen/business-flow.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` : UXV-VRT-01 (58 行) | 対あり |
| `docs/design/harness/L2-screen/screen-detail.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` : UXV-VISUAL-01 (55 行) | 対あり |
| `docs/design/harness/L2-screen/screen-flow.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` : UXV-VRT-01 (58 行) | 対あり |
| `docs/design/harness/L2-screen/screen-list.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` : UXV-A11Y-01 (57 行) | 対あり |
| `docs/design/harness/L2-screen/ui-element.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` : UXV-TOKEN-01 (56 行) | 対あり |
| `docs/design/harness/L2-screen/wireframe.md` | L2 | L10 | `docs/test-design/harness/L10-ux-validation-test-design.md` : UXV-VISUAL-01 (55 行) | 対あり |
| `docs/design/harness/L3-functional/README.md` | L3 | L12 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L3-functional/business-detail.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` : 見出し「§1.2 business-detail sub-doc 由来 AT (BR-21 + HM-0」(128 行); 見出し「business-detail sub-doc」(199 行) | 対あり |
| `docs/design/harness/L3-functional/functional-requirements.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` : 節「§3 trace (④ → ②)」内の言及 (214 行) | 対あり |
| `docs/design/harness/L3-functional/nfr-grade.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` : 見出し「§1.3 nfr-grade sub-doc 由来 AT (NFR-* 15 件)」(151 行); 見出し「nfr-grade sub-doc」(206 行) | 対あり |
| `docs/design/harness/L3-functional/roadmap.md` | L3 | L12 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L3-functional/screen-functional.md` | L3 | L12 | `docs/test-design/harness/L12-acceptance-test-design.md` (設計文書名の言及 0 行) | 節が無い |
| `docs/design/harness/L4-basic-design/architecture.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` : 見出し「§1.2 ST-ARCH (architecture.md 由来 — 統合 / 依存方向 / f」(54 行); ST-ASSET-05 (90 行); ST-ASSET-06 (91 行) | 対あり |
| `docs/design/harness/L4-basic-design/data.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` : 見出し「§1.1 ST-DATA (data.md 由来 — 集約整合 / state schema)」(43 行); ST-ASSET-01 (87 行); CAND-NODEBOOT-211 (220 行) | 対あり |
| `docs/design/harness/L4-basic-design/external-if.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` : 見出し「§1.4 ST-EXT (external-if.md 由来 — 境界統合 / degradat」(95 行); 「§0 量閉じ原則 (L4 ↔ L9)」の項 (35 行); 「§2 量閉じ一覧 (L4 設計要素 → ST 被覆、孤児チェ」の項 (110 行) | 対あり |
| `docs/design/harness/L4-basic-design/function.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` : 見出し「§1.3 ST-FUNC (function.md 由来 — コマンド / workflow e」(63 行); 見出し「§1.3.1 ST-ASSET (function.md §1.1 由来 — 内部資産 rost」(81 行); ST-ASSET-07 (92 行) | 対あり |
| `docs/design/harness/L4-basic-design/repository-placement.md` | L4 | L9 | `docs/test-design/harness/L9-repository-placement-test-design.md` (節・検証項目を特定できる言及なし) | 言及のみ |
| `docs/design/harness/L4-basic-design/security.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` : ST-EXT-06 (104 行); ST-DOCSEM-08 (170 行); 「§2 量閉じ一覧 (L4 設計要素 → ST 被覆、孤児チェ」の項 (114 行) | 対あり |
| `docs/design/harness/L4-basic-design/tokens.yaml` | L4 | L9 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L4-basic-design/ui-standard.md` | L4 | L9 | `docs/test-design/harness/L9-system-test-design.md` (設計文書名の言及 0 行) | 節が無い |
| `docs/design/harness/L5-detailed-design/if-detail.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` : 見出し「§1.2 IT-ADAPTER (if-detail D-CONTRACT 由来)」(50 行); 「§0 量閉じ原則 (L5 ↔ L8)」の項 (34 行); 「§2 量閉じ一覧 (L5 契約 → IT 被覆、孤児チェック」の項 (79 行) | 対あり |
| `docs/design/harness/L5-detailed-design/internal-processing.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` : 見出し「§1.1 IT-CONTRACT (internal-processing DbC 由来)」(43 行); IT-ASSET-04 (100 行); IT-ASSET-06 (102 行) | 対あり |
| `docs/design/harness/L5-detailed-design/module-decomposition.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` : 見出し「§1.3 IT-MODULE (module-decomposition 由来)」(57 行); IT-ASSET-04 (100 行); IT-ASSET-06 (102 行) | 対あり |
| `docs/design/harness/L5-detailed-design/node-toolchain-provenance-registry-v1.json` | L5 | L8 | (pair_artifact 未宣言) | 文書が無い |
| `docs/design/harness/L5-detailed-design/physical-data.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` : 見出し「§1.4 IT-STATE (physical-data 由来)」(63 行); IT-ASSET-07 (103 行); IT-ASSET-07 (138 行) | 対あり |
| `docs/design/harness/L5-detailed-design/ui-detail.md` | L5 | L8 | `docs/test-design/harness/L8-integration-test-design.md` : IT-UI-01 (129 行); IT-UI-02 (130 行); IT-UI-03 (131 行) | 対あり |
| `docs/design/harness/L6-function-design/agent-slots.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.9 U-SLOT (agent-slots 由来、PLAN-L7-08 / IMP-050」(169 行); U-FRCOV-004 (613 行); §5 対応表の行 (1021 行) | 対あり |
| `docs/design/harness/L6-function-design/backfill-pairing.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.11 U-BACKFILL (backfill-pairing lint 由来、IMP-0」(190 行); §5 対応表の行 (1023 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (794 行) | 対あり |
| `docs/design/harness/L6-function-design/claude-inbox-explicit-ack.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 節「Claude inbox 明示 ACK candidate oracle (PL」内の言及 (1725 行) | 対あり |
| `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : CANDIDATE-U-PH-001..008 (3072 行); CANDIDATE-U-PH-010..024 (3073 行); CANDIDATE-U-PH-025 (3074 行) | 対あり |
| `docs/design/harness/L6-function-design/consumer-trace-gates.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 節「consumer trace gate (Issue #971 / #972 /」内の言及 (3093 行) | 対あり |
| `docs/design/harness/L6-function-design/context.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : U-DOMAIN-004 (423 行); U-PLANLINT-004 (602 行); U-PA-045 (1405 行) | 対あり |
| `docs/design/harness/L6-function-design/cross-review-enforcement.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1027 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (800 行) | 対あり |
| `docs/design/harness/L6-function-design/descent-obligation.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.22 U-DESC (descent-obligation ledger 由来、PLAN-」(678 行); CANDIDATE-U-FRCOV-018 (640 行); §5 対応表の行 (1030 行) | 対あり |
| `docs/design/harness/L6-function-design/design-protection-diff-gate.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 節「設計書保護 diff gate (Issue #898) — 索引」内の言及 (3047 行) | 対あり |
| `docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 節「doctor result envelope 実測面 (Issue #193 /」内の言及 (2820 行) | 対あり |
| `docs/design/harness/L6-function-design/edge-case.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.4 U-EDGE (edge-case 由来)」(80 行); §5 対応表の行 (1016 行); 「§0 量閉じ原則 (L6 ↔ L7)」の項 (50 行) | 対あり |
| `docs/design/harness/L6-function-design/forced-stop-feedback.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.6 U-FSF (forced-stop フィードバック由来、PLAN-L6-04 add」(106 行); §5 対応表の行 (1018 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (777 行) | 対あり |
| `docs/design/harness/L6-function-design/fr-unit-coverage.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1032 行) | 対あり |
| `docs/design/harness/L6-function-design/function-spec.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.1 U-FUNC (function-spec §1 関数 signature 由来)」(57 行); 見出し「§1.2 U-CORE (function-spec §2 pseudocode 由来)」(65 行); 見出し「§1.3 U-RULE (function-spec §4 IMP-033 rule engin」(73 行) | 対あり |
| `docs/design/harness/L6-function-design/gate-confirm.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.18 U-GCONF (gate-confirm coupling lint、PLAN-L」(564 行); §5 対応表の行 (1033 行) | 対あり |
| `docs/design/harness/L6-function-design/governance-enforcement.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1022 行) | 対あり |
| `docs/design/harness/L6-function-design/graph.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.16.1a U-RELGRAPH (cross-artifact relation gra」(316 行); 見出し「§1.16.1b U-TOOLADAPTER (A-124 graph/diagram adap」(337 行); U-RELGRAPH-006 (331 行) | 対あり |
| `docs/design/harness/L6-function-design/handover-mechanism.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.8 U-HOVER (handover 記録機構由来、PLAN-L6-06 add-des」(136 行); §5 対応表の行 (1020 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (780 行) | 対あり |
| `docs/design/harness/L6-function-design/memory.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.8.1 U-MEMORY (共有 memory / PLAN-L7-189)」(155 行); 見出し「Claude HARNESS memory async wake oracle (2026-08」(1708 行); U-MEMORY-001 (159 行) | 対あり |
| `docs/design/harness/L6-function-design/module-drift.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.16 U-MDRIFT (module-drift lint = 設計⊇実在の包含、PLA」(273 行); §5 対応表の行 (1029 行); U-DESIGNDB-R1 (1097 行) | 対あり |
| `docs/design/harness/L6-function-design/oracle-test-citation-trace.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 節「oracle-test-trace 逆向き test-label citatio」内の言及 (2798 行) | 対あり |
| `docs/design/harness/L6-function-design/plan-schedule-lint.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1034 行) | 対あり |
| `docs/design/harness/L6-function-design/release-channel-manifest.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 節「R4 backfill（PLAN-REVERSE-473、2026-08-19）」内の言及 (2217 行) | 対あり |
| `docs/design/harness/L6-function-design/review-evidence-stale.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1026 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (799 行) | 対あり |
| `docs/design/harness/L6-function-design/review-evidence.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1025 行); §5 対応表の行 (1026 行); §5 対応表の行 (1027 行) | 対あり |
| `docs/design/harness/L6-function-design/screen-spec.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1035 行) | 対あり |
| `docs/design/harness/L6-function-design/secret.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「PLAN-L6-62 docs 横断 secret-scan oracle (2026-07-0」(1328 行); U-HOVER-004 (142 行); U-MEMORY-002 (160 行) | 対あり |
| `docs/design/harness/L6-function-design/session-log.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.5 U-SLOG (session-log 由来、PLAN-L6-03 add-desig」(87 行); U-SLOG-007 (96 行); U-DBPROJ-PROV-02 (913 行) | 対あり |
| `docs/design/harness/L6-function-design/setup-solo-team.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.7 U-SETUP (ut-tdd setup solo/team 由来、PLAN-L6-」(117 行); §5 対応表の行 (1019 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (778 行) | 対あり |
| `docs/design/harness/L6-function-design/skill-admission.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.24b U-SKILL-ADMIT (skill admission gate 由来、PL」(752 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (789 行) | 対あり |
| `docs/design/harness/L6-function-design/skill-index.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : 見出し「§1.24 U-SKILL-IDX (skill 索引モデル 由来、PLAN-L6-37 add」(725 行); U-SETUP-009a (128 行); §5 対応表の行 (1031 行) | 対あり |
| `docs/design/harness/L6-function-design/test-before-review.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1028 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (801 行) | 対あり |
| `docs/design/harness/L6-function-design/vmodel-pair-freeze.md` | L6 | L7 | `docs/test-design/harness/L7-unit-test-design.md` : §5 対応表の行 (1024 行); U-DESIGNDB-R2 (1098 行); 「§2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)」の項 (795 行) | 対あり |

## 表 2: 工程単体の文書の置き場

設計文書と対にならない工程の文書。置き場の正本は `docs/templates/vmodel/` の各テンプレートの `disposition_target`。

| 工程 | テンプレート | 置き場 | 実在 |
|---|---|---|---|
| L0 | `docs/templates/vmodel/L0-charter.md` | `docs/design/harness/L0-planning/charter.md` | あり (#1019 で新設) |
| L10 | `docs/templates/vmodel/L10-ux-validation.md` | `docs/test-design/harness/L10-ux-validation-test-design.md` | あり |
| L11 | `docs/templates/vmodel/L11-trace-uat.md` | `docs/process/evidence/g11-uat-review-design.md` | あり |
| L13 | `docs/templates/vmodel/L13-production-observation.md` | `docs/process/evidence/g13-post-deploy-verification-design.md` | あり |

注記: `docs/design/harness/L10-ux/visual-design.md` は L2 の子の設計文書であり、置き場の移動は PLAN の退役のときに行う。
