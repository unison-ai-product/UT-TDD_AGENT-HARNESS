---
title: "L7 公開前の Pack の照合の配線 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-publication-audit-wiring.md
status: confirmed
updated: 2026-11-20
issue: 1894
---

# 公開前の Pack の照合の配線 テスト設計 (issue #1894)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-publication-audit-wiring.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (shared file の直列化規律)。本書が
oracle の正本であり、`U-PKAUD-001`〜`017` を候補として宣言する。昇格・実装は別 PR である。
Red は `it.fails` で先に入れ、Green で `it` に戻す (設計書保護 gate)。

## 2. 候補の oracle

以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。fixture は一時 Git repo (C1 を commit し、その上に `release/` だけを変える C2 を commit する) を使う。
各 oracle は、その oracle が守る条件だけが成立する入力を 1 つだけ持つ。`installDependencies` は spy を注入し、呼び出し回数を観測する。

| ID | 入力 / 独立変異 | 期待 | その行が Red にする mutation |
| --- | --- | --- | --- |
| `U-PKAUD-001` | 正しい C1 (artifact + ビルド入力複数) と C2 (`release/manifest.yaml` だけを足す) で `package` を実行する | 成功。JSON の `publicationAudit.status === "attested"`、`c1` / `c2` は source binding の SHA と一致、`entryCount` / `buildInputCount` が実数と一致する。5 asset が書かれる | 照合を呼ばない / 結果を出力へ出さない |
| `U-PKAUD-002` | 001 の C1 に、期待集合に無い `100644` の file (私有の file を模した path、`release/` の外) を 1 件だけ足し、C2 はその C1 の上に `release/manifest.yaml` だけを足す (C2 は extra を継承する。`diff_outside_release` の検査は通る。`release/` の中の extra は 003 が扱う) | exit 1、`error: pack_publication_audit_commit_entries_mismatch`、`details` に `{ category: "extra", path }`。`installDependencies` は 0 回、`outDir` は空 | 照合を asset の書き込みの後ろに置く / extra を許す (期待を「C2 の全 entry」へ緩める) |
| `U-PKAUD-003` | 001 の C2 に `release/manifest.yaml` 以外の `release/notes.md` を足す (`release/` の外は変えない。既存の `diff_outside_release` の検査は通る) | 002 と同じ拒否 (`extra`、path は `release/notes.md`)。asset は作られない | 期待集合へ `release/` 配下の glob を足す |
| `U-PKAUD-004` | C1 の artifact のうち、変換を通らない file (`package.json` 以外) の blob を 1 byte だけ変える (manifest の `contentDigest` は元のまま。path / mode は同じ。C2 は C1 の上に `release/manifest.yaml` だけを足す) | 照合より前の既存の検査で `distribution package tar materialization failed: artifact_mismatch` (設計 §3.3: tar の導出の `exactEntries` が `contentDigest` の不一致で拒否する。照合の理由コードにならない)。計画も観測も呼ばれず、`installDependencies` は 0 回、`outDir` は空 | bytes の照合を path だけにする / 既存の拒否を握りつぶして先へ進む |
| `U-PKAUD-005` | C1 の artifact 1 件の mode を manifest の `mode` と変える (`100644` と `100755`。bytes は同一) | 004 と同じ既存の拒否 `distribution package tar materialization failed: artifact_mismatch` (`exactEntries` の `mode` の不一致)。計画も観測も呼ばれず、asset は作られない | mode を照合から外す |
| `U-PKAUD-006` | 正しい C1 の上に、C2 で `release/` の中へ mode `120000` の entry (`release/link`) を 1 件足す (`release/manifest.yaml` も足す。`diff_outside_release` は通り、materializer は C1 しか読まないので観測まで届く) | `pack_publication_audit_commit_entries_mismatch`。観測が entry を作らずに拒否する (`details` の分類は `extra`) | `120000` を `100644` として扱う / 観測で捨てて素通りさせる |
| `U-PKAUD-007` | 正しい C1 / C2 で、source binding と計画の構築は実際の Git で通す。観測だけに注入した git runner (011 と同じ注入点) が、`ls-tree` か `cat-file --batch` の時点で失敗を返す。早期失敗と区別するため、`resolveConsumerRuntimeReleaseSourceBinding` と `buildPackPublicationStagingPlan` が成功したこと (計画が作られたこと) を spy で先に確かめる | exit 1、`error: pack_publication_audit_observation_unavailable`、`publicationAudit.status === "indeterminate"`。asset は作られず、再試行しない | `indeterminate` を通す / 観測の例外を握りつぶして `attested` にする |
| `U-PKAUD-008` | 観測の独立: working tree に未追跡の extra file と、index に staged だけの extra file があり、C2 の tree は正しい | `attested` (C2 の tree だけが観測の対象)。逆に extra が commit の tree だけにあり (002 と同じく C1 に足して C2 が継承する)、working tree と index が清潔なら、002 と同じ拒否 | 観測に `git ls-files` / working tree の readdir を使う |
| `U-PKAUD-009` | C1 のビルド入力を 1 件欠かし、C2 はその C1 の上に `release/manifest.yaml` だけを足す (C2 も欠落を継承し、manifest は正しい。`release/` の外に C1 との差分が無いので、`diff_outside_release` の検査は通る。002・006 と同じ作り方) | `error` は `pack_build_input_*` (設計 §3.1 の順序。照合の理由コードにならない)。`installDependencies` は 0 回 | 照合をビルド入力の検査より前に置き、理由を上書きする |
| `U-PKAUD-010` | 002 (C1 に extra を足して C2 が継承する作り方) の失敗の JSON の形 | `ok: false`、`error`、`publicationAudit.{status,c1,c2,details}` のみ。`details` は `category` (4 分類) と `path` だけで、bytes・digest・file の内容・secret の文字列を含まない | 失敗の出力へ bytes / digest を出す |
| `U-PKAUD-011` | SHA の束縛: 観測が `git` に渡す引数を、`git` を包む spy で記録する | `ls-tree` の revision 引数は固定した C2 の 40 桁 SHA だけ。`cat-file --batch` の標準入力は、その `ls-tree` の出力から取った blob の OID だけで、行ごとに 1 対 1 に対応する。spy は argv と標準入力の両方を記録し、この対応を確かめる。どちらにも tag・branch・`HEAD` の名前を含まない。照合の後に tag を別の commit へ動かしても結果は変わらない | 観測が ref 名を再解決する (照合と公開の SHA がずれる) |
| `U-PKAUD-012` | **L12 受入 (手動 + 記録)**: canary.7 と同じ形の C1 (ビルド入力 52 件を含む) と C2 で、`docs/reference/pack-release-runbook.md` の手順だけで `package` を実行する。次に C1 へ私有の file を足した C2 でも実行する | 前者は `attested` で 5 asset の sha256 が独立の再計算と一致する。後者は `commit_entries_mismatch` で止まり、asset が無い。結果を #1894 / #1879 のコメントに残す | 手順書に照合の読み方が無い / 人の手で照合を飛ばせる経路が残る |
| `U-PKAUD-013` | 正規化で消える変異: C1 の `package.json` の末尾に空白を 1 byte 足す (manifest の `contentDigest` は元のまま。C2 は C1 の上に `release/manifest.yaml` だけを足す) | tar の導出と計画の構築は通り (materializer の `JSON.parse` / `JSON.stringify` で差分が消える)、観測の asset の再計算は失敗するが例外にせず `releaseAssets` を空にし (設計 §3.6)、照合の比較順 (entry が asset より先) で、観測が生の blob の違いを捕まえて `error: pack_publication_audit_commit_entries_mismatch`、`details` に `{ category: "content", path: "package.json" }`。`installDependencies` は 0 回、`outDir` は空 | 観測で読んだ bytes を正規化してから比べる / 期待を C1 の生の blob から作る (sealed の bytes と比べない) |
| `U-PKAUD-014` | C1 由来の `160000` (submodule) を 1 件置き (`release/` の外)、C2 はそれを継承する | 観測より前に `resolveReleaseArtifacts` が `invalid_artifact` で拒否し、`package` は既存の理由 (`distribution package tar materialization failed: invalid_artifact`) で exit 1。観測は呼ばれず、`installDependencies` は 0 回、`outDir` は空 (設計 §3.5 の到達経路) | C1 の `160000` を materializer で素通りさせる / 既存の拒否を握りつぶして観測へ進む |
| `U-PKAUD-015` | C1 の artifact の path (例: `src/link`) を mode `120000`、安全な相対の target (`target.ts`) の symlink にする。manifest は有効なまま (その artifact の `mode` は `100644`、`contentDigest` は元のまま。manifest の `mode` は `100644` / `100755` しか持てず、`120000` にすると `parsePublicationManifest` が先に `consumer_runtime_release_manifest_invalid` で止めるため)。C2 はその C1 の上に `release/manifest.yaml` だけを足す | `distribution package tar mode is unsupported: src/link` で exit 1 (照合より前の既存の拒否。照合の理由コードにならない)。観測は呼ばれず、`installDependencies` は 0 回、`outDir` は空 | 安全な symlink を tar に入れて公開する / 既存の拒否を照合の理由に書き換える |
| `U-PKAUD-016` | 015 と同じ作り方 (manifest は有効なまま) で、target を危険なもの (絶対 path `/etc/passwd`、または drive 付きの `C:/x`) にする | `distribution package tar materialization failed: invalid_artifact` で exit 1 (materializer の `validSymlink` の拒否)。観測は呼ばれず、asset は作られない | 危険な symlink を materializer で通す |
| `U-PKAUD-017` | C1 の artifact でない path (materializer の対象外、`release/` の外、例: `notes/link`) に mode `120000` の symlink を置き、C2 はそれを継承する | 照合の観測が mode を拒否して `error: pack_publication_audit_commit_entries_mismatch`、`details` に `{ category: "extra", path: "notes/link" }`。`installDependencies` は 0 回、`outDir` は空 | 対象外の symlink を観測で捨てて素通りさせる / `120000` を `100644` として扱う |

## 3. 範囲と実行

- 001〜011 と 013〜017 は `packageConsumerRuntimeRelease` と `observePackPublication` の fixture テストで、一時 Git repo とネットワークなし、`installDependencies` の spy を使う。012 は L12 の受入で、CI の対象にしない。
- 004 / 005 は、tar の導出の既存の拒否 (`exactEntries` の `artifact_mismatch`) が計画と観測より先に止める (設計 §3.3)。計画の構築の `commit_entry_mismatch` は多重の防御で、C1 の変異では到達しない。oracle は既存の拒否に統一する。
- 全 ID は `Red -> Green` の対象である。`it.fails` 登録の段階では、`pack-publication-observe.ts` が無いことによる import 失敗ではなく、各 oracle の期待の不成立で Red になること (import は stub で解決する)。
- ビルド入力の entry の種別 `build-input` を足す `packCommitEntries` の改訂は、`pack-build-inputs.md` §5.1 の実装 (`CANDIDATE-U-PKBIN-013`〜`017`) が先に Green になることを前提にする。本書の実装 PR は、その merge の後に出す。
