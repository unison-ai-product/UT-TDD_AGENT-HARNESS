---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_gate_static_pair_retirement
pair_artifact: docs/test-design/harness/L7-gate-static-pair-retirement-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1073
---

> **L6 contract marker**: `checkPairRetirement(repoRoot, baseCommit, headCommit) => PairRetirementCheck` は、source repo の U-RCDEV-037 に比較元から失われた設計対と退役宣言の照合結果を返す。正式 oracle `U-GSPAIR-001`〜`007` は対応する L7 が定める。

# Gate static の設計対の維持と退役 (Issue #1073)

## 1. 適用範囲

source repo の PR 回帰テスト U-RCDEV-037 は、G1〜G6 の層別の固定下限と G7 の双方向対の固定下限を、実在する設計対の集合の比較に切り替える。現行 main の対を1件除いても旧下限を上回ることは [#1073 の記録](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1073#issuecomment-7118869437) で確認済み。G1〜G10 の golden、件数の正規化、既存の確認済み・孤児なしの判定、G7 の verification base の確認済み件数の下限を維持する。

## 2. 比較する集合と Git 境界

| 条件 | 契約 |
| --- | --- |
| Pre | 比較元と変更側の commit を解決し、両方の tracked 文書を読み取れること。 |
| Post | 比較元の対から変更側で失われた対の集合と、今回宣言した対の集合が一致した場合だけ、この照合は成功する。 |
| Invariant | 両方に同じ document root 解決・path 正規化・pair-freeze の双方向照合を使う。照合はリポジトリへ書き込まない。 |

PR 比較の起動入力は `.github/workflows/harness-check.yml` の `harness-check-linux` と `harness-check-windows` の両 job が同一の固定名で渡す。`PAIR_RETIREMENT_EVENT_NAME` は `${{ github.event_name }}`、`PAIR_RETIREMENT_BASE_SHA` は `${{ github.event.pull_request.base.sha }}`、`PAIR_RETIREMENT_HEAD_SHA` は `${{ github.event.pull_request.head.sha }}` を値とする。比較入口はこの3入力と GitHub Actions の自動設定値 `GITHUB_EVENT_NAME` を読む。

GitHub Actions の自動設定値がある場合は `GITHUB_ACTIONS=true` を要求し、`PAIR_RETIREMENT_EVENT_NAME` が空でなく `GITHUB_EVENT_NAME` と完全一致することを必須とする。`pull_request` の場合は base / head SHA の両方を必須とし、各値がこのリポジトリの完全な 40 桁の hexadecimal commit SHA であり、checkout 内で commit として解決できることを確認する。成功したらイベントの base commit と head commit の merge-base を比較元、同じイベントの head commit を変更側として固定する。いずれかの入力が欠落・不正・commit 解決失敗、またはイベント名が不一致なら、golden のみを実行する経路へ降格せず比較全体を失敗させる。`origin/main` や checkout の `HEAD` を PR SHA の補完・代用にしてはならない。比較元や文書または宣言を読み取れない場合も PR の比較は失敗とする。

`push` など `pull_request` 以外の GitHub Actions event では、event 名が `GITHUB_EVENT_NAME` と一致し、base / head SHA が両方とも空である場合に限り、PR 比較を起動せず既存の golden と不変条件を実行する。非 PR event にどちらかの PR SHA が渡された場合、または CI event 名・入力が欠落や矛盾する場合は失敗させる。手元での比較は GitHub Actions の自動設定値がいずれも無く、3つの `PAIR_RETIREMENT_*` 入力がいずれも未設定の場合に限り、`origin/main` と `HEAD` を比較対象として明示的に解決する。手元経路でも commit 解決や読み取りに失敗したら失敗し、PR 入力の部分指定を手元経路へ読み替えない。比較に使う commit は起動時に固定し、途中で参照が更新されても取り直さない。

対は `(設計文書の repo 相対 path, テスト設計文書の repo 相対 path)` で識別する。L1〜L6 の設計 sub-doc を起点とし、有効な参照と逆参照がある組を、既存の pair-freeze と同じルールで1組ずつ数える。複数の設計文書が同じテスト設計を共有する場合は、設計文書ごとに異なる対となる。別の対の追加によって消失を相殺できない。

## 3. 退役の宣言

比較元に存在せず変更側で追加された `docs/governance/design-pair-retirements/issue-<Issue番号>.json` を今回の宣言として読む。ファイルは `{"pairs":[{"design":"…","testDesign":"…"}]}` の形とし、Issue 番号は正の10進整数、対象は両方の文書の canonical な repo 相対 path で記す。前から存在する宣言は今回の例外の根拠に使わない。

消失した対を過不足なく宣言する。重複、不明な対、残っている対、空の宣言、壊れた宣言は失敗とする。移動や組み替えで path の組が変わる場合も、旧 path の組を宣言し、新しい組には通常の pair-freeze を適用する。失敗出力には比較に使った commit と、未宣言・過剰な対の両 path または読み取りに失敗した対象を示す。
