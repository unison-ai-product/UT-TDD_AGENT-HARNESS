---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_build_inputs
pair_artifact: docs/test-design/harness/L7-pack-build-inputs-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 1882
---

> **L6 contract marker**: `selectPackBuildInputs(treePaths, exists?) => PackBuildInputSelection` (tagged source の Git tree の path 一覧から Pack のビルド入力を選ぶ純粋関数。`src/setup/pack-build-inputs.ts` に置く) は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、契約の意味は変えない)。pre: `treePaths` は `git ls-tree -r` 相当の tracked path (index を読まない)。post: 固定の 3 file と V-model テンプレート (§3) が全て tree に在るときだけ `ok: true` とその path の昇順の一覧を返し、1 件でも欠ければ書き出し前に止める理由コード (§4) を返す。invariant: ビルド入力の選択規則は repo 全体でこの 1 関数だけが持ち、`sync-pack` / `package` / テストの補助は同じ関数を呼ぶ。oracle は `docs/test-design/harness/L7-pack-build-inputs-test-design.md` の `CANDIDATE-U-PKBIN-001`〜`017` が固定する (正式 ID `U-PKBIN-*` への昇格は、src を含まない昇格 PR で行う)。

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
   (入れると公開物が変わり、既存の契約に触れる)。C1 に置くだけで、`package` が snapshot から読む。同じ path が artifact にも入っている場合は artifact を優先して 1 回だけ copy する (変換後の bytes が C1 に入り、build 入力としての bytes 同一の照合は行わない)。
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

### 5.1 公開の照合 (`pack-exec-mode.md` §4.3) が期待する C1 の集合

本書は `pack-exec-mode.md` §4.3 の「期待 entry の集合」を次のとおり**改訂する** (§4.3 の他の規則は変えない)。ビルド入力を C1 に置くので、照合の期待集合へ入れないと、
正しく作った C1 を `commit_entries_mismatch` で拒否する。

- **期待集合** = artifact (`release.artifacts`) + **ビルド入力** + C2 の `release/manifest.yaml` (control manifest の sidecar)。この集合と C1 の全 entry / 全 blob を `exactCommitEntries` が完全に比べる。
- **ビルド入力の entry**: path は `selectPackBuildInputs` の `paths` (§3 と同じ単一の正本。照合側に独自の一覧を持たない)。mode は `100644` 固定。bytes は**固定した source commit** の同じ path の blob と一致する
  (変換しない。§5 の `sync-pack` が bytes を変えずに copy するのと対)。entry の種別は artifact / control manifest とは別の `build-input` とする。
  artifact と同じ path のときは artifact の entry だけを期待し、`build-input` の entry は足さない。
- **責務**: 期待集合を作るのは `packCommitEntries` (`src/setup/pack-publication-staging.ts`) である。呼び出し側が、固定した source commit の `git ls-tree -r` を `selectPackBuildInputs` に通し、
  その `paths` の blob を `git cat-file` で読んだ `{ path, bytes }` の列を渡す。`packCommitEntries` は選択をしない (選択の正本は 1 つ)。`ok: false` (§4) のときは、期待集合を作らず公開を止める。
  期待集合の外の entry を 1 件でも観測すれば、従来どおり拒否する。
- **`package` の照合での期待 bytes (#1894 で改訂)**: `package` は source repo を読まない (§5)。そのため `package` の中の照合 (`pack-publication-audit-wiring.md`) では、ビルド入力の期待 bytes を **C1 の blob** とする。
  この照合が保証するのは、path・mode・extra・欠落の完全一致と、C1 と C2 の間で bytes が変わっていないことである。ビルド入力の bytes が source commit の blob と一致することは保証しない。
  source commit との一致は `sync-pack` が bytes を変えずに copy すること (`CANDIDATE-U-PKBIN-007`) が保証する。`sync-pack` の後、C1 の commit の前に人がビルド入力を書き換える場合は、どちらでも検出できない (残余リスク)。
  上の「bytes は固定した source commit の blob と一致する」は `sync-pack` の出力についての規則であり、`package` の照合の oracle ではない。`CANDIDATE-U-PKBIN-013` の「source commit の blob と一致」は、fixture の C1 を source から作るときの前提として読む。
- **公開物は変えない**: ビルド入力は公開 tar と manifest の `artifacts[]` に入らない (§2.2)。増えるのは C1 の期待集合だけである。
- **実測 (本書の根拠)**: 現行の `packCommitEntries` (`pack-publication-staging.ts:223-256`) は `release.artifacts` と control manifest だけから期待集合を作る。
  `auditPackPublication` の呼び出し元は `src/` に無く (テストだけ)、`exactCommitEntries` に実 C1 を読ませる配線は未実装である (`pack-exec-mode.md` §4.3 の「公開の必須条件」)。
  canary.7 は C1 に 52 件のビルド入力を人が足して公開されたが、この照合を通っていない。照合を配線すると、期待集合を改訂しないままでは同じ C1 を拒否する。

## 6. 不変条件 (DbC)

- Pre: 入力は tracked path の一覧のみ。選択は読み取りだけで、file を書かない。
- Post: `ok: true` のとき、返る path は全て tree に在り、固定 3 件とテンプレート 1 件以上を含む。`ok: false` のとき、`reasons` は欠けた全ての固定 file と、必要ならテンプレート空の理由を含む。
- Invariant (単一の正本): ビルド入力を**選ぶ**規則 (固定 3 件の一覧とテンプレート規則) は `src/setup/pack-build-inputs.ts` にだけ在る。`sync-pack` / `package` / `tests/support/` は、ビルド入力を選ぶために独自の一覧や規則を持たず、この関数を呼ぶ。入力の**中身を読む**ための既存の参照 (例: `src/runtime/node-bootstrap.ts` の provenance の検証と読込み、`src/setup/vmodel-template-writer.ts` の catalog の読込み) は選択の重複ではないので対象外とする。
- Invariant (非破壊): ビルド入力の検査が失敗した `sync-pack` は `repoDir` を変えず、`package` は `outDir` に何も書かない。
- Invariant (artifact と別): `plan.artifactPaths`、release manifest、tar inventory は本契約の前後で変わらない。照合の期待集合だけが §5.1 のとおり広がる。
- Invariant (出力の語彙): 出力は理由コード、path、件数だけ。`nextCommands` は引き続き `git add` / `commit` / `push` を実行しない (`localGitMutationExecuted: false`)。

## 7. oracle

`CANDIDATE-U-PKBIN-001..017` (`docs/test-design/harness/L7-pack-build-inputs-test-design.md`。共有の `L7-unit-test-design.md` には足さない)。012 は L12 の受入
(新しい clone での再現の実測。再現性の範囲は §7.1) である。013〜017 は §5.1 の期待集合の oracle である。unit の oracle は path 区切りや実行 bit に依らず、tracked path だけを観測する。

### 7.1 再現性の定義

「同じ C1 / C2 から同じ Pack を作れる」を、5 asset ごとに次のとおり定義する (コードの読みによる。実測は 012)。

| asset | 同一になる条件 | 理由 |
| --- | --- | --- |
| `<tag>.tar.gz`、`<tag>.tar.gz.sha256` | **PC・checkout・Node の path に依らず byte 同一** | C2 の sealed な entry だけから作り、Node の path を入力に持たない |
| `<tag>.ut-tdd.mjs` | **同上 (path 非依存の期待)** | esbuild は `absWorkingDir` 相対のコメントだけを出し、sourcemap は無く、banner は定数 (`scripts/build-node.mjs`)。012 の実測で崩れたら本表を改訂する |
| `<tag>.consumer-runtime.json`、`<tag>.consumer.sha256` | **Node / npm の install path が同一のときだけ** byte 同一 | receipt の `node.path` / `npm.cli_path` (絶対 path) と、それを含む `generation_id` が runtime json に base64 のまま入り (`src/runtime/node-bootstrap.ts:796-827`、`src/setup/consumer-runtime-release.ts:531`)、`consumer.sha256` は runtime json の digest を持つ (`src/cli/distribution.ts:668-671`) |

- **比べ方**: 同じ PC の 2 つ目の checkout (Node の path が同じ) では 5 asset 全てが一致する。別の PC では、Node / npm の install path が同一なら 5 asset 全て、異なるなら上の 3 asset だけを必須とする。
  後者で `consumer-runtime.json` が違うときは、receipt を base64 から戻し、`node.path`、`npm.cli_path`、`generation_id`、`receipt_digest` 以外が一致することを確かめて、差が path だけであることを示す。
- **範囲外 (別 Issue で扱う)**: receipt から絶対 path を除く (または path に依らない形で `generation_id` を作る) こと。receipt 形式 (schema v2) と consumer の検証 (`verifyToolchain`) に触れる契約変更であり、本書では行わない。
- 本書が保証するのは「ビルド入力の不足で作れない」を無くすことであり、path 非依存の byte 同一は保証しない。

## 8. 範囲外

C2 の `release/manifest.yaml` の生成 (materializer の呼び出し) の自動化、公開 (`gh release`) の自動化、`sync-pack` の mode 保持 (`pack-exec-mode.md`)。
運用手順 (`pack-release-runbook.md`) は、これらを自動化されていない手順として明記する。
