---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_exec_mode
pair_artifact: docs/test-design/harness/L7-pack-exec-mode-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 821
---

> **L6 contract marker**: `expectedPackModes(sourceTree, pathMapping) => PackModeExpectation` (公開対象 source commit の Git tree の entry を、既存の materializer の path 写像 (`materializeReleaseArtifacts`) に通し、出荷先 path ごとの期待 mode を導く) と `verifyPackC1Modes(c1Tree, expected) => PackModeVerdict` (C1 の Git tree を `git ls-tree -r` 相当で独立に読み、**mode だけ**を照合して食い違いを fail-close する) は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、契約の意味は変えない)。pre: 入力は Git object だけで、index と実行 bit を読まない。post: 期待 path が全て C1 に在り、各 mode が期待と一致し、期待しない `100755` と `120000` が C1 に無いときだけ合格。**bytes の digest は本契約の照合に含めない** (`package.json` などは Pack への変換で bytes が source と正当に異なるため。内容の照合は既存の manifest `artifacts[].contentDigest` と `exactCommitEntries` が持つ、§4.3)。invariant: sync-pack は `git add` / `update-index` / `commit` / `push` を実行しない。oracle は `docs/test-design/harness/L7-pack-exec-mode-test-design.md` の `CANDIDATE-U-PACKMODE-001`〜`011` が固定する (正式 ID `U-PACKMODE-*` への昇格は、src を含まない昇格 PR で行う)。

# Pack の実行可能ファイルの mode を保つ方式 (Issue #821)

source で `100755` のファイルが、Pack の C1 (Pack checkout で作る commit) と公開 tar では `100644` になる。
本書はその是正方式を freeze する設計判断であり、実装・テストは本書を oracle の正本として別 PR で行う。
PLAN は凍結中 (#1166) のため、方式判断はここへ置く。

## 1. 実測した事実

| 事実 | 根拠 |
| --- | --- |
| source で `100755` の tracked file は 2 件だけ: `scripts/ut-tdd` (blob `bfd690c5`)、`scripts/git-hooks/pre-push` (blob `1f7ad806`) | `git ls-files -s \| grep ^100755` (origin/main `09ee54f0d`) |
| Pack main には `100755` が 0 件。`scripts/ut-tdd` の blob は source と同一 (`bfd690c5`) で、落ちているのは mode だけ | `gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/git/trees/HEAD?recursive=1` の mode 絞り込みが空、`contents/scripts/ut-tdd` の sha |
| sync-pack の copy は `cpSync` / `writeFileSync` だけで mode を扱わない。Git index も触らず、`git add` / `commit` / `push` は文字列として `nextCommands` に出すだけ (`localGitMutationExecuted: false`) | `src/cli/distribution.ts:186-213` (copy)、`:1085-1101` (`nextCommands`)、`CLAUDE.md` §Distribution Repository |
| Windows の Git は `core.filemode=false` で、working tree の実行 bit が無いため、新規 file の `git add` は `100644` を index に載せる | この PC の `git config core.filemode` = `false`。issue #821 の推定原因 (未確定) と整合する |
| 期待 mode はすでに sealed 済みの値がある。release manifest v2 の `artifacts[].mode` は source の tag/commit の Git tree から作られ、`artifactInventoryDigest` に入っている | `docs/design/harness/L6-function-design/release-channel-manifest.md` §7.1-7.2 (manifest v2 の `artifacts[].mode`。本書は同文書から分離した)、`src/schema/release-manifest.ts:110-125` |
| 公開 tar の header mode は C1 の Git object の mode を使い、`100644` / `100755` 以外を拒否する。#807 / PR #813 は tar が C1 の mode を保つことまでを扱い、C1 自体の落ち込みは範囲外 | `src/setup/pack-publication-assets.ts:116`、`:163`、`:263`、issue #821 本文 |

未確認: canary.3 の C1 が sync-pack + 人手の `git add` で作られたことは、issue 本文の推定であり、
本調査では C1 作成時の操作ログを再現していない。

## 2. 選択肢

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| A | sync-pack が期待 mode を読み、`git add` の後・`commit` の前に実行する `git -C <repo> update-index --chmod=+x <path>` を `nextCommands` と copy evidence に出す。sync-pack 自身は index を変更しない | 非破壊境界 (commit / push / index 変更なし) を保つ。修復手順が機械的に出る | 手順が人手で飛ばされると検出できない |
| B | C1 作成後に、独立した Git 読取り (`git ls-tree`) で C1 の path / mode を期待値と照合し、`100644` への落ち込みを fail-close する | 実際に作られた C1 を測るので、手順の抜けを必ず検出する | 検出だけで、修復手順を示さない |
| C | A と B を両方採る | 修復手順と検出の両方がそろう | 実装が 2 か所になる。ただし B は A の手順を実施したかの判定そのもの |

## 3. 技術助言 (advisor)

- 相談先: `gpt-6.1-sol` (`ut-tdd advisor --decision implementation --current-model claude-sonnet-5-5 --execute`)。
- 回答の要約: 案 C を推奨する。期待 mode の正本は公開対象 source commit の Git tree とし、可変な index を毎回
  `ls-files -s` で読む方式は staged 変更が混入するので公開判定に使わない。manifest の `artifacts[].mode` はその
  commit から導いた値として固定し、source commit SHA と結び付ける。検査は `+x` 対象だけでなく全 artifact の
  mode を完全照合する (不要な `100755` の混入も落とす)。oracle はファイルシステムの実行 bit を使わず、
  Git object (`git ls-tree` と blob) だけを見る。
- 前提の検証: 助言の「manifest が mode をどこから得るか」という不足証拠は §1 の実測で埋まった
  (manifest は source の tag/commit の Git tree から導出済み)。リスク「manifest と C1 が同じ誤った mode から
  作られると照合が効かない」は、独立に source commit の Git tree を読むことで避ける (§4 の 2)。
  助言と実測の食い違いはない。

## 4. 採択: 案 C

1. **期待 mode の正本は、公開対象 source commit の Git tree とする**。新しい「実行可能ファイル宣言 manifest」は
   作らない (source の mode が正本であり、宣言を別に持つと二重管理になる。棄却)。sync-pack は
   `git ls-tree -r <sourceTag または sourceRevision>` から artifact ごとの期待 mode を導く。working tree や
   index (`git ls-files -s`) は staged 変更が混ざるため、期待値の入力にしない。
2. **A (sync-pack の出力)**: sync-pack は copy 後、期待 mode が `100755` の path について、人間が実行する
   `git -C <repo> update-index --chmod=+x -- <path>` を `nextCommands` の `git add` の後・`commit` の前に出す。
   同じ path / mode の一覧を copy evidence (`.ut-tdd/pack-sync/<tag>.sync-pack.json`) の `pack` に記録する。
   sync-pack は引き続き `git add` / `update-index` / `commit` / `push` を実行しない
   (`localGitMutationExecuted: false` を保つ)。path は `--` 区切りで渡し、空白・引用符を含む path でも
   手順が別 path を指さないようにする。
3. **B (C1 の mode の独立照合)**: C1 作成後、公開前に、C1 の Git tree を独立に読む (`git ls-tree -r <C1>`) 照合を追加する。
   この契約が新しく持つ照合は **mode だけ**である。bytes は比べない。
   - **期待値**: 1 の source commit の Git tree の entry を、既存の materializer (`materializeReleaseArtifacts`、
     `src/setup/release-materializer.ts:129-196`) に通して得る。path の写像は `cleanDistributionArtifactPath` /
     `cleanDistributionSourcePath` (`src/setup/distribution.ts:215-224`、`:226-247`) で、mode は変換せず source の値を
     そのまま持つ (`release-materializer.ts:191`)。結果は (出荷先 path → 期待 mode) の集合になる。manifest と同じ
     producer の出力だけで比べないよう、source の Git tree から導く。
   - **fail-close の条件**: (a) 期待 path が C1 に無い、(b) C1 の mode が期待と違う (`100755` が `100644` に落ちる場合を含む)、
     (c) 期待しない `100755` が C1 に在る、(d) 検査対象の C1 の entry に mode `120000` (symlink) が在る。(d) は
     manifest v2 の symlink 拒否 (`release-channel-manifest.md` §7.1、`PUBLICATION_MODES`、`src/schema/release-manifest.ts:9`) と
     同じ向きである。materializer は source の `120000` を受け付ける (`release-materializer.ts:48`、`:182`) ので、
     source が `120000` の path を期待 mode として導く場合も fail-close し、公開の契約が受け付けない mode を期待値にしない。
   - **bytes を比べない理由**: Pack の出荷物は source の bytes と正当に異なる。`package.json` は `transformCleanDistributionArtifact`
     (`src/setup/distribution.ts:261-281`、`src/cli/distribution.ts:207-215`) で test / build / repository / `artifactProfile`
     が書き換わり、追跡する team の定義は projection (`src/cli/distribution.ts:186-200`) を通る。bytes や digest を source と
     照合すると、正しく作った C1 を拒否する。
   - **責務の分担 (内容の照合)**: 変換後の内容の等価は既存の機構が持つ。manifest v2 の `artifacts[].contentDigest` /
     `size` (`release-channel-manifest.md` §7.1)、sealed 入力と manifest の完全一致 (`exactEntries`、
     `src/setup/pack-publication-assets.ts:252-269`) と、`auditPackPublication` の `exactCommitEntries`
     (`src/setup/pack-publication-staging.ts:258-277`、呼び出し `:378`) が、path / mode / size / contentDigest / bytes を
     manifest 由来の期待 entry と観測した C1 の entry で比べる。本契約はこれを置き換えず、C1 を Git tree から独立に読んで
     mode だけを source 由来の期待値と照合する。
   - **extra の扱い**: C1 に期待 path の集合に無い entry が在るとき、mode `100755` と `120000` は上の (c) (d) で本照合が落とす。
     mode `100644` の extra は本照合の責務外とする。`exactCommitEntries` が期待と観測の entry 数の一致
     (`pack-publication-staging.ts:261`) と index ごとの path の一致 (`:268`) を要求するため、extra は既存の audit が
     `commit_entries_mismatch` で拒否する (`:378-379`)。ただし control manifest の sidecar (`release/manifest.yaml`、
     mode `100644`、`pack-publication-staging.ts:14`、`:240-248`) は期待 entry の一部であり、extra として扱わない。
     (確認できていないこと: `auditPackPublication` の `observe` port の実装は src に無く、C1 を Git tree から読む
     producer は未実装である。したがって audit が実 C1 を観測するまで、100644 の extra の拒否は port の契約に依存する。)
   照合の対象 C1 は SHA で固定し、後続の公開処理が同じ SHA を使うことを同じ gate で確かめる。
4. **範囲外**: #807 / PR #813 の tar 生成 (`pack-publication-assets.ts`) は変更しない。canary.3 の公開物は
   作り直さず、是正は次の版で効けばよい。#418 の AT-DIST の判定を止めない。
5. **棄却**: A のみ (人手の抜けを検出できず、本 issue の再発を止められない)、B のみ (落ち込みを検出しても
   修復手順が出ず、毎回人間が原因を探す)、宣言 manifest (1 のとおり二重管理)。

## 5. oracle

`CANDIDATE-U-PACKMODE-001..011` (`docs/test-design/harness/L7-pack-exec-mode-test-design.md`。共有の L7-unit-test-design.md には足さない)。Windows と Linux の両方で、
実行 bit ではなく Git object の mode だけを観測する。
