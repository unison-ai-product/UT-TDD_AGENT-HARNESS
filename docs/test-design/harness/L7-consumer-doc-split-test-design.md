---
title: "L7 consumer doc split test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-doc-split.md
status: confirmed
updated: 2026-11-04
issue: 1531
---

# consumer の設計文書分割 テスト設計 (issue #1531)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-doc-split.md` である (未実装の目標契約)。
本書はその §2 読む root、§3 超過時の是正の文面、§4 baseline が無い consumer、§5 閾値の固定、§7 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-CDSPLIT-*`) だけを宣言する。正式化は設計書保護 gate の三段階で、各段の Red PR が引用し、src を含まない昇格 PR で `U-CDSPLIT-*` へ 1:1 で昇格する。

## 2. fixture

- すべて temp directory を repo root として使う。実 repo のファイルは読まない。
- consumer の fixture は `docs/design/L2-screen/x.md` のような `docs/design/` 直下の層ディレクトリと、`docs/test-design/` を置く。`docs/design/harness` は置かない。
- 本体の fixture は `docs/design/harness/L6-function-design/x.md` と `docs/test-design/harness/` を置く。
- 長い文書は、行数だけを `limit + 1` 行にした本文を生成して作る (内容は 1 行 1 語でよい)。
- git を使う行 (006) だけ、temp repo を `git init` し、`origin/main` を持たせない。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。

## 3. oracle 宣言の一覧

| ID | 段 | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- | --- |
| `CANDIDATE-U-CDSPLIT-001` | Red | consumer の fixture で、`docs/design/L2-screen/x.md` を `layer-doc` の上限 +1 行にして `checkDocSplit` を流す | `ok=false`。`docs/design/L2-screen/x.md` の `doc-split-required:new-doc-over-limit` が 1 件。`no-sources` の `doc-split-input-unreadable` は出ない | root を harness に固定したまま (走査 0 件で `no-sources`) / `docs/design` を見落とす |
| `CANDIDATE-U-CDSPLIT-002` | Red | consumer の fixture で `docs/design/L6-function-design/t.md` を (a) 責務 17 個 (見出し) の文書、`docs/test-design/L7-t-test-design.md` を (b) family 5 種の文書にして流す | (a) は `l6-topic` の `responsibilities` 上限超過、(b) は `l7-topic` の上限超過で、どちらも `new-doc-over-limit` | 種別を path の harness 接頭辞で決めて `layer-doc` にしてしまう (責務の数を見ない) |
| `CANDIDATE-U-CDSPLIT-003` | 回帰 | 本体の fixture (`docs/design/harness`・`docs/test-design/harness`) で、上限内の文書と上限超過の文書を置いて流す。さらに `docs/design/stray.md` (harness の外) を置く | 出力 (全行) が root 変更前の実装と同一。`docs/design/stray.md` は走査されず `checked` に数えない。実 repo の `docs/design/harness` を `resolveVModelRoots` に渡すと `designRoot` が `docs/design/harness`、`testDesignRoot` が `docs/test-design/harness` になる | path だけの判定で `docs/design/` 直下を本体でも対象に入れる / 本体の root が変わる |
| `CANDIDATE-U-CDSPLIT-004` | Red | consumer の fixture で、設計側の文書 (`docs/design/L2-screen/x.md`) と test-design 側の文書 (`docs/test-design/L8-x.md`、`layer-doc`) を、それぞれ上限 +1 行にして流す | 設計側の 2 行目に `split_of: docs/design/L2-screen/x.md`、`入口 docs/design/L2-screen/x.md を残したまま`、`design-split-family.md` が含まれる。test-design 側には `dir の集合参照` が含まれ、`split_of` が含まれない | 本体用の文面 (`docs/design/harness/L6-function-design/...`) を consumer へ出す / 設計側に `split_of` を示さない / test-design 側に `split_of` を求める |
| `CANDIDATE-U-CDSPLIT-005` | 回帰 | 本体の fixture で上限超過の文書 1 本を流す | 2 行目が `doc-split-gate.md` §6 の従来の文面 (`docs/design/harness/L6-function-design/<topic>.md と ... へ分ける`) と一致し、`split_of` を含まない | 本体にも consumer の文面を出す |
| `CANDIDATE-U-CDSPLIT-006` | Red | consumer の fixture (`docs/governance/doc-split-baseline.json` なし、git 履歴なしの temp repo、`origin/main` なし) で (a) 上限内の文書だけ、(b) 上限超過の文書 1 本を流す | (a) は `ok=true` で例外なし。(b) は `new-doc-over-limit` の 1 件だけで、`doc-split-baseline-base-unreadable` が出ない。baseline のファイルは作られない | baseline が無いと `previousBaseline` の読み取り失敗で常に落とす / baseline ファイルを要求する・作る / baseline が無いと上限を適用しない |
| `CANDIDATE-U-CDSPLIT-007` | 回帰 | 本体の fixture で、baseline のファイルを置き (a) 解釈できない JSON、(b) 上限超過の文書を baseline の値以下で記録、を流す | (a) は `doc-split-input-unreadable`、(b) は違反 0 件。baseline があるときの規則が baseline の無い経路の緩和で変わらない | baseline の有無の判定を誤り、読めない baseline を黙って空として扱う |
| `CANDIDATE-U-CDSPLIT-008` | Red | consumer の fixture で、入口 `docs/design/L2-screen/x.md` (上限内) と、子 `docs/design/L2-screen/x/part-1.md` (frontmatter `split_of: docs/design/L2-screen/x.md`、上限 +1 行) と、子 `docs/design/L2-screen/x/part-2.md` (上限内) を置いて流す | 違反は子 `part-1.md` の 1 件だけ (`new-doc-over-limit`)。入口の行数・責務の数に子の分が足されず、入口は違反にならない。2 つの子の行数を足した値でも判定されない | 子を入口へ合算する / 子を走査しない / 子を 1 本の文書として束ねて測る |
| `CANDIDATE-U-CDSPLIT-009` | 回帰 | `DOC_SPLIT_LIMITS` と `checkDocSplit` の公開入口を検査する。(a) `DOC_SPLIT_LIMITS` が `l6-topic` 400/16、`l7-topic` 400/4、`layer-doc` 1200/null である。(b) `checkDocSplit` を `UT_TDD_DOC_SPLIT_*` 風の環境変数と、consumer の fixture に置いた閾値を示す設定ファイルを付けて流す | (a) 値が正本と一致する。(b) 結果が環境変数・設定ファイルなしの場合と同一で、上限を変える経路が無い | 環境変数や設定ファイルで閾値を上書きできる / 定数を可変にする |
| `CANDIDATE-U-CDSPLIT-010` | Red | consumer の fixture で、上限 +1 行の文書の移動 (`git mv`) を伴う変更を、(a) `docs/design/L2-screen/a.md` から `docs/design/L2-screen/a/part.md` (同じ種別)、(b) `docs/design/L6-function-design/a.md` から `docs/design/L2-screen/a.md` (種別が変わる) の 2 通りで流す。`origin/main` は fixture の base commit に置く | (a) は `doc-split-class-changed` が出ない、(b) は `doc-split-class-changed` が出る (consumer の root を基準に種別が決まる) | consumer の path の種別を `null` と判定して種別変更を見逃す / 同じ種別の移動を拒否する |

## 4. 昇格と引用の方針

- Red の行 (001・002・004・006・008・010) は、実装 PR の前の Red PR が候補 ID をテスト名に引用し、`it.fails` で入れる。
- 回帰の行 (003・005・007・009) は振る舞いを足さない行で、現行の main で通る。Red PR は `it` として入れてよい (`it.fails` にしない)。
- 009 の (a) は `src/lint/doc-split.ts` の定数を読む静的な検査で、(b) は temp repo の fixture を使う。
- 候補 ID は、Red PR がテスト名に引用し、src を含まない昇格 PR で `U-CDSPLIT-001`〜`010` へ 1:1 で昇格する。
- `src/doctor/test-repository-isolation.ts` の登録は、temp repo だけを使うこの行では要らない。実 repo を読む検査 (003 の `resolveVModelRoots` の確認) を入れる場合だけ、同じ PR で登録する。
