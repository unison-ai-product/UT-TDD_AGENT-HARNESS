---
plan_id: PLAN-L6-816-release-notes-draft-contract
title: "PLAN-L6-816 (add-design): Pack リリースノート下書きの機械生成 (段階 1) の契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-05
updated: 2026-10-05
owner: Claude control lane (契約起草) · Codex worker (L7 実装) · 非著者 frontier reviewer
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 既存 producer (PLAN-L7-628) の出力と Pack C2 の manifest
  を読むだけの operator 補助スクリプトの契約であり、 L0-L3 要件と producer / publication の契約を変えない。新規
  source module の Reverse 対は後続の L7 add-impl PLAN が持つ。
agent_slots:
  - role: tl
    slot_label: TL - identity の信頼根 (producer 出力 / Pack C2 manifest / asset 実 bytes)
      と fail-close 条件を freeze する
  - role: se
    slot_label: SE - local git の first-parent merge から PR 一覧を作り、型ごとの日本語下書きを出す手順を定義する
  - role: qa
    slot_label: QA - 手編集 identity・producer 欄欠落・未分類 commit・公開非実行の反証可能な oracle を定義する
generates:
  - artifact_path: docs/plans/PLAN-L6-816-release-notes-draft-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires:
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/plans/PLAN-L7-532-pack-publication-driver.md
    - docs/plans/PLAN-L7-523-release-version-identity.md
    - docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    - src/cli/distribution.ts
    - src/setup/distribution.ts
    - scripts/pack-canary-acceptance.mjs
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/816
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/807
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 816
admission_receipt:
  schema_version: v2
  receipt_id: certificate:a6607f96be57dfa724ec121c159d1dba
  command_id: plan-draft:issue-816:release-notes-draft-contract:1
  admitted_at: 2026-10-05T11:45:38.401Z
  source_digest: sha256:42d97d166cd7ce33a9eefef3a85d1d52eadefd3bc8fc42577e38cefe89ab2926
  decision_digest: sha256:9c341eef56a0b6dc1bf4d1de17cd2f9efd12a675789abddb089d8d26c7fa124a
  receipt_digest: sha256:825f30800fbaf538e06f5a5a902b6692c147550910082aee9fb36de919c60241
  binding:
    path: docs/plans/PLAN-L6-816-release-notes-draft-contract.md
    plan_id: PLAN-L6-816-release-notes-draft-contract
    asset_id: plan:a6607f96be57dfa724ec121c159d1dba
    revision: 1
    content_digest: sha256:42d97d166cd7ce33a9eefef3a85d1d52eadefd3bc8fc42577e38cefe89ab2926
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 816
    episode_id: E4-816-release-notes-draft
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    revision: 13
    digest: sha256:d61f55125e5d53fd7247758abc29d128e1584fd4ea743a4593b40f1c86f566f2
  reentry:
    target_plan_id: PLAN-L6-816-release-notes-draft-contract
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #816 段階 1 (PO 判断 2026-10-01): Pack リリースノートの下書きを producer
    出力と local git から機械生成する。PLAN-L7-628 の producer 出力を読むだけの operator 補助であり、L6
    で契約を凍結してから L7 add-impl で scripts/ に実装する (前例 PLAN-L6-711)。"
---

# PLAN-L6-816: Pack リリースノート下書きの機械生成 (段階 1) の契約 freeze

## 1. 目的と範囲

Issue #816 の段階 1 を契約として凍結する。Pack Release のノートを、control の手書きではなく機械で下書きする。
下書きは次の 2 つから成る。

- 前回 Release の素材 commit から今回の素材 commit までに source repo の main へ merge された PR を、
  Conventional Commits の型ごとにまとめた一覧。
- release identity。対象は素材 commit、C1、C2、releaseId、5 asset の SHA-256、consumer anchor である。
  これらは producer の出力と Pack repo から差し込み、手で書き写さない。

下書きは operator 票に添付する。control が照合した後に `gh release create --notes-file` で使う。

範囲外:

- 段階 2 (`ut-tdd distribution release-notes` CLI、CHANGELOG.md の生成、利用者影響の節、secret 検査 gate の再利用)。
  段階 2 は canary.3 の後に別 PLAN で freeze する (Issue #816 本文)。
- producer (`distribution package`)、sync-pack、Pack の C1 / C2 作成手順の変更。

## 2. 実測した前提 (origin/main `e0e1da3f`、2026-10-05)

- 生成コードは存在しない。`git grep -n "release-notes" -- src scripts` は 0 件である。
- producer `distribution package --json` の stdout に出るのは `ok` / `tag` / `sourceRevision` / `artifacts` /
  `assetDigests` / `consumerAnchorDigest` だけである (`src/cli/distribution.ts:633-640` の戻り値型、
  `:768-783` の値、`:1291-1293` の JSON 出力)。
  - `sourceRevision` は Pack manifest の `artifactSourceCommit` であり、C1 を指す (`src/cli/distribution.ts:377`)。
  - `assetDigests` は出力 directory の 5 file を読み直した `sha256:` 値である (`:768-774`)。5 file 名は
    `releaseArtifactFileNames(tag)` が決める (`src/setup/distribution.ts:94`)。
  - `consumerAnchorDigest` は `<tag>.consumer.sha256` の file bytes の SHA-256 である (`:781`)。
- C2 と releaseId は stdout に出ない。C2 は Pack tag が指す commit (`resolveTagRevision`、`:355`)、releaseId は
  C2 の `release/manifest.yaml` の `channels.<channel>` である (`:611`)。channel は tag に `-canary.` を含めば
  `canary`、含まなければ `stable` である (`:370`)。
- 素材 commit (source main の SHA) はどこにも機械記録されていない。Pack の C1 / C2 の commit message
  (`chore(pack): materialize reviewed canary.3 inputs` など) にも、sync-pack の JSON
  (`src/cli/distribution.ts:1180-1228`) にも無い。sync-pack は working tree を `cpSync` で写し、`package.json` を
  変換する (`:191-220`)。このため、C1 の manifest `contentDigest` を source の blob と照合して素材 commit を
  導く方法は、改行コード (#807) と変換のせいで成り立たない。
- PR 一覧は local git から決定的に取れる。`git log --first-parent --merges 39d75206..6b5effbc` の
  `Merge pull request #N` と PR タイトル (merge commit の本文 1 行目) は、canary.3 の手書きノートにある
  6 PR (#808 / #812 / #810 / #811 / #760 / #679) と完全に一致した。
- `v0.2.0-canary.3` は 2026-10-05T01:24:07Z に手書きノートで公開済みである
  (`gh release list --repo unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`)。このため、段階 1 を初めて使う Release は
  canary.3 ではなく、次の Release になる。Issue #816 の「canary.3 向け」はこの実測で読み替える。

## 3. 設計判断

advisor 相談: `ut-tdd advisor --decision design --current-model claude-opus-5 --execute` (claude-fable-5、2026-10-05)。
判定は SURVIVE (条件付き) で、A1 と B1 を推奨した。条件として付いた 2 点 (素材 commit 対の永続化、
merge でない first-parent commit の可視化) は §3.1 と §3.3 に入れた。advisor の前提 (producer 出力の欄、
素材 commit が未記録であること、sync-pack が working tree を写すこと) は §2 の実測で確認した。

### 3.1 判断 A: 素材 commit の取得

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A1 (採用)** | operator が今回と前回の素材 commit を引数で渡す。生成器が source repo で検査し、検査に通らなければ fail-close する。下書きには「申告値 (祖先検査のみ)」と明記し、control が照合する | 素材 commit だけは機械導出ではなく申告値になる。ただし検査と表示で、申告値であることが隠れない | 採用 |
| A2 | C1 の manifest `contentDigest` と source blob の全件照合で素材 commit を導く | 改行コード (#807) と `package.json` 変換で偽陰性が出る | 棄却 |
| A3 | Pack の C1 commit に `Source-Commit:` trailer を入れ、機械で読む | Pack の C1 作成手順は別 owner の契約であり、段階 1 の範囲外。既に公開した Release には遡れない | 段階 2 の後続 issue へ回す |

A1 の検査 (全て fail-close、下書きを書かない):

1. `--material` と `--previous-material` は 40 桁の小文字 hex で、source repo に commit として存在する。
2. 両方とも `origin/main` の first-parent 祖先である。
3. `--previous-material` は `--material` の真の祖先である (同一 commit も不可)。

素材 commit 対の永続化: 生成器は下書きと並べて sidecar JSON を出す (§3.4)。次回は `--previous-material` の
代わりに `--previous-sidecar <前回の sidecar>` を渡せる。この場合、前回の素材 commit は sidecar から読み、
sidecar の `notes_digest` と前回の下書き file の照合は行わない (前回の下書きは手元に無いことがある)。
初回 (段階 1 の最初の Release) だけは `--previous-material` を申告値で渡す。

### 3.2 判断 B: 置き場と PLAN の分け方

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **B1 (採用)** | 本 PLAN (L6 add-design) で契約を凍結し、後続の L7 add-impl PLAN と Reverse 対で `scripts/release-notes-draft.mjs` と `tests/release-notes-draft.test.ts` を作る。`ut-tdd` CLI には登録しない | 前例 `scripts/pack-canary-acceptance.mjs` (PLAN-L7-531 所有) と同じ形。Issue の「段階 1 は正式 CLI を作らない」と一致する | 採用 |
| B2 | `src/` に source module を置き、隠し CLI サブコマンドにする | Issue の段階 1 の方針と衝突し、段階 2 の CLI と重複する | 棄却 |
| B3 | 既存 PLAN-L7-628 への delta | 新しい source module を既存 PLAN に積むので、1 PR = 1 論点に反する | 棄却 |

L7 実装 PLAN は `PLAN-L7-816-release-notes-draft` (add-impl、route `add-feature`) と
`PLAN-REVERSE-816-release-notes-draft-backfill` の対で、実装 PR で起票する (前例: PLAN-L6-711 と #722)。
番号の実測: origin/main `e0e1da3f` の `docs/plans` に `PLAN-*-816-*` は無い。

### 3.3 判断 C: PR 一覧の入力源

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **C1 (採用)** | source repo の local git。`git log --first-parent --reverse <previous_material>..<material>` を読む | offline で動き、同じ入力からは同じ出力になる。PR の label や現在のタイトルは取れない (merge 時点のタイトルになる) | 採用 |
| C2 | GitHub API (`gh pr list` / `gh api`) | 現在のタイトルと label が取れる。ただし network と認証に依存し、PR タイトルの後からの編集で出力が変わる | 棄却 (段階 2 で link 付与に限って再検討) |

規則:

- 範囲は `<previous_material>..<material>` の first-parent 列で、古い順に並べる。
- merge commit の subject が `Merge pull request #<N> from <ref>` なら PR として扱う。PR タイトルは merge commit の
  本文で最初の空でない行とする。本文が空なら subject の残りを使わず、「タイトル不明」と表示する。
- merge でない first-parent commit (squash merge や main への直接 push) は捨てない。「未分類の commit」節に
  短縮 SHA と subject を列挙する (advisor 条件 2、fail-visible)。
- 型の判定は PR タイトルに対し `^(feat|fix|docs|test|refactor|perf|build|ci|chore|revert|style)(\([^)]*\))?!?: ` を
  使う。一致しなければ「その他」に入れる (例: #679 のタイトルは型が無いので「その他」)。
- 節の順と見出しは固定する: 新機能 (feat) / 不具合修正 (fix) / 性能 (perf) / リファクタリング (refactor) /
  テスト (test) / 文書 (docs) / CI・ビルド (ci、build) / 雑務 (chore、style) / 取り消し (revert) / その他。
  該当 0 件の節は出さない。`!` 付きの型は節を変えず、行頭に「破壊的変更」と付ける。
- 各行は `- unison-ai-product/UT-TDD_AGENT-HARNESS#<N> <PR タイトル>` とする。PR タイトルは原文のまま載せ、
  翻訳しない。

### 3.4 判断 D: identity の読み方

identity の値は全て、次の 3 つの信頼根から機械で読む。operator が値を入力する欄は、§3.1 の素材 commit だけである。

| 欄 | 読む場所 | 照合 (不一致は fail-close) |
| --- | --- | --- |
| tag | 引数 `--tag` | producer JSON の `tag` と一致する |
| C1 | producer JSON の `sourceRevision` | C2 manifest の `releases[releaseId].artifactSourceCommit` と一致する |
| C2 | `git -C <Pack checkout> rev-parse <tag>^{commit}` | 40 桁 hex。C1 が C2 の first-parent 祖先である |
| releaseId | C2 の `release/manifest.yaml` (`git show <C2>:release/manifest.yaml`) の `channels.<channel>` | `rel-sha256:` + 64 桁 hex。channel は §2 の規則で tag から決める |
| 5 asset の SHA-256 | producer JSON の `assetDigests` | 名前の集合が `releaseArtifactFileNames(tag)` の 5 件と完全に一致する。`--assets-dir` の実 file を読み直した SHA-256 と全件一致する |
| consumer anchor | producer JSON の `consumerAnchorDigest` | `--assets-dir` の `<tag>.consumer.sha256` の file bytes の SHA-256 と一致する |

入力: `--producer-json <file>` (operator が `distribution package --json` の stdout を保存した file)、
`--assets-dir <dir>`、`--pack-repo <dir>`、`--tag <tag>`、`--source-repo <dir>` (既定は cwd)、§3.1 の素材 commit 引数、
`--out-dir <dir>`。

producer JSON の扱い: `ok === true` でなければ拒否する。`tag` / `sourceRevision` / `assetDigests` /
`consumerAnchorDigest` のどれかが無い、型が違う、形式 (40 桁 hex / `sha256:` + 64 桁 hex) に合わない場合は拒否する。
未知の欄は無視する (producer の後方互換を壊さないため)。

### 3.5 判断 E: 出力形式

`--out-dir` に次の 2 file を書く。どちらも UTF-8 (BOM なし)、改行 LF、末尾に改行 1 つとする。
書き込みは全検査が通った後にだけ行い、一部だけ書いた状態を残さない (一時 file に書いてから rename する)。
同名の file が既にあれば上書きせずに失敗する。

1. `<tag>.release-notes.md` (`gh release create --notes-file` に渡す本文):
   1. 見出し `## <tag> (内部 canary)` (stable なら `(安定版)`)。
   2. 「release identity」節: 素材 (「申告値 (祖先検査のみ)」の注記付き) と比較元の素材、C1、C2、releaseId、
      5 asset の SHA-256 (asset 名の辞書順)、consumer anchor。
   3. 「主な変更 (source repo)」節: §3.3 の型別の節と「未分類の commit」節。
   4. 固定の注記: canary は prerelease であり、stable への昇格と `latest` の変更をしないこと。追跡 issue の参照
      (`--tracking-issue <N>` で指定。省略時は注記を出さない)。
2. `<tag>.release-notes.json` (sidecar、canonical JSON、key は辞書順): `schema_version: 1`、`tag`、`channel`、
   `material`、`previous_material`、`c1`、`c2`、`release_id`、`asset_digests`、`consumer_anchor`、`pr_numbers`
   (表示順)、`unclassified_commits`、`notes_digest` (md file の bytes の `sha256:`)。

決定性: 同じ入力からは byte 単位で同じ 2 file を出す。時刻・実行環境・絶対 path は本文と sidecar に入れない。

### 3.6 判断 F: 本文の言語

GitHub に載る本文は日本語とする (CLAUDE.md §GitHub 記載言語)。見出し・節名・注記は日本語の固定文にする。
PR タイトル、コマンド、SHA、asset 名、PR / issue 番号は原文のまま載せる。

### 3.7 判断 G: 自動公開をしない

生成器は下書きと sidecar を書くだけで、公開しない。

- 生成器は `gh` を起動せず、network にも接続しない。git の読み取り (`rev-parse` / `log` / `show` /
  `merge-base` / `cat-file`) 以外の子プロセスを起動しない。
- stdout の最後に、control が使うコマンドを表示するが、実行はしない:
  `gh release create <tag> --repo unison-ai-product/UT-TDD_AGENT-HARNESS-Pack --verify-tag --notes-file <md> [--prerelease] <5 asset>`
  (`--prerelease` は canary のときだけ付ける)。
- `gh release create` は外部に公開する操作なので、operator 票の照合を終えた control (人間の承認を含む) だけが実行する。
  段階 1 では、この経路を機械で自動化しない。

### 3.8 判断 H: control の照合手順 (`--check`)

control は `--check` を付けて、operator と同じ引数で生成器を再実行する。`--check` は file を書かず、再生成した
2 file が `--out-dir` の既存 2 file と byte 単位で一致するかだけを判定する。不一致なら exit 1 で、違う欄を表示する。
これで、下書きを後から手で書き換えた場合と、identity の値を書き写した場合を検出する。
operator 票への添付物は、この 2 file と producer JSON とする。

## 4. 反証可能な oracle (L7 実装 PLAN の test-design で宣言する)

宣言先は `docs/test-design/harness/L7-unit-test-design.md`、test は `tests/release-notes-draft.test.ts` とする。
fixture は一時 directory の git repo (source 側と Pack 側) で作り、実 GitHub と実 producer は使わない。

| ID | oracle | 反証 (この変更を入れると RED) |
| --- | --- | --- |
| U-RNOTES-001 | producer JSON の `assetDigests` の 1 値を手で書き換えると、assets-dir の実 bytes と不一致になり exit 1、file を書かない | 実 bytes の再計算を省く |
| U-RNOTES-002 | producer JSON から `sourceRevision` / `assetDigests` / `consumerAnchorDigest` を 1 つずつ消すと、どれも exit 1 で file を書かない | 欠落欄を空文字や既定値で埋める |
| U-RNOTES-003 | `consumerAnchorDigest` を書き換えると、`<tag>.consumer.sha256` の bytes の SHA-256 と不一致で exit 1 | anchor を producer JSON から素通しする |
| U-RNOTES-004 | Pack C2 manifest の `artifactSourceCommit` と producer JSON の `sourceRevision` が違うと exit 1 | C1 を片方からだけ読む |
| U-RNOTES-005 | releaseId と C2 は Pack repo から読み、引数で上書きできない (上書き用の引数が存在しない) | releaseId を引数で受け付ける |
| U-RNOTES-006 | `--previous-material` が `--material` の祖先でない、同一、または `origin/main` の first-parent 祖先でない場合に exit 1 | 祖先検査を省く |
| U-RNOTES-007 | first-parent 上の merge でない commit が「未分類の commit」節に出る | 非 merge commit を捨てる |
| U-RNOTES-008 | 型の無い PR タイトルが「その他」節に出る。`feat!:` の PR は新機能節に「破壊的変更」付きで出る | 型の判定を緩める / `!` を無視する |
| U-RNOTES-009 | 同じ入力で 2 回生成すると md と sidecar が byte 単位で一致し、本文に一時 directory の絶対 path が含まれない | 時刻や path を本文に入れる |
| U-RNOTES-010 | `--check` は、生成後に md の identity 行を 1 文字変えると exit 1 になる。無変更なら exit 0 で file を書かない | `--check` が file を書く / 比較を省く |
| U-RNOTES-011 | 生成器が起動する子プロセスは `git` だけである (注入した spawn の記録で判定し、`gh` が 0 回) | `gh release create` を実行する |
| U-RNOTES-012 | 見出し・節名・注記が日本語の固定文で、U+FFFD を含まない | 見出しを英語に戻す |
| U-RNOTES-013 | `--previous-sidecar` を渡すと前回の素材 commit を sidecar から読み、`--previous-material` との同時指定は exit 1 | sidecar と申告値を混ぜる |

## 5. Schedule (serial)

1. [直列] PR-0 (本 PR): 本 PLAN の draft。src / scripts / tests / test-design は変更しない (直列理由 = downstream_dependency)。
2. [直列] PR-0 の closing review (非著者 family の frontier tier) と confirm。
3. [直列] PR-1: `PLAN-L7-816-release-notes-draft` と `PLAN-REVERSE-816-release-notes-draft-backfill` を起票し、
   §4 の oracle を test-design に宣言する。Red の test を先に作り、`scripts/release-notes-draft.mjs` を実装する
   (直列理由 = verification_gate)。
4. [直列] 次の Pack Release で、operator が下書きを作り、control が `--check` で照合した後に公開する。
   結果を Issue #816 に記録する。

## 6. 非対象と残余リスク

- 素材 commit は申告値のままである (§3.1)。祖先検査で、存在しない commit・main の外の commit・順序の逆転は防げる。
  ただし、main 上の別の commit を素材と申告する取り違えは検出できない。control は sync-pack を実行した時の
  source HEAD と照合する。根本対策は A3 (C1 の trailer) であり、段階 2 の後続 issue で扱う。
- PR タイトルは merge 時点のものである。後からの PR タイトル編集は反映されない。
- secret / 個人 path の検査 gate (#806 / #815) は段階 2 で再利用する。段階 1 は、絶対 path を本文に入れないこと
  (U-RNOTES-009) だけを保証する。
