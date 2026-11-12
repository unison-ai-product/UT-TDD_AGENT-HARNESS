---
title: "L7 Pack 実行可能ファイル mode 保持 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-exec-mode.md
status: confirmed
updated: 2026-11-12
issue: 821
---

# Pack の実行可能ファイル mode の保持 テスト設計 (issue #821)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-exec-mode.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (別 lane が分割・縮小中のため)。本書が
oracle の正本であり、`CANDIDATE-U-PACKMODE-001`〜`011` を候補として宣言する。昇格・実装は別 PR である。

## 2. 候補の oracle

正本: `docs/design/harness/L6-function-design/pack-exec-mode.md`。
以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。実装は別 PR。
全 ID は実行 bit (ファイルシステム) ではなく Git object の mode だけを観測する。fixture は一時 Git repo を
`core.filemode=false` (Windows 相当) と `true` (Linux) の両方で作る。

| ID | 入力 / 独立変異 | 期待 |
| --- | --- | --- |
| `CANDIDATE-U-PACKMODE-001` | source commit の tree に `100755` を 2 件持つ fixture を sync-pack で copy する (Windows 相当: `core.filemode=false`) | `nextCommands` に `git add` の後・`commit` の前で、`100755` の path ごとに `update-index --chmod=+x -- <path>` が出る。copy evidence の `pack` に同じ path / mode の一覧が残る。`localGitMutationExecuted` は `false` のまま、Pack checkout の index は sync-pack の前後で同一 |
| `CANDIDATE-U-PACKMODE-002` | 期待 mode の入力を、source commit の Git tree と、staged だけ `100755` に変えた index とで変える | 期待値は commit の Git tree 由来のままで、staged 変更は混入しない |
| `CANDIDATE-U-PACKMODE-003` | 手順を実施して作った C1 (`100755` が保たれる) | C1 照合が通る。Windows 相当 (`core.filemode=false`) でも `git ls-tree` が `100755` を返す |
| `CANDIDATE-U-PACKMODE-004` | 手順を省略して作った C1 (path と bytes は同一で `100644` へ落ちる) | C1 の mode 照合が fail-close する。blob 内容が一致していても通らない (blob oid だけの照合への退行が Red) |
| `CANDIDATE-U-PACKMODE-005` | 期待 `100644` の path が C1 で `100755` になる / manifest `artifacts[].mode` だけ書き換える / C1 の別 SHA を後続の公開処理へ渡す | 3 変異とも fail-close する。完全照合であること (`+x` 対象だけの検査への退行) と、検査した C1 SHA が公開処理まで固定されることを確かめる |
| `CANDIDATE-U-PACKMODE-006` | Linux 上で同じ fixture (`core.filemode=true`、実行 bit あり) | 001-005 と同じ判定。Windows と Linux で結果が同じであり、実行 bit の有無が判定を変えない |
| `CANDIDATE-U-PACKMODE-007` | 期待 `100644` の path の C1 の entry を mode `120000` (symlink) に変える (他は正しい) | fail-close する (`release-channel-manifest.md` §7.1 の symlink 拒否と同じ向き)。mutation: `120000` を `100644` 同等に扱う / `100755` だけを見る退行が Red |
| `CANDIDATE-U-PACKMODE-008` | 期待 path の 1 件 (`scripts/ut-tdd` の出荷先) を C1 から削除する (他の mode は正しい) | fail-close する。mutation: C1 に在る path だけを走査し、期待 path の欠落を見ない退行が Red |
| `CANDIDATE-U-PACKMODE-009` | 期待集合に無い extra を C1 に足す: (i) mode `100755`、(ii) mode `100644` | (i) は本照合が fail-close する。(ii) は本照合の責務外で、本照合は通す。拒否は既存の `exactCommitEntries` (`src/setup/pack-publication-staging.ts:258-277`、entry 数 `:261`) が持ち、既存の oracle は `U-PACKPUB-STAGE-003` (`tests/pack-publication-staging.test.ts:182`、sealed 入力の extra) と `U-PACKASSET-006` (`tests/pack-publication-assets.test.ts:249-258`) である。ただし観測した C1 の extra (audit の `commit_entries_mismatch`) を直接 Red にする既存の oracle は確認できていない。control manifest の sidecar (`release/manifest.yaml`) は extra として扱わない |
| `CANDIDATE-U-PACKMODE-010` | 成功の対照。正当な変換を通した C1: path 写像 (`docs/skills/` → `skills/`) と `package.json` の書き換え (`transformCleanDistributionArtifact`。bytes と digest は source と異なる) を経て、mode は期待どおり | 本照合は **PASS** する (変換後の bytes の違いを理由に落とさない)。bytes や digest を source と照合する退行が Red。4.3 の「bytes を比べない」を固定する |
| `CANDIDATE-U-PACKMODE-011` | mode は正しく、変換していない artifact の bytes だけが source と違う C1 | 本照合は **PASS** する。bytes の違いの拒否は本照合の責務外で、既存の manifest `contentDigest` と `exactCommitEntries` (`src/setup/pack-publication-staging.ts:258-277`、bytes `:273`) が持つ。既存の oracle は `U-PACKPUB-STAGE-003` の `digest drift` (`tests/pack-publication-staging.test.ts:183`、sealed 入力の digest 改変)。観測した C1 の bytes 改変を直接 Red にする既存の oracle は確認できていない (確認できていない点を本書に残す) |

001-006 のうち bytes の一致を要求するものは無い (004 の bytes は fixture の前提であり、照合の対象ではない)。

mutation: 期待値を index (`ls-files -s`) から読む退行、`+x` 対象だけを検査する退行、blob oid だけを比べる退行、sync-pack が
`update-index` / `git add` を実行する退行 (001 の index 同一性が Red)。

