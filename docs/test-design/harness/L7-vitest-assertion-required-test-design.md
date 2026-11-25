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

fixture は L6 §1 の `vitest` alias と runner を通し、callback で呼ぶ import 版と `context.expect` が同じ counter に入ることを確かめる。独立 fixture の21ケースで検証した方式を、開発リポジトリの設定を通して再検証する。

## 2. 正式 oracle

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `U-VITASSERT-001` | 通常テストで assertion の前に `return`。reporter がそのテストの 0 件を診断し、CLI は非 0。 | 成功として報告する。別の設定エラーで終了する。 |
| `U-VITASSERT-002` | 正常に返る `it.fails` と、本当に対象が throw する `it.fails`。前者は期待した失敗が起きないという理由で FAIL、後者は PASS。各結果を個別に照合する。 | global `requireAssertions` を有効化し、前者も PASS にする。反転を外して後者を FAIL にする。 |
| `U-VITASSERT-003` | import した `expect` のみ、`context.expect` のみ、両方を1回ずつ呼んで `expect.assertions(2)` を指定するケースはすべて PASS。`context.expect` の取得だけで戻るケースは 0 件で FAIL。`expect.soft` または `expect.poll` だけで検証するケースはそれぞれ PASS。 | import と local のカウントが分離する。関数呼び出しだけを転送し、`soft` や `poll` を 0 件と判定する。 |
| `U-VITASSERT-004` | helper 経由の matcher は PASS。parameterized テストを 2 ケース実行し、matcher を呼ぶ方だけが PASS。元から throw する通常テストは元の診断で FAIL。 | callback の文字列で検査する。ケース間で数を共有する。例外を 0 件診断に置き換える。 |
| `U-VITASSERT-005` | 1 回目の試行で `context.expect` の matcher が失敗し、retry は assertion を呼ばず正常終了する。reporter は retry の 0 件を診断し FAIL。skip・todo は既存の状態を維持する。 | 前の試行の呼び出し数を retry に持ち越す。未実行テストを失敗に変換する。 |
| `U-VITASSERT-006` | `beforeEach` だけが assertion を呼ぶ通常テストは 0 件で FAIL。並行する2ケースを Promise barrier で決定的に同期し、先に始めた0件のケースが待機している間に別ケースが import した `expect` を呼ぶ。0件のケースは assertion 0 件で FAIL し、assertion を呼んだケースは PASS する。 | セットアップ用 hook や、別ケースの共有カウンター増分で 0 件を合格させる。 |
| `U-VITASSERT-007` | import と local を1回ずつ呼び `expect.assertions(3)` を指定すると、標準診断で実績2件を報告して FAIL。matcher を呼ばず `expect.assertions(2)` または `expect.hasAssertions()` だけを指定した場合も、各標準診断で FAIL。 | メソッド転送の漏れで個数の不一致を合格させる。独自の 0 件診断で標準診断を上書きする。 |

## 3. 導入の確認

実装の有効化前に、L6 の適用範囲で既存テストを公式 CI から実行し、各ケースの 0 件診断と `it.fails` の成否差分を確認する。直接 `expect` が無かった 32 宣言は優先して確認する。183 件は期待失敗宣言の棚卸し値として使い、実行されたケース数とは区別する。U-VITASSERT-001〜007 は合流済みの Red と対応する。Green は後続で行う。
