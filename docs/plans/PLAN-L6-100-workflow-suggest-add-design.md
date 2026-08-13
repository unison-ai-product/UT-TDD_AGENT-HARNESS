---
plan_id: PLAN-L6-100-workflow-suggest-add-design
title: "PLAN-L6-100 (add-design): workflow suggest 合成器の L6 設計 — family map / drive×kind matrix / exit semantics"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-13
updated: 2026-08-13
owner: PM / TL
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 合成境界と設計判断 (family map / matrix / exit) の freeze"
generates:
  - artifact_path: docs/plans/PLAN-L6-100-workflow-suggest-add-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/workflow-suggest.md
    artifact_type: design_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-485-workflow-suggest-composition.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L6-function-design/skill-index.md
    - src/task/classify.ts
    - src/schema/route-filing.ts
    - src/skill-engine/recommend.ts
    - src/schema/team.ts
    - skills/review-checklist.yaml
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/304
github_issue_id: 304
review_evidence: []
---

# PLAN-L6-100: workflow suggest 合成器の L6 add-design

Issue #304 (S1) の add-feature 経路 B (`add-design → add-impl`) の設計側 PLAN。実装側は
`PLAN-L7-485-workflow-suggest-composition` (add-impl、Reverse 対 `PLAN-REVERSE-485`)。
本 PLAN が S1 の**設計判断の home** であり、実装 PR はここで freeze した判断を発明・変更しない。
L6 doc 実体 `docs/design/harness/L6-function-design/workflow-suggest.md` は、`U-WFSUG-*` の
test-design 行・テスト実体と同一 PR で合流する (test-design 行を先行させると
`oracle-test-trace` の citation 断線 orphan になるため。PF 分割と同じ「PLAN で freeze →
実装 PR で昇格」順序)。

## §1 設計判断 freeze

### 1.1 family 候補 map (`family-map.v1`)

family 候補の提案は **versioned data asset `family-map.v1` の決定的 lookup のみ**で行う。
composer 側に scoring・推論ロジックを持たない (合成境界の維持)。

- 形式: `signal → family label` の静的表。signal は `classifyTask()` の公開出力
  (kind / drive / risk_flags) と入力テキストの完全一致 keyword に限る。
- 初期表 (label は GitHub 実在 family label に限定する):

| signal (優先順) | family 候補 |
| --- | --- |
| keyword: `release` / `配布` / `Pack` | `family:release` |
| keyword: `gate` / `oracle` / `review` / `検証` | `family:verification-gate` |
| keyword: `memory` / `handover` / `digest` | `family:memory-bus` |
| keyword: `PLAN` / `frontmatter` / `lint` | `family:plan-assets` |
| keyword: `doctor` / `hook` / `session` / `並列` | `family:runtime-discipline` |
| 上記いずれにも一致しない | **候補なし** (空を返す。推測で埋めない) |

- 複数一致時は表の上から先勝ち (優先順も data asset の一部として freeze)。
- label の付与は行わない (読み取り専用。提案を出力へ含めるだけ)。
- 表の追補は S2 (#305) の還流経路から行う。

### 1.2 drive×kind checklist 選択 matrix (`workflow-checklist.v1`)

checklist 7 項目 (正方向 / 逆方向 / 不在ケース / 配送・可視性 / 両 OS・両 slash / 順序・並行 /
寿命・堆積) の選択は **data asset 内の静的 matrix** で決める。composer は matrix を評価する
だけで、項目の取捨をロジックで発明しない。

- 選択キーは (drive 群, kind 群) の 2 軸。drive 群 = `code` (be / db / fe / fullstack) と
  `agent`。kind 群 = `impl 系` (impl / add-impl / refactor / troubleshoot) と `docs 系`
  (design / add-design / reverse / verify)。
- 初期 matrix:

| | impl 系 | docs 系 |
| --- | --- | --- |
| code | 全 7 項目 | 正方向・逆方向・不在ケース・寿命堆積 (4) |
| agent | 全 7 項目 | 正方向・逆方向・不在ケース・寿命堆積 (4) |

- 差分の実在 (DoD の「最低 2 組」) は次の 2 組で pin する:
  (code, impl 系) = 7 項目 vs (code, docs 系) = 4 項目、
  (agent, impl 系) = 7 項目 vs (agent, docs 系) = 4 項目。
  docs 系で落ちる 3 項目 (配送・可視性 / 両 OS・両 slash / 順序・並行) は実行系成果物のみが
  持つ失敗類型であることが根拠 (#227 / PR #300 / PR #299 BL-1 はいずれも実行系)。
- 未知の drive / kind が入力された場合は **全 7 項目** を返す (落とす方向へ倒さない fail-safe)。
- matrix の追補・細分化は S2 (#305) の還流経路から行う。

### 1.3 exit semantics (advisory と operational error の分離)

| 事象 | exit | 出力 |
| --- | --- | --- |
| 正常 (advisory 提案を出力、提案 0 件を含む) | 0 | stdout に提案 |
| 入力 usage error (3 経路の排他違反、引数欠落) | 2 | stderr に理由 |
| operational failure (`gh` fetch 失敗 / PLAN 不在 / team・checklist serialization 失敗) | 1 | stderr に理由 |

「advisory なので作業を止めない」は**提案内容が non-blocking である**ことを意味し、
道具自体の利用不能・取得不能・生成不能を exit 0 へ丸めることを意味しない
(判定不能を green へ丸めない既定の踏襲)。

### 1.4 合成境界 (二重実装禁止) の判定基準

composer が新規に持ってよいのは (a) 入力正規化、(b) 4 部品出力の変換・束ね、(c) data asset
(`family-map.v1` / `workflow-checklist.v1`) の決定的 lookup、(d) 出力 serialization のみ。
分類・route 判定・skill scoring の再実装は禁止し、判定は「部品の出力を差し替えると composer
出力が追随するか」で実測する (CANDIDATE-WFSUG-006)。

## §2 スコープ外

S2 (#305) の FLAG 還流、gate 化 / doctor 配線、GitHub Issue inbound projection (PLAN-L7-437)。

## §3 工程表

### Step 1: [直列] 本 add-design freeze の cross-review

直列理由: downstream_dependency. 本 PLAN の §1 が merge されるまで `PLAN-L7-485` の実装 PR を
出さない (経路 B: add-design → add-impl)。

### Step 2: [直列] L6 doc 実体の合流

直列理由: downstream_dependency. `workflow-suggest.md` は `U-WFSUG-*` 昇格と同一 PR で合流する
(§冒頭の orphan 回避順序)。

## §3.1 実装計画

実装は `PLAN-L7-485` §3.1 に従う。本 PLAN 自体はコードを生成しない。

## §4 DoD / Exit

- [ ] §1 の 3 判断 (family map / matrix / exit semantics) が非 author family の cross-review を
      PASS して main へ merge される。
- [ ] `docs/design/harness/L6-function-design/workflow-suggest.md` が `U-WFSUG-*` と同一 PR で
      合流し、本 PLAN が confirmed へ遷移する。
