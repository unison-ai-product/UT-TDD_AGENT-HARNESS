---
title: "L7 memory episode retirement test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-13
---


# 共有メモリのエピソード回収 テスト設計 (issue #963 / PLAN-L6-97)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/memory.md` の §4.2 (エピソードの回収) である。
本書は §4.2 の分類・書き込み時の推定と fail-close・読み取り時の既存分の扱い・回収の三値判定・退避の冪等性・
配送側の抑止を検証する oracle を定義する。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引だけを置き、
本書が詳細の正本である。この pair-freeze では候補 ID (`CANDIDATE-U-MEMEPI-*`) だけを宣言し、実装 PR で Red を
追加してから `U-MEMEPI-*` へ昇格する。001〜011 は PLAN-L6-97 (2026-08-05) の候補を引き継ぎ、012〜016 を足す。

## 2. 計測値 (2026-10-13、main 96da70d6)

| 項目 | 値 | 取り方 |
| --- | --- | --- |
| `.ut-tdd/memory` の全ファイル | 1865 | `ls .ut-tdd/memory \| wc -l` |
| git 追跡 | 46 | `git ls-files .ut-tdd/memory \| wc -l` |
| 名前に `pr-N` を含む | 1435 | advisor 実測 (`ls \| grep -ciE 'pr-?[0-9]+'` 相当) |
| 1 日あたりの増加 | 約 100 | `ls -lt` の日付別件数 (2026-09-24〜10-09) |

実装 PR は、同じコマンドで実 repo を測り直して dry-run の件数と照合する (CANDIDATE-U-MEMEPI-016)。

## 3. 前提と fixture

- 一時 git repo に `ut-tdd.project.json` (repository_identity = `example/repo`) を置き、default branch に
  `Merge pull request #10 from ...` の merge commit を 1 本作る。PR 11 は merge commit なし。
- GitHub への問い合わせは注入可能な port とし、テストは fake を渡す (open / closed / 到達不能を切り替える)。
- `.ut-tdd/memory` に tracked / untracked、kind 別のファイルを置く。

## 4. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-MEMEPI-001 | `memory add --lifecycle episode` で `--bound-to` なし、title に番号なし | exit 1、ファイルを書かない | episode の bound_to 必須検査を外す |
| CANDIDATE-U-MEMEPI-002 | git 追跡済み、`lifecycle` 未宣言、title に `PR 10` | `durable`、retire の dry-run / `--archive` とも対象外 | tracked 判定を外して推定を掛ける |
| CANDIDATE-U-MEMEPI-003 | untracked `kind=project`、`bound_to` = PR 10 (merge commit あり)、fake は到達不能 | `retirable` (offline で確定) | merge commit 検査を GitHub 依存に置き換える |
| CANDIDATE-U-MEMEPI-004 | `bound_to` = PR 10 と issue 20 (fake で open) | `ok` | 全件 closed の条件を「どれか closed」に緩める |
| CANDIDATE-U-MEMEPI-005 | `bound_to` = PR 11 (merge commit なし)、fake は到達不能 | `unknown`、doctor の row は advisory で exit に影響しない | unknown を retirable / ok に倒す |
| CANDIDATE-U-MEMEPI-006 | `--bound-to` に PLAN ID、path、別 repo の URL | それぞれ exit 1 | URL の repo 照合を外す |
| CANDIDATE-U-MEMEPI-007 | `memory retire` (dry-run) | ファイルの bytes と位置、`memory_entries` 行、manifest がすべて不変 | dry-run で移動する |
| CANDIDATE-U-MEMEPI-008 | `lifecycle: durable` + `bound_to` あり (教訓の根拠引用) | `retirable` にしない | lifecycle を見ずに bound_to だけで判定する |
| CANDIDATE-U-MEMEPI-009 | `episode`、判定 `retirable` の entry を即時配送に渡す | 配送しない | 配送 filter を外す |
| CANDIDATE-U-MEMEPI-010 | `episode`、判定 `unknown` の entry を即時配送に渡す | 配送する | unknown を抑止側へ倒す |
| CANDIDATE-U-MEMEPI-011 | `memory add --kind project`、明示なし、title / tags に番号なし | exit 1、`--lifecycle` の指定を案内する文言 | 既定値 durable へ黙って倒す |
| CANDIDATE-U-MEMEPI-012 | `memory add --kind project`、明示なし、title `PR962 Issue898 ...` | `lifecycle: episode`、`bound_to` = pull/962 と issues/898 の 2 件 | 最初の 1 件だけ拾う / PR と issue を取り違える |
| CANDIDATE-U-MEMEPI-013 | `memory add --kind feedback`、明示なし、title に `PR 551` | `lifecycle: durable` (推定しない) | kind を見ずに推定する |
| CANDIDATE-U-MEMEPI-014 | `--archive` を 1 件目の rename 後に中断 (fault 注入)、そのあと再実行 | 二重移動なし、manifest の行数 = 退避先のファイル数、各 sha256 一致、`memory_entries` に退避済みの行なし | manifest 追記を rename の後にする / 再実行で既存行を重複追記する |
| CANDIDATE-U-MEMEPI-015 | `--archive` の後に `readMemory` と db status | `freshness: fresh`、index-only 行 0 | db 行の削除を省く |
| CANDIDATE-U-MEMEPI-016 | 実 repo (real-repo) で dry-run | 件数の合計 = untracked の全ファイル数、tracked は全件 durable、例外 0 | 集計から tracked / 推定外を落とす |

## 5. 範囲外

- エピソードを別の置き場へ書く (#424 の bus) こと。v4 で扱う。
- ファイルを削除すること。経路自体を持たない (設計 §4.2)。
- review dispatch が錨を memory に書くこと自体の変更。
