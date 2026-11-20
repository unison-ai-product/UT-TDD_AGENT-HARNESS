---
title: "L7 Pack C2 manifest 生成サブコマンド テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-c2-manifest.md
status: confirmed
updated: 2026-11-20
issue: 1885
---

# Pack の C2 manifest を作るサブコマンド テスト設計 (issue #1885)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-c2-manifest.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (別 lane が分割・縮小中のため)。本書が
oracle の正本であり、`CANDIDATE-U-C2MAN-001`〜`020` を候補として宣言する。昇格・実装は別 PR である。
Red は契約 PR の後に `it.fails` で登録する。

## 2. 候補の oracle

以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。
fixture は、小さな C1 (一時 Git repo。`GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` / author / committer を固定して commit SHA も決定的にする) と、
stable と canary が別 release を指す既存 v2 manifest を `--previous` の commit に持つ。
「mutation」は、その行を Red にすべき退行を 1 つだけ書く。

| ID | 入力 / 独立変異 | 期待 | その行が Red にする mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-C2MAN-001` | 小さな C1 と previous から 2 回実行する (別の cwd・別の環境変数・別の時刻) | 2 回の出力 bytes が同一で、commit 済みの golden の bytes とも一致する | 時刻・乱数・`Map` / `Set` の反復順・環境変数を出力へ入れる。YAML の option を変える |
| `CANDIDATE-U-C2MAN-002` | 再現性: Pack#14 の入力 (Pack clone の C1 `06903e918a91286a235b953ca5c3fa073367dff7`、previous `68c29c23f5b3f3a6faacbaec08676596e0150267`、tag `v0.2.0-canary.8`) から生成する。Pack の clone が無い環境では、環境変数で指定された clone を必須とし、無ければ fail する (skip で通さない)。実行は control の検収で行い、CI の必須 job にはしない | 生成 bytes が C2 `fde54dbe28ba31420ef9a33754dd15a38e9d92a1` の `release/manifest.yaml` の Git blob と全 bytes 一致する (1,034 件の inventory を含む) | `releaseAssetInventoryDigest` に fixture の仮値 (`sha256:` + `c` × 64) を使う。`artifactSetDigest` に探索用の `0` × 64 を使う。`artifacts` を sort し直す |
| `CANDIDATE-U-C2MAN-003` | previous の stable と、stable 以外の既存 release (複数) | 結果の `channels.stable`、`channelOrder`、既存の `releases` の key の順と各 record の値が previous と同一 | `channels.stable` を新 release にする (canary.7 の形)。既存 release を並べ替える・書き換える |
| `CANDIDATE-U-C2MAN-004` | 通常の入力 | 新 release が `releases` の末尾に 1 件だけ増え、`channels.canary` がその ID を指す | `canary` を更新しない。新 release を先頭に挿入する |
| `CANDIDATE-U-C2MAN-005` | `derivePackPublicationAssets` の成功結果 | `releaseAssetInventoryDigest` が `value.releaseAssetInventoryDigest` と一致し、`releaseRecordDigest` が `deriveReleaseRecordDigest` の独立再計算と一致する | 仮値の digest を使う。asset の導出を呼ばない |
| `CANDIDATE-U-C2MAN-006` | resolver が返す `digest` | `artifactSetDigest` と `releaseId` (`deriveReleaseId("1", c1, digest)`) が、探索用の仮 ID / digest ではなく返った `resolved.digest` から導かれる | 探索用の `0` × 64 の値を manifest へ記録する |
| `CANDIDATE-U-C2MAN-007` | 成功後、C1 から C2 相当 (作業木) の差分を読む | 差分が `release/manifest.yaml` の追加 1 件だけ (`release/` の外・sidecar・log・一時 file が 0 件)。`git add` / `commit` / tag / ref の変化なし | `release/` の外へ file を書く。作業木の他 file を更新する。index を更新する |
| `CANDIDATE-U-C2MAN-008` | `--c1` が Pack checkout の HEAD ではない | `c2_c1_not_head` で拒否し、Pack checkout が呼び出し前と同一 | HEAD の照合を外す |
| `CANDIDATE-U-C2MAN-009` | 作業木が dirty (追跡済み file の変更 / 未追跡 file の 1 件ずつ) | `c2_worktree_dirty` で拒否し、何も書かない | dirty の検査を外す。未追跡 file を見ない |
| `CANDIDATE-U-C2MAN-010` | C1 の tree に `release/manifest.yaml` が既に在る | `c2_manifest_present_in_c1` で拒否し、何も書かない | 既存の manifest を黙って上書きする |
| `CANDIDATE-U-C2MAN-011` | `--previous` の blob が (a) 無い commit / (b) 不正な YAML / (c) v1 manifest | (a) `c2_previous_unavailable`、(b)(c) `c2_previous_invalid` (v1 は `v1_read_only` を detail に持つ)。何も書かない | v1 から集合を補完する fallback を持つ。parse を省く |
| `CANDIDATE-U-C2MAN-012` | `--tag` が (a) `-canary.` を含まない (stable の tag) / (b) `..` や空白を含む | (a) `c2_tag_not_canary`、(b) `c2_option_invalid`。何も書かない。stable は動かない | stable の tag でも canary を更新する。tag の形式検査を外す |
| `CANDIDATE-U-C2MAN-013` | tag が Pack の repo に存在しない / 存在する | どちらも同じ bytes を出す (tag の有無は導出に影響しない)。tag の作成・解決 (`rev-parse refs/tags/...`) をしない | tag の存在を要求する。tag の指す commit を C1 の代わりに使う |
| `CANDIDATE-U-C2MAN-014` | C1 の tree に (a) mode `120000` の entry / (b) tracked でない path を指す entry を作る注入 (resolver / reader の差し替え) | `c2_inventory_invalid` で拒否し、何も書かない (symlink は公開契約で拒否: `release-channel-manifest.md` §7.1) | mode・tracked の照合を外す |
| `CANDIDATE-U-C2MAN-015` | resolver が `invalid_distribution_plan` / `unavailable` / `invalid_artifact` を返す注入 | `c2_artifact_resolution_failed` (detail に error) で拒否し、何も書かない | resolver の失敗を握りつぶして空の inventory で続ける |
| `CANDIDATE-U-C2MAN-016` | `derivePackPublicationAssets` が失敗を返す注入 (各 error) | `c2_assets_failed` (detail に error) で拒否し、何も書かない | asset の失敗時に仮値の digest で続ける |
| `CANDIDATE-U-C2MAN-017` | 組み立てた manifest が `parsePublicationManifest` に落ちる注入 (digest を 1 つ壊す) | `c2_manifest_invalid` で拒否し、何も書かない (書く前の自己検証) | 自己検証を書き込みの後に回す / 省く |
| `CANDIDATE-U-C2MAN-018` | 導出した releaseId が previous の `releases` に既に在る (同じ C1 の再登録) | `c2_release_already_registered` で拒否し、何も書かない | 既存 record を黙って置き換える |
| `CANDIDATE-U-C2MAN-019` | `release/manifest.yaml` が既に作業木に在る (C1 には無い。untracked) / 書き込みの段の故障を注入する | (既存) `c2_worktree_dirty` か `c2_target_exists` で拒否し、既存の bytes が不変。(故障) 注入点は (a) `wx` の open の失敗、(b) open の後の書き込みの失敗、(c) close の失敗、(d) (b) か (c) の後の片付けの unlink の失敗、の 4 つ。(a)〜(c) は `c2_write_failed` で、この呼び出しが `wx` で作ったファイルと、新しく作った空の `release/` が残らない。(a) は既存のファイルに触れない。(d) は `c2_write_failed` (exit 1) で、detail に残った path が出る。呼び出し前から在った `release/` と、別の実行が置いたファイル (同じ dir の別名のファイル) は、どの場合も残る | `wx` を `w` にして上書きする。失敗時に、作ったファイルや空の `release/` を残す。片付けで、呼び出し前から在った `release/` や他のファイルを消す。片付けの失敗を成功として返す、または残った path を出さない |
| `CANDIDATE-U-C2MAN-020` | CLI の配線: 成功と失敗を `--json` 有無で実行する。出力 bytes は UTF-8、BOM なし、LF | 成功は exit 0 と契約の JSON (`ok` / `releaseId` / `channel: "canary"` / `artifactCount` / `manifestSha256`)、失敗は exit 1 と `{ ok: false, reason }`。`manifestSha256` が書かれた file の SHA-256 と一致する。サブコマンドが `distribution c2-manifest` として登録されている | 失敗でも exit 0 にする。reason を出さない。CRLF / BOM を付ける |

## 3. 実装 PR の受け入れ基準

- 001・003〜020 は CI の Vitest で実行する (Pack の clone を要しない)。002 は control の検収で、Pack#14 の入力に対して実行し、結果の C2 blob SHA と bytes 一致を PR コメントに残す。
- 失敗系 (008〜019) は全て、呼び出し前後の Pack checkout の working tree・index・`.git` の ref の同一性を確かめる (「何も書かない」の独立観測)。
- 実装 PR は手順書 `docs/reference/pack-release-runbook.md` §4 の `[未自動 #1885]` を本コマンド 1 行
  (`node <source>/src/cli.ts distribution c2-manifest --c1 <C1> --tag <tag> --previous <Pack main>` を cwd = Pack checkout で実行) へ置き換える。
- `tests/support/pack-internal-canary.ts` の `createReleaseManifest` は fixture 用 (仮の asset digest、canary と stable が同じ ID) であり、本コマンドへ置き換えるかは実装 PR で判断する (置き換えない場合でも、仮値が公開の生成へ混入しないことを 005 が守る)。
