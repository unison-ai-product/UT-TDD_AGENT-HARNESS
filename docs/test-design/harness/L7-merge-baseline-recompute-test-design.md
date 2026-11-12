---
title: "L7 merge baseline recompute test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/merge-gate-check-run-selection.md
status: draft
updated: 2026-11-05
issue: 1559
---

# baseline 競合時の再計算テスト設計 (issue #1559)

## 1. 対象と上位の契約

対象は `ut-tdd pr merge` の baseline 競合の判定で、競合を見つけたときに合成 tree で gate を計算し直す段である。上位の契約は
`docs/design/harness/L6-function-design/merge-gate-check-run-selection.md` の §6.6。§6.2 の競合の検出 (`CANDIDATE-U-RVMG-047`〜`049`、
`docs/test-design/harness/L7-unit-test-design.md`) は変えず、本書では再定義しない。

## 2. fixture の作り方

- 一時ディレクトリに bare の origin と clone を作り、main と PR の branch を git で組み立てる。開発 repository の `.ut-tdd/`・`harness.db`・
  OneDrive を操作しない。
- gate は `BASELINE_GATES` の entry を差し替えられる形で注入する。050〜052 は fixture の小さな gate (対象 path と baseline ファイルを持ち、
  `check(repoRoot)` が tree の内容から finding を返す) を使い、実際の code-size / doc-split の閾値には依存しない。053 は実際の
  `BASELINE_GATES` に `check` が登録されていることだけを確かめる。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `U-RVMG-050` | 再計算で許可 | 入力: PR と main が同じ対象ファイルを別々の行で変え (§6.2 の競合 1 に当たる)、合成 tree では gate の finding が 0 件。期待: merge へ進む。`merge_intent` の receipt に `preview` (`mainSha`・`headSha`・`treeSha`・合成 commit・gate ごとの `{ name, ok, findings }`) が残り、`treeSha` が `git merge-tree --write-tree` の出力と一致する。配置先は、実行cwdで得た `git rev-parse --show-toplevel` を `fs.realpathSync.native` で実体化したrootの親であり、linked worktreeではそのrootを使う。junction / symlink経由のcwdでも実体pathの親に作る。一時worktreeは`fs.mkdtempSync(<親>/ut-tdd-baseline-preview-<PR番号>-)`で原子的に作成し、並行する2呼び出しは別pathを使う。既存ディレクトリは再利用・上書き・削除しない。node_modulesのjunction / symlinkを作らずにgateを動かす。一時worktreeは判定後に残らない。反例: 競合を見つけた時点で従来どおり拒否する実装。previewを記録しない実装。指定位置以外にworktreeを作る実装。既存pathを消す実装。一時worktreeを消さない実装。 |
| `U-RVMG-051` | 再計算で拒否 (finding の型) | 入力: 合成 tree で、(a) baseline に載っていない対象ファイルが上限を超える (`*-required`、`over` に数えられる)、(b) **baseline の記録値そのものが比較元より増える**: 現 main の baseline がある行を 1001 と記録し、合成後の baseline ファイルが同じ行を 1002 と記録し、実測も 1002 (finding は `*-baseline-grown`、`ok=false` で `over=0`・`stale=0`)、(c) 記録値が実測より大きいまま残る (`*-stale-baseline`)。注入 gate はこの 3 つの意味を再現し、少なくとも (b) は実際の `analyzeCodeSize` (または doc-split の analyzer) に同じ入力を与えて finding の符号を照合する。期待: (a)(b)(c) のどれも拒否し、reason が `baseline_conflict_recomputed:<gate>=<finding の符号>` (b は `*-baseline-grown`)。反例: `summary.over` と `summary.stale` が 0 なら許可する実装 ((b) を通す)。 |
| `U-RVMG-052` | 失敗はすべて拒否 | 入力: (a) 合成で衝突する、(b) `merge-tree --write-tree` を持たない git (版の検査を stub で失敗させる)、(c) cwdからrepository root / 実体pathまたは親を解決できない、repository rootがfilesystem root、親ディレクトリへの書込み失敗、一時ディレクトリ作成失敗、`commit-tree` / worktree作成失敗、(d) gateの`check`が例外を投げる、(e) 展開後の中断または途中の例外。期待: (a)は従来の`baseline_conflict:...`、(c)のroot / 親解決不能・filesystem rootは`baseline_conflict_unknown:preview_parent_unresolved`、親への書込み失敗を含む一時ディレクトリ作成失敗は`baseline_conflict_unknown:preview_dir_create_failed`、それ以外の(b)〜(e)は既存`baseline_conflict_unknown:<理由>`で拒否し、mergeを呼ばない。許可・拒否・例外・中断の各経路で`finally`が`git worktree remove --force <path>`→残ったディレクトリの削除→`git worktree prune`の順に実行し、前段の失敗後も後段を試みる。後始末が成功した場合は、各拒否経路で一時worktreeと管理情報を残さない。一時worktreeにはnode_modulesのjunction / symlinkを作らない。後始末失敗を注入した場合も既に確定した許可／拒否の判定は変わらず、stderrに警告し、receiptの`preview`に`cleanup: "failed"`と理由を記録する。反例: 失敗時に競合なしとしてmergeする実装。衝突した合成treeでgateを計算する実装。後始末失敗を理由に判定を反転する実装。 |
| `U-RVMG-053` | 競合した gate だけを両方の gate で | 入力: (a) 競合が code-size だけ、(b) doc-split だけ、(c) 両方、(d) 競合なし。期待: (a)(b)(c) は競合した gate の `check` だけを呼ぶ (呼ばれた gate の名前を記録して確かめる)。(d) は合成も再計算もしない。実際の `BASELINE_GATES` の doc-split と code-size の両方に `check` がある。反例: code-size だけを再計算する実装。競合の無い PR でも合成する実装。競合していない gate まで計算する実装。 |
| `U-RVMG-054` | 比較元が現 main であること | 入力 (実際の code-size の規則を使う fixture): merge-base の時点で、code-size の baseline に `src` の 2 ファイル A・B の行があり、`functionExcess` は A=2・B=3 (合計 5)。各ファイルの実測もこの値。main は A の関数を縮め、A の実測と baseline の行を `functionExcess` 1 にする (合計 4)。PR は B の関数を伸ばし、B の実測と baseline の行を `functionExcess` 4 にする。A と B の baseline の行は JSON の離れた行に置き、合成は衝突しない (baseline ファイルを両側が変えたので §6.2 の競合 2・3 が成り立つ)。合成後の baseline は A=1・B=4 (合計 5) で、実測も同じ。期待: 同じ合成 tree に対して、実際の `analyzeCodeSize` が、比較元を元の merge-base (合計 5) にすると finding 0 件、比較元を現 main (合計 4) にすると `code-size-baseline-grown` (`functionExcess-total`) を返すことを、テストの中で両方確かめる (`growthAgainstPrevious` は `functionExcess` を合計で比べるので、片側の縮小がもう片側の増加を打ち消す)。そのうえで再計算の経路は拒否し、gate の `check` の中で `git merge-base HEAD origin/main` が `preview.mainSha` と一致することを記録して確かめる。反例: 合成 commit の第 1 親を PR head にする、または元の merge-base の baseline と比べる実装 (finding 0 件で許可してしまう)。 |

## 4. 段の扱い

- 050〜054 は設計書保護の三段階に従う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID に改め、実装 PR が `it` に戻す。
  fixture は一時ディレクトリだけを使うので、`test-repository-isolation` の登録は要らない見込みである。053 の (実際の `BASELINE_GATES` を import する) 部分が
  開発 repository のファイルを読むなら、登録行を登録と Red の PR に入れる。
- 実装 PR の merge 後に、docs-only PR で wrapper の再計算時間を L6 §6.6 の実測表へ追記する。
