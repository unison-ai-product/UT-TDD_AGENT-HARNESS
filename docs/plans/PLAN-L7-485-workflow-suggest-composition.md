---
plan_id: PLAN-L7-485-workflow-suggest-composition
title: "PLAN-L7-485 (add-impl): workflow suggest — 既存分類/route/skill 機構の合成による駆動別 workflow 生成器"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-13
updated: 2026-08-13
owner: PM / TL
agent_slots:
  - role: tl
    slot_label: "TL - 合成境界 (二重実装禁止) と advisory only 規律の維持"
  - role: se
    slot_label: "SE - composer 1 モジュールと CLI 最小配線の実装"
  - role: qa
    slot_label: "QA - drive×kind による checklist 差分と team YAML schema 適合の検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-485-workflow-suggest-composition.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-485-workflow-suggest-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-72-task-classify-cli.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-72-task-classify-cli.md
    - docs/plans/PLAN-REVERSE-485-workflow-suggest-backfill.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L6-function-design/skill-index.md
    - src/task/classify.ts
    - src/schema/route-filing.ts
    - src/skill-engine/recommend.ts
    - src/schema/team.ts
    - skills/review-checklist.yaml
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/303
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/304
github_issue_id: 304
backprop_decision: not_required
backprop_decision_reason: "既存の classifyTask / routeFiling / proposal-document-coverage / skill recommend の出力を変換して束ねる advisory 合成であり、各部品の契約・L0-L6 要件・外部仕様を変更しない。新規の判定ロジックを持たないため上流への逆伝播は不要 (local-impl-only)。"
review_evidence: []
---

# PLAN-L7-485: workflow suggest 生成器 (S1)

## §0 位置づけ

Issue #304 (親 #303) の S1 slice。issue 文面 / PLAN を入力に、**既存機構の合成だけ**で駆動モデル別
workflow を advisory 出力する CLI を追加する。S2 (#305 の FLAG 還流) はスコープ外。

本 PLAN は `kind=add-impl` であり、Reverse 対 `PLAN-REVERSE-485-workflow-suggest-backfill` を持つ。
`parent_design` は宣言しない: workflow suggest 合成器を宣言している L1-L6 設計 doc は現時点で存在せず、
存在しない降下元を詐称しないためである。代わりに `backprop_decision: not_required` + 理由を置き、
forward-convergence 上は local-impl-only 分類で扱う (PLAN-L7-482 と同型)。設計 back-fill の要否は
Reverse 対の R3/R4 で実測に基づき確定する。

## §1 契約 freeze (実装 PR で発明しない)

### 1.1 CLI 表面

```
ut-tdd workflow suggest --text "..." | --issue <N> | --plan <id>
```

- 入力 3 経路は排他。いずれも最終的に「1 本の入力テキスト + 任意の PLAN context」へ正規化してから
  composer へ渡す。
- `--issue <N>` は `gh` 読みの**薄い adapter のみ**とする。Issue の harness.db inbound projection
  (PLAN-L7-437) には依存せず、これをブロッカー化しない。projection が将来入っても composer 側の
  契約は変えない (入力正規化の差し替えで吸収する)。
- 出力は advisory であり、exit code で作業を止めない。

### 1.2 合成する既存部品 (二重実装禁止)

| 部品 | 正本 | composer が取る出力 |
| --- | --- | --- |
| `classifyTask()` | `src/task/classify.ts` | drive / kind / size / risk_flags |
| `routeFiling()` | `src/schema/route-filing.ts` | route_mode / allowed_kinds / layer_band / pairing_obligation / requires_human_approval |
| `classifyProposalDocumentCoverage()` | `src/task/classify.ts` | 必要 doc / gate / 推奨 subagent |
| `recommendSkillsForText` + `buildSkillInjectionSet` | `src/skill-engine/recommend.ts` | required / recommended skill 添付 |

**新規ロジックは「各部品の出力を変換して束ねる」ことに限る。** 分類・route 判定・skill scoring を
composer 側で再実装しない (再実装が必要に見えたら実装を止め、当該部品の PLAN へ戻す)。
新規 source_module は composer 1 個 + CLI 配線のみとする。

### 1.3 出力 2 面

1. **team YAML**: `src/schema/team.ts` 準拠 (role 列 + `serialize_after`)。role は
   `src/team/delegation-routing.ts` で解決可能なものだけを使う (未登録 role を出力しない)。
   生成物はそのまま `ut-tdd team run --definition` の schema validation を通ること。
2. **駆動別検証次元 checklist**: `skills/review-checklist.yaml` (`review-checklist.v1`) の派生 schema
   `workflow-checklist.v1` を持つ versioned data asset。項目は drive×kind で選択する。

初期項目セット (absence-blindness 対策の核。出典類型を併記する):

| 次元 | 問い | 出典類型 |
| --- | --- | --- |
| 正方向 | 期待入力で期待結果になるか | — |
| 逆方向 | 失敗時に fail-open 化しないか | — |
| 不在ケース | gate が発火しない環境はないか | #242 類型 |
| 配送・可視性 | publish が配送・可視化まで届くか | #227 類型 |
| 両 OS・両 slash | Windows/Linux と `/` `\` の双方で成立するか | PR #300 類型 |
| 順序・並行 | 実行順序・並行時に壊れないか | PR #299 BL-1 類型 |
| 寿命・堆積 | 生成物が堆積・陳腐化しないか | #232 類型 |

項目の追補は S2 (#305) の還流経路から行い、手書きで増殖させない。

### 1.4 family 候補提案

family label 未付与 issue に対し、`classifyTask()` の出力を流用して family 候補を提案する。
提案は出力に含めるだけで、label 付与は行わない (書き込み副作用を持たない)。

### 1.5 advisory only

fail-close gate を作らない (未計測のままゲート化しない規律)。発火は `hook_events` で計測可能にする。
gate 化・doctor 配線は本 PLAN のスコープ外であり、計測後に別 PLAN で判断する。

### 1.6 oracle

新規 oracle は既存系列と衝突しない `U-WFSUG-*` を宣言予定とする。test-design への実宣言と
`generates` への実装ファイル追加は、実装 PR で confirm と同時に行う (draft の `generates` には
本 PLAN doc と Reverse 対 doc のみを置く)。

## §2 スコープ外

- S2 = #305 の FLAG 還流経路。
- gate 化 / doctor 配線。
- GitHub Issue の inbound projection (PLAN-L7-437)。

## §3 工程表

### Step 1: [直列] 契約 freeze の cross-review

直列理由: downstream_dependency. §1 の契約 (CLI 表面 / 合成部品 / 出力 2 面 / advisory only) が
merge されるまで実装 PR を出さない (pair-freeze 復元、PR スコープ規律)。

### Step 2: [直列] Red — `U-WFSUG-*` の失敗テストを先に置く

直列理由: downstream_dependency. Step 1 で freeze した契約を oracle へ写すため、契約確定が先。

### Step 3: [直列] composer 1 モジュールの実装 (Green)

直列理由: downstream_dependency. Step 2 の Red が composer の受入条件であり、Red なしに実装しない。

### Step 4: [並列] CLI 最小配線 + `workflow-checklist.v1` data asset 初版

CLI 配線 (`src/cli/`) と checklist data asset は別ファイル・別責務であり、file_conflict が無いため
並列で進める。checklist 初版は composer の入力データであるため同一 PR に含めてよい。

### Step 5: [直列] closing review (非 author family の frontier tier)

直列理由: downstream_dependency. Step 4 までの成果物が exact HEAD で揃ってからでないと
closing review が対象を固定できない。PASS verdict 受領前に merge しない。

## §3.1 実装計画

- 1 PR = 1 論点: composer 1 モジュール + 対テスト + CLI 最小配線 + checklist 初版まで。
  audit / 別 consumer / gate 化は別 PR とする。
- 実装中に §1 の方式変更が必要になった場合は PR を close し、契約改訂 (Step 1) へ戻る。
  同一 PR への是正 commit 積み増しで応じない。
- 実装 PR の confirm と同時に `generates` へ実装ファイル・テスト・data asset を宣言する。

## §4 DoD

- [ ] 実 issue 3 件 (うち absence-blindness 類型 1 件以上) で生成試走し、生成 YAML が
      `ut-tdd team run` の schema validation を通る。
- [ ] checklist が drive×kind で内容を変える (最低 2 組で差分を実証する)。
- [ ] `U-WFSUG-*` の oracle 宣言と test-design が 1:1 で対応する。
- [ ] composer が既存 4 部品の再実装を含まない (import 実測で確認する)。
- [ ] fail-close gate を追加していない (doctor / CI の gate 数が不変であることを確認する)。
- [ ] 非 author family の frontier tier による closing review が PASS。

## §5 Exit

上記 DoD 全項目が実測で満たされ、closing review PASS 後に merge した時点で confirmed へ遷移する。
Reverse 対 `PLAN-REVERSE-485` の R3/R4 で設計 back-fill の要否を確定するまで、本 PLAN の
`backprop_decision: not_required` は暫定判断として扱う。
