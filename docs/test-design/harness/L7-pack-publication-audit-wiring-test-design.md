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
oracle の正本であり、`CANDIDATE-U-PKAUD-001`〜`012` を候補として宣言する。昇格・実装は別 PR である。
Red は `it.fails` で先に入れ、Green で `it` に戻す (設計書保護 gate)。

## 2. 候補の oracle

以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。fixture は一時 Git repo (C1 を commit し、その上に `release/` だけを変える C2 を commit する) を使う。
各 oracle は、その oracle が守る条件だけが成立する入力を 1 つだけ持つ。`installDependencies` は spy を注入し、呼び出し回数を観測する。

| ID | 入力 / 独立変異 | 期待 | その行が Red にする mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-PKAUD-001` | 正しい C1 (artifact + ビルド入力複数) と C2 (`release/manifest.yaml` だけを足す) で `package` を実行する | 成功。JSON の `publicationAudit.status === "attested"`、`c1` / `c2` は source binding の SHA と一致、`entryCount` / `buildInputCount` が実数と一致する。5 asset が書かれる | 照合を呼ばない / 結果を出力へ出さない |
| `CANDIDATE-U-PKAUD-002` | 001 の C2 の tree に、期待集合に無い `100644` の file (私有の file を模した path) を 1 件だけ足す | exit 1、`error: pack_publication_audit_commit_entries_mismatch`、`details` に `{ category: "extra", path }`。`installDependencies` は 0 回、`outDir` は空 | 照合を asset の書き込みの後ろに置く / extra を許す (期待を「C2 の全 entry」へ緩める) |
| `CANDIDATE-U-PKAUD-003` | 001 の C2 に `release/manifest.yaml` 以外の `release/notes.md` を足す (`release/` の外は変えない。既存の `diff_outside_release` の検査は通る) | 002 と同じ拒否 (`extra`、path は `release/notes.md`)。asset は作られない | 期待集合へ `release/` 配下の glob を足す |
| `CANDIDATE-U-PKAUD-004` | C1 の artifact の blob を 1 byte だけ変える (manifest の `contentDigest` は元のまま。path / mode は同じ) | `error: pack_publication_audit_plan_commit_entry_mismatch` (設計 §3.3: 計画の構築が先に落とす)。観測は呼ばれない。asset は作られない | bytes の照合を path だけにする / 計画の失敗を握りつぶして観測へ進む |
| `CANDIDATE-U-PKAUD-005` | C1 の artifact 1 件の mode を manifest の `mode` と変える (`100644` と `100755`。bytes は同一) | 004 と同じ拒否 (mode の不一致)。asset は作られない | mode を照合から外す |
| `CANDIDATE-U-PKAUD-006` | C2 の tree に mode `120000` の entry を 1 件足す (path は期待集合の外) | `pack_publication_audit_commit_entries_mismatch`。観測が entry を作らずに拒否する (`details` の分類は `extra`) | `120000` を `100644` として扱う / 観測で捨てて素通りさせる |
| `CANDIDATE-U-PKAUD-007` | C2 の tree の object を読めなくする (loose object を削除した clone。SHA の解決は先に済む) | exit 1、`error: pack_publication_audit_observation_unavailable`、`publicationAudit.status === "indeterminate"`。asset は作られず、再試行しない | `indeterminate` を通す / 観測の例外を握りつぶして `attested` にする |
| `CANDIDATE-U-PKAUD-008` | 観測の独立: working tree に未追跡の extra file と、index に staged だけの extra file があり、C2 の tree は正しい | `attested` (C2 の tree だけが観測の対象)。逆に C2 の tree だけに extra があり working tree が清潔なら、002 と同じ拒否 | 観測に `git ls-files` / working tree の readdir を使う |
| `CANDIDATE-U-PKAUD-009` | C1 のビルド入力を 1 件欠かす (C2 は正しい) | `error` は `pack_build_input_*` (設計 §3.1 の順序。照合の理由コードにならない)。`installDependencies` は 0 回 | 照合をビルド入力の検査より前に置き、理由を上書きする |
| `CANDIDATE-U-PKAUD-010` | 002 の失敗の JSON の形 | `ok: false`、`error`、`publicationAudit.{status,c1,c2,details}` のみ。`details` は `category` (4 分類) と `path` だけで、bytes・digest・file の内容・secret の文字列を含まない | 失敗の出力へ bytes / digest を出す |
| `CANDIDATE-U-PKAUD-011` | SHA の束縛: 観測が `git` に渡す引数を、`git` を包む spy で記録する | `ls-tree` / `cat-file` の引数は C2 の 40 桁 SHA だけ。tag・branch・`HEAD` の名前を含まない。照合の後に tag を別の commit へ動かしても結果は変わらない | 観測が ref 名を再解決する (照合と公開の SHA がずれる) |
| `CANDIDATE-U-PKAUD-012` | **L12 受入 (手動 + 記録)**: canary.7 と同じ形の C1 (ビルド入力 52 件を含む) と C2 で、`docs/reference/pack-release-runbook.md` の手順だけで `package` を実行する。次に C1 へ私有の file を足した C2 でも実行する | 前者は `attested` で 5 asset の sha256 が独立の再計算と一致する。後者は `commit_entries_mismatch` で止まり、asset が無い。結果を #1894 / #1879 のコメントに残す | 手順書に照合の読み方が無い / 人の手で照合を飛ばせる経路が残る |

## 3. 範囲と実行

- 001〜011 は `packageConsumerRuntimeRelease` と `observePackPublication` の fixture テストで、一時 Git repo とネットワークなし、`installDependencies` の spy を使う。012 は L12 の受入で、CI の対象にしない。
- 004 の `error` は、計画の構築 (`buildPackPublicationStagingPlan`) が観測より先に `commit_entry_mismatch` で落とす (設計 §3.3)。観測の後の `auditPackPublication` が落とす形にはしない。
- 全 ID は `Red -> Green` の対象である。`it.fails` 登録の段階では、`pack-publication-observe.ts` が無いことによる import 失敗ではなく、各 oracle の期待の不成立で Red になること (import は stub で解決する)。
- ビルド入力の entry の種別 `build-input` を足す `packCommitEntries` の改訂は、`pack-build-inputs.md` §5.1 の実装 (`CANDIDATE-U-PKBIN-013`〜`017`) が先に Green になることを前提にする。本書の実装 PR は、その merge の後に出す。
