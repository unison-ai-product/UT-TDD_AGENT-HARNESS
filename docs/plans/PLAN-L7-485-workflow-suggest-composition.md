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
dependencies:
  parent: docs/plans/PLAN-L6-99-workflow-suggest-add-design.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-99-workflow-suggest-add-design.md
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
review_evidence: []
---

# PLAN-L7-485: workflow suggest 生成器 (S1)

## §0 位置づけ

Issue #304 (親 #303) の S1 slice。issue 文面 / PLAN を入力に、**既存機構の合成だけ**で駆動モデル別
workflow を advisory 出力する CLI を追加する。S2 (#305 の FLAG 還流) はスコープ外。

本 PLAN は `kind=add-impl` であり、Reverse 対 `PLAN-REVERSE-485-workflow-suggest-backfill` を持つ。
add-feature 経路 B (`add-design → add-impl`) に従い、設計側の親は
`PLAN-L6-99-workflow-suggest-add-design` (L6 add-design) である。family map / drive×kind matrix /
exit semantics の設計判断はすべて L6-99 §1 に freeze されており、本 PLAN と実装 PR はそれを
発明・変更しない。L6 doc 実体 (`docs/design/harness/L6-function-design/workflow-suggest.md`) は
`U-WFSUG-*` 昇格と同一 PR で合流する (L6-99 §冒頭の orphan 回避順序)。

## §1 契約 freeze (実装 PR で発明しない)

### 1.1 CLI 表面

```
ut-tdd workflow suggest --text "..." | --issue <N> | --plan <id>
```

- 入力 3 経路は排他。いずれも最終的に「1 本の入力テキスト + 任意の PLAN context」へ正規化してから
  composer へ渡す。
- exit semantics は L6-99 §1.3 の 3 区分 (advisory=0 / usage error=2 / operational failure=1 +
  stderr) に従う。advisory の非 blocking 性を、道具の利用不能・取得不能・生成不能の exit 0 への
  丸めに拡大解釈しない。
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
   `workflow-checklist.v1` を持つ versioned data asset。項目の選択は L6-99 §1.2 で freeze した
   drive×kind 静的 matrix の評価のみで行い、取捨ロジックを composer 側で発明しない。未知の
   drive / kind は全項目へ倒す (fail-safe)。

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

family label 未付与 issue に対し、L6-99 §1.1 で freeze した `family-map.v1` (静的 signal→family
表、先勝ち、未一致は候補なし) の決定的 lookup で family 候補を提案する。scoring・推論ロジックを
composer 側に持たず、提案は出力に含めるだけで label 付与は行わない (書き込み副作用を持たない)。

### 1.5 advisory only

fail-close gate を作らない (未計測のままゲート化しない規律)。発火は `hook_events` で計測可能にする。
gate 化・doctor 配線は本 PLAN のスコープ外であり、計測後に別 PLAN で判断する。

### 1.6 oracle candidate (falsifiable、実装 PR で `U-WFSUG-*` へ昇格)

PF 分割と同じ「PLAN で candidate freeze → 実装 PR で test-design と 1:1 昇格」順序を取る
(test-design 行の先行はテスト実体不在の citation 断線 orphan を作るため)。以下を falsifiable な
candidate として freeze する。各行が入力・期待出力・失敗境界を持つ:

| candidate | 入力 | 期待 (falsifier) |
| --- | --- | --- |
| `CANDIDATE-WFSUG-001` | 生成 team YAML | `src/schema/team.ts` の schema parse を通り、`delegation-routing` 未登録 role を含まない。未登録 role を含む合成入力では serialization failure (exit 1) |
| `CANDIDATE-WFSUG-002` | `--text` と `--issue` の同時指定 | usage error: exit 2 + stderr。advisory 出力を出さない |
| `CANDIDATE-WFSUG-003` | `gh` fetch 失敗 (`--issue` で到達不能) | exit 1 + stderr。exit 0 / 空提案へ丸めない |
| `CANDIDATE-WFSUG-004` | (code, impl 系) と (code, docs 系) の 2 入力 | checklist が 7 項目 vs 4 項目 (L6-99 §1.2 matrix と要素一致)。matrix を無視した実装では差分が出ず RED |
| `CANDIDATE-WFSUG-005` | family-map 一致 keyword / 全不一致テキスト | 一致 → 表の先勝ち family 候補、不一致 → 候補なし (空)。推測で埋める実装は RED |
| `CANDIDATE-WFSUG-006` | 4 部品の出力 stub 差し替え | composer 出力が部品出力へ追随する (再実装していれば追随せず RED)。import 実測で部品 module 以外の分類・route・scoring 実装が composer に無い |
| `CANDIDATE-WFSUG-007` | 正常 `--text` 入力 (提案 0 件ケースを含む) | exit 0 + stdout に advisory (0 件でも exit 0) |
| `CANDIDATE-WFSUG-008` | 未知 drive / kind の分類結果 | checklist は全 7 項目 (落とす方向へ倒れない fail-safe)。subset へ落ちる実装は RED |

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
- [ ] checklist が drive×kind で内容を変える (L6-99 §1.2 で pin した 2 組 — (code, impl 系) 7 項目
      vs (code, docs 系) 4 項目、(agent, impl 系) vs (agent, docs 系) — で要素差分を実証する)。
- [ ] §1.6 の candidate 8 件が `U-WFSUG-*` へ昇格し、test-design と 1:1 で対応する。
- [ ] composer が既存 4 部品の再実装を含まない (import 実測で確認する)。
- [ ] fail-close gate を追加していない (doctor / CI の gate 数が不変であることを確認する)。
- [ ] 非 author family の frontier tier による closing review が PASS。

## §5 Exit

上記 DoD 全項目が実測で満たされ、closing review PASS 後に merge した時点で confirmed へ遷移する。
設計の upstream closure は L6-99 (add-design) が所有し、Reverse 対 `PLAN-REVERSE-485` の R3/R4 が
L6 doc 実体の合流と設計判断の実測整合を再検証する。
