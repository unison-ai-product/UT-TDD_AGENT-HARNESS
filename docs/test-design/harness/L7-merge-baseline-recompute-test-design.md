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
| `CANDIDATE-U-RVMG-050` | 再計算で許可 | 入力: PR と main が同じ対象ファイルを別々の行で変え (§6.2 の競合 1 に当たる)、合成 tree では gate の finding が 0 件。期待: merge へ進む。`merge_intent` の receipt に `preview` (`mainSha`・`headSha`・`treeSha`・合成 commit・gate ごとの `{ name, ok, findings }`) が残り、`treeSha` が `git merge-tree --write-tree` の出力と一致する。一時 worktree が判定後に残らない。反例: 競合を見つけた時点で従来どおり拒否する実装。preview を記録しない実装。一時 worktree を消さない実装。 |
| `CANDIDATE-U-RVMG-051` | 再計算で拒否 (finding の型) | 入力: 合成 tree で、(a) 対象ファイルが上限を超える、(b) baseline に記録した行数を合成後の内容が上回る (§6.1 の #1408 の型。`over` にも `stale` にも数えられない finding)、(c) baseline に載っていたファイルが消える。期待: (a)(b)(c) のどれも拒否し、reason が `baseline_conflict_recomputed:<gate>=<finding の符号>`。反例: `summary.over` と `summary.stale` が 0 なら許可する実装 ((b) を通す)。 |
| `CANDIDATE-U-RVMG-052` | 失敗はすべて拒否 | 入力: (a) 合成で衝突する、(b) `merge-tree --write-tree` を持たない git (版の検査を stub で失敗させる)、(c) `commit-tree` か worktree の作成が失敗する、(d) gate の `check` が例外を投げる。期待: (a) は従来の `baseline_conflict:...`、(b)(c)(d) は `baseline_conflict_unknown:<理由>` で拒否し、merge を呼ばない。反例: 失敗時に競合なしとして merge する実装。衝突した合成 tree で gate を計算する実装。 |
| `CANDIDATE-U-RVMG-053` | 競合した gate だけを両方の gate で | 入力: (a) 競合が code-size だけ、(b) doc-split だけ、(c) 両方、(d) 競合なし。期待: (a)(b)(c) は競合した gate の `check` だけを呼ぶ (呼ばれた gate の名前を記録して確かめる)。(d) は合成も再計算もしない。実際の `BASELINE_GATES` の doc-split と code-size の両方に `check` がある。反例: code-size だけを再計算する実装。競合の無い PR でも合成する実装。競合していない gate まで計算する実装。 |

## 4. 段の扱い

- 050〜053 は設計書保護の三段階に従う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID に改め、実装 PR が `it` に戻す。
  fixture は一時ディレクトリだけを使うので、`test-repository-isolation` の登録は要らない見込みである。053 の (実際の `BASELINE_GATES` を import する) 部分が
  開発 repository のファイルを読むなら、登録行を登録と Red の PR に入れる。
- 実装 PR は、wrapper の中で計った再計算の時間を L6 §6.6 の実測表に追記する。
