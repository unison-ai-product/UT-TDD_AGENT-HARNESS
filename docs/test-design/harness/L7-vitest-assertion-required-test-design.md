---
title: "L7 Vitest assertion required test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/vitest-assertion-required.md
status: confirmed
updated: 2026-11-20
issue: 1452
---

# Vitest の assertion 必須化テスト設計 (Issue #1452)

## 1. 検証方法

上位の判定契約は `docs/design/harness/L6-function-design/vitest-assertion-required.md`。ここでは、実行設定から reporter と CLI 終了までを一続きで確かめる。

一時ディレクトリに独立した Vitest fixture を作り、開発リポジトリと同じ実行設定を通す。CLI を子プロセスで実行して JSON reporter の個別の状態・理由と終了コードを取る。失敗すべき fixture は同じ invocation の成功 fixture と組み合わせ、実行起動・収集・reporter の正常系を確認する。収集前の設定エラー、タイムアウト、テストの未実行で oracle を通過させない。

## 2. 候補 oracle

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `CANDIDATE-U-VITASSERT-001` | 通常テストで assertion の前に `return`。reporter がそのテストの 0 件を診断し、CLI は非 0。 | 成功として報告する。別の設定エラーで終了する。 |
| `CANDIDATE-U-VITASSERT-002` | 正常に返る `it.fails` と、本当に対象が throw する `it.fails`。前者は期待した失敗が起きないという理由で FAIL、後者は PASS。各結果を個別に照合する。 | global `requireAssertions` を有効化し、前者も PASS にする。反転を外して後者を FAIL にする。 |
| `CANDIDATE-U-VITASSERT-003` | import した `expect` で検証する通常テスト、`context.expect` で検証する通常テスト、`context.expect` を取得して早期に戻る通常テスト。最初の 2 件は PASS、最後は assertion 0 件で FAIL。 | import した `expect` だけで検査する。local `expect` を使う正当なテストを拒否する。 |
| `CANDIDATE-U-VITASSERT-004` | helper 経由の matcher は PASS。parameterized テストを 2 ケース実行し、matcher を呼ぶ方だけが PASS。元から throw する通常テストは元の診断で FAIL。 | callback の文字列で検査する。ケース間で数を共有する。例外を 0 件診断に置き換える。 |
| `CANDIDATE-U-VITASSERT-005` | 1 回目の試行で matcher が失敗し、retry が assertion を呼ばずに正常終了する通常テストは FAIL。skip・todo は既存 reporter の状態を維持する。 | 前の試行の呼び出し数を retry に持ち越す。未実行テストを失敗に変換する。 |

## 3. 導入の確認

実装の有効化前に、L6 の適用範囲で既存テストを公式 CI から実行し、各ケースの 0 件診断と `it.fails` の成否差分を確認する。直接 `expect` が無かった 32 宣言は優先して確認する。183 件は期待失敗宣言の棚卸し値として使い、実行されたケース数とは区別する。登録・Red・正式昇格・Green は後続で行う。
