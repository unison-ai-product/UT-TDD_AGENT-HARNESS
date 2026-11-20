---
title: "L7 Pack ビルド入力の一覧と検査 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-build-inputs.md
status: draft
updated: 2026-11-20
issue: 1882
---

# Pack のビルド入力の一覧と検査 テスト設計 (issue #1882)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-build-inputs.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (shared file の直列化規律)。本書が
oracle の正本であり、`CANDIDATE-U-PKBIN-001`〜`012` を候補として宣言する。昇格・実装は別 PR である。
Red は `it.fails` で先に入れ、Green で `it` に戻す (設計書保護 gate)。

## 2. 候補の oracle

以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。fixture は一時 Git repo (tracked は `git ls-tree` で観測) を使う。
各 oracle は、その oracle が守る条件だけが成立する入力を 1 つだけ持つ。

| ID | 入力 / 独立変異 | 期待 | その行が Red にする mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-PKBIN-001` | 全て揃った tree (固定 3 件 + テンプレート複数 + `review-examples/` の `.md` + `docs/templates/vmodel/` 直下の非 `.md`) を `selectPackBuildInputs` に渡す | `ok: true`。`paths` は固定 3 件 + 対象テンプレートだけで、昇順・重複なし。`review-examples/` と非 `.md` は含まない | 除外接頭辞を外す / 接尾辞の判定を外す |
| `CANDIDATE-U-PKBIN-002` | 固定 3 件のうち 1 件だけを tree から外す (3 通りを表で回す。他は全て揃う) | `ok: false`。`reasons` はその 1 件の `pack_build_input_missing` と path だけ | 固定 file の検査を 1 件でも外す |
| `CANDIDATE-U-PKBIN-003` | `docs/templates/vmodel/*.md` を 0 件にした tree (固定 3 件は揃う) | `ok: false`、`pack_build_input_template_set_empty` だけ | テンプレート 0 件を許す (空集合の素通り) |
| `CANDIDATE-U-PKBIN-004` | 固定 file が working tree に在り、tree (HEAD) には無い。`exists` を渡す | `pack_build_input_untracked` (`missing` ではない)。`exists` を渡さないと `missing` | untracked と missing を区別しない |
| `CANDIDATE-U-PKBIN-005` | 複数の欠落 (固定 2 件とテンプレート 0 件) | `reasons` が全てを path の昇順で返す (最初の 1 件で止めない) | 最初の欠落で return する |
| `CANDIDATE-U-PKBIN-006` | `sync-pack` を、ビルド入力が 1 件欠けた source (HEAD) で実行。`repoDir` に既存 file と、prune 対象の stale file を置く | exit 1、JSON の `pack.buildInputs.ok === false` と理由コード。`repoDir` は実行前後で byte 単位で同一 (prune も copy も無い) | 検査を prune / copy の後ろに置く |
| `CANDIDATE-U-PKBIN-007` | `sync-pack` の成功。`repoDir` は空の clone | ビルド入力が source と bytes 同一で `repoDir` の同じ相対 path に在る。`nextCommands` の `git add` pathspec に全て含まれる。`pack.buildInputs.count/paths` が evidence に在る。`copiedArtifacts` と `exportPlan.artifactPaths` に増減が無い | 変換 (`transformCleanDistributionArtifact`) を通す / artifact へ混ぜる |
| `CANDIDATE-U-PKBIN-008` | `sync-pack --prune-local`。`repoDir` に前回のビルド入力と、一覧に無い stale file がある | ビルド入力は消えない (上書きされ、`unmanagedExistingPaths` にも出ない)。stale file だけが prune される (canary.8 の ENOENT の退行) | ビルド入力を保護集合に入れない |
| `CANDIDATE-U-PKBIN-009` | `package`。C1 の snapshot に、ビルド入力が 1 件欠ける (C1 / C2 の構造は正しい) | `installDependencies` を呼ぶ前に `ConsumerRuntimeReleaseProducerError("pack_build_input_*")` で止まり、`outDir` に何も書かれない。ENOENT / `node-bootstrap-*-missing` ではない | 検査を install / build の後ろに置く |
| `CANDIDATE-U-PKBIN-010` | 単一の正本 (静的検査): `tests/support/pack-internal-canary.ts` と `src/` の `src/setup/pack-build-inputs.ts` 以外の module に、固定 3 件の path 文字列とテンプレート接頭辞の literal が無い。helper は `selectPackBuildInputs` を import する | literal が 0 件。`sync-pack` / `package` / helper が同じ関数を呼ぶ | helper または `sync-pack` に path の literal を戻す |
| `CANDIDATE-U-PKBIN-011` | ビルド入力のうち 1 file の内容に denylist の entry が一致する (denylist は `provided`。他は全て清潔) | `sync-pack` と `package` のどちらも書き出し前に `privacy-denylist-hit` で止まる。出力に一致した文字列を含まない | ビルド入力を scan の入力から外す |
| `CANDIDATE-U-PKBIN-012` | **L12 受入 (手動 + 記録)**: 新しい clone と何も入っていない作業 directory で、`docs/reference/pack-release-runbook.md` の手順だけで 5 asset を作る | 5 asset の sha256 が、独立に再計算した値と一致する。producer が、人手で足したビルド入力を必要としない | 手順書が前提を欠く (denylist、Node の pin、ビルド入力) |

## 3. 範囲と実行

- 001〜005 は `selectPackBuildInputs` の純粋関数テスト。006〜009 と 011 は `sync-pack` / `package` の fixture テスト (一時 Git repo、ネットワークなし、`installDependencies` は注入の spy)。
  010 は静的検査 (grep 相当のテスト)。012 は L12 の受入で、結果は #1879 / #1882 のコメントに記録する (CI の対象にしない)。
- 007 の bytes 同一の照合は、変換を通る artifact (`package.json` 等) と区別するため、ビルド入力の path だけを対象にする (`pack-exec-mode.md` §4 の bytes を比べない範囲と衝突しない)。
- 全 ID は `Red -> Green` の対象である。`it.fails` 登録の段階では、`pack-build-inputs.ts` が無いことによる import 失敗ではなく、各 oracle の期待の不成立で Red になること (import は stub で解決する)。
