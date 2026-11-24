---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_publication_audit_wiring
pair_artifact: docs/test-design/harness/L7-pack-publication-audit-wiring-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 1894
---

> **L6 contract marker**: `observePackPublication({ repoRoot, c1, c2 }) => PackPublicationObservation` (固定した C2 の 40 桁 SHA の Git tree を `git ls-tree -r -z` と `git cat-file` だけで読み、path / mode / size / digest / bytes の entry の列を返す。`src/setup/pack-publication-observe.ts` に置く) と、`packageConsumerRuntimeRelease` (`src/cli/distribution.ts`) の中での `buildPackPublicationStagingPlan` → `auditPackPublication` の呼び出しは unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、契約の意味は変えない)。pre: `c1` / `c2` は `resolveConsumerRuntimeReleaseSourceBinding` が返した SHA で、観測は ref 名・index・working tree を読まない。post: `status: "attested"` のときだけ `package` は asset を書き出す。`partial_publication` / `indeterminate` / 計画の preflight 失敗では、`installDependencies` も asset の stage も実行せず、`outDir` は空のままである。invariant: 公開の照合は `package` を通らずに済ませる経路を持たない (canary.7 の再発の防止)。oracle は `docs/test-design/harness/L7-pack-publication-audit-wiring-test-design.md` の `CANDIDATE-U-PKAUD-001`〜`017` が固定する (正式 ID `U-PKAUD-*` への昇格は、src を含まない昇格 PR で行う)。

# 公開前の Pack の照合を `package` に配線する方式 (Issue #1894)

`auditPackPublication` / `buildPackPublicationStagingPlan` (`src/setup/pack-publication-staging.ts`) は、公開の最後の門として C1 / C2 の全 entry を期待集合と完全に比べる。
しかし `src/` のどこからも呼ばれず、呼ぶのはテストだけである。canary.7 は C1 に 52 件のビルド入力を人が足して、この照合を通らずに公開された。
本書は、その照合を公開の手順のどこで、どの観測で呼ぶかを freeze する。実装・テストは本書を oracle の正本として別 PR で行う。PLAN は凍結中 (#1166) のため、方式判断はここへ置く。
照合の期待集合は `pack-build-inputs.md` §5.1、mode と extra・bytes の位置付けは `pack-exec-mode.md` §4.3 が持ち、本書はこれを置き換えず、配線だけを定める。
C2 の生成 (#1885、`pack-c2-manifest.md`。PR #1886 が未 merge) とは独立で、C2 が `release/manifest.yaml` を持つ前提だけを共有する。

## 1. 実測した事実

- `package` (`packageConsumerRuntimeRelease`) は Pack の checkout を cwd にして走り、`resolveConsumerRuntimeReleaseSourceBinding` で tag から C2 (`releaseRevision`) と C1 (`artifactSourceRevision`) の SHA を既に持つ。C2 が `release/` の外を変えていないことも、ここで検査済みである。
- `package` は `resolveReleaseArtifacts` で sealed な entry (`tarResolution.entries`) を得た後、`writeFileSync` で tarball を stage に書く。照合を差し込める位置は、この `writeFileSync` の前である。
- `release-plan` は手順を表示するだけで、何も実行しない。照合を呼べる経路ではない。
- `auditPackPublication` は注入された `observe` の値を `plan` と比べるだけで、観測は持たない。比べる対象は commit entry・release asset・control manifest の snapshot digest の 3 つである。
- 期待 entry の `kind` は現在 `artifact` と `control-manifest` の 2 種である。ビルド入力 (`build-input`) は `pack-build-inputs.md` §5.1 の実装 (#1882 の Green) が足す。

## 2. 選択肢

| 案 | 内容 | 利点 | 欠点 |
| --- | --- | --- | --- |
| A | 新しい `distribution audit-publication` サブコマンドを足し、runbook で `package` の前に実行する | 照合だけを単独で試せる | 呼び忘れると素通りする。canary.7 は「呼ばれない手順」が原因であり、同じ構造を残す。C1 / C2 の SHA と sealed entry を二重に解決する |
| B | `package` の中で、asset を書く前に照合する | 別の呼び出しが要らず、素通りできない。`package` が既に C1 / C2 の SHA と sealed entry を持つ | `package` の責務が増える (追加は 1 呼び出しと観測 1 関数だけ) |
| C | `release-plan` で照合する | 公開の直前に近い | `release-plan` は表示のみで fail-close の位置に無い。asset を作った後になる |

## 3. 採択: 案 B

1. **配線点**: `packageConsumerRuntimeRelease` で、(i) `pack-build-inputs.md` §5 のビルド入力の検査、(ii) `resolveReleaseArtifacts` による sealed entry の取得、(iii) メモリ上の tar の導出 (`derivePackPublicationAssets`、mode の検査 `distribution package tar mode is unsupported` を含む)、の後、(iv) 最初の `writeFileSync` (tarball) と `installDependencies` の前に照合を入れる。
   ビルド入力の検査を先にするので、ビルド入力の欠落の理由コードは `pack_build_input_*` のまま (照合の理由に上書きされない)。
2. **別サブコマンドを足さない理由**: 案 A は呼び忘れに弱い。照合を `package` に畳めば、5 asset を作る全ての経路が照合を通る (最小実装)。単独で試したいときは、`package` を空の `--out` で実行する (失敗しても `outDir` は空のまま残る)。
3. **期待集合の作り方と順序**: 先に計画を作り (`buildPackPublicationStagingPlan`)、その後に観測して照合する (`auditPackPublication`)。
   計画には、C2 の `release/manifest.yaml` の bytes (`git cat-file blob <C2>:release/manifest.yaml`) と、そこから解釈した manifest、`tarResolution.entries` から作る sealed entry を渡す。
   ビルド入力は、C1 の tree を `selectPackBuildInputs` に通した `paths` の **C1 の blob** を `{ path, bytes }` で `packCommitEntries` に渡す (照合側は選択しない)。期待 bytes を C1 の blob とすることは、`pack-build-inputs.md` §5.1 の「`package` の照合での期待 bytes」で改訂済みである (source commit との一致はこの照合の保証に含めない。§9)。
   計画の構築が `invalid_manifest` / `v1_read_only` / `unknown_release` / `control_manifest_mismatch` / `commit_entry_mismatch` などで失敗したときは、観測に進まず止める (§4)。
   C1 の blob の変異は、照合より前の既存の検査で次のとおりに止まる (`src/cli/distribution.ts` のメモリ上の tar の導出が、manifest の `artifacts[]` と materializer の出力を `exactEntries` (`src/setup/pack-publication-assets.ts`) で比べる)。既存の拒否は、照合の理由コードへ写像しない。
   - **正規化で消えない変異** (変換を通らない artifact の bytes、artifact の mode): `exactEntries` が `contentDigest` / `mode` の不一致で拒否し、`distribution package tar materialization failed: artifact_mismatch` で止まる。計画も観測も呼ばれない。
   - **正規化で消える変異** (`package.json` の末尾の空白など、`transformCleanDistributionArtifact` の `JSON.parse` / `JSON.stringify` で元に戻るもの): tar の導出と計画を通る。観測は C2 の tree の生の blob を読み、期待 (sealed の bytes) と違うので `commit_entries_mismatch` になる (§4、`details` は `content`)。
   計画の構築の `commit_entry_mismatch` は、tar の導出の検査を通った後の多重の防御であり、C1 の blob の変異では到達しない。どの経路でも asset は作られない。
4. **観測 (`observePackPublication`)**: 固定した **C2 の SHA** の tree を、次の 2 つの Git コマンドだけで読む。
   - `git ls-tree -r -z --full-tree <C2>`: 全 entry の mode と blob oid と path。
   - `git cat-file --batch`: 各 blob の bytes。標準入力には、直前の `ls-tree` の出力から取った blob の OID だけを 1 行に 1 つ渡す (commit の SHA や ref 名は渡さない)。OID は bytes を取り出すためだけに使い、size と `sha256:` digest は取り出した bytes から計算する。
   C2 の tree は C1 の tree に `release/` の変更を足したものなので、C1 の全 entry と `release/manifest.yaml` を 1 回の観測で得る。
   観測は ref 名 (tag・branch・`HEAD`)・index (`git ls-files`)・working tree を読まない (読むと、期待を作った SHA と違うものを観測しうる)。
   観測した entry は path を UTF-8 のバイト順で並べる。`kind` は、path が期待集合の `control-manifest` / `build-input` に当たればその種別、それ以外は `artifact` とする。
   期待に無い path は `artifact` と観測され、path の不一致で拒否される (`exactCommitEntries`)。
5. **観測の mode**: `100644` / `100755` 以外 (`120000` symlink、`160000` submodule) を見つけたら、観測は entry を作らず `commit_entries_mismatch` と等価の拒否を返す (`PackPublicationCommitEntry` の型は 2 つの mode しか持てないため。symlink の拒否は `pack-exec-mode.md` §4.3 の (d) と同じ向き)。
   **到達する経路** (`src/setup/release-artifact-resolver.ts` の `parseTree` と `ENTRY_MODES`、`src/setup/release-materializer.ts` の `validSymlink`、`src/cli/distribution.ts` の tar の mode の検査を実測して固定する。どれも照合の理由コードへ写像せず、既存の理由のまま止める。manifest の `mode` は `100644` / `100755` しか持てず (`src/schema/release-manifest.ts` の `PUBLICATION_MODES`)、`120000` を書いた manifest は `parsePublicationManifest` が `consumer_runtime_release_manifest_invalid` で先に止める。以下の symlink の経路は、manifest を有効なまま C1 の tree だけを symlink にした場合である):
   - C1 の `160000` (submodule、path を問わない): `parseTree` が tree 全体を拒否し、`distribution package tar materialization failed: invalid_artifact` で止まる (`ENTRY_MODES` に無く、type が `blob` でない)。
   - C1 の `120000` で、artifact の path かつ危険な target (絶対 path・drive 付き・`` を含むなど、`validSymlink` が拒否するもの): 止まる位置は、snapshot の checkout が symlink を実体化するかで変わる。実体化する OS (Linux など) では、source の preflight の privacy scan がリンク先を読めず `distribution package source preflight failed: ...privacy-input-unreadable...` で止まる。実体化しない OS (`core.symlinks=false` の Windows など) では、materializer が拒否して `distribution package tar materialization failed: invalid_artifact` で止まる。どちらも照合より前の既存の拒否である (2026-11-24 の CI の Linux と手元の Windows で実測)。
   - C1 の `120000` で、artifact の path かつ安全な相対の target: materializer は mode を保って通す。メモリ上の tar の導出が `distribution package tar mode is unsupported: <path>` で止まる (照合より前、§3.1 (iii))。
   - C1 の `120000` で、artifact でない path (materializer の対象外、`release/` の外): `parseTree` と materializer を通り、照合の観測で mode を拒否されて `pack_publication_audit_commit_entries_mismatch` になる (`details` の分類は `extra`)。
   - C2 で `release/` の中に足した `120000` / `160000`: `diff_outside_release` を通り、materializer は C1 しか読まないので、照合の観測で拒否される (同上)。
   どの経路でも `installDependencies` は呼ばれず、asset は書かれない。
6. **release asset の観測**: 公開前は release asset が存在しない。観測した C2 の artifact entry の bytes から `buildPackPublicationAssets` で tarball と checksum を再計算した値を `releaseAssets` として渡す。
   期待側 (`tarResolution` 由来) とは別の bytes の入力で導くので、C1 の blob が期待と違えば asset の不一致としても検出できる。
   **再計算の失敗**: 観測した生の bytes が manifest と合わない (正規化で消える変異など) と、`buildPackPublicationAssets` は `artifact_mismatch` などで失敗する。このとき観測は例外にせず (例外は `observation_unavailable` になるため)、`commitEntries` はそのまま返し、`releaseAssets` を空の列にする。
   `auditPackPublication` は control manifest → commit entry → release asset の順に比べる (`src/setup/pack-publication-staging.ts`)。そのため、entry が期待と違えば `commit_entries_mismatch` が先に返る。entry が一致して asset だけ再計算できない場合は、`release_assets_mismatch` になる。
7. **fail-close**: `status` が `attested` でなければ、`ConsumerRuntimeReleaseProducerError` を `pack_publication_audit_<reason>` の理由コードで投げる。`indeterminate` (`observation_unavailable`) も止める (再試行しない。観測できないものを「通った」と見なさない)。
   止まるのは `installDependencies`・tarball の書き込み・stage への書き込みより前なので、`outDir` には何も書かれない。

## 4. 理由コード

`package` の失敗の `error` は次のいずれかである (最初の 1 件で止まる。既存の `auditPackPublication` の結果の語彙を変えない)。

| `error` | 由来 |
| --- | --- |
| `pack_publication_audit_commit_entries_mismatch` | `partial_publication` / `commit_entries_mismatch` (extra・欠落・mode・size・digest・bytes の不一致、`120000` / `160000`) |
| `pack_publication_audit_release_assets_mismatch` | `partial_publication` / `release_assets_mismatch` |
| `pack_publication_audit_control_manifest_mismatch` | `partial_publication` / `control_manifest_mismatch` |
| `pack_publication_audit_observation_unavailable` | `indeterminate` (Git object を読めない) |
| `pack_publication_audit_plan_<error>` | `buildPackPublicationStagingPlan` の preflight の失敗 (`<error>` は `PackPublicationStagingError` の値) |

失敗の JSON には、診断のため、**path と分類だけ**の `details` を付ける。分類は `missing` / `extra` / `mode` / `content` の 4 つで、期待と観測の entry を path で突き合わせて作る。
`details` は判定に使わない (判定は `auditPackPublication` の戻り値だけ)。bytes・digest・file の内容は出力しない。

## 5. 出力

成功 (`--json`) の出力に、次を足す。

```json
{ "publicationAudit": { "status": "attested", "releaseId": "<id>", "controlManifestSnapshotDigest": "sha256:<hex>", "c1": "<40 桁>", "c2": "<40 桁>", "entryCount": 0, "buildInputCount": 0 } }
```

失敗 (exit 1) の出力は `{ "ok": false, "error": "<§4 の理由コード>", "publicationAudit": { "status": "<partial_publication|indeterminate|preflight>", "c1": "...", "c2": "...", "details": [{ "category": "extra", "path": "..." }] } }` とする。
`c1` / `c2` は release note の SHA 欄と、後続の公開処理への受け渡しに使う (`pack-exec-mode.md` §4.3 (f): 照合した SHA だけを後続へ渡す)。

## 6. 不変条件 (DbC)

- Pre: `c1` / `c2` は 40 桁の SHA で、`package` の source binding が返した値そのもの。観測は SHA だけで object を引く。
- Post: `attested` のときだけ asset を書く。`attested` は、C2 の tree の全 entry が期待集合 (artifact + ビルド入力 + `release/manifest.yaml`) と path・mode・size・digest・bytes で完全一致したときだけである。期待に無い entry は 1 件でも拒否する (`pack-build-inputs.md` §5.1)。
- Invariant (素通り無し): 5 asset を作る経路は `package` だけで、`package` は照合の前に asset を書かない。照合を呼ばない手順や flag を設けない (skip flag を足さない)。
- Invariant (非破壊・読み取りのみ): 観測は Git object を読むだけで、index・working tree・ref を変えない。失敗時は `outDir` を変えない。
- Invariant (観測の独立): 観測は `selectPackBuildInputs`・`resolveReleaseArtifacts`・materializer を呼ばない。期待集合と観測を、同じ関数の出力どうしで比べない。
- Invariant (出力の語彙): 出力は理由コード、path、分類、件数、SHA だけ。

## 7. 手順書の変更 (Green の後)

本 PR は `docs/reference/pack-release-runbook.md` を変えない (未実装の機能を手順として書かないため)。Green の PR が、次を直す。
(1) §5 に、「照合は `package` が行い、`attested` でなければ asset を作らない」と、理由コード (§4) の表を足す。
(2) §5 に、失敗の読み方を書く。`pack_publication_audit_commit_entries_mismatch` は C1 / C2 に期待外の file があるか、足りない。`details` の path を直して C1 / C2 を作り直す。tag は書き換えず、新しい tag を使う。
(3) §7 の release note の項目に、`publicationAudit` の `c1` / `c2` / `controlManifestSnapshotDigest` を足す。
(4) §3 / §5 の「[未自動 #1882]」の注記のうち、照合に関わる部分を除く。

## 8. oracle

`CANDIDATE-U-PKAUD-001..017` (`docs/test-design/harness/L7-pack-publication-audit-wiring-test-design.md`。共有の `L7-unit-test-design.md` には足さない)。012 は L12 の受入である。
unit の oracle は一時 Git repo (C1 / C2 を実際に commit する) と `installDependencies` の spy を使い、ネットワークを使わない。

## 9. 範囲外

照合の期待集合の定義 (`pack-build-inputs.md` §5.1)、C1 の mode の独立照合 (`pack-exec-mode.md` §4.3)、C2 の生成 (#1885)、公開 (`gh release`) の自動化、`gh release` の後の asset 一覧の照合 (本書は公開前だけを扱う)。
ビルド入力の bytes が **source commit** の blob と一致することは、Pack の checkout に source が無い `package` では確かめない。`sync-pack` が bytes を変えずに copy する契約 (`pack-build-inputs.md` §5、`CANDIDATE-U-PKBIN-007`) に委ね、`package` の照合は C1 の blob を期待とする (path・mode・extra・欠落と、C1 と C2 の間の bytes の不変の検出が目的)。この保証の範囲は `pack-build-inputs.md` §5.1 で改訂済みである。
`sync-pack` の後、C1 の commit の前に人がビルド入力を書き換えた場合は、この照合では検出できない (残余リスク。source commit の blob と照らす手順は後続の issue で扱う)。
