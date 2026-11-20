---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_c2_manifest
pair_artifact: docs/test-design/harness/L7-pack-c2-manifest-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 1885
---

> **L6 contract marker**: `buildC2ReleaseManifest(input: C2ManifestInput, deps: C2ManifestDeps) => C2ManifestResult` (固定した C1 の Git object と既存の v2 manifest から、C2 の `release/manifest.yaml` の bytes を導く。既存の helper を Pack#14 で人が呼んだ順に合成するだけで、新しい導出式は持たない) と `ut-tdd distribution c2-manifest --c1 <sha> --tag <tag> --previous <sha> [--pack-root <dir>] [--json]` (その bytes を Pack checkout の `release/manifest.yaml` へ 1 回だけ書く CLI) は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、契約の意味は変えない)。pre / post / invariant は §5 の DbC に置く。oracle は `docs/test-design/harness/L7-pack-c2-manifest-test-design.md` の `CANDIDATE-U-C2MAN-001`〜`020` が固定する (正式 ID `U-C2MAN-*` への昇格は、src を含まない昇格 PR で行う)。

# Pack の C2 (release/manifest.yaml) を作るサブコマンド (Issue #1885)

Pack の公開は C1 (clean Pack の内容を載せた commit) と C2 (C1 の直後で `release/` だけを足した commit) の 2 段である。
C2 の `release/manifest.yaml` は、既存の helper を人が順に呼んで作っていた (canary.8 の Pack#14)。
手順書だけでは新しい担当や PC で再現できないため、その呼び出し順を 1 つのサブコマンドへ固定する。
PO の必達条件 (2026-11-20): 新しいプロジェクトや新しい PC でも Pack を再現して作れること。

## 1. 実測した事実

| 事実 | 根拠 |
| --- | --- |
| Pack#14 の C2 `fde54dbe28ba31420ef9a33754dd15a38e9d92a1` は、親が C1 `06903e918a91286a235b953ca5c3fa073367dff7` で、C1 との差分は `release/manifest.yaml` の追加 1 件だけ | `gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/commits/fde54dbe...` (files = `release/manifest.yaml` added) |
| 既存 manifest の入力は Pack main `68c29c23f5b3f3a6faacbaec08676596e0150267` の `release/manifest.yaml` (v2、stable は `rel-sha256:b424bd02e92e3f603b8de55f4a9f2ae96ba5d1ae724d4cdcdc2a0c45eb24eeb1`)。C1 には `release/manifest.yaml` が無い | Codex lane の報告 (#1885 コメント)、Pack main の blob |
| 生成の呼び出し順は §3 のとおり。同一入力の読み取り専用 replay で、1,034 件の inventory、artifact set digest、asset inventory digest、YAML の全 bytes が C2 の Git blob と一致した | Codex lane の報告 (#1885 コメント) |
| tag `v0.2.0-canary.8` は C2 の生成には使っておらず、C2 が出来た後に producer が C2 を解決するために使った | 同上 |
| package は C1 から C2 への差分が `release/` の外にあると `consumer_runtime_release_diff_outside_release` で拒否する | `src/cli/distribution.ts:328-332` |
| channel は tag に `-canary.` を含むかで canary / stable に決まる | `src/cli/distribution.ts:289`、`:448` |
| canary.7 の C2 `97384dd7...` は `canary` と `stable` の両方を新 ID に切り替えており、Pack#14 と #1885 の要件 (stable を保つ) と違う。当時の生成コマンドの原本は確認できず、現行の materializer で古い C1 を replay すると `invalid_distribution_plan` で止まる | Codex lane の報告 (#1885 コメント) |
| `tests/support/pack-internal-canary.ts` の `createReleaseManifest` (`:156-210`) は同じ helper を合成するが、`releaseAssetInventoryDigest` を `sha256:` + `c` × 64 の仮値にし、`canary` と `stable` を同じ ID にする。fixture 用であり、公開の生成には使えない | `tests/support/pack-internal-canary.ts:156-210` |

## 2. 採択

1. **入力は Git object だけ**とする。C1 の tree と blob は `createLocalGitObjectReader` で読み、既存 manifest は `--previous` の commit の blob を `git` で読む。working tree、index、network、tag の有無は導出に使わない (tag は channel の決定と形式検査にだけ使う)。
2. **合成は §3 の順に固定**し、新しい導出式・digest・層を持たない。`tests/support/pack-internal-canary.ts` の合成を src へ移すのではなく、Codex lane が Pack#14 で使った順 (§3) を正本にする (fixture は仮値を含むため)。実装は `src/setup/` の 1 module と `src/cli/distribution.ts` の最小配線にとどめる。
3. **書くのは `<pack-root>/release/manifest.yaml` の 1 file だけ**とする。sidecar、log、一時 file を Pack checkout へ作らない。Issue 本文の「release control manifest」は、Pack#14 の実測 (C2 の差分は `release/manifest.yaml` 1 件) のとおり、この `release/manifest.yaml` 自身を指すものとして扱う。
4. **channel は canary だけ**を更新する。stable への昇格は promotion gate (`release-channel-manifest.md` §8.3) の責務であり、本コマンドは stable を動かさない。
5. 棄却: (a) 既存 manifest を working tree の file から読む (C1 に `release/manifest.yaml` が無く、Pack main の blob が正本。作業木の書き換えで再現性が崩れる)。(b) `tag` を C1 の解決に使う (Pack#14 の順序では tag は C2 より後。C2 を作るのに tag を要求すると循環する)。(c) `canary` と `stable` を同じ ID にする canary.7 の形 (stable の保持要件に反する)。

## 3. 合成の順序 (Pack#14 の実測、正本)

各 step の helper は既存で、引数と順序を変えない。

1. `parsePublicationManifest(parse(previousBytes))` (`src/schema/release-manifest.ts`) で既存 v2 を検証する。v1 (`v1_read_only`) と不正は拒否する。
2. 前提を確かめる: C1 が Pack checkout の HEAD、作業木が clean、C1 の tree に `release/manifest.yaml` が無い。
3. `resolveReleaseArtifacts({ repository, release: { releaseId: "rel-sha256:" + "0"×64, materializerVersion: "1", artifactSourceCommit: c1, artifactSetDigest: "sha256:" + "0"×64 } }, { git: createLocalGitObjectReader(), materialize: materializeReleaseArtifacts })` (`src/setup/release-artifact-resolver.ts`、`src/setup/release-materializer.ts`)。仮の ID と digest は探索への引数であり、manifest に記録する値は返った `resolved.digest` である。
4. `resolved.entries` の順を保ち、`artifacts[] = { sourcePath: entry.path, destinationPath: entry.path, mode: entry.mode, size: entry.content.length, contentDigest: digestConsumerRuntimeBytes(entry.content) }` を作る (`digestConsumerRuntimeBytes` は `src/setup/consumer-node-runtime.ts`)。各 path が C1 の tracked path で、mode が `100644` / `100755` であることを照合する。
5. `releaseId = deriveReleaseId("1", c1, resolved.digest)` → `derivePackPublicationAssets({ release: { releaseId, artifacts }, entries })` (`entries` は同じ metadata に `content` を足したもの。`src/setup/pack-publication-assets.ts`) → `deriveArtifactInventoryDigest(artifacts)`。`releaseAssetInventoryDigest` は `derivePackPublicationAssets` の成功結果の `value.releaseAssetInventoryDigest` を使う。
6. `record = { materializerVersion: "1", artifactSourceCommit: c1, artifactSetDigest: resolved.digest, artifactInventoryDigest, releaseAssetInventoryDigest, artifacts }` を作り、`releaseRecordDigest = deriveReleaseRecordDigest(record)` を足して `releases[releaseId]` の末尾に追加する。既存 release の順序と record は変えず、`channels.canary` だけを `releaseId` にする (`channels.stable` と `channelOrder` は不変)。
7. `stringify(next)` (`yaml`、既定 option) → `parsePublicationManifest(parse(bytes))` の成功を確かめる → UTF-8 (BOM なし、LF) の bytes を `release/manifest.yaml` へ `wx` で書く。

## 4. サブコマンド

`ut-tdd distribution c2-manifest --c1 <sha40> --tag <tag> --previous <sha40> [--pack-root <dir>] [--json]`

| option | 意味 |
| --- | --- |
| `--c1 <sha40>` | 必須。固定した C1 の commit (小文字 40 桁)。Pack checkout の HEAD と一致すること |
| `--tag <tag>` | 必須。`^[A-Za-z0-9._/-]+$` で `..` を含まず、`-canary.` を含むこと。存在は要求しない |
| `--previous <sha40>` | 必須。既存の `release/manifest.yaml` を持つ Pack の commit (通常は Pack main)。その blob を読む |
| `--pack-root <dir>` | Pack checkout (既定は cwd)。source の CLI は絶対 path で呼び、cwd を Pack に置く (`pack-release-runbook.md` §5) |
| `--json` | 結果を JSON で出す |

- 成功: exit 0。stdout (`--json`) は `{ ok: true, releaseId, c1, tag, channel: "canary", artifactCount, manifestPath, manifestSha256 }`。
- 失敗: exit 1。stdout (`--json`) は `{ ok: false, reason }`。何も書かない (§5)。
- 失敗の reason (安定した識別子。detail は path 名や helper の error を `:` の後ろに付けてよい): `c2_option_invalid`、`c2_tag_not_canary`、`c2_c1_not_head`、`c2_worktree_dirty`、`c2_manifest_present_in_c1`、`c2_previous_unavailable`、`c2_previous_invalid`、`c2_artifact_resolution_failed`、`c2_inventory_invalid`、`c2_assets_failed`、`c2_manifest_invalid`、`c2_release_already_registered`、`c2_target_exists`、`c2_write_failed`。

## 5. DbC

- **Pre**: 入力は §4 の option だけ。C1 は Pack checkout の HEAD で作業木は clean。C1 の tree に `release/manifest.yaml` が無い。`--previous` の blob が妥当な v2 manifest。`--tag` は canary の tag。
- **Post (成功)**: Pack checkout に `release/manifest.yaml` が 1 file だけ増え、C1 → C2 の差分は `release/manifest.yaml` の追加 1 件になる。内容は `parsePublicationManifest` を通り、`channels.stable` と既存の `releases` (順序と record の bytes) が `--previous` と同一で、`channels.canary` は新しい release を指す。
- **Post (失敗)**: Pack checkout の working tree、index、`release/` の有無、`.git` の ref が呼び出し前と同一 (何も書かない)。書き込みは検証が全て済んだ最後の 1 回だけで、`release/` の作成も書き込み直前に行う。
- **Invariant**: 決定性。同じ (C1 の Git object、`--previous` の blob、`--tag` の channel) からは、時刻・環境・実行回数に依らず byte 同一の出力になる。`git add` / `commit` / `push` / tag 作成 / network を行わない。`release/` の外へ書かない (package の `consumer_runtime_release_diff_outside_release` と同じ境界)。`--previous` と C1 の内容を変更しない。既存の `release/manifest.yaml` は上書きしない (`wx`)。

## 6. oracle と手順書

oracle は `CANDIDATE-U-C2MAN-001`〜`020` (`docs/test-design/harness/L7-pack-c2-manifest-test-design.md`)。実装 (Green) の受け入れ基準に、手順書 (`docs/reference/pack-release-runbook.md`) §4 の `[未自動 #1885]` を本コマンド 1 行へ置き換えることを含める。手順書は #1883 が持つため、本契約の PR は手順書へ触れない。
