---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_plan_admission_record_partition
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: pending
---

> **L6 contract marker**: PLAN 台帳 (admission receipt の tracked projection) を asset ごとの chain 1 ファイルへ分割する関数契約は `assetChainPath(assetId) => string` / `parseAssetChain(text, expected) => AssetChainParseResult` / `verifyPartitionedAdmission(reader) => PartitionVerdict` / `verifyAssetChainDelta(input) => PartitionVerdict` / `resolveAssetTail(reader, assetId) => AssetTail | undefined` / `loadAdmissionProjection(reader) => AdmissionProjectionPort` (型は §9) であり、unit-test-granularity contract である。DbC pre/post/invariant は §10 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§PLAN 台帳の asset 分割) に置き、詳細 (CANDIDATE-U-PARTREC-001〜) は専用の `docs/test-design/harness/L7-plan-admission-record-partition-test-design.md` が固定する。

# PLAN 台帳の asset 分割 — 関数設計 (issue #1011)

## 1. 目的と位置づけ

`docs/governance/plan-admission-receipts.json` (以下 legacy 台帳) は、全 PLAN で 1 本の hash chain である。各 record は全体通しの `sequence` と直前の record の `previous_record_digest` を持つ。そのため、別々の PLAN を扱う PR どうしでも、同じファイルの末尾で衝突するか、後から merge する側が rechain (PLAN-L6-711) をすることになる。レーン間に「writer の手番」を置いて避けてきたが、手番が 1 本しか無いことで 2026-10-14 には 3 レーンが半日止まった。

本書は、v4 のチケットの正本形式 (UTV4-FR-004 / FR-006 の「機械の記録は tracked ファイル、harness.db は作り直せる索引」) を、⑧ を待たずに今の admission record へ先に適用する契約である。

- 分割の単位と、ファイル 1 本の中で chain を閉じる形式は、チケットが引き継ぐ形式に合わせる。⑧ で PLAN をチケットへ切り替えるときは、record の中身 (PLAN → チケット) だけを替える。置き場と chain の規則は作り直さない。
- PLAN 固有の新しい仕組み (PLAN 専用の index、手番の管理、lock ファイル) は足さない。ディレクトリの一覧が索引であり、衝突は既存の git の衝突と、本書の検査規則だけで拒否する (最小実装原則、`docs/governance/coding-rules.md`)。
- 契約だけを freeze する。実装 (`src/`) と移行は別 PR である (§11)。

## 2. 現状の実測 (2026-10-14、origin/main)

| 項目 | 実測 |
|---|---|
| legacy 台帳 | `schema_version = "ut-tdd.plan-admission-receipts/v1"`、records 483 件、`sequence` は 1〜483 の通し |
| 末尾 record_digest | `sha256:b42a9d85aedb0de29be9c47df93c9eeb091f4fa829e496721fc787a5923a5076` (契約時点の値。凍結 PR の基点で再計測する) |
| ファイルの byte digest | `sha256:6b3a984089eef1d6ed3e35ffe57d1d585309cc1a1b70c8812cffaadab413744c` (同上) |
| asset 数 / plan_id 数 | 99 / 97。plan_id が 2 asset にまたがるものが 2 件 (superseding asset)。asset が 2 plan_id を持つものは 0 件 |
| asset_id の形 | `^plan:[a-z0-9][a-z0-9:-]{2,127}$`。`plan:legacy:<hex>` が 39 asset (コロンを 2 つ含む) |
| record digest | `trackedReceiptRecordDigest` (`src/kernel/github-closure-receipt.ts`)。`sequence` / `previous_record_digest` / binding 等を JSON 化して sha256 |

現行の読み書きと検査の規則 (本書が置き換える・維持する対象):

| 部品 | 現行の規則 | 本書での扱い |
|---|---|---|
| `parseTrackedReceiptProjection` | `sequence = index + 1`、先頭の previous = null、全体で command_id / receipt_id / (path, asset, revision) が一意 | legacy 台帳にはそのまま使う (変更しない)。asset ファイルには §3 の専用 parser を使う |
| `TrackedReceiptRenderer.render` (`tracked-receipt-renderer.ts`) | 全 records の末尾に `sequence = 件数 + 1`、previous = 末尾 digest で追記し、projection 全体を書き直す | 書き先を asset ファイルにする (§5) |
| `PlanRevisionManifest.base.projection_tail_digest` (`plan-revision-command-assembler.ts`) と `node-plan-revision-runner.ts` の `projectionTailDigest` | 全体の末尾 record の digest に束縛し、ずれたら `plan-revision-projection-tail-drift` | その asset の末尾に束縛する (§5) |
| `rehydratePlanLedgerBase` (`plan-ledger-rehydrator.ts`) | 全 records から embedded receipt に一致する 1 件を探し、plan_id/path の lineage の最大 sequence であることを要求する | 自分の asset ファイルから探す。lineage の曖昧さは alias の衝突検査 (§7) へ移す |
| `plan-draft-ledger.ts` / `node-plan-revision-runner.ts` の alias 検査 | harness.db (worktree 局所 cache) の `plan_aliases` で衝突を検出する | DB は cache のまま。tracked の正本側でも alias の衝突を検出する (§7) |
| `verifyRechainDelta` (`rechain-verifier.ts`) | `docs/governance/plan-admission-receipts.json` の追記を whitelist 検証して再発行する | 凍結後は対象のファイルが変わらないため、この経路は使われなくなる (§8.4) |
| 利用側 | `src/cli/plan-admission.ts` (HEAD の projection から `lookup(commandId)`)、`src/state-db/github-review-lane-provenance.ts`、`src/plan-asset/ledger/sealed-lineage-local-migration.ts` | `loadAdmissionProjection` (§9) を経由させる |
| 対象外 | `src/runtime/node-slice-admission.ts` が読む legacy D0 の merge commit 時点の blob | 過去の immutable object なので変更しない |

## 3. 分割の形式

```
docs/governance/plan-admission-receipts.json              # legacy 台帳 (凍結。以後 1 byte も変えない)
docs/governance/plan-admission-receipts/ROOT.json         # 凍結の宣言 (1 回だけ作る。以後不変)
docs/governance/plan-admission-receipts/<asset-file>.json # PLAN (asset) ごとに 1 ファイル
```

### 3.1 ファイル名

`assetChainPath(assetId)` は `plan:` を除いた残りの `:` を `.` に置き換えて `<asset-file>.json` とする。asset_id の文字集合 (`a-z0-9:-`) に `.` が無いので写像は単射であり、Windows のファイル名に使えない `:` を含まない。例: `plan:890b18d7…` → `890b18d7….json`、`plan:legacy:ba9f…` → `legacy.ba9f….json`。

### 3.2 asset ファイルの内容

```json
{
  "schema_version": "ut-tdd.plan-admission-asset-chain/v1",
  "asset_id": "plan:…",
  "records": [ { "sequence": 1, "previous_record_digest": "<ROOT の legacy_root_record_digest>", "record_digest": "…", "command_id": "…", "receipt_id": "…", "receipt_digest": "…", "decision_digest": "…", "binding": { "path": "…", "plan_id": "…", "asset_id": "…", "revision": 1, "content_digest": "…" } } ]
}
```

- **record の形と digest は legacy と同一**である。`trackedReceiptRecordDigest` をそのまま使い、legacy の 483 records の digest も変わらない。
- `sequence` は **asset ファイル内で 1 から** 数える。`previous_record_digest` は、先頭の record だけ **ROOT の `legacy_root_record_digest`** とし、2 件目以降は直前の record の `record_digest` とする。つまり全 asset の chain が、凍結された legacy 台帳の末尾を共通の起点とする。先頭を null にしない (起点が凍結区間に繋がっていることを機械で確かめるため)。
- `binding.revision` は asset 単位の通し番号である。その asset が legacy 台帳にも records を持つ場合 (legacy asset の続き)、asset ファイルの先頭の revision は「legacy 台帳でのその asset の最後の revision + 1」でなければならない。legacy に無い asset の先頭は 1 である。いずれも以後 +1 ずつ連続する。
- ファイル内の全 record の `binding.asset_id` は、ヘッダの `asset_id` と、ファイル名から逆算した asset_id と一致する。

### 3.3 ROOT.json

```json
{
  "schema_version": "ut-tdd.plan-admission-partition-root/v1",
  "legacy_path": "docs/governance/plan-admission-receipts.json",
  "legacy_file_digest": "sha256:<legacy 台帳の byte digest>",
  "legacy_record_count": 483,
  "legacy_root_record_digest": "sha256:<legacy 台帳の末尾 record_digest>"
}
```

- 凍結 PR (§11 M3) が 1 回だけ作る。値は凍結 PR の基点の実測で決める (§2 の値は契約時点の参考値)。
- **ROOT.json の有無が分割の有効化の切り替えである。** 無ければ現行の単一台帳の経路 (本書は変更しない)、有れば §8 の分割モードで検査する。コード定数にしないのは、実装 PR と凍結 PR の時期が違うためである。
- ROOT.json は作成後に変更・削除できない (§8.2 D4)。

## 4. legacy の 483 records の凍結

- legacy 台帳は凍結後 1 byte も変えない。renumber・rechain・再 digest をしない。各 record の `sequence` / `previous_record_digest` / `record_digest` は現状のままである。
- 凍結の根拠は ROOT.json の `legacy_file_digest` (ファイル全体の byte digest) と `legacy_root_record_digest` (末尾 record の digest)、`legacy_record_count` の 3 つである。検査は、ファイルが ROOT と一致することと、`parseTrackedReceiptProjection` で従来どおり chain が連続していることの両方を求める。
- 凍結後、legacy 台帳は読み取り専用の過去区間であり、新しい record は書かれない。legacy asset の続きの revision も、その asset の asset ファイルに書く (§3.2)。

## 5. revise の base と書き込み

### 5.1 asset の末尾への束縛

`PlanRevisionManifest.base.projection_tail_digest` を `base.asset_tail_digest` に置き換える (breaking: manifest の schema 変更。実装 PR の範囲)。値は `resolveAssetTail(reader, assetId)` が返す末尾の record_digest である。

- asset ファイルが在る: そのファイルの最後の record。
- asset ファイルが無く、legacy 台帳にその asset の record が在る: legacy 台帳でその asset の最後の record。
- どちらにも無い: 新規 asset (draft、§5.3)。revise の対象ではない。

`node-plan-revision-runner.ts` の preflight は、全体の末尾ではなくこの値と照合する。**別の PLAN の record が追加されても manifest は drift しない。** 同じ asset の末尾が動いたときだけ drift し、`plan-revision-asset-tail-drift` で停止する。

### 5.2 書き込み

`TrackedReceiptRenderer.render` は、読む・書くファイルを `assetChainPath(receipt.assetId)` にする。asset ファイルが無ければ空の chain として扱い、先頭の record を `sequence = 1`、`previous_record_digest = ROOT.legacy_root_record_digest` で作る。他の asset のファイルは読まず、書き直さない。書き込みは従来どおり atomic publish (`node-atomic-draft-publisher.ts`) に載せる。

### 5.3 新規 asset (draft)

`plan draft` は、新しい asset_id を採番した後に、その asset のファイルを新規作成する (先頭の revision = 1)。`projection.path` は固定の文字列 `docs/governance/plan-admission-receipts.json` ではなく、asset_id から `assetChainPath` で導出する。`src/cli/plan-draft.ts` / `plan-revise.ts` の `projectionTargetSchema` は `z.literal(...)` をやめ、導出値との一致を検査する。

## 6. 同じ PLAN の revision が衝突したとき (fail-close)

同じ asset への追記は、本来直列であるべきものであり、次のどちらかで必ず検出する。どちらも、**後から main に入ろうとした側を拒否し、先に入った側は変えない。**

- git が衝突する: 同じファイルの末尾への追記、または同じ名前のファイルの新規作成 (add/add) は、git の merge で衝突する。wrapper は衝突を解消扱いにしない (CANDIDATE-U-RECHAIN-008 と同じ停止)。
- git が衝突しない場合の保険: `verifyAssetChainDelta` (§8.2) が、head の asset ファイルが merge-base のそれの末尾への純粋な追記であること、かつ main の現在のそのファイルが merge-base と同じであることを求める。main が先に進んでいれば `asset-chain-moved` で拒否する。

拒否された側は、新しい main の asset 末尾を base にして、revise をやり直す (rechain はしない)。契約齟齬ではなく単なる直列化なので、設計の差し戻しにはならない。

## 7. alias と path の衝突の検出

alias (同じ plan_id を 2 つの asset が持つこと) の衝突は、worktree 局所の harness.db では別 clone の起票を見られない。tracked の正本でも検出する。

- 検査は **全 asset ファイルと legacy 台帳の走査** で行う (索引を足さない)。台帳に載る asset 数は最大でも数百のオーダーであり、1 回の検査で全ファイルを読んでよい。
- 規則 (すべて `alias-collision:<plan_id>` で fail):
  1. 1 つの plan_id は、全 asset ファイルのうち高々 1 つの asset にしか現れない。
  2. plan_id が legacy 台帳にも現れる場合、asset ファイル側の asset は、legacy 台帳でその plan_id の最後の record (最大 sequence) の asset と同一でなければならない (legacy asset の続き)。legacy で plan_id が 2 asset にまたがる 2 件は、最後の record の asset だけが続けられる。
  3. 同じ `binding.path` を持つ asset が複数ある場合も同じく拒否する。
- 別々の PR が別の asset_id で同じ plan_id を起票した場合、ファイル名が違うので git は衝突しない。この規則は **merge 結果の tree** (CI の merge ref、`ut-tdd pr merge` が検査する exact head との merge 結果) に対して適用するので、後から入る側がここで拒否される。

## 8. 検査規則 (doctor / rechain-verifier)

### 8.1 `verifyPartitionedAdmission` (doctor。tree 全体)

ROOT.json が無ければ検査しない (単一台帳モード、現行のまま)。有れば次をすべて検査し、理由を集約して返す。

| 規則 | 理由名 |
|---|---|
| P1 ROOT.json の形が正しい。legacy 台帳の byte digest / 件数 / 末尾 record_digest が ROOT と一致し、legacy 台帳が `parseTrackedReceiptProjection` を通る | `root-invalid` / `legacy-frozen-digest-mismatch` |
| P2 ディレクトリの中身が `ROOT.json` と `<asset-file>.json` だけである | `unexpected-file:<name>` |
| P3 各 asset ファイルを `parseAssetChain` が通す (§9)。ファイル名と asset_id が一致する、record digest が正しい、`sequence` が 1 から連続、先頭の previous が ROOT の root、2 件目以降の previous が直前の digest、revision が §3.2 のとおり連続 | `asset-file-name-mismatch` / `record-digest-mismatch` / `sequence-not-canonical` / `previous-record-digest-mismatch` / `revision-discontinuous` |
| P4 command_id・receipt_id が、legacy 台帳と全 asset ファイルを合わせて一意 | `command-id-duplicate` / `receipt-id-duplicate` |
| P5 alias / path の衝突がない (§7) | `alias-collision:<plan_id>` |
| P6 凍結後の revision を指す PLAN の `admission_receipt` が、対応する asset ファイルの record に解決できる (receipt_id が在り、binding が一致する)。ファイルが無い、record が無い、binding が違うは別の理由で拒否する | `asset-file-missing:<asset_id>` / `asset-record-missing:<receipt_id>` / `receipt-binding-mismatch` |

asset ファイルを欠落させる、中間の record を消す、record を書き換える、はそれぞれ P6 / P3 のいずれかで必ず fail-close する (§10 の不変条件)。

### 8.2 `verifyAssetChainDelta` (PR の差分。merge 時)

`ut-tdd pr merge` の wrapper が、head と merge-base と main の現在の 3 つの tree から呼ぶ。

| 規則 | 理由名 |
|---|---|
| D1 head で変わった asset ファイルごとに、merge-base のその asset の records が head の records の接頭辞である (追記のみ。書き換え・削除・並べ替えは拒否) | `asset-chain-not-append-only` |
| D2 main の現在のそのファイルの records が merge-base と同じである。違えば main が先に進んでいる (同じ asset の衝突、§6) | `asset-chain-moved` |
| D3 merge-base に無く head で作られたファイルが、main の現在にも既に在る (別 PR が先に作った) | `asset-chain-fork` |
| D4 legacy 台帳と ROOT.json が、merge-base と head で byte 同一である | `legacy-modified` / `root-modified` |
| D5 head の変更した各 asset ファイルが `parseAssetChain` を通る | (P3 の理由) |

別々の asset のファイルは互いに触らないので、D1〜D5 は別の PLAN の PR 同士で干渉しない。**どちらの順で merge しても rechain は要らない。**

### 8.3 rehydrate (`plan-ledger-rehydrator.ts`)

harness.db は tracked の正本から作り直せる cache のままである。`rehydratePlanLedgerBase` は、manifest の asset の asset ファイル (legacy asset ならその続きの legacy records も) だけから embedded receipt に一致する 1 件を探す。その record が、その asset の chain の末尾であることを要求する (古い revision の receipt からの rehydrate は `plan-revision-rehydration-lineage-ambiguous`)。他の asset のファイルは読まない。ただし alias の衝突 (§7) が在れば `plan-revision-rehydration-alias-ambiguous` で停止する。

### 8.4 rechain-verifier の扱い

凍結後、`RECEIPT_PATH` (legacy 台帳) は変わらないので、`verifyRechainDelta` の「単一台帳の追記を再発行する」経路は使われなくなる。別々の PLAN の衝突はファイルが分かれているために起きず、同じ PLAN の衝突は §6 で拒否するので、rechain で救う場面が無い。`verifyRechainDelta` を残すか、PLAN-L6-711 を supersede して撤去するかは、実装 PR の範囲で決める (本書は、分割モードで `verifyRechainDelta` を呼ばないことだけを固定する)。PLAN の簿記 (`generates` 追記など) の merge 時の連結は、本書の範囲外である。

## 9. 関数契約

型は構造のみを示す。実装の置き場は、新規 source_module 1 個 (`src/plan-admission/asset-chain.ts` を想定) とする。

```ts
interface AdmissionTreeReader {
  readLegacy(): string;                       // legacy 台帳の本文
  readRoot(): string | undefined;             // ROOT.json の本文 (無ければ undefined)
  listAssetDir(): readonly string[];          // ディレクトリ直下のファイル名 (順序は不問)
  readAssetFile(name: string): string;
}
type AssetTail = { digest: string; revision: number; region: "legacy" | "asset" };

assetChainPath(assetId: string) => string                                  // §3.1。asset_id が正規形でなければ throw
parseAssetChain(text: string, expected: { assetId: string; root: string; legacyLastRevision: number }) => AssetChainParseResult
  // { ok: true; records: readonly TrackedReceiptRecord[] } | { ok: false; errors: readonly string[] }
resolveAssetTail(reader: AdmissionTreeReader, assetId: string) => AssetTail | undefined   // §5.1
verifyPartitionedAdmission(reader: AdmissionTreeReader, plans: readonly PlanReceiptRef[]) => PartitionVerdict   // §8.1
verifyAssetChainDelta(input: { mergeBase: AdmissionTreeReader; head: AdmissionTreeReader; main: AdmissionTreeReader }) => PartitionVerdict   // §8.2
loadAdmissionProjection(reader: AdmissionTreeReader) => AdmissionProjectionPort   // legacy + 全 asset を束ねた lookup(commandId) / validate()
// PartitionVerdict = { ok: true; verifierDigest: string } | { ok: false; reasons: readonly string[] }
```

- `PlanReceiptRef` は、PLAN の `admission_receipt` (receipt_id、binding) を tree から読み出した最小の形である。
- `verifierDigest` は、入力を stable な順序 (ファイル名の辞書順) に正規化して計算し、`listAssetDir` の返す順序に依存しない (U-RECHAIN-016 と同じ)。
- 既存の `parseTrackedReceiptProjection` / `trackedReceiptRecordDigest` は変更しない。

## 10. DbC (事前条件・事後条件・不変条件)

- **事前条件 (parseAssetChain)**: `expected.assetId` は `assetChainPath` が受理する正規形であり、`expected.root` は ROOT の `legacy_root_record_digest` である。呼び出し側は ROOT の検査 (P1) を先に済ませる。
- **事後条件 (parseAssetChain)**: `ok: true` のとき、全 record について `record_digest = trackedReceiptRecordDigest(record)`、`sequence = index + 1`、先頭の previous = `expected.root`、以降の previous = 直前の digest、`binding.asset_id = expected.assetId` が成り立つ。1 つでも破れれば `ok: false` で、records を返さない (部分採用しない)。
- **事前条件 (verifyAssetChainDelta)**: 3 つの reader は同じ ROOT を持つ tree である。持たない場合 (分割の有効化の前後をまたぐ差分) は `root-modified` ではなく、検査対象外として呼ばない。
- **事後条件 (verifyPartitionedAdmission / verifyAssetChainDelta)**: `ok: true` のとき `reasons` は存在しない。`ok: false` のとき、規則を満たさなかった理由をすべて (最初の 1 件で打ち切らず) 返す。tree への書き込みは行わない (pure)。
- **不変条件 (凍結)**: 凍結後、legacy 台帳と ROOT.json の byte は main の全 commit で不変である。legacy の 483 records の `record_digest` は、凍結の前後で 1 つも変わらない。
- **不変条件 (asset の分離)**: ある PR が変更する asset ファイルの集合が別の PR と交わらないなら、2 つの PR は任意の順で merge でき、どちらの順でも merge 結果は検査を通る (rechain 不要)。
- **不変条件 (単調性)**: 1 つの asset ファイルの records は追記のみで増える。既存の record の書き換え・削除・並べ替えは検査で拒否される。
- **不変条件 (fail-close)**: ROOT.json が在るとき、asset ファイルの欠落・record の欠落・改ざんは、P3 / P6 のいずれかで必ず拒否される。「検査できない」は PASS にしない。
- **不変条件 (最小性)**: 分割モードで読み書きするファイルは、ROOT.json と `<asset-file>.json` と legacy 台帳だけである。PLAN 専用の index、手番の管理、lock のファイルを作らない (P2 が機械で守る)。

## 11. 移行の手順 (PR を分ける。1 PR = 1 論点)

1. **M1 契約 PR (本書 + test-design)**: 本書と専用 test-design を freeze し、Red (`it.fails`) を入れる (`design-protection-diff-gate.md` §10.2。src / scripts を含まない PR)。
2. **M2 実装 PR 群 (Codex)**: (a) `asset-chain.ts` の純関数 (parser / 検査 / resolve) とテスト、(b) renderer・assembler・runner・`plan-draft.ts` / `plan-revise.ts` の書き先と base の切り替え、(c) rehydrator・doctor・wrapper (D1〜D5)・利用側 (`loadAdmissionProjection`) の配線。いずれも ROOT.json が無い間は現行の挙動を変えない。
3. **M3 移行 PR**: legacy 台帳の実測値で ROOT.json を作り (これが分割の有効化)、手番の運用を `CLAUDE.md` と `AGENTS.md` の規律から削除する。同じ PR で legacy 台帳を変更しない (D4 / P1 が検査する)。ROOT.json を作る前に、open の PR が legacy 台帳へ追記していないことを確かめ、残っていれば先に merge する (凍結の後に legacy へ書く PR は、D4 で拒否されるため)。
4. **M4 清掃**: `verifyRechainDelta` と単一台帳の経路の扱いを決めて撤去する (別 PR。必要なら PLAN-L6-711 を supersede する)。

書き込みの二重化 (legacy と asset の両方への書き込み) はしない。切り替えは ROOT.json の有無の 1 点だけである。

## 12. v4 チケットの record 形式との対応

| 本書 | v4 | 対応 |
|---|---|---|
| asset ファイル (tracked、機械が書く JSON) | UTV4-FR-006「機械の記録は tracked の JSON 正本」 | 同じ。置き場は tracked ファイルであり、GitHub や harness.db は正本にしない |
| harness.db は asset ファイルから作り直せる cache (§8.3) | UTV4-FR-006「索引は正本から作り直せる」 | 同じ。DB にしか無い状態を作らない |
| PLAN 1 本 = 1 asset = 1 ファイル、chain はファイル内 | UTV4-FR-004「チケットの正本は repo の tracked ファイル」、v4.0「1 record = 1 JSON/YAML file」 | チケット 1 枚の記録履歴を 1 ファイルとして対応づける。⑧ では asset ファイルの中身を PLAN からチケットに替える。置き場と chain の規則 (§3、§8) は引き継ぐ |
| 同じ asset の衝突は後発を拒否 (§6) | UTV4-FR-005「claim 済みへの 2 件目は deny」 | 同じ考え方。lease や手番を持たずに、base の末尾への束縛だけで直列化する |
| 全体で 1 本の手番を作らない | #530 候補 3、`v4-roadmap/README.md`「簡易の複数人運用」 | 別々の asset の PR は並列に merge できる |
| 検査は doctor で fail-close | UTV4-AC-011 (b)「1 ファイルに 2 件以上の記録を入れる → deny」 | **差分あり** (§13 の判断点 1) |

## 13. control の判断が要る点 (本書は案を置いて凍結しない)

1. **「1 記録 = 1 ファイル」の字義との差**: UTV4-FR-006 / UTV4-AC-011 (b) は、機械の記録は 1 ファイルに 1 記録と読める。本書 (issue #1011 の方針) は asset ごとに 1 ファイルで、中に chain の records を複数持つ。代案は、`<asset>/<revision>.json` のように 1 revision = 1 ファイルとする形である。その場合、同じ asset の衝突は同名ファイルの add/add になるので git が必ず衝突し、追記で育つファイルが無くなる。代わりにファイル数が records 数 (483 以上) に比例して増える。本書は issue の方針どおり asset 単位とし、字義との差は UTV4-AC-011 (b) の「記録」を「チケット 1 枚の履歴」と読むことで受ける。変えるなら §3 と §8 の書き換えになる。
2. **ROOT.json の有無で分割を切り替える (§3.3)**: コード定数にしない方が実装 PR と凍結 PR の時期を分けられるが、ROOT.json の改ざん (差し替え) を D4 の append-only 検査と design-protection の保護対象に頼る。ROOT.json を `src/` の定数にする案もある (その場合は M2 と M3 の時期が揃う)。
3. **凍結後の別 asset による plan_id の再発行を認めない (§7 規則 2)**: legacy にある 2 件の superseding asset の続きは、最後の record の asset だけに限る。それ以外の再 mint が要る場面が将来出たら、supersede の記録を asset ファイルに持たせる拡張が要る (本書の範囲外)。
