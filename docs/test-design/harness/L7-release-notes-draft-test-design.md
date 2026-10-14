---
title: "L7 release notes draft test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/design/harness/L6-function-design/release-notes-draft.md
parent_doc: docs/design/harness/L6-function-design/release-notes-draft.md
created: 2026-10-14
updated: 2026-10-14
---

# Pack リリースノート下書き (Issue #816 段階 1) — L7 test design

## 1. 位置付け

`docs/design/harness/L6-function-design/release-notes-draft.md` の pair artifact。`PLAN-L6-816-release-notes-draft-contract` の本文にだけあった oracle 候補 18 件 (旧 ID `U-RNOTES-001..018`) を `CANDIDATE-RNOTES-*` として移した (設計還流 issue #958)。いずれも未実装で、正規 ID への昇格は実装 PR で行う。実装テストは `tests/release-notes-draft.test.ts`。

## 2. 共通の oracle 規則

fixture は一時 directory の git repo (source 側と Pack 側) で作り、実 GitHub と実 producer は使わない。各 candidate は、表の mutation を入れたら RED になることを実装 PR で示す。

## 3. 候補 oracle

| ID | oracle | mutation (入れたら RED) |
|---|---|---|
| `CANDIDATE-RNOTES-001` | producer JSON の `assetDigests` の 1 値を手で書き換えると、assets-dir の実 bytes と不一致になり exit 1、file を書かない | 実 bytes の再計算を省く |
| `CANDIDATE-RNOTES-002` | producer JSON から `sourceRevision` / `assetDigests` / `consumerAnchorDigest` を 1 つずつ消すと、どれも exit 1 で file を書かない | 欠落欄を空文字や既定値で埋める |
| `CANDIDATE-RNOTES-003` | `consumerAnchorDigest` を書き換えると、`<tag>.consumer.sha256` の bytes の SHA-256 と不一致で exit 1 | anchor を producer JSON から素通しする |
| `CANDIDATE-RNOTES-004` | Pack C2 manifest の `artifactSourceCommit` と producer JSON の `sourceRevision` が違うと exit 1 | C1 を片方からだけ読む |
| `CANDIDATE-RNOTES-005` | releaseId と C2 は Pack repo から読み、引数で上書きできない (上書き用の引数が存在しない) | releaseId を引数で受け付ける |
| `CANDIDATE-RNOTES-006` | C1 の `Source-Commit:` trailer が 0 行・2 行・40 桁 hex でない場合、素材が `origin/main` の first-parent 祖先でない場合、前回の素材が今回の真の祖先でない場合に exit 1 | trailer 検査か祖先検査を省く |
| `CANDIDATE-RNOTES-007` | first-parent 上の merge でない commit が「未分類の commit」節に出る | 非 merge commit を捨てる |
| `CANDIDATE-RNOTES-008` | 型の無い PR タイトルが「その他」節に出る。`feat!:` の PR は新機能節に「破壊的変更」付きで出る | 型の判定を緩める / `!` を無視する |
| `CANDIDATE-RNOTES-009` | 同じ入力で 2 回生成すると md と sidecar が byte 単位で一致し、本文に一時 directory の絶対 path が含まれない | 時刻や path を本文に入れる |
| `CANDIDATE-RNOTES-010` | `--check` は、生成後に md の identity 行を 1 文字変えると exit 1 になる。無変更なら exit 0 で file を書かない | `--check` が file を書く / 比較を省く |
| `CANDIDATE-RNOTES-011` | 生成器が起動する子プロセスは `git` だけである (注入した spawn の記録で判定し、`gh` が 0 回) | `gh release create` を実行する |
| `CANDIDATE-RNOTES-012` | 見出し・節名・注記が日本語の固定文で、U+FFFD を含まない | 見出しを英語に戻す |
| `CANDIDATE-RNOTES-013` | `--material` / `--previous-material` / `--previous-sidecar` を渡すと未知の引数として exit 1 | 素材を引数や sidecar から受け取る |
| `CANDIDATE-RNOTES-014` | first-parent 上の `Merge branch 'topic'` (PR でない通常の merge) が「未分類の commit」節に出て、PR 節には出ない | PR subject に一致しない merge を捨てる |
| `CANDIDATE-RNOTES-015` | 生成後に md と sidecar の素材を別の `origin/main` first-parent 祖先へ書き換える (sidecar の `notes_digest` も合わせて再計算する) と、`--check` は `material` の不一致で exit 1 | `--check` が素材を out-dir の file から読む |
| `CANDIDATE-RNOTES-016` | 別の Release で生成した md と sidecar の組 (組の内部では `notes_digest` が整合) を out-dir に置くと、`--check` は `tag` / `c2` / `release_id` の不一致で exit 1。sidecar の `notes_digest` だけを変えても exit 1 | sidecar の Release 束縛か `notes_digest` の照合を省く |
| `CANDIDATE-RNOTES-017` | 前回の tag の C1 に trailer が無いとき、bootstrap 表にある `v0.2.0-canary.3` は `6b5effbc…` を使い、表に無い tag は exit 1。`--previous-tag` が `--tag` と同じ場合、または C2 / releaseId が同じ場合も exit 1 | 表に無い tag を推測で補う / 前回 Release の同一性検査を省く |
| `CANDIDATE-RNOTES-018` | `--tag` に trailer の無い `v0.2.0-canary.3` (bootstrap 表にある) を渡すと exit 1。C1 の本文の途中に `Source-Commit:` 行があり末尾の trailer block に無い場合は 0 行として exit 1 | 表を `--tag` にも適用する / 本文全体を grep する |
