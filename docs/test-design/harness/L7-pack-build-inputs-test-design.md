---
title: "L7 Pack ビルド入力の一覧と検査 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-build-inputs.md
status: confirmed
updated: 2026-11-20
issue: 1882
---

# Pack のビルド入力の一覧と検査 テスト設計 (issue #1882)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-build-inputs.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (shared file の直列化規律)。本書が
oracle の正本である。自動検証の `U-PKBIN-001`〜`011` と `U-PKBIN-013`〜`017` は、
Red で登録した `it.fails` のテストから引用する。`CANDIDATE-U-PKBIN-012` は L12 受入として control が手動で実行する。
実装 PR で Red を Green (`it` へ戻す) に切り替える (設計書保護 gate)。

## 2. Oracle と手動受入

fixture は一時 Git repo (tracked は `git ls-tree` で観測) を使う。
各 oracle は、その oracle が守る条件だけが成立する入力を 1 つだけ持つ。

| ID | 入力 / 独立変異 | 期待 | その行が Red にする mutation |
| --- | --- | --- | --- |
| `U-PKBIN-001` | 全て揃った tree (固定 3 件 + テンプレート複数 + `review-examples/` の `.md` + `docs/templates/vmodel/` 直下の非 `.md`) を `selectPackBuildInputs` に渡す | `ok: true`。`paths` は固定 3 件 + 対象テンプレートだけで、昇順・重複なし。`review-examples/` と非 `.md` は含まない | 除外接頭辞を外す / 接尾辞の判定を外す |
| `U-PKBIN-002` | 固定 3 件のうち 1 件だけを tree から外す (3 通りを表で回す。他は全て揃う) | `ok: false`。`reasons` はその 1 件の `pack_build_input_missing` と path だけ | 固定 file の検査を 1 件でも外す |
| `U-PKBIN-003` | `docs/templates/vmodel/*.md` を 0 件にした tree (固定 3 件は揃う) | `ok: false`、`pack_build_input_template_set_empty` だけ | テンプレート 0 件を許す (空集合の素通り) |
| `U-PKBIN-004` | 固定 file が working tree に在り、tree (HEAD) には無い。`exists` を渡す | `pack_build_input_untracked` (`missing` ではない)。`exists` を渡さないと `missing` | untracked と missing を区別しない |
| `U-PKBIN-005` | 複数の欠落 (固定 2 件とテンプレート 0 件) | `reasons` が全てを path の昇順で返す (最初の 1 件で止めない) | 最初の欠落で return する |
| `U-PKBIN-006` | `sync-pack` を、ビルド入力が 1 件欠けた source (HEAD) で実行。`repoDir` に既存 file と、prune 対象の stale file を置く | exit 1、JSON の `pack.buildInputs.ok === false` と理由コード。`repoDir` は実行前後で byte 単位で同一 (prune も copy も無い) | 検査を prune / copy の後ろに置く |
| `U-PKBIN-007` | `sync-pack` の成功。`repoDir` は空の clone | ビルド入力が source と bytes 同一で `repoDir` の同じ相対 path に在る。`nextCommands` の `git add` pathspec に全て含まれる。`pack.buildInputs.count/paths` が evidence に在る。`copiedArtifacts` と `exportPlan.artifactPaths` に増減が無い | 変換 (`transformCleanDistributionArtifact`) を通す / artifact へ混ぜる |
| `U-PKBIN-008` | `sync-pack --prune-local`。`repoDir` に前回のビルド入力と、一覧に無い stale file がある | ビルド入力は消えない (上書きされ、`unmanagedExistingPaths` にも出ない)。stale file だけが prune される (canary.8 の ENOENT の退行) | ビルド入力を保護集合に入れない |
| `U-PKBIN-009` | `package`。C1 の snapshot に、ビルド入力が 1 件欠ける (C1 / C2 の構造は正しい) | `installDependencies` を呼ぶ前に `ConsumerRuntimeReleaseProducerError("pack_build_input_*")` で止まり、`outDir` に何も書かれない。ENOENT / `node-bootstrap-*-missing` ではない | 検査を install / build の後ろに置く |
| `U-PKBIN-010` | 単一の正本 (静的検査): ビルド入力を選ぶ経路 (`sync-pack` / `package` の実装と `tests/support/pack-internal-canary.ts`) に、ビルド入力を選ぶための独自の path の一覧やテンプレート接頭辞の規則が無い。中身を読むための既存の参照 (`src/runtime/node-bootstrap.ts`、`src/setup/vmodel-template-writer.ts`) は対象外。helper は `selectPackBuildInputs` を import する | 選択経路に独自の一覧が 0 件。`sync-pack` / `package` / helper が同じ関数を呼ぶ | helper または `sync-pack` に path の literal を戻す |
| `U-PKBIN-011` | ビルド入力のうち 1 file の内容に denylist の entry が一致する (denylist は `provided`。他は全て清潔) | `sync-pack` と `package` のどちらも書き出し前に `privacy-denylist-hit` で止まる。出力に一致した文字列を含まない | ビルド入力を scan の入力から外す |
| `CANDIDATE-U-PKBIN-012` | **L12 受入 (手動 + 記録)**: 新しい clone と何も入っていない作業 directory で、`docs/reference/pack-release-runbook.md` の手順だけで 5 asset を作る。同じ PC の 2 つ目の checkout でも作る。別の PC を使えるときは、Node の path が同一の条件と異なる条件の両方で作る | 5 asset の sha256 が、独立に再計算した値と一致する。producer が人手で足したビルド入力を必要としない。2 つ目の checkout (同じ Node path) では 5 asset 全てが一致する。別の PC では、`tar.gz`、`tar.gz.sha256`、`ut-tdd.mjs` が必ず一致し、`consumer-runtime.json` / `consumer.sha256` は Node path が同一のときだけ一致する (異なるときは receipt の path と `generation_id`、`receipt_digest` 以外の一致を示す。設計 §7.1) | 手順書が前提を欠く (denylist、Node の pin、ビルド入力)。または path 依存の asset を無条件の一致として扱う |
| `U-PKBIN-013` | 期待集合の組み立て: artifact + `selectPackBuildInputs` の `paths` の blob + control manifest を `packCommitEntries` に渡し、同じ集合の C1 を `auditPackPublication` に観測させる | `attested`。ビルド入力の entry は mode `100644`、種別 `build-input`、bytes は source commit の blob と一致し、公開 tar と manifest の `artifacts[]` には無い | 期待集合へビルド入力を足さない (正しい C1 を拒否する) / ビルド入力を artifact に混ぜる |
| `U-PKBIN-014` | 013 の正しい C1 に、期待集合に無い `100644` の file を 1 件だけ足す | `partial_publication` / `commit_entries_mismatch` (extra は引き続き拒否) | 期待集合を「C1 の全 entry」へ緩める (extra の素通り) |
| `U-PKBIN-015` | 013 の正しい C1 から、ビルド入力を 1 件だけ外す (他は全て在る) | `commit_entries_mismatch` (欠落したビルド入力を拒否) | ビルド入力を任意扱いにする |
| `U-PKBIN-016` | 013 の正しい C1 で、ビルド入力 1 件の bytes だけを 1 byte 変える (path / mode / size は同じ) | `commit_entries_mismatch` | bytes の照合を path だけにする |
| `U-PKBIN-017` | ビルド入力の path が artifact の出荷先 path と重なる (artifact の bytes は変換後で source と異なる) | 期待集合に当該 path が 1 件だけ在り、artifact の変換後の bytes を期待する。`build-input` の entry は足さない。C1 がその bytes ならば `attested` | 重なった path に source の bytes を期待する / 2 件並べる |

## 3. 範囲と実行

- 001〜005 は `selectPackBuildInputs` の純粋関数テスト。006〜009 と 011 は `sync-pack` / `package` の fixture テスト、013〜017 は `packCommitEntries` と `auditPackPublication` の unit テスト (一時 Git repo、ネットワークなし、`installDependencies` は注入の spy)。
  010 は静的検査 (grep 相当のテスト)。012 は L12 の受入で、結果は #1879 / #1882 のコメントに記録する (CI の対象にしない)。
- 007 の bytes 同一の照合は、変換を通る artifact (`package.json` 等) と区別するため、ビルド入力の path だけを対象にする (`pack-exec-mode.md` §4 の bytes を比べない範囲と衝突しない)。
- 全 ID は `Red -> Green` の対象である。`it.fails` 登録の段階では、`pack-build-inputs.ts` が無いことによる import 失敗ではなく、各 oracle の期待の不成立で Red になること (import は stub で解決する)。
