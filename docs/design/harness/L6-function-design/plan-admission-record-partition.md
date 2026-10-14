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

> **L6 contract marker**: PLAN 台帳 (admission receipt の tracked projection) を 1 revision = 1 ファイル (asset ごとのディレクトリ) へ分割する関数契約は `assetRecordPath(assetId, revision) => string` / `parseAssetRecord(text, expected) => AssetRecordParseResult` / `verifyPartitionedAdmission(reader, plans) => PartitionVerdict` / `verifyAssetChainDelta(input) => PartitionVerdict` / `resolveAssetTail(reader, assetId) => AssetTail | undefined` / `loadAdmissionProjection(reader) => AdmissionProjectionPort` (型は §9) であり、unit-test-granularity contract である。DbC pre/post/invariant は §10 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§PLAN 台帳の asset 分割) に置き、詳細 (CANDIDATE-U-PARTREC-001〜) は専用の `docs/test-design/harness/L7-plan-admission-record-partition-test-design.md` が固定する。

# PLAN 台帳の asset 分割 — 関数設計 (issue #1011)

## 1. 目的と位置づけ

`docs/governance/plan-admission-receipts.json` (以下 legacy 台帳) は、全 PLAN で 1 本の hash chain である。各 record は全体通しの `sequence` と直前の record の `previous_record_digest` を持つ。そのため、別々の PLAN を扱う PR どうしでも、同じファイルの末尾で衝突するか、後から merge する側が rechain (PLAN-L6-711) をすることになる。レーン間に「writer の手番」を置いて避けてきたが、手番が 1 本しか無いことで 2026-10-14 には 3 レーンが半日止まった。

本書は、v4 のチケットの正本形式 (UTV4-FR-004 / FR-006 の「機械の記録は tracked ファイル、harness.db は作り直せる索引」) を、⑧ を待たずに今の admission record へ先に適用する契約である。

- 分割の単位 (1 revision = 1 ファイル) と、ファイルどうしを previous digest で繋ぐ chain の形式は、チケットが引き継ぐ形式に合わせる。⑧ で PLAN をチケットへ切り替えるときは、record の中身 (PLAN → チケット) だけを替える。置き場と chain の規則は作り直さない。
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
| `parseTrackedReceiptProjection` | `sequence = index + 1`、先頭の previous = null、全体で command_id / receipt_id / (path, asset, revision) が一意 | legacy 台帳にはそのまま使う (変更しない)。asset の record ファイルには §9 の `parseAssetRecord` を使う |
| `TrackedReceiptRenderer.render` (`tracked-receipt-renderer.ts`) | 全 records の末尾に `sequence = 件数 + 1`、previous = 末尾 digest で追記し、projection 全体を書き直す | 新しい revision のファイル 1 つだけを作る (§5) |
| `PlanRevisionManifest.base.projection_tail_digest` (`plan-revision-command-assembler.ts`) と `node-plan-revision-runner.ts` の `projectionTailDigest` | 全体の末尾 record の digest に束縛し、ずれたら `plan-revision-projection-tail-drift` | その asset の末尾に束縛する (§5) |
| `rehydratePlanLedgerBase` (`plan-ledger-rehydrator.ts`) | 全 records から embedded receipt に一致する 1 件を探し、plan_id/path の lineage の最大 sequence であることを要求する | 自分の asset のディレクトリから探す。lineage の曖昧さは alias の衝突検査 (§7) へ移す |
| `plan-draft-ledger.ts` / `node-plan-revision-runner.ts` の alias 検査 | harness.db (worktree 局所 cache) の `plan_aliases` で衝突を検出する | DB は cache のまま。tracked の正本側でも alias の衝突を検出する (§7) |
| `verifyRechainDelta` (`rechain-verifier.ts`) | `docs/governance/plan-admission-receipts.json` の追記を whitelist 検証して再発行する | 凍結後は対象のファイルが変わらないため、この経路は使われなくなる (§8.4) |
| 利用側 | `src/cli/plan-admission.ts` (HEAD の projection から `lookup(commandId)`)、`src/state-db/github-review-lane-provenance.ts`、`src/plan-asset/ledger/sealed-lineage-local-migration.ts` | `loadAdmissionProjection` (§9) を経由させる |
| 対象外 | `src/runtime/node-slice-admission.ts` が読む legacy D0 の merge commit 時点の blob | 過去の immutable object なので変更しない |

## 3. 分割の形式

1 revision = 1 ファイルとする (control 決定、§13 の 1)。追記で育つファイルは持たない。

```
docs/governance/plan-admission-receipts.json              # legacy 台帳 (凍結。以後 1 byte も変えない)
docs/governance/plan-admission-receipts/ROOT.json         # 凍結の宣言 (1 回だけ作る。以後不変)
docs/governance/plan-admission-receipts/<asset>/<revision>.json   # record 1 件 = 1 ファイル
```

### 3.1 パス

`assetRecordPath(assetId, revision)` は、`plan:` を除いた asset_id の残りの `:` を `.` に置き換えたものを `<asset>` とし、`<asset>/<revision>.json` を返す。`<revision>` は先頭に 0 を付けない 10 進の正整数である。asset_id の文字集合 (`a-z0-9:-`) に `.` が無いので写像は単射であり、Windows のパスに使えない `:` を含まない。例: `plan:890b18d7…` の revision 3 → `890b18d7…/3.json`、`plan:legacy:ba9f…` の revision 2 → `legacy.ba9f…/2.json`。

### 3.2 record ファイルの内容

```json
{
  "schema_version": "ut-tdd.plan-admission-record/v1",
  "sequence": 3,
  "previous_record_digest": "sha256:<直前の revision の record_digest>",
  "record_digest": "sha256:…",
  "command_id": "…", "receipt_id": "…", "receipt_digest": "…", "decision_digest": "…",
  "binding": { "path": "…", "plan_id": "…", "asset_id": "plan:…", "revision": 3, "content_digest": "…" }
}
```

- record の項目と digest は legacy と同一である。`trackedReceiptRecordDigest` をそのまま使い、legacy の 483 records の digest も変わらない。追加の項目は `schema_version` だけで、digest の入力には含めない。
- **`sequence` は `binding.revision` と、ファイル名の `<revision>` に一致させる。** 全体通しの番号は持たない。
- `previous_record_digest` は **直前の revision の `record_digest`** である。直前の revision の record は、asset ディレクトリの `<revision - 1>.json`、または (legacy asset の続きで revision - 1 が legacy 台帳にしか無いとき) legacy 台帳でその asset の最後の record である。revision 1 (新規 asset) だけは、**ROOT の `legacy_root_record_digest`** とする。null にしない (起点が凍結区間に繋がっていることを機械で確かめるため)。
- asset の revision は連続する。legacy 台帳にも records を持つ asset の続きは、先頭の revision が「legacy 台帳でのその asset の最後の revision + 1」でなければならない。legacy に無い asset の先頭は 1 である。
- `binding.asset_id` は、ディレクトリ名から逆算した asset_id と一致する。

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
- **ROOT.json の有無が分割の有効化の切り替えである** (control 決定、§13 の 2)。無ければ現行の単一台帳の経路 (本書は変更しない)、有れば §8 の分割モードで検査する。コード定数にしないのは、実装 PR と凍結 PR の時期が違うためである。
- ROOT.json は作成後に変更・削除できない (§8.2 D4)。差し替えは D4 の不変検査と、設計書保護の diff gate が止める。

### 3.4 ファイル数

ファイル数は records 数に比例して増える (legacy 483 件は凍結されるので、増えるのは凍結後の revision 数である)。この増加は許容するものとして受ける。代わりに、追記で育つファイルが無く、同じ asset の同じ revision の衝突が git の add/add として自然に現れる。全 asset の走査 (§7) はファイル数に比例するが、1 回の検査で全ファイルを読んでよい。数が運用上の問題になるまで、索引や圧縮 (packing) を足さない。

## 4. legacy の 483 records の凍結

- legacy 台帳は凍結後 1 byte も変えない。renumber・rechain・再 digest をしない。各 record の `sequence` / `previous_record_digest` / `record_digest` は現状のままである。
- 凍結の根拠は ROOT.json の `legacy_file_digest` (ファイル全体の byte digest) と `legacy_root_record_digest` (末尾 record の digest)、`legacy_record_count` の 3 つである。検査は、ファイルが ROOT と一致することと、`parseTrackedReceiptProjection` で従来どおり chain が連続していることの両方を求める。
- 凍結後、legacy 台帳は読み取り専用の過去区間であり、新しい record は書かれない。legacy asset の続きの revision も、その asset のディレクトリの revision ファイルに書く (§3.2)。

## 5. revise の base と書き込み

### 5.1 asset の末尾への束縛

`PlanRevisionManifest.base.projection_tail_digest` を `base.asset_tail_digest` に置き換える (breaking: manifest の schema 変更。実装 PR の範囲)。値は `resolveAssetTail(reader, assetId)` が返す末尾の record_digest である。

- asset ディレクトリが在る: 最大の revision のファイルの record。
- asset ディレクトリが無く、legacy 台帳にその asset の record が在る: legacy 台帳でその asset の最後の record。
- どちらにも無い: 新規 asset (draft、§5.3)。revise の対象ではない。

`node-plan-revision-runner.ts` の preflight は、全体の末尾ではなくこの値と照合する。**別の PLAN の record が追加されても manifest は drift しない。** 同じ asset に新しい revision のファイルが入ったときだけ drift し、`plan-revision-asset-tail-drift` で停止する。

### 5.2 書き込み

`TrackedReceiptRenderer.render` は、projection 全体を読み書きする代わりに、新しい revision のファイル 1 つだけを作る。パスは `assetRecordPath(receipt.assetId, receipt.revision)`、`sequence = revision`、`previous_record_digest` は §3.2 のとおり (直前の revision の digest)。**既存のファイルは読み直して書き換えない。** 書き込みは従来どおり atomic publish (`node-atomic-draft-publisher.ts`) に載せ、新しいファイルは **排他的な作成** (既に在れば失敗) とする。既に在れば `asset-revision-exists` で停止し、他のファイルを 1 つも書かない。

### 5.3 新規 asset (draft)

`plan draft` は、新しい asset_id を採番した後に、`<asset>/1.json` を作る (`previous_record_digest` = ROOT の root)。`projection.path` は固定の文字列 `docs/governance/plan-admission-receipts.json` ではなく、`assetRecordPath` で導出する。`src/cli/plan-draft.ts` / `plan-revise.ts` の `projectionTargetSchema` は `z.literal(...)` をやめ、導出値との一致を検査する。

## 6. 同じ PLAN の revision が衝突したとき (fail-close)

同じ asset の同じ revision (n+1) を 2 本の PR が作ると、どちらも同じパス `<asset>/<n+1>.json` を新規作成するので、git の merge は **add/add 衝突** になる。これが主たる検出である。後から merge しようとした側が止まり、先に入った側は変わらない。wrapper は衝突を解消扱いにしない (CANDIDATE-U-RECHAIN-008 と同じ停止)。

git が衝突を出さない経路への保険として、`verifyAssetChainDelta` (§8.2) が次を求める。

- merge-base に在った revision ファイルは、head で変更・削除・改名されていない (D1)。
- head で新規に作られたファイルと同じパスが、main の現在に既に在れば拒否する (D2、`asset-revision-fork`)。
- merge 結果の tree で、asset の revision が連続し、各 `previous_record_digest` が直前の revision の digest と一致する (§8.1 P3)。fork の枝を連ねた revision (別の n+1 の上に積んだ n+2) は、ここで拒否される。

拒否された側は、新しい main の asset 末尾を base にして、revise をやり直す (rechain はしない)。契約齟齬ではなく単なる直列化なので、設計の差し戻しにはならない。

## 7. alias と path の衝突の検出

alias (同じ plan_id を 2 つの asset が持つこと) の衝突は、worktree 局所の harness.db では別 clone の起票を見られない。tracked の正本でも検出する。

- 検査は **全 asset ディレクトリと legacy 台帳の走査** で行う (索引を足さない。§3.4)。
- 規則 (すべて `alias-collision:<plan_id>` で fail):
  1. 1 つの plan_id は、全 asset ディレクトリのうち高々 1 つの asset にしか現れない。
  2. plan_id が legacy 台帳にも現れる場合、asset ディレクトリ側の asset は、legacy 台帳でその plan_id の最後の record (最大 sequence) の asset と同一でなければならない (legacy asset の続き)。legacy で plan_id が 2 asset にまたがる 2 件は、最後の record の asset だけが続けられる。**凍結後に、既存の plan_id を別の asset として再 mint することは認めない** (§13 の 3)。
  3. 同じ `binding.path` を持つ asset が複数ある場合も同じく拒否する。
- 別々の PR が別の asset_id で同じ plan_id を起票した場合、ディレクトリが違うので git は衝突しない。この規則は **merge 結果の tree** (CI の merge ref、`ut-tdd pr merge` が検査する exact head との merge 結果) に対して適用するので、後から入る側がここで拒否される。

## 8. 検査規則 (doctor / rechain-verifier)

### 8.1 `verifyPartitionedAdmission` (doctor。tree 全体)

ROOT.json が無ければ検査しない (単一台帳モード、現行のまま)。有れば次をすべて検査し、理由を集約して返す。

| 規則 | 理由名 |
|---|---|
| P1 ROOT.json の形が正しい。legacy 台帳の byte digest / 件数 / 末尾 record_digest が ROOT と一致し、legacy 台帳が `parseTrackedReceiptProjection` を通る | `root-invalid` / `legacy-frozen-digest-mismatch` |
| P2 ディレクトリの中身が `ROOT.json` と `<asset>/<revision>.json` (`<revision>` は先頭 0 なしの正整数) だけである | `unexpected-file:<path>` |
| P3 各 record ファイルを `parseAssetRecord` が通す (§9)。ディレクトリ名・ファイル名と `binding` が一致する、record digest が正しい、`sequence` = `revision`。asset ごとに、revision が先頭 (legacy の続きなら legacy の最後 + 1、新規なら 1) から欠けずに連続し、先頭以外の previous が直前の revision の digest、新規 asset の revision 1 の previous が ROOT の root、legacy の続きの先頭の previous が legacy でのその asset の最後の record の digest | `asset-file-name-mismatch` / `record-digest-mismatch` / `sequence-not-revision` / `previous-record-digest-mismatch` / `revision-discontinuous` |
| P4 command_id・receipt_id が、legacy 台帳と全 record ファイルを合わせて一意 | `command-id-duplicate` / `receipt-id-duplicate` |
| P5 alias / path の衝突がない (§7) | `alias-collision:<plan_id>` |
| P6 凍結後の revision を指す PLAN の `admission_receipt` が、対応する record ファイルに解決できる (receipt_id が在り、binding が一致する) | `asset-file-missing:<asset_id>` / `asset-record-missing:<receipt_id>` / `receipt-binding-mismatch` |

asset のディレクトリごとの欠落・revision ファイルの欠落・record の書き換えは、末尾より前なら P3 (`revision-discontinuous` / `previous-record-digest-mismatch`)、末尾なら P6 で必ず fail-close する (§10 の不変条件)。

### 8.2 `verifyAssetChainDelta` (PR の差分。merge 時)

`ut-tdd pr merge` の wrapper が、head と merge-base と main の現在の 3 つの tree から呼ぶ。

| 規則 | 理由名 |
|---|---|
| D1 merge-base に在った record ファイルが、head で内容を変えていない・削除されていない・別のパスへ移されていない (追加だけが許される) | `record-file-modified` |
| D2 head で新規に作られた record ファイルのパスが、main の現在に既に在る (別 PR が先に作った。同じ asset の同じ revision の衝突、§6) | `asset-revision-fork` |
| D3 head の tree で、変更された asset の revision の連続と chain (P3) が成り立つ | (P3 の理由) |
| D4 legacy 台帳と ROOT.json が、merge-base と head で byte 同一である | `legacy-modified` / `root-modified` |
| D5 head で新規に作られた各ファイルが `parseAssetRecord` を通る | (P3 の理由) |

別々の asset の PR は、互いに別のパスにファイルを新規作成するだけなので、D1〜D5 は干渉しない。**どちらの順で merge しても rechain は要らない。**

### 8.3 rehydrate (`plan-ledger-rehydrator.ts`)

harness.db は tracked の正本から作り直せる cache のままである。`rehydratePlanLedgerBase` は、manifest の asset の revision ファイル (legacy asset ならその続きの legacy records も) だけから embedded receipt に一致する 1 件を探す。その record が、その asset の最大の revision であることを要求する (古い revision の receipt からの rehydrate は `plan-revision-rehydration-lineage-ambiguous`)。他の asset のディレクトリは読まない。ただし alias の衝突 (§7) が在れば `plan-revision-rehydration-alias-ambiguous` で停止する。

### 8.4 rechain-verifier の扱い

凍結後、`RECEIPT_PATH` (legacy 台帳) は変わらないので、`verifyRechainDelta` の「単一台帳の追記を再発行する」経路は使われなくなる。別々の PLAN の衝突はパスが分かれているために起きず、同じ PLAN の衝突は §6 で拒否するので、rechain で救う場面が無い。`verifyRechainDelta` を残すか、PLAN-L6-711 を supersede して撤去するかは、実装 PR の範囲で決める (本書は、分割モードで `verifyRechainDelta` を呼ばないことだけを固定する)。PLAN の簿記 (`generates` 追記など) の merge 時の連結は、本書の範囲外である。

## 9. 関数契約

型は構造のみを示す。実装の置き場は、新規 source_module 1 個 (`src/plan-admission/asset-chain.ts` を想定) とする。

```ts
interface AdmissionTreeReader {
  readLegacy(): string;                       // legacy 台帳の本文
  readRoot(): string | undefined;             // ROOT.json の本文 (無ければ undefined)
  listAdmissionFiles(): readonly string[];    // receipts ディレクトリ配下の全ファイルの相対パス (順序は不問)
  readAdmissionFile(relPath: string): string;
}
type AssetTail = { digest: string; revision: number; region: "legacy" | "asset" };

assetRecordPath(assetId: string, revision: number) => string               // §3.1。正規形でなければ throw
parseAssetRecord(text: string, expected: { assetId: string; revision: number; previous: string }) => AssetRecordParseResult
  // { ok: true; record: TrackedReceiptRecord } | { ok: false; errors: readonly string[] }
resolveAssetTail(reader: AdmissionTreeReader, assetId: string) => AssetTail | undefined   // §5.1
verifyPartitionedAdmission(reader: AdmissionTreeReader, plans: readonly PlanReceiptRef[]) => PartitionVerdict   // §8.1
verifyAssetChainDelta(input: { mergeBase: AdmissionTreeReader; head: AdmissionTreeReader; main: AdmissionTreeReader }) => PartitionVerdict   // §8.2
loadAdmissionProjection(reader: AdmissionTreeReader) => AdmissionProjectionPort   // legacy + 全 record ファイルを束ねた lookup(commandId) / validate()
// PartitionVerdict = { ok: true; verifierDigest: string } | { ok: false; reasons: readonly string[] }
```

- `PlanReceiptRef` は、PLAN の `admission_receipt` (receipt_id、binding) を tree から読み出した最小の形である。
- `verifierDigest` は、入力を stable な順序 (パスの辞書順) に正規化して計算し、`listAdmissionFiles` の返す順序に依存しない (U-RECHAIN-016 と同じ)。
- 既存の `parseTrackedReceiptProjection` / `trackedReceiptRecordDigest` は変更しない。

## 10. DbC (事前条件・事後条件・不変条件)

- **事前条件 (parseAssetRecord)**: `expected.assetId` と `expected.revision` は `assetRecordPath` が受理する正規形であり、`expected.previous` は呼び出し側が §3.2 の規則 (直前の revision の digest、または ROOT の root) で求めた値である。呼び出し側は ROOT の検査 (P1) を先に済ませる。
- **事後条件 (parseAssetRecord)**: `ok: true` のとき、`record_digest = trackedReceiptRecordDigest(record)`、`sequence = expected.revision = binding.revision`、`previous_record_digest = expected.previous`、`binding.asset_id = expected.assetId` が成り立つ。1 つでも破れれば `ok: false` で、record を返さない (部分採用しない)。
- **事前条件 (verifyAssetChainDelta)**: 3 つの reader は同じ ROOT を持つ tree である。持たない場合 (分割の有効化の前後をまたぐ差分) は、検査対象外として呼ばない。
- **事後条件 (verifyPartitionedAdmission / verifyAssetChainDelta)**: `ok: true` のとき `reasons` は存在しない。`ok: false` のとき、規則を満たさなかった理由をすべて (最初の 1 件で打ち切らず) 返す。tree への書き込みは行わない (pure)。
- **不変条件 (凍結)**: 凍結後、legacy 台帳と ROOT.json の byte は main の全 commit で不変である。legacy の 483 records の `record_digest` は、凍結の前後で 1 つも変わらない。
- **不変条件 (asset の分離)**: ある PR が新規に作る record ファイルのパスの集合が別の PR と交わらないなら、2 つの PR は任意の順で merge でき、どちらの順でも merge 結果は検査を通る (rechain 不要)。
- **不変条件 (不変性)**: 1 度 main に入った record ファイルは、変更・削除・移動されない。asset の chain は、新しい revision のファイルの追加でだけ伸びる。
- **不変条件 (fail-close)**: ROOT.json が在るとき、asset のディレクトリ・revision ファイルの欠落と record の改ざんは、P3 / P6 のいずれかで必ず拒否される。「検査できない」は PASS にしない。
- **不変条件 (最小性)**: 分割モードで読み書きするファイルは、ROOT.json と `<asset>/<revision>.json` と legacy 台帳だけである。PLAN 専用の index、手番の管理、lock のファイルを作らない (P2 が機械で守る)。

## 11. 移行の手順 (PR を分ける。1 PR = 1 論点)

1. **M1 契約 PR (本書 + test-design)**: 本書と専用 test-design を freeze し、Red (`it.fails`) を入れる (`design-protection-diff-gate.md` §10.2。src / scripts を含まない PR)。
2. **M2 実装 PR 群 (Codex)**: (a) `asset-chain.ts` の純関数 (parser / 検査 / resolve) とテスト、(b) renderer・assembler・runner・`plan-draft.ts` / `plan-revise.ts` の書き先と base の切り替え、(c) rehydrator・doctor・wrapper (D1〜D5)・利用側 (`loadAdmissionProjection`) の配線。いずれも ROOT.json が無い間は現行の挙動を変えない。
3. **M3 移行 PR**: legacy 台帳の実測値で ROOT.json を作り (これが分割の有効化)、手番の運用を `CLAUDE.md` と `AGENTS.md` の規律から削除する。同じ PR で legacy 台帳を変更しない (D4 / P1 が検査する)。ROOT.json を作る前に、open の PR が legacy 台帳へ追記していないことを確かめ、残っていれば先に merge する (凍結の後に legacy へ書く PR は、D4 で拒否されるため)。
4. **M4 清掃**: `verifyRechainDelta` と単一台帳の経路の扱いを決めて撤去する (別 PR。必要なら PLAN-L6-711 を supersede する)。

書き込みの二重化 (legacy と record ファイルの両方への書き込み) はしない。切り替えは ROOT.json の有無の 1 点だけである。

## 12. v4 チケットの record 形式との対応

| 本書 | v4 | 対応 |
|---|---|---|
| record ファイル (tracked、機械が書く JSON、1 revision = 1 ファイル) | UTV4-FR-006「機械の記録は 1 記録 = 1 ファイルの JSON 正本」、UTV4-AC-011 (b)「1 ファイルに 2 件以上の記録を入れる → deny」 | 字義どおり。1 ファイルに入る record は 1 件だけで、追記で育つファイルが無い |
| harness.db は record ファイルから作り直せる cache (§8.3) | UTV4-FR-006「索引は正本から作り直せる」 | 同じ。DB にしか無い状態を作らない |
| PLAN 1 本 = 1 asset = 1 ディレクトリ、revision ごとに 1 ファイル | UTV4-FR-004「チケットの正本は repo の tracked ファイル」、v4.0「1 record = 1 JSON/YAML file」 | ⑧ では record ファイルの中身を PLAN からチケットに替える。置き場と chain の規則 (§3、§8) は引き継ぐ |
| 同じ asset の同じ revision の衝突は後発を拒否 (§6) | UTV4-FR-005「claim 済みへの 2 件目は deny」 | 同じ考え方。lease や手番を持たずに、同名ファイルの新規作成の衝突だけで直列化する |
| 全体で 1 本の手番を作らない | #530 候補 3、`v4-roadmap/README.md`「簡易の複数人運用」 | 別々の asset の PR は並列に merge できる |
| 検査は doctor で fail-close | UTV4-AC-011 | 同じ。§8.1 の P1〜P6 |

## 13. 決めたこと (control 決定 2026-10-14)

1. **1 revision = 1 ファイルを採用する** (`<asset>/<revision>.json`)。
   - 理由: UTV4-FR-006 / UTV4-AC-011 (b) の「1 記録 = 1 ファイル」の字義に合わせ、追記で育つファイルを無くすため。同じ asset の同じ revision を 2 本の PR が作ると git の add/add 衝突になり、後から merge する側を機械が自然に止める。
   - 代償: ファイル数が records 数に比例して増える。これは許容するものとして受ける (§3.4)。
   - 却下した案: asset ごとに 1 ファイルで中に chain を持つ形。字義との差が残り、同じファイル末尾の追記の衝突を検査で補う必要があった。
2. **ROOT.json の有無で分割を有効化する方式を採用する。**
   - 理由: 実装 PR と凍結 PR の時期を分けられる (M2 は ROOT.json が無い間、現行の挙動を変えない)。
   - ROOT.json の差し替えは、D4 の不変検査と設計書保護の diff gate で止める。
   - 却下した案: `src/` の定数にする案 (M2 と M3 の時期が揃ってしまう)。
3. **凍結後の plan_id の再 mint は認めない。**
   - 理由: legacy で plan_id が 2 asset にまたがる 2 件は、最後の record の asset だけが続けられる (§7 規則 2)。それ以外の再 mint が要る場面は現状無く、先回りして supersede の記録を足さない (最小実装原則)。
   - 必要になったら別途拡張する (本書の範囲外)。
