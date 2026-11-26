---
title: "L7 harness-check の Linux job 分割 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/ci-job-split.md
created: 2026-11-25
issue: 1981
---

# harness-check の Linux job を責務ごとに分ける テスト設計 (Issue #1981)

## 1. 位置付け

正本は `docs/design/harness/L6-function-design/ci-job-split.md` である。本書は、その契約を確かめる oracle `U-CISPLIT-001`〜`012` を定める。

fixture は、実リポジトリの `.github/workflows/harness-check.yml` と `tests/fixtures/ci/harness-check-contract.json` を、同じ exact HEAD から読む。YAML は文字列の grep ではなく、parse した構造で比べる。manifest は **分割前の YAML から固定したもの** であり、分割後の YAML から生成してはならない (L6 §6.1)。

テストの組み立ては次のとおりである。

- 計画の取り出し: workflow を `lane` (`full` / `doc`) と `event` (`pull_request` / `push`) の組ごとに評価し、実行される step の列を得る。job の `if` と step の `if` を評価し、`needs.classify.outputs.lane` に lane を代入する。
- 変異: テストは workflow の parse 結果を複製して 1 か所だけ書き換え、同じ比較を流す。変異した入力では、比較が不一致を返さなければならない。

## 2. 候補 oracle

| ID | 対象・入力 | 期待 / Red にする変異 |
|---|---|---|
| `U-CISPLIT-001` | manifest と分割前の計画 | 分割前の `harness-check.yml` (本書の起草時点の main `21bbe1643`) から取り出した計画が、4 つの組 (full / doc × pull_request / push) のすべてで manifest と集合一致する。Red PR の時点で緑である。manifest を分割後の YAML から生成していないことは、manifest の生成元を別の script が持たないこと (テストが manifest を書き出さないこと) で確かめる |
| `U-CISPLIT-002` | 検査の欠落 | 計画から 1 件を消すと不一致。変異: `privacy scan`、`lint (biome)`、`doctor`、`audit quality` を、それぞれ job から削除する。4 件とも赤になる |
| `U-CISPLIT-003` | 条件の反転 | `condition` が変わると不一致。変異: `typecheck` の `lane == 'full'` を `lane == 'doc'` へ反転する。`design-protection` の `event_name == 'pull_request'` を外す。どちらも赤になる |
| `U-CISPLIT-004` | 検査の重複 | 同じ `check_id` が 2 回現れると不一致。変異: `lint (biome)` を `harness-check-static` と `harness-check-pr-discipline` の両方に置く。赤になる |
| `U-CISPLIT-005` | コマンド・環境の差 | `command`・`env`・`shell`・`continue_on_error` のどれかが違うと不一致。変異: `doctor` の `UT_TDD_DOCTOR_RESULT_FILE` を削る。`vitest-full` の `PAIR_RETIREMENT_BASE_SHA` の式を変える。`audit quality` の `--limit 20` を変える。いずれも赤になる |
| `U-CISPLIT-006` | 集約: skip を失敗にする | 期待は両 lane とも全 job が `success` (L6 §5.1、UTV4-AC-077(f)) で、`skipped` を期待値に持たない。lane = `full` と lane = `doc` の両方で、どの job (`harness-check-linux`、`harness-check-static`、`harness-check-pr-discipline`、`classify` など) の `result` を `skipped` にしても、集約の判定が失敗する。「`success` か `skipped` なら通す」判定の実装は赤になる。doc lane で `harness-check-linux` が `success` のとき、ほかの job も `success` なら成功する (回帰 job は doc lane でも skip しない) |
| `U-CISPLIT-007` | 集約: lane の値 | `needs.classify.outputs.lane` が空、`classify` の `result` が `failure` / `cancelled` / `skipped`、または `full` / `doc` 以外の値 (例: `Full`、`docs`、`unknown`) のとき、判定は失敗する。空や未知の値を `full` や `doc` として扱った場合は赤になる |
| `U-CISPLIT-008` | 集約: `failure` と `cancelled` | どの job でも、`result` が `failure` または `cancelled` なら、期待が何であっても失敗する |
| `U-CISPLIT-009` | 集約 job の構造 | 集約 job の id は `harness-check` のまま。`if: always()` を持ち、`needs` に `classify` と §2 の全 job を含む。変異: `if` を外す、`needs` から 1 つ外す、job 名を変える。いずれも赤になる。branch protection の設定は変更しない (リポジトリのファイルに branch protection の定義が無いことを確かめる) |
| `U-CISPLIT-010` | lane の分類を 1 回だけ行う | `classify-changes` の呼び出しは、Linux の job 群のうち `classify` にだけある (`harness-check-windows` の既存の呼び出しは除く)。ほかの Linux job は `needs` に `classify` を持ち、`steps.classify` を参照しない。変異: `harness-check-static` に分類を足す。赤になる。個々の `if` に `!=` の否定で lane を導く式がないことも確かめる |
| `U-CISPLIT-011` | step の配置と受け渡し | L6 §3 の表のとおりに step が配置される (全 step がちょうど 1 job に現れる。準備の 3 step を除く)。受け渡しの対 (`db rebuild` → `doctor` → `test` → `job summary`、`doctor` → `test` の `UT_TDD_DOCTOR_RESULT_FILE`、lane 証跡の write → upload) は同じ job にある。変異: `doctor` だけを別の job へ移す。赤になる |
| `U-CISPLIT-012` | 失敗の伝播 (`continue-on-error`) | manifest の `continue_on_error` は全エントリで `false` (現行 YAML に `continue-on-error` は 0 件)。変異: `lint (biome)` の step に `continue-on-error: true` を足す。ほかの step への追加、job (`harness-check-static`、`harness-check-linux`、`harness-check-pr-discipline`) への追加も同様。いずれも赤になる。job の `continue-on-error: true` は、step の比較ではなく job のキーの確認で赤になる。`continue-on-error: false` の明記は、値が同じなので緑のままである |

## 3. 実行の約束

- 001 は Red PR で緑にする。002〜012 のうち、分割後の構造を求めるもの (006〜012 と、002〜005 の変異に対する期待) は、Red PR では `it.fails` とし、Green PR で `it` に戻す。
- 変異テストは YAML ファイルを書き換えず、メモリ上の parse 結果を書き換える (`.github/` を変えない)。
- 分割後の構造を知らない現行 YAML では、006〜012 の「分割後の job」を参照する比較は成立しない。そのため `it.fails` で包む。
