---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-816-release-notes-draft-contract.md
pair_artifact: docs/test-design/harness/L7-release-notes-draft-test-design.md
---

# Pack リリースノート下書きの機械生成 (段階 1) の契約 (Issue #816)

状態: 未実装の目標契約。生成コードは存在しない (2026-10-14 実測: `git grep -n "release-notes" -- src scripts` が 0 件、`scripts/release-notes-draft.mjs` も `tests/release-notes-draft.test.ts` も無い)。実装は後続の L7 add-impl PLAN と Reverse 対で行う。

Pack Release のノートを control の手書きではなく機械で下書きする。下書きは (1) 前回 Release の素材 commit から今回の素材 commit までに source repo の main へ merge された PR を Conventional Commits の型ごとにまとめた一覧と、(2) release identity (素材 commit、C1、C2、releaseId、5 asset の SHA-256、consumer anchor) から成る。identity は producer の出力と Pack repo から差し込み、手で書き写さない。下書きは operator 票に添付し、control が照合した後に `gh release create --notes-file` で使う。

範囲外: 段階 2 (`ut-tdd distribution release-notes` CLI、CHANGELOG.md の生成、利用者影響の節、secret 検査 gate の再利用。canary.3 の後に別契約)、producer (`distribution package`)・sync-pack・Pack の C1 / C2 作成手順の変更。`v0.2.0-canary.3` は 2026-10-05 に手書きノートで公開済みのため、段階 1 を初めて使う Release は次の Release になる。

## 1. 現行実装の前提 (origin/main `e0e1da3f`、2026-10-05 実測)

- producer `distribution package --json` の stdout に出るのは `ok` / `tag` / `sourceRevision` / `artifacts` / `assetDigests` / `consumerAnchorDigest` だけ (`src/cli/distribution.ts:633-640,768-783,1291-1293`)。`sourceRevision` は Pack manifest の `artifactSourceCommit` で C1 を指す (`:377`)。`assetDigests` は出力 directory の 5 file を読み直した `sha256:` 値で、5 file 名は `releaseArtifactFileNames(tag)` が決める (`src/setup/distribution.ts:94`)。`consumerAnchorDigest` は `<tag>.consumer.sha256` の file bytes の SHA-256 (`:781`)。
- C2 と releaseId は stdout に出ない。C2 は Pack tag が指す commit (`resolveTagRevision`、`:355`)、releaseId は C2 の `release/manifest.yaml` の `channels.<channel>` (`:611`)。channel は tag に `-canary.` を含めば `canary`、含まなければ `stable` (`:370`)。
- 素材 commit (source main の SHA) はどこにも機械記録されていない。Pack の C1 / C2 の commit message にも sync-pack の JSON (`:1180-1228`) にも無く、sync-pack は working tree を `cpSync` で写し `package.json` を変換する (`:191-220`)。C1 の manifest `contentDigest` を source の blob と照合して素材 commit を導く方法は、改行コード (#807) と変換のせいで成り立たない。
- PR 一覧は local git から決定的に取れる。`git log --first-parent --merges 39d75206..6b5effbc` の `Merge pull request #N` と PR タイトルは、canary.3 の手書きノートの 6 PR (#808 / #812 / #810 / #811 / #760 / #679) と完全に一致した。

## 2. 設計判断 (advisor `claude-fable-5`、2026-10-05、SURVIVE 条件付き。A1 と B1 を推奨)

### 判断 A: 素材 commit の信頼根

素材 commit を引数や sidecar から受け取る経路は持たない (別の `origin/main` first-parent 祖先へ置き換えても祖先検査は通り、`--check` も同じ改変入力から再生成するので成功してしまうため)。push 後に改変できない記録から導く。

| 記録 | 素材 commit を持つか | 改変への耐性 | 判定 |
|---|---|---|---|
| sync-pack の JSON (`.ut-tdd/pack-sync/<tag>.sync-pack.json`) | 持たない (`export.sourceTag` だけで、`--tag` を省くと HEAD の短縮 SHA) | git 管理外の local file で書き換え可 | 不採用 |
| Pack の C1 / C2 の commit message | いまは持たない | push 後は git object として不変。C1 は manifest の `artifactSourceCommit` を介して C2 と releaseId に結び付く | 次の Release から trailer を載せて採用 |
| GitHub Release の本文 | 手書きで持つ | 後から編集できる | 不採用 (bootstrap 値の出典としてだけ記録) |
| operator 票 / 公開記録 | 機械可読な保存先が repo に無い | - | 不採用 |

採用 (新しい保存先は作らない):

1. **C1 の trailer を段階 1 の operator 手順の必須要件にする**。sync-pack は commit しない。operator は sync-pack を実行した source の HEAD を、Pack の C1 の commit message に trailer `Source-Commit: <40 桁 hex>` として 1 行書く。operator 票には sync-pack 実行時の `git -C <source> rev-parse HEAD` の出力と、その直前の `git -C <source> status --porcelain` が空であることを貼る (sync-pack は working tree を写すので、dirty だと trailer の commit と C1 の中身が対応しない)。control は C1 が push された後に、Pack repo の C1 (git object) の trailer を operator 票の値と照合し、一致と clean tree の両方を確認してから下書きを作る (push 前の照合は照合後の amend を防げないため採らない)。
2. **今回の素材**は `--tag` の C1 の trailer から読む。
3. **前回の素材**は `--previous-tag` の C1' の trailer から読む。C1' は前回の tag が指す C2' の `release/manifest.yaml` の `releases[channels.<channel>].artifactSourceCommit`。前回の identity (tag'、C2'、releaseId'、C1'、素材') は毎回 Pack repo から導き直し、sidecar からは読まない。
4. **bootstrap 表**: trailer を持たない既存 Release のために、生成器に固定の表を 1 件だけ置く (`v0.2.0-canary.3 → 6b5effbc055af2dbd083a256b6cb76edec97014f`。出典は canary.3 の公開本文で、1 の 6 PR 一致で裏付けた)。表は引数で上書きできず変えるには PR の review を通す。trailer が無く表にも無い tag は拒否する。表は `--previous-tag` の素材を導くときだけ使い、`--tag` の C1 に trailer が無ければ表にある tag でも拒否する。

検査 (全て fail-close、file を書かない):

1. C1 の `Source-Commit:` trailer がちょうど 1 行で 40 桁の小文字 hex。0 行や 2 行以上は拒否。trailer は commit message 末尾の trailer block (`git interpret-trailers --parse` と同じ範囲) からだけ読み、本文の途中にある同名の行は数えない。
2. 今回と前回の素材がどちらも source repo に commit として存在し、`origin/main` の first-parent 祖先である。
3. 前回の素材は今回の素材の真の祖先である (同一 commit も不可)。
4. `--previous-tag` は `--tag` と異なり、C2' ≠ C2 かつ releaseId' ≠ releaseId である。

素材 commit・前回の素材・sidecar を受け取る引数 (`--material` / `--previous-material` / `--previous-sidecar`) は存在せず、渡されたら未知の引数として拒否する。

### 判断 B: 置き場

| 案 | 内容 | 判定 |
|---|---|---|
| **B1 (採用)** | 契約を凍結し、後続の L7 add-impl PLAN (`PLAN-L7-816-release-notes-draft`) と Reverse 対 (`PLAN-REVERSE-816-release-notes-draft-backfill`) で `scripts/release-notes-draft.mjs` と `tests/release-notes-draft.test.ts` を作る。`ut-tdd` CLI には登録しない | 前例 `scripts/pack-canary-acceptance.mjs` (PLAN-L7-531 所有) と同じ形。段階 1 は正式 CLI を作らない |
| B2 | `src/` に source module を置き隠し CLI サブコマンドにする | 段階 2 の CLI と重複する。棄却 |
| B3 | 既存 PLAN-L7-628 への delta | 新しい source module を既存 PLAN に積み 1 PR = 1 論点に反する。棄却 |

### 判断 C: PR 一覧の入力源

| 案 | 内容 | 判定 |
|---|---|---|
| **C1 (採用)** | source repo の local git。`git log --first-parent --reverse <previous_material>..<material>` | offline で動き同じ入力から同じ出力になる。PR の label や現在のタイトルは取れない (merge 時点のタイトルになる) |
| C2 | GitHub API (`gh pr list` / `gh api`) | network と認証に依存し、PR タイトルの後からの編集で出力が変わる。棄却 (段階 2 で link 付与に限って再検討) |

規則:

- 範囲は `<previous_material>..<material>` の first-parent 列で古い順。
- merge commit の subject が `^Merge pull request #(\d+) from \S+$` なら PR として扱い、PR タイトルは merge commit の本文で最初の空でない行。本文が空なら「タイトル不明」と表示する。
- PR merge の subject に一致しない first-parent commit は、merge かどうかを問わず全て「未分類の commit」節に短縮 SHA と subject を列挙する (通常の branch merge `Merge branch 'x'`、squash merge、main への直接 push を含む。捨てる分岐と拒否する分岐は持たない = fail-visible)。
- 型の判定は PR タイトルに `^(feat|fix|docs|test|refactor|perf|build|ci|chore|revert|style)(\([^)]*\))?!?: ` を使い、一致しなければ「その他」に入れる (例: #679 は型が無いので「その他」)。
- 節の順と見出しは固定: 新機能 (feat) / 不具合修正 (fix) / 性能 (perf) / リファクタリング (refactor) / テスト (test) / 文書 (docs) / CI・ビルド (ci、build) / 雑務 (chore、style) / 取り消し (revert) / その他。該当 0 件の節は出さない。`!` 付きの型は節を変えず、行頭に「破壊的変更」と付ける。
- 各行は `- unison-ai-product/UT-TDD_AGENT-HARNESS#<N> <PR タイトル>`。PR タイトルは原文のまま、翻訳しない。

### 判断 D: identity の読み方

identity の値は全て次の信頼根から機械で読む。operator が値を入力する欄は無い (素材 commit も判断 A の trailer から読む)。

| 欄 | 読む場所 | 照合 (不一致は fail-close) |
|---|---|---|
| tag | 引数 `--tag` | producer JSON の `tag` と一致 |
| C1 | producer JSON の `sourceRevision` | C2 manifest の `releases[releaseId].artifactSourceCommit` と一致 |
| C2 | `git -C <Pack checkout> rev-parse <tag>^{commit}` | 40 桁 hex。C1 が C2 の first-parent 祖先 |
| releaseId | C2 の `release/manifest.yaml` (`git show <C2>:release/manifest.yaml`) の `channels.<channel>` | `rel-sha256:` + 64 桁 hex。channel は 1 の規則で tag から決める |
| 5 asset の SHA-256 | producer JSON の `assetDigests` | 名前の集合が `releaseArtifactFileNames(tag)` の 5 件と完全一致。`--assets-dir` の実 file を読み直した SHA-256 と全件一致 |
| consumer anchor | producer JSON の `consumerAnchorDigest` | `--assets-dir` の `<tag>.consumer.sha256` の file bytes の SHA-256 と一致 |

入力: `--producer-json <file>` (operator が `distribution package --json` の stdout を保存した file)、`--assets-dir <dir>`、`--pack-repo <dir>`、`--tag <tag>`、`--previous-tag <tag>`、`--source-repo <dir>` (既定は cwd)、`--out-dir <dir>`、任意の `--tracking-issue <N>`、`--check`。producer JSON は `ok === true` でなければ拒否し、`tag` / `sourceRevision` / `assetDigests` / `consumerAnchorDigest` のどれかが無い・型違い・形式不一致 (40 桁 hex / `sha256:` + 64 桁 hex) は拒否する。未知の欄は無視する (producer の後方互換を壊さないため)。

### 判断 E: 出力形式

`--out-dir` に 2 file を書く。どちらも UTF-8 (BOM なし)、改行 LF、末尾に改行 1 つ。書き込みは全検査が通った後にだけ行い、一時 file に書いてから rename して一部だけ書いた状態を残さない。同名の file が既にあれば上書きせず失敗する。

1. `<tag>.release-notes.md` (`gh release create --notes-file` に渡す本文): (1) 見出し `## <tag> (内部 canary)` (stable なら `(安定版)`)。(2) 「release identity」節: 素材 (C1 の trailer から導いた値) と比較元の素材、C1、C2、releaseId、5 asset の SHA-256 (asset 名の辞書順)、consumer anchor。(3) 「主な変更 (source repo)」節: 判断 C の型別の節と「未分類の commit」節。(4) 固定の注記: canary は prerelease であり stable への昇格と `latest` の変更をしないこと、追跡 issue の参照 (`--tracking-issue <N>` 指定時のみ)。
2. `<tag>.release-notes.json` (sidecar、canonical JSON、key は辞書順): `schema_version: 1`、`tag`、`channel`、`material`、`previous_tag`、`previous_c2`、`previous_release_id`、`previous_material`、`previous_material_source` (`c1-trailer` か `bootstrap-table`)、`c1`、`c2`、`release_id`、`asset_digests`、`consumer_anchor`、`pr_numbers` (表示順)、`unclassified_commits`、`notes_digest` (md file の bytes の `sha256:`)。sidecar は出力であり `--check` の照合対象だが次回の入力にはしない。

決定性: 同じ入力からは byte 単位で同じ 2 file を出す。時刻・実行環境・絶対 path は本文と sidecar に入れない。

### 判断 F: 本文の言語

GitHub に載る本文は日本語 (`CLAUDE.md` §GitHub 記載言語)。見出し・節名・注記は日本語の固定文。PR タイトル、コマンド、SHA、asset 名、PR / issue 番号は原文のまま。

### 判断 G: 自動公開をしない

生成器は下書きと sidecar を書くだけで公開しない。`gh` を起動せず network にも接続せず、git の読み取り (`rev-parse` / `log` / `show` / `merge-base` / `cat-file`) 以外の子プロセスを起動しない。stdout の最後に control が使うコマンドを表示するが実行しない: `gh release create <tag> --repo unison-ai-product/UT-TDD_AGENT-HARNESS-Pack --verify-tag --notes-file <md> [--prerelease] <5 asset>` (`--prerelease` は canary のときだけ)。`gh release create` は外部に公開する操作なので、operator 票の照合を終えた control (人間の承認を含む) だけが実行し、段階 1 ではこの経路を機械で自動化しない。

### 判断 H: control の照合手順 (`--check`)

control は `--check` を付けて operator と同じ引数で生成器を再実行する。`--check` は file を書かず、再生成した 2 file が `--out-dir` の既存 2 file と byte 単位で一致するかを判定する。加えて既存 sidecar の `tag` / `c2` / `release_id` / `c1` / `material` / `previous_tag` / `previous_c2` / `previous_release_id` / `previous_material` が再生成値と一致し、`notes_digest` が既存 md の bytes の SHA-256 と一致することを欄ごとに検査する。不一致なら exit 1 で違う欄の名前を表示する。これで、下書きを後から手で書き換えた場合、identity の値を書き写した場合、素材を別の祖先へ置き換えた場合、別の Release の sidecar が混ざった場合を検出する。operator 票への添付物は、この 2 file と producer JSON とする。

## 3. 責務どうしの依存

- identity の読み取り (判断 D) は producer JSON と Pack repo の C2 manifest に依存し、素材 commit (判断 A) は C1 の trailer に依存する。C1 の trailer を書く手順 (operator) は、本契約の前提である operator 手順の成果。
- PR 一覧 (判断 C) は判断 A の検査 (祖先関係) を通過した素材の対に依存する。
- `--check` (判断 H) は同じ入力からの再生成 (判断 E の決定性) に依存する。
- secret / 個人 path の検査 gate (#806 / #815) は段階 2 で再利用する。段階 1 は絶対 path を本文に入れないこと (CANDIDATE-RNOTES-009) だけを保証する。

## 4. 残余リスク

素材 commit の信頼根は operator が C1 に書く trailer。push 後の改変は git object の不変性で防げるが、C1 を作る時点で operator が別の commit を書く取り違えは機械では検出できない (operator 票の `rev-parse HEAD` と clean tree の確認、C1 push 後の control の照合で防ぐ。sync-pack 自身が素材 commit を記録する仕組みは段階 2)。bootstrap 表の 1 件は公開本文という編集可能な出典に依る (6 PR の一致で裏付けたうえで tracked code として review を通す)。PR タイトルは merge 時点のもので後からの編集は反映されない。

## 5. 検証 oracle

`docs/test-design/harness/L7-release-notes-draft-test-design.md` の `CANDIDATE-RNOTES-001..018`。
