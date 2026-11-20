---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_pack_build_inputs
pair_artifact: docs/test-design/harness/L7-pack-build-inputs-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 1882
---

> **L6 contract marker**: `selectPackBuildInputs(treePaths, exists?) => PackBuildInputSelection` (tagged source の Git tree の path 一覧から Pack のビルド入力を選ぶ純粋関数。`src/setup/pack-build-inputs.ts` に置く) は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、契約の意味は変えない)。pre: `treePaths` は `git ls-tree -r` 相当の tracked path (index を読まない)。post: 固定の 3 file と V-model テンプレート (§3) が全て tree に在るときだけ `ok: true` とその path の昇順の一覧を返し、1 件でも欠ければ書き出し前に止める理由コード (§4) を返す。invariant: ビルド入力の選択規則は repo 全体でこの 1 関数だけが持ち、`sync-pack` / `package` / テストの補助は同じ関数を呼ぶ。oracle は `docs/test-design/harness/L7-pack-build-inputs-test-design.md` の `CANDIDATE-U-PKBIN-001`〜`012` が固定する (正式 ID `U-PKBIN-*` への昇格は、src を含まない昇格 PR で行う)。

# Pack のビルド入力の一覧と検査 (Issue #1882)

新しい PC・新しい clone でも同じ Pack を作れることが必達条件である (PO 2026-11-20)。本書は、tagged source のビルド入力を
`src/` の 1 か所で持ち、`sync-pack` と `package` がそれを取り込んで検査する方式を freeze する。実装・テストは本書を
oracle の正本として別 PR で行う。PLAN は凍結中 (#1166) のため、方式判断はここへ置く。公開手順は
`docs/reference/pack-release-runbook.md` が持つ。

## 1. 実測した事実 (main `c45be126`)

| 事実 | 根拠 |
| --- | --- |
| ビルド入力を選ぶ処理は、テストの補助にしか無い。固定 2 file (`node-toolchain-provenance.json`、`tsconfig.node.json`) と、`vmodel-document-catalog.md` と `docs/templates/vmodel/*.md` (`review-examples/` 除く) の選択 | `tests/support/pack-internal-canary.ts:126-150` |
| `src/` の `sync-pack` / `package` にこの入力を扱う処理は無い。`sync-pack` は `exportPlan.artifactPaths` だけを copy し、`--prune-local` は artifact でない既存 file を消す | `src/cli/distribution.ts` の `sync-pack` (`existingBefore`、prune、copy の各 block) |
| `package` の producer は、Pack checkout の `artifactSourceCommit` (C1) を `git clone --shared` + `checkout --detach` した snapshot で動く。build は snapshot の root から固定 2 file を読み、無ければ `node-bootstrap-provenance-missing` / `node-bootstrap-tsconfig-missing` で止まる (canary.8 の ENOENT) | `src/cli/distribution.ts:336-351` (snapshot)、`:575`、`src/runtime/node-bootstrap.ts:724-731` |
| `package` は C2 (tag) が C1 から `release/` だけを変えることを要求する (外の diff は `consumer_runtime_release_diff_outside_release`)。したがって build 入力は C1 に在る必要があり、C2 の差分には入らない | `src/cli/distribution.ts:325-331` |
| canary.7 では C1 に build 入力 52 件 (固定 3 + テンプレート 49) を人が足した。現行 main の tracked テンプレートも 49 件 (合計 52 件) | #1879 コメント、`git ls-files docs/templates/vmodel` の実測 |
| `collectDistributionCandidatePaths` は `git ls-tree -r HEAD` の tracked path を返す (Git が無いときだけ filesystem を歩く) | `src/cli/distribution.ts:120-139` |

## 2. 採択

1. **一覧は新しい小さな module `src/setup/pack-build-inputs.ts` が持つ**。`src/setup/distribution.ts` は肥大が進んでおり (code-size gate)、
   artifact の一覧 (`buildCleanDistributionPlan`) とは別の概念なので同居させない。module は定数 2 個と関数 1 個だけにする
   (層・class・registry を足さない、最小実装原則)。
2. **ビルド入力は Pack の artifact ではない**。`buildCleanDistributionPlan` の `artifactPaths`、release manifest の inventory、公開 tar には入れない
   (入れると公開物が変わり、既存の契約に触れる)。C1 に置くだけで、`package` が snapshot から読む。同じ path が artifact にも入っている場合は 1 回だけ copy する。
3. **検査は書き出しの前に行う**。`sync-pack` は prune / copy の前、`package` は依存の install と asset の stage の前に、`selectPackBuildInputs` を呼び、
   `ok: false` なら何も書かずに止まる (§5)。
4. **テストの補助は同じ関数を読む**。`tests/support/pack-internal-canary.ts` の独自の選択 (path の文字列 literal) を削除し、`selectPackBuildInputs` の結果を copy する。
   一覧が 2 か所に残ると今回の再発になる。
5. **棄却**: (a) 一覧を JSON / YAML の宣言 file にする案 (3 件 + 1 規則の定数に比べ、読み込みと検証の層が増えるだけ)。
   (b) build 入力を artifact に昇格して tar に入れる案 (公開物の変更。必要なら別 Issue)。
   (c) `sync-pack` が `--prune-local` で入力を除外するだけの案 (`package` 側の検査が無く、C1 を手で作る経路で再発する)。

## 3. 選択規則

`treePaths` は `/` 区切りに正規化する。選ぶ path は次の和集合で、昇順・重複なしで返す。

| 種別 | 規則 | 欠けたとき |
| --- | --- | --- |
| 固定 file | `docs/governance/node-toolchain-provenance.json`、`tsconfig.node.json`、`docs/governance/vmodel-document-catalog.md` の 3 件。tree に完全一致で在ること | 1 件ごとに `pack_build_input_missing` |
| テンプレート | `docs/templates/vmodel/` で始まり、`.md` で終わり、`docs/templates/vmodel/review-examples/` で始まらない path。子 directory は含む | 0 件なら `pack_build_input_template_set_empty` |

- テンプレートは glob ではなく**接頭辞 + 接尾辞 + 除外接頭辞**で判定する (現行 helper の判定と同一。件数は固定しない。canary.7 の 52 件は例であって契約ではない)。
- 固定 file が tree に無く、`exists(path)` が真 (working tree に在る) のときは `pack_build_input_untracked` とする。commit し忘れを `missing` と区別して示すためである。
  `exists` を渡さない呼び出し (`package` の snapshot) は常に `missing` になる。

## 4. 関数のシグネチャと理由コード

```ts
export const PACK_BUILD_INPUT_FILES: readonly string[]; // 固定 3 件
export const PACK_BUILD_INPUT_TEMPLATE_RULE: { prefix: string; suffix: string; excludePrefix: string };
export type PackBuildInputReason =
  | { code: "pack_build_input_missing" | "pack_build_input_untracked"; path: string }
  | { code: "pack_build_input_template_set_empty" };
export type PackBuildInputSelection =
  | { ok: true; paths: readonly string[] }
  | { ok: false; reasons: readonly PackBuildInputReason[] };
export function selectPackBuildInputs(
  treePaths: readonly string[],
  exists?: (path: string) => boolean,
): PackBuildInputSelection;
```

理由コードは `reasons` に path の昇順で全て並べる (最初の 1 件で止めない。足りない物を一度で直せるようにする)。出力に出すのは理由コードと path だけで、file の内容は出さない。

## 5. `sync-pack` と `package` の配線

- **`sync-pack`**: `collectDistributionCandidatePaths(repoRoot)` の結果を `selectPackBuildInputs(sourcePaths, existsInWorkTree)` に通す。
  - `ok: false`: `output.ok = false` (exit 1)、prune・copy を行わず、JSON に `pack.buildInputs: { ok: false, reasons }` を出す。`repoDir` を一切変えない。
  - `ok: true`: artifact の copy に続けて、ビルド入力を **bytes を変えずに** 同じ相対 path で `repoDir` へ copy する (`transformCleanDistributionArtifact` を通さない)。
    `plannedArtifacts` と同じ保護集合に含めるので、`--prune-local` で消えず、`unmanagedExistingPaths` にも出ない (canary.8 の原因)。
    `nextCommands` の `git add` の pathspec に含め、`pack.buildInputs: { ok: true, count, paths }` を copy evidence に記録する。
  - secret-scan / privacy-scan (`privacy-scan.md` §5、denylist 必須) の入力にもビルド入力を加える。Pack に入る file は全て同じ検査を通す。
- **`package`**: `createTaggedSourceSnapshot` の後、`collectDistributionCandidatePaths(sourceRoot)` を `selectPackBuildInputs` に通す。`ok: false` なら
  `ConsumerRuntimeReleaseProducerError("pack_build_input_<code>", paths)` で、`installDependencies` と asset の stage より前に止める (`outDir` は空のまま)。
  snapshot は C1 の checkout なので、C1 からのビルド入力の欠落を、ENOENT より前に理由コード付きで検出する。
- どちらも `selectPackBuildInputs` の戻り値以外から path を作らない。`package` が source repo を読み戻して補う経路は作らない (Pack 単独で再現できなくなる)。

## 6. 不変条件 (DbC)

- Pre: 入力は tracked path の一覧のみ。選択は読み取りだけで、file を書かない。
- Post: `ok: true` のとき、返る path は全て tree に在り、固定 3 件とテンプレート 1 件以上を含む。`ok: false` のとき、`reasons` は欠けた全ての固定 file と、必要ならテンプレート空の理由を含む。
- Invariant (単一の正本): 固定 file の path 文字列とテンプレート規則は `src/setup/pack-build-inputs.ts` にだけ在る。`src/` の他の module と `tests/support/` は同じ literal を持たない。
- Invariant (非破壊): ビルド入力の検査が失敗した `sync-pack` は `repoDir` を変えず、`package` は `outDir` に何も書かない。
- Invariant (artifact と別): `plan.artifactPaths`、release manifest、tar inventory は本契約の前後で変わらない。
- Invariant (出力の語彙): 出力は理由コード、path、件数だけ。`nextCommands` は引き続き `git add` / `commit` / `push` を実行しない (`localGitMutationExecuted: false`)。

## 7. oracle

`CANDIDATE-U-PKBIN-001..012` (`docs/test-design/harness/L7-pack-build-inputs-test-design.md`。共有の `L7-unit-test-design.md` には足さない)。012 は L12 の受入
(新しい clone での再現の実測) である。unit の oracle は path 区切りや実行 bit に依らず、tracked path だけを観測する。

## 8. 範囲外

C2 の `release/manifest.yaml` の生成 (materializer の呼び出し) の自動化、公開 (`gh release`) の自動化、`sync-pack` の mode 保持 (`pack-exec-mode.md`)。
運用手順 (`pack-release-runbook.md`) は、これらを自動化されていない手順として明記する。
