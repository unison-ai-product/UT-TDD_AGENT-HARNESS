---
plan_id: PLAN-L6-816-release-notes-draft-contract
title: "PLAN-L6-816 (add-design): Pack リリースノート下書きの機械生成 (段階 1) の契約 freeze"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-05
updated: 2026-10-09
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
review_evidence:
  - reviewer: gpt-6.1-sol
    review_kind: cross_agent
    reviewed_at: 2026-10-09T04:01:55.809Z
    tests_green_at: 2026-10-09T03:56:52Z
    verdict: pass
    worker_model: claude-opus-5-5
    reviewer_model: gpt-6.1-sol
    subject_head: 5d0ef7198e33ce04e7a9a7661d615029c58af16c
    scope: PR 933 exact head 5d0ef7198e33ce04e7a9a7661d615029c58af16c (本 PLAN 本文は PR
      843 最終 head 95ca4efb と同一) に対する非著者 post-green evidence review (Sol)。PR 843
      の先行 PASS receipt (b375dd7b…) は CI green (02:27Z) より前の 02:08Z に出たものであるため、CI
      run 37879977558 green 後に取った本 review を confirm の拘束証跡とする。receipt は reviewer
      family codex / verdict PASS / blocking 0 を記録している。
    green_commands:
      - kind: unit_test
        command: node scripts/run-vitest-snapshot.ts (harness-check-linux /
          harness-check-windows full 回帰、CI run 37879977558)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-09T03:56:52Z
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: sha256:7cfc96eb7d27b84c7b67cc6baf253db1a42589f2a0637aaeb630e38718b2ad3a
        anchor_commit: 5d0ef7198e33ce04e7a9a7661d615029c58af16c
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/933
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/37879977558
      - .ut-tdd/review/receipts/5e73eb79c0bf5f9107b5a55cb1113166940989768fe76bc56f6e9ddb49ceb131.json
status: confirmed
sub_doc: function-spec
github_issue_id: 816
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0b0dfbee547b17e8b5da1625d4cb2a69
  command_id: plan-revise:issue-816:l6-stale-note-fix:r3:9f94fd8654fd
  admitted_at: 2026-10-09T07:58:21.970Z
  source_digest: sha256:3d6a0fe7c0511bcc1533a19e8829b76d42bcea5d22a246a60eb20ba791fae835
  decision_digest: sha256:3841029a367e41a1d25dab332a293cfaf6252cee7839b8c649fe4e1e8608a681
  receipt_digest: sha256:ac7a42f9758455807321b010ac0de2153e7ec213ca55d5da5d39a99ed330dda5
  binding:
    path: docs/plans/PLAN-L6-816-release-notes-draft-contract.md
    plan_id: PLAN-L6-816-release-notes-draft-contract
    asset_id: plan:2f5be4ac3a56270474529ae239e69d4d
    revision: 3
    content_digest: sha256:3d6a0fe7c0511bcc1533a19e8829b76d42bcea5d22a246a60eb20ba791fae835
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
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #816: L7 準備で見つかった §3.4 / §3.5 の古い注記 (rev 2 F1 以前の記述)
    を訂正する。契約・oracle は変えない。"
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

### 3.1 判断 A: 素材 commit の信頼根 (rev 2)

rev 1 は素材 commit を operator の申告値とし、前回の素材を前回の sidecar から継承していた。closing review (PR #843 Sol r1 F1) の
指摘どおり、この方式では申告値や sidecar の素材を別の `origin/main` first-parent 祖先へ置き換えても祖先検査は通り、
`--check` も同じ改変入力から再生成するので成功してしまう。別の Release の sidecar が混ざっても拒否できない。
rev 2 では、素材 commit を引数や sidecar から受け取る経路を廃止し、push 後に改変できない記録から導く。

既存の記録の実測 (2026-10-05):

| 記録 | 素材 commit を持つか | 改変への耐性 | 判定 |
| --- | --- | --- | --- |
| sync-pack の JSON (`.ut-tdd/pack-sync/<tag>.sync-pack.json`) | 持たない。持つのは `export.sourceTag` だけで、`--tag` を省くと HEAD の短縮 SHA になる (`src/cli/distribution.ts:76-78`) | git 管理外の local file で、書き換えられる | 不採用 |
| Pack の C1 / C2 の commit message | いまは持たない (§2) | push した後は git object として不変。C1 は manifest の `artifactSourceCommit` を介して C2 と releaseId に結び付く | 次の Release から trailer を載せて採用 |
| GitHub Release の本文 | 手書きで持つ (canary.2 / canary.3) | 後から編集できる | 不採用 (bootstrap 値の出典としてだけ記録する) |
| operator 票 / 公開記録 | 機械可読な保存先が repo に定義されていない (`git grep -n "operator 票" -- docs src` は 0 件) | - | 不採用 |

採用 (新しい保存先は作らない):

1. **C1 の trailer を段階 1 の operator 手順の必須要件にする。** sync-pack は commit しない (`src/cli/distribution.ts:1216-1221` の
   `nextCommands` は表示だけ)。operator は、sync-pack を実行した source の HEAD を、Pack の C1 の commit message に
   trailer `Source-Commit: <40 桁 hex>` として 1 行だけ書く。operator 票には sync-pack 実行時の
   `git -C <source> rev-parse HEAD` の出力と、その直前の `git -C <source> status --porcelain` が空であることを貼る (rev 3)。sync-pack は
   working tree を `cpSync` で写すため (`src/cli/distribution.ts:219`)、tree が dirty だと trailer の commit と C1 の中身が対応しない。
   control は C1 が push された後に、Pack repo の C1 (git object) の trailer を operator 票の値と照合し、一致と clean tree の両方を
   確認してから下書きを作る (push 前の照合は、照合後の amend を防げないため採らない、rev 3)。
   rev 1 で段階 2 へ回した A3 を、この理由で段階 1 に繰り上げる。
2. **今回の素材**は、`--tag` の C1 の trailer から読む。
3. **前回の素材**は、`--previous-tag` の C1' の trailer から読む。C1' は、前回の tag が指す C2' の `release/manifest.yaml` の
   `releases[channels.<channel>].artifactSourceCommit` である。前回の identity (tag'、C2'、releaseId'、C1'、素材') は
   毎回 Pack repo から導き直し、sidecar からは読まない。
4. **bootstrap 表**: trailer を持たない既存 Release のために、生成器に固定の表を 1 件だけ置く。
   `v0.2.0-canary.3 → 6b5effbc055af2dbd083a256b6cb76edec97014f`。出典は canary.3 の公開本文で、§2 の 6 PR 一致で裏付けた。
   表は引数で上書きできず、変えるには PR の review を通す。trailer が無く、表にも無い tag は拒否する。
   表は `--previous-tag` の素材を導くときだけ使う。`--tag` の C1 に trailer が無ければ、表にある tag でも拒否する (rev 3)。

検査 (全て fail-close、file を書かない):

1. C1 の `Source-Commit:` trailer がちょうど 1 行で、40 桁の小文字 hex である。0 行や 2 行以上は拒否する。trailer は commit message
   末尾の trailer block (`git interpret-trailers --parse` と同じ範囲) からだけ読み、本文の途中にある同名の行は数えない (rev 3)。
   解析の細部は L7 の test-design で固定する。
2. 今回と前回の素材が、どちらも source repo に commit として存在し、`origin/main` の first-parent 祖先である。
3. 前回の素材は今回の素材の真の祖先である (同一 commit も不可)。
4. `--previous-tag` は `--tag` と異なり、C2' ≠ C2 かつ releaseId' ≠ releaseId である。

素材 commit、前回の素材、sidecar を受け取る引数 (`--material` / `--previous-material` / `--previous-sidecar`) は存在しない。
渡されたら未知の引数として拒否する。

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
- PR merge の subject (`^Merge pull request #(\d+) from \S+$`) に一致しない first-parent commit は、merge かどうかを問わず
  全て「未分類の commit」節に、短縮 SHA と subject を列挙する (rev 2、PR #843 Sol r1 F2)。通常の branch merge
  (`Merge branch 'x'`)、squash merge、main への直接 push を含む。捨てる分岐と拒否する分岐は持たない
  (advisor 条件 2、fail-visible)。
- 型の判定は PR タイトルに対し `^(feat|fix|docs|test|refactor|perf|build|ci|chore|revert|style)(\([^)]*\))?!?: ` を
  使う。一致しなければ「その他」に入れる (例: #679 のタイトルは型が無いので「その他」)。
- 節の順と見出しは固定する: 新機能 (feat) / 不具合修正 (fix) / 性能 (perf) / リファクタリング (refactor) /
  テスト (test) / 文書 (docs) / CI・ビルド (ci、build) / 雑務 (chore、style) / 取り消し (revert) / その他。
  該当 0 件の節は出さない。`!` 付きの型は節を変えず、行頭に「破壊的変更」と付ける。
- 各行は `- unison-ai-product/UT-TDD_AGENT-HARNESS#<N> <PR タイトル>` とする。PR タイトルは原文のまま載せ、
  翻訳しない。

### 3.4 判断 D: identity の読み方

identity の値は全て、次の 3 つの信頼根から機械で読む。operator が値を入力する欄は無い。素材 commit も、§3.1 の C1 `Source-Commit:` trailer から機械で読む。

| 欄 | 読む場所 | 照合 (不一致は fail-close) |
| --- | --- | --- |
| tag | 引数 `--tag` | producer JSON の `tag` と一致する |
| C1 | producer JSON の `sourceRevision` | C2 manifest の `releases[releaseId].artifactSourceCommit` と一致する |
| C2 | `git -C <Pack checkout> rev-parse <tag>^{commit}` | 40 桁 hex。C1 が C2 の first-parent 祖先である |
| releaseId | C2 の `release/manifest.yaml` (`git show <C2>:release/manifest.yaml`) の `channels.<channel>` | `rel-sha256:` + 64 桁 hex。channel は §2 の規則で tag から決める |
| 5 asset の SHA-256 | producer JSON の `assetDigests` | 名前の集合が `releaseArtifactFileNames(tag)` の 5 件と完全に一致する。`--assets-dir` の実 file を読み直した SHA-256 と全件一致する |
| consumer anchor | producer JSON の `consumerAnchorDigest` | `--assets-dir` の `<tag>.consumer.sha256` の file bytes の SHA-256 と一致する |

入力: `--producer-json <file>` (operator が `distribution package --json` の stdout を保存した file)、
`--assets-dir <dir>`、`--pack-repo <dir>`、`--tag <tag>`、`--previous-tag <tag>`、`--source-repo <dir>` (既定は cwd)、
`--out-dir <dir>`。素材 commit は §3.1 のとおり Pack の C1 trailer から読み、引数では受け取らない。

producer JSON の扱い: `ok === true` でなければ拒否する。`tag` / `sourceRevision` / `assetDigests` /
`consumerAnchorDigest` のどれかが無い、型が違う、形式 (40 桁 hex / `sha256:` + 64 桁 hex) に合わない場合は拒否する。
未知の欄は無視する (producer の後方互換を壊さないため)。

### 3.5 判断 E: 出力形式

`--out-dir` に次の 2 file を書く。どちらも UTF-8 (BOM なし)、改行 LF、末尾に改行 1 つとする。
書き込みは全検査が通った後にだけ行い、一部だけ書いた状態を残さない (一時 file に書いてから rename する)。
同名の file が既にあれば上書きせずに失敗する。

1. `<tag>.release-notes.md` (`gh release create --notes-file` に渡す本文):
   1. 見出し `## <tag> (内部 canary)` (stable なら `(安定版)`)。
   2. 「release identity」節: 素材 (C1 の `Source-Commit:` trailer から導いた値。C1 の push 後は不変) と比較元の素材、C1、C2、releaseId、
      5 asset の SHA-256 (asset 名の辞書順)、consumer anchor。
   3. 「主な変更 (source repo)」節: §3.3 の型別の節と「未分類の commit」節。
   4. 固定の注記: canary は prerelease であり、stable への昇格と `latest` の変更をしないこと。追跡 issue の参照
      (`--tracking-issue <N>` で指定。省略時は注記を出さない)。
2. `<tag>.release-notes.json` (sidecar、canonical JSON、key は辞書順): `schema_version: 1`、`tag`、`channel`、
   `material`、`previous_tag`、`previous_c2`、`previous_release_id`、`previous_material`、`previous_material_source`
   (`c1-trailer` か `bootstrap-table`)、`c1`、`c2`、`release_id`、`asset_digests`、`consumer_anchor`、`pr_numbers`
   (表示順)、`unclassified_commits`、`notes_digest` (md file の bytes の `sha256:`)。sidecar は出力であり `--check` の照合対象だが、
   次回の入力にはしない (§3.1)。

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
2 file が `--out-dir` の既存 2 file と byte 単位で一致するかを判定する。加えて、既存 sidecar の `tag` / `c2` / `release_id` / `c1` /
`material` / `previous_tag` / `previous_c2` / `previous_release_id` / `previous_material` が再生成値と一致し、`notes_digest` が既存 md の
bytes の SHA-256 と一致することを欄ごとに検査する (rev 2)。不一致なら exit 1 で、違う欄の名前を表示する。
これで、下書きを後から手で書き換えた場合、identity の値を書き写した場合、素材を別の祖先へ置き換えた場合、
別の Release の sidecar が混ざった場合を検出する。
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
| U-RNOTES-006 | C1 の `Source-Commit:` trailer が 0 行・2 行・40 桁 hex でない場合、素材が `origin/main` の first-parent 祖先でない場合、前回の素材が今回の真の祖先でない場合に exit 1 | trailer 検査か祖先検査を省く |
| U-RNOTES-007 | first-parent 上の merge でない commit が「未分類の commit」節に出る | 非 merge commit を捨てる |
| U-RNOTES-008 | 型の無い PR タイトルが「その他」節に出る。`feat!:` の PR は新機能節に「破壊的変更」付きで出る | 型の判定を緩める / `!` を無視する |
| U-RNOTES-009 | 同じ入力で 2 回生成すると md と sidecar が byte 単位で一致し、本文に一時 directory の絶対 path が含まれない | 時刻や path を本文に入れる |
| U-RNOTES-010 | `--check` は、生成後に md の identity 行を 1 文字変えると exit 1 になる。無変更なら exit 0 で file を書かない | `--check` が file を書く / 比較を省く |
| U-RNOTES-011 | 生成器が起動する子プロセスは `git` だけである (注入した spawn の記録で判定し、`gh` が 0 回) | `gh release create` を実行する |
| U-RNOTES-012 | 見出し・節名・注記が日本語の固定文で、U+FFFD を含まない | 見出しを英語に戻す |
| U-RNOTES-013 | `--material` / `--previous-material` / `--previous-sidecar` を渡すと未知の引数として exit 1 | 素材を引数や sidecar から受け取る |
| U-RNOTES-014 | first-parent 上の `Merge branch 'topic'` (PR でない通常の merge) が「未分類の commit」節に出て、PR 節には出ない | PR subject に一致しない merge を捨てる |
| U-RNOTES-015 | 生成後に md と sidecar の素材を別の `origin/main` first-parent 祖先へ書き換える (sidecar の `notes_digest` も合わせて再計算する) と、`--check` は `material` の不一致で exit 1 | `--check` が素材を out-dir の file から読む |
| U-RNOTES-016 | 別の Release で生成した md と sidecar の組 (組の内部では `notes_digest` が整合) を out-dir に置くと、`--check` は `tag` / `c2` / `release_id` の不一致で exit 1。sidecar の `notes_digest` だけを変えても exit 1 | sidecar の Release 束縛か `notes_digest` の照合を省く |
| U-RNOTES-018 | `--tag` に trailer の無い `v0.2.0-canary.3` (bootstrap 表にある) を渡すと exit 1。C1 の本文の途中に `Source-Commit:` 行があり、末尾の trailer block に無い場合は 0 行として exit 1 | 表を `--tag` にも適用する / 本文全体を grep する |
| U-RNOTES-017 | 前回の tag の C1 に trailer が無いとき、bootstrap 表にある `v0.2.0-canary.3` は `6b5effbc…` を使い、表に無い tag は exit 1。`--previous-tag` が `--tag` と同じ場合、または C2 / releaseId が同じ場合も exit 1 | 表に無い tag を推測で補う / 前回 Release の同一性検査を省く |

## 5. Schedule (serial)

1. [直列] PR-0 (本 PR): 本 PLAN の draft。src / scripts / tests / test-design は変更しない (直列理由 = downstream_dependency)。
2. [直列] PR-0 の closing review (非著者 family の frontier tier) と confirm。
3. [直列] PR-1: `PLAN-L7-816-release-notes-draft` と `PLAN-REVERSE-816-release-notes-draft-backfill` を起票し、
   §4 の oracle を test-design に宣言する。Red の test を先に作り、`scripts/release-notes-draft.mjs` を実装する
   (直列理由 = verification_gate)。
4. [直列] 次の Pack Release で、operator が C1 に `Source-Commit:` trailer を書き (§3.1)、下書きを作り、control が `--check` で照合した後に公開する。
   結果を Issue #816 に記録する。

## 6. 非対象と残余リスク

- 素材 commit の信頼根は、operator が C1 に書く trailer である (§3.1、rev 2)。push した後の改変は git object の不変性で防げる。
  ただし、C1 を作る時点で operator が別の commit を書く取り違えは、機械では検出できない。これは operator 票に貼った
  sync-pack 実行時の `rev-parse HEAD` と clean tree の確認、および C1 push 後の control の照合で防ぐ (rev 3)。sync-pack 自身が素材 commit を記録する仕組みは
  段階 2 で扱う。
- bootstrap 表の 1 件 (`v0.2.0-canary.3`) は、公開本文という編集可能な出典に依る。§2 の 6 PR 一致で裏付けたうえで、
  tracked code として review を通して固定する。
- PR タイトルは merge 時点のものである。後からの PR タイトル編集は反映されない。
- secret / 個人 path の検査 gate (#806 / #815) は段階 2 で再利用する。段階 1 は、絶対 path を本文に入れないこと
  (U-RNOTES-009) だけを保証する。

## 7. 改訂履歴

- 2026-10-09 (admission revision 3、#816 の L7 準備で見つかった古い注記の訂正。契約は変えない)
  - §3.4 と §3.5 に残っていた rev 2 以前の記述 (operator が素材 commit を入力する、素材は申告値) を、rev 2 F1 で決めた C1 `Source-Commit:` trailer からの機械読み取りに合わせた。

- rev 3 (2026-10-06、Sol r1 FLAG の是正 1/3 の続き。再検の前に advisor (design、claude-fable-5、2026-10-06) が SURVIVE (条件付き) と判定した条件を反映)
  - sync-pack は working tree を写すので、operator 票に sync-pack 直前の clean tree (`status --porcelain` が空) を必須にした (§3.1)。
  - control の trailer 照合を、C1 push 後の git object に対して行うことにした (照合後の amend を防ぐ)。
  - bootstrap 表を `--previous-tag` 専用にし、trailer は末尾 trailer block からだけ読むことにした。oracle U-RNOTES-018 を追加した。

- rev 2 (2026-10-05、PR #843 Sol r1 FLAG の是正 1/3)
  - F1: 素材 commit の取得を、申告値と sidecar の継承から、Pack C1 の `Source-Commit:` trailer と bootstrap 表 1 件へ切り替えた。
    前回 Release の identity は毎回 Pack repo から導き直す (§3.1)。`--check` に sidecar の Release 束縛と `notes_digest` の照合を加えた (§3.8)。
    oracle U-RNOTES-006 / 013 を差し替え、015 / 016 / 017 を追加した。
  - F2: PR merge でない first-parent commit を全て「未分類の commit」に出す規則にし (§3.3)、U-RNOTES-014 を追加した。
