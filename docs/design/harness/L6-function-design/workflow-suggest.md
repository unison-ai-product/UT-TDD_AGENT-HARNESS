---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_workflow_suggest
pair_artifact: docs/test-design/harness/L7-workflow-suggest-test-design.md
---

# workflow suggest 合成器の設計判断 (issue #304 S1、未実装の目標契約)

> **実装状態**: 本書の契約は未実装である。2026-10-14 時点で `src/workflow/` に `family-map.v1` / `workflow-checklist.v1` の
> data asset と合成器は無い。本書は PLAN-L6-100 から還流した、`ut-tdd workflow suggest` 合成器 (Issue #304 S1、add-feature の
> 経路 B = add-design から add-impl) の設計判断である。実装 PR は本書で freeze した判断を発明・変更しない。
> 変更が必要になったら実装を止めて本書の改訂へ戻る。oracle は `CANDIDATE-WFSUG-*` のまま、実装 PR で
> `U-WFSUG-*` へ 1:1 で昇格する (test-design 行を先行させると、テスト実体が無い citation 断線の orphan になる)。
>
> CLI 表面 (入力 3 経路)、合成する 4 部品、出力 2 面の全体仕様は、実装側の `PLAN-L7-485-workflow-suggest-composition`
> (add-impl、draft) の還流で本書へ追記する。本書が持つのは、実装側が前提とする 4 つの設計判断 (§1〜§4) である。

## 1. family 候補 map (`family-map.v1`)

family 候補の提案は、versioned data asset `family-map.v1` の決定的 lookup だけで行う。合成器は scoring も推論も持たない
(合成境界の維持)。

- 形式は `signal → family label` の静的表である。signal は `classifyTask()` の公開出力 (kind / drive / risk_flags) と、
  入力テキストの完全一致 keyword に限る。
- 初期表 (label は GitHub に実在する family label に限る):

| signal (優先順) | family 候補 |
|---|---|
| keyword: `release` / `配布` / `Pack` | `family:release` |
| keyword: `gate` / `oracle` / `review` / `検証` | `family:verification-gate` |
| keyword: `memory` / `handover` / `digest` | `family:memory-bus` |
| keyword: `PLAN` / `frontmatter` / `lint` | `family:plan-assets` |
| keyword: `doctor` / `hook` / `session` / `並列` | `family:runtime-discipline` |
| 上記いずれにも一致しない | 候補なし (空を返す。推測で埋めない) |

- 複数一致時は表の上から先勝ちとする。優先順も data asset の一部として freeze する。
- label の付与は行わない (読み取り専用)。提案を出力へ含めるだけである。
- 表の追補は S2 (#305) の還流経路から行う。

## 2. drive × kind の checklist 選択 matrix (`workflow-checklist.v1`)

checklist 7 項目 (正方向 / 逆方向 / 不在ケース / 配送・可視性 / 両 OS・両 slash / 順序・並行 / 寿命・堆積) の選択は、
data asset 内の静的 matrix で決める。合成器は matrix を評価するだけで、項目の取捨をロジックで発明しない。

- 選択キーは (drive 群, kind 群) の 2 軸である。**両軸とも `classifyTask()` の公開出力語彙をそのまま使い、PLAN frontmatter の
  `kind` 語彙 (impl / add-impl / add-design / verify 等) と混同しない**。混同すると、到達不能 token と未定義 token が同時に生じ、
  翻訳ロジックの発明が必要になる (cross-review FLAG 2026-08-14 の是正)。
  - drive 群は `code` (`classifyDrive` の be / db / fe / fullstack) と `agent` である。
  - kind 群は `TaskKind` (`src/task/classify.ts`、design / add-feature / refactor / troubleshoot / poc / reverse / unknown) を
    次の 2 群へ写す。**実行系** = `add-feature` / `refactor` / `troubleshoot` / `poc`、**文書系** = `design` / `reverse`。
    `unknown` は下の fail-safe で全項目へ倒す。
  - この 7 token は `TaskKind` union を余さず被覆する (到達不能 token 0、未定義 token 0)。
- 初期 matrix:

| | 実行系 | 文書系 |
| --- | --- | --- |
| code (be / db / fe / fullstack) | 全 7 項目 | 正方向・逆方向・不在ケース・寿命堆積 (4) |
| agent | 全 7 項目 | 正方向・逆方向・不在ケース・寿命堆積 (4) |

- 差分の実在 (DoD の「最低 2 組」) は、(code, 実行系) 7 項目 対 (code, 文書系) 4 項目、(agent, 実行系) 7 項目 対 (agent, 文書系) 4 項目
  の 2 組で pin する。文書系で落ちる 3 項目 (配送・可視性 / 両 OS・両 slash / 順序・並行) は、実行系の成果物だけが持つ失敗類型で
  あることが根拠である (#227 / PR #300 / PR #299 BL-1 はいずれも実行系)。
- `kind=unknown`、および `classifyDrive` が返す未知の drive は **全 7 項目** を返す (落とす方向へ倒さない fail-safe)。
- matrix の追補・細分化は S2 (#305) の還流経路から行う。

## 3. exit semantics (advisory と operational error の分離)

| 事象 | exit | 出力 |
|---|---|---|
| 正常 (advisory 提案を出力。提案 0 件を含む) | 0 | stdout に提案 |
| 入力 usage error (3 経路の排他違反、引数欠落) | 2 | stderr に理由 |
| operational failure (`gh` fetch 失敗、PLAN 不在、team / checklist の serialization 失敗) | 1 | stderr に理由 |

「advisory なので作業を止めない」は、**提案内容が non-blocking** であることを意味する。道具自体の利用不能・取得不能・
生成不能を exit 0 へ丸めることは意味しない (判定不能を green へ丸めない既定の踏襲)。

## 4. 合成境界 (二重実装禁止) の判定基準

合成器が新規に持ってよいのは次の 4 つだけである。

- (a) 入力の正規化
- (b) 4 部品出力の変換・束ね
- (c) data asset (`family-map.v1` / `workflow-checklist.v1`) の決定的 lookup
- (d) 出力の serialization

分類・route 判定・skill scoring の再実装は禁止する。判定は「部品の出力を差し替えると、合成器の出力が追随するか」で実測する
(`CANDIDATE-WFSUG-006`)。

## 5. 範囲外と依存

- 範囲外: S2 (#305) の FLAG 還流、gate 化 / doctor 配線、GitHub Issue の inbound projection (PLAN-L7-437)。
- 依存: 責務 A (本書の設計判断) は責務 B (実装側 `PLAN-L7-485` の合成器) に先行する。実装 PR は本書の設計判断が cross-review で
  PASS して merge されるまで出さない。この順序の依存は、本書が未実装の目標契約である間は有効である。

## 6. 検証の対

`docs/test-design/harness/L7-workflow-suggest-test-design.md` (`CANDIDATE-WFSUG-002..008`)。`CANDIDATE-WFSUG-001`
(生成 team YAML の schema 適合) は合成器の出力 2 面に属するため、`PLAN-L7-485` の還流で追加する。
