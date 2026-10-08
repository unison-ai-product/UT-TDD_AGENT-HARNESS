---
title: "確定文書のプレースホルダー検出 — L7テスト設計"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/design/harness/L6-function-design/
parent_doc: docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md
created: 2026-10-08
updated: 2026-10-08
---

# PLAN-L6-833 確定文書の記入欄検出: L7テスト設計

## 1. 目的・実施段階

本書は PLAN-L6-833 の pair artifact であり、実装前に適用境界と反証 oracle を凍結する。ここで宣言するのは候補 oracle であり、production source / test code / gate ID は本契約PRに含めない。実装PRでは各 candidate について Red→Green を実測し、confirmed fixture が成功することと、記入欄を一箇所戻すと失敗することを証明する。

全ての検査では一時 consumer fixture を使い、実 consumer、`.ut-tdd/` runtime state、harness DBには触れない。固定した matcher inventory の件数を受入条件にはせず、現行 template bytes から独立に作成した lexical expectations と個別の oracle により検証する。

## 2. 48 template inventory

表記はHTML entityで表す。fixtureへ渡すときはテスト側でentityを復号し、実際の template bytes と正規 matcherで照合する。下の件数はHTML commentを除いた変更前 corpus の観測値であり、閾値ではない。46本の説明段落にあった3つずつの説明例はHTML commentへ移す契約差分である。L2とL6はその説明段落を持たない。

| template path | matcher vocabulary | 説明例移動前の一致数 |
| --- | --- | ---: |
| `docs/templates/vmodel/L0-charter.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 47 |
| `docs/templates/vmodel/L1-requirements.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 30 |
| `docs/templates/vmodel/L2-screen-list.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;` | 10 |
| `docs/templates/vmodel/L3-functional-requirements.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 75 |
| `docs/templates/vmodel/L4-architecture.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 43 |
| `docs/templates/vmodel/L4-data.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 22 |
| `docs/templates/vmodel/L4-external-if.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 42 |
| `docs/templates/vmodel/L4-function.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 52 |
| `docs/templates/vmodel/L4-security.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 31 |
| `docs/templates/vmodel/L4-ui-standard.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 30 |
| `docs/templates/vmodel/L5-module-decomposition.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 76 |
| `docs/templates/vmodel/L5-physical-data.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 34 |
| `docs/templates/vmodel/L6-function-spec.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 14 |
| `docs/templates/vmodel/L7-unit-test-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 26 |
| `docs/templates/vmodel/L8-integration-test-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 26 |
| `docs/templates/vmodel/L9-system-test-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 26 |
| `docs/templates/vmodel/L10-ux-validation.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 17 |
| `docs/templates/vmodel/L11-trace-uat.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 21 |
| `docs/templates/vmodel/L12-acceptance-test-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 26 |
| `docs/templates/vmodel/L13-production-observation.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 45 |
| `docs/templates/vmodel/L14-operational-test-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 53 |
| `docs/templates/vmodel/optional/012-test-plan.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 37 |
| `docs/templates/vmodel/optional/013-migration-plan.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 20 |
| `docs/templates/vmodel/optional/014-issue-risk-decision-log.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 27 |
| `docs/templates/vmodel/optional/015-development-standards.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 24 |
| `docs/templates/vmodel/optional/016-batch-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 24 |
| `docs/templates/vmodel/optional/017-design-index-definitions.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 54 |
| `docs/templates/vmodel/optional/019-workflow-definition.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 12 |
| `docs/templates/vmodel/optional/020-metrics-kpi-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 21 |
| `docs/templates/vmodel/optional/025-network-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 23 |
| `docs/templates/vmodel/optional/026-server-infrastructure-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 17 |
| `docs/templates/vmodel/optional/030-glossary-data-dictionary.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 16 |
| `docs/templates/vmodel/optional/033-traceability-id-conventions.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 15 |
| `docs/templates/vmodel/optional/035-reliability-dr-bcp-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 18 |
| `docs/templates/vmodel/optional/036-privacy-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 16 |
| `docs/templates/vmodel/optional/038-ci-cd-pipeline-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 13 |
| `docs/templates/vmodel/optional/044-deliverable-index-map.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 15 |
| `docs/templates/vmodel/optional/045-directory-structure-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 12 |
| `docs/templates/vmodel/optional/046-seo-public-page-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 18 |
| `docs/templates/vmodel/optional/047-support-escalation-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 22 |
| `docs/templates/vmodel/optional/048-user-documentation-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 12 |
| `docs/templates/vmodel/optional/049-ai-output-verification-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 15 |
| `docs/templates/vmodel/optional/050-stop-resume-execution-log-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 13 |
| `docs/templates/vmodel/optional/052-documentation-policy-tailoring.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 14 |
| `docs/templates/vmodel/optional/053-poc-verification-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 16 |
| `docs/templates/vmodel/optional/096-design-principles-seven-pillars.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 3 |
| `docs/templates/vmodel/optional/108-refactoring-design.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 5 |
| `docs/templates/vmodel/optional/109-qa-quality-checklist.md` | `&lt;記入&gt;`, `&lt;本文を記入&gt;`, `&lt;項目を記入&gt;` | 3 |

## 3. 純関数オラクル

| Candidate | 入力・操作 | 必須の観測結果 |
| --- | --- | --- |
| CANDIDATE-U-PH-001 | 48 template 本文のそれぞれからHTML commentだけを除去 | 独立に算出した期待 finding が、記載した vocabulary/path inventory と一致する。escape されていない対象形式を全て検出し、HTML comment 内の例は検出しない。inventory の件数は診断用であり、合否基準ではない。 |
| CANDIDATE-U-PH-002 | target marker が1件ある confirmed 本文と、同じ本文に2件ある場合 | finding は path、元本文の行・列、字句を保持し、1件以上なら reject となる。並び順は決定的である。 |
| CANDIDATE-U-PH-003 | target marker がある completed 本文 | reject となる。この規則では completed は confirmed と同じ凍結済みstatusとして扱う。 |
| CANDIDATE-U-PH-004 | target marker がある draft 本文 | 本検出器は finding を返さず、既存 gate が持つ draft/pair の規則は変わらない。 |
| CANDIDATE-U-PH-005 | HTML element または一般的な `&lt;id&gt;` を含む confirmed 本文 | 本検出器は pass とし、山括弧全般を禁止しない。 |
| CANDIDATE-U-PH-006 | 1行および複数行のHTML comment内にtarget markerが1件あるconfirmed本文 | 本検出器は pass とする。ただし、各commentの外にある本文は引き続き検査する。 |
| CANDIDATE-U-PH-007 | target marker を含む confirmed の fenced/inline code | reject となる。code fence と inline code は除外しない。 |
| CANDIDATE-U-PH-008 | confirmed 本文 `&lt;&lt;記入&gt;&gt;`、`&lt;前⏎記入&gt;`、`&lt;!-- opening⏎&lt;記入&gt;` を入力する（`⏎` は実際のLF 1文字を表す） | exact matcher では、nested な `&lt;&lt;記入&gt;&gt;` から内側の `&lt;記入&gt;` が返る。実LFを含む範囲は行をまたいで一致しない。閉じていないcomment開始記号は対象を隠さず、最後の入力から `&lt;記入&gt;` が返る。 |

## 4. 既存gateの到達性オラクル

各ケースでは、通常どおりgate所有対象が選択された一時repository fixtureを作る。status は `confirmed`（および対となる `completed` 版）とし、comment外に実際のmatcher一致をちょうど1件追加する。既存の公開gate entry pointを呼び、失敗することと、所有対象のpathが示されることを確認する。純関数を直接呼ぶだけでは到達性を証明したことにならない。

| Candidate | 既存entry pointとowner set | 反例条件 |
| --- | --- | --- |
| CANDIDATE-U-PH-010..015 | G1/G1-TRACE L1、G2 L2、G3/G3-TRACE L3、G4 L4、G5 L5、G6 L6 のpair path | pair gateの各layerにつき1件テストする。既に所有されているconfirmedのdesign/test-design memberにmarkerを置き、対応gateが失敗することを確認する。 |
| CANDIDATE-U-PH-016 | G7 static pair-freeze / 現行L0-L7 verification input | G7 input setに既に含まれるconfirmed memberだけにmarkerを追加し、後続layer文書へ対象を拡張せずにG7が失敗することを確認する。 |
| CANDIDATE-U-PH-017..019 | G8、G9、G10 workflow branch | 各gateが現在所有するL8、L9、L10の文書にそれぞれmarkerを注入する。他のworkflow証跡を保ったまま、既存gateが失敗することを確認する。 |
| CANDIDATE-U-PH-020..023 | G11、G12、G13、G14 right-arm static slot branch | 現在のslot ownerごとに1件テストする。選択されたconfirmed/completed slotのtarget markerで失敗し、無関係なpair文書には触れない。 |
| CANDIDATE-U-PH-024 | workflow inputを利用できない場合のright-arm G8-G10 fallback branch | 既存fallback slot ownerに同じ検査を適用し、失敗することを確認する。fallbackで成功する経路は新設しない。 |

各branch testには、新しいpredicateを通過し、既存assertionも弱めないclean control fixtureを用意する。テストによる変更はfixture内だけで行い、実行後に破棄する。

## 5. 既存G14 fixtureの修正とmutation

現行の `tests/consumer-g14-static.test.ts` fixtureは、tableを一部だけ記入した状態でconfirmedを宣言している。説明例をHTML commentへ移す前の実測では、matcherらしい形式がrawで59件あり、そのうち11件は既存HTML comment内、48件はcomment外で、後者には説明文中の3件が含まれる。これらは実測に基づく診断値であり、固定件数ではない。実装テストでは、このfixtureの実際の必須欄を全て記入し、confirmed statusを維持する。修正済みfixtureは既存G14 static oracleを通過し、comment外へ対象markerを1件戻すと同じG14 oracleが失敗することを確認する。

## 6. Gate所有境界と明示的な除外

テストでは新しい全体共通の所有規則を定めず、現行の入力境界を証明する。G1-G6は各layerの既存pair-doc subsetを使い、G7は現在のpair/verification inputだけを使う。G8-G10はそれぞれのworkflow loaderを使い、right-arm static checkは現在のregistry obligationが選んだslotだけを対象とする。inventoryに載るoptional template path自体は検査対象ではない。既存ownerを持たないoptional consumer文書は引き続き対象外であり、どのcollectorにも暗黙に追加しない。

新しいgateやstatus transitionはテストしない。既存gateのerror handlingは引き続きfail-closeとする。検出器の例外や、所有対象inputを読めない状態を、gateのpassへ変換してはならない。
