# PLAN-L6-711 rev 3 改訂案 (receipt digest 再導出のための入力形の補完) — advisor 反証後の改訂版

基準: origin/main `cae05c4a` 上の `docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md` (ledger revision 2、§8 注記 7〜8 が S1 の rev 2 / rev 3 の記録)。
本案は差し替え文面だけを示す。repo は編集していない。以下の「rev 3」は本改訂 (PLAN ledger revision 3) を指す。
spike の結果は `SPIKE.md` にある。

**状態 (2026-09-29 更新)**: freeze の前提作業 1〜8 は完了した (§I)。freeze できるのは、advisor の再審で REFUTED が出ないことを確認した後である。
§I の数値 (字義式 0/314、Tier 2 103/116) は、下記の旧 spike の数値 (66/89) を置き換える。
(以下は旧状態の記述。)**状態: freeze 不可 (未完了)**。導出規則は案 B として提示する。案 B は、spike が未測定のまま残した一般則を必要としない。
freeze の前に、次の 2 件を行う。(1) 本改訂版を advisor に再度かける。(2) 案 B の per-instance 証明を、PLAN-L7-742 r2〜r4 の実データで golden vector として固定し、実証する。
詳細は §H を参照。

---

## A. 設計判断の追加 (§1 の末尾、advisor 反論リストの後)

### rev 3: receipt digest 再導出のための入力形の補完

**背景**: S2 実装 PR #724 (head `bb60576e`) は、非著者 review (Codex Sol r2) で FLAG を受けて close した。FINDING は次のとおり (issue #711 / PR #724)。

> `src/plan-admission/rechain-verifier.ts:355` — receipt_digest を正規 ledger 導出式で再計算せず H 値の再利用だけを拒否するため、H と異なる任意値へ置換して record_digest と frontmatter を同期した R が通過し、PLAN-L6-711 §2.3-6 の「digest を自分で計算し直す」契約を満たさない。actor/sourceCommit を含まない現行 §2.6 入力では修正不能なので、まず入力契約を改訂して必要な正規 ledger 入力を追加し、その値から receipt_digest を bit-exact に再導出して照合すること。

**原因**: tracked の `receipt_digest` は `"sha256:" + certificateDigest` である。その preimage は `commandPayloadDigest = sha(JSON.stringify({...AppendPlanRevisionInput, canonicalPayloadDigest}))` を含む。
§2.6 rev 2 の入力と tree だけでは、`AppendPlanRevisionInput` のうち `actor`・`sourceCommit`・`basePayloadDigest` が決まらない。そのため S2 は、「H と同値でない」という弱い検査に落ちた。

**advisor 相談 (2026-09-29、`gpt-5.6-sol`、`--decision implementation`)**: 初版の案 1 (`ledger.actor` を 1 個だけ追加し、`basePayloadDigest = canonicalPlanPayload(M)` とする) を攻撃させた。判定は **REFUTED**。

- **残った判断**:
  - pure verifier は production の pure primitive を共有してよい。runner / DB / fs を呼ばない限り pure である。
  - draft / legacy bootstrap / 同じ PLAN に複数 record は fast-path の非適用とする。fail-close して手動 re-chain と通常の再検へ戻す。これは免除ではない。
  - `sourceCommit = X.oid`。
  - `occurredAt = R の admitted_at`。
  - verifier は Git / fs / DB を読まず、adapter が snapshot を渡す。
- **反証された点と、本改訂での対応**:
  1. **R 側だけで受け取る actor は、digest と一緒に偽造できる。** → actor は H の receipt 再導出を通じて束縛する。`actorR === actorH` を要求する (§C-2、§C-3)。
  2. **`basePayloadDigest = canonicalPlanPayload(M)` は未証明である。** → spike を行った (`SPIKE.md`)。
     字義どおりの式 (receipt 込み) は構成上偽で、0/307 だった。stripped 形 (`admission_receipt` を除いた frontmatter の `stableJson`) は、Tier 2 で 66/89 件の receipt を bit 一致で再導出でき、反例は 0 件だった。
     ただし 23 件は actor が未知で判定できない。そのため一般則としては freeze しない。代わりに、**verifier が実行時に、M の最新 tracked record 1 件の receipt を再導出して、その場で証明する** (案 B、§C-3)。
  3. **「M に base record が無い」は、現行の Git-only 入力では判定できない。** → この語を **M の tracked projection の record** に限定する。DB の `plan_revisions` 行は参照しない (§C-4)。
  4. **「assembler を呼ぶ」だけでは完全な再導出にならない。** → 呼ぶ primitive の連鎖と入力変換を §C-5 で名指しで固定する。renderer には in-memory の projection reader を注入する。

**採択**: 案 B。

| 案 | 内容 | 判定 |
| --- | --- | --- |
| A (初版案 1、反証済み) | `ledger.actor` を 1 個追加し、`basePayloadDigest = sha(canonicalPlanPayload(M).payload)` とする | 反証 (1) と (2) により不可。R 側だけの actor は偽造と区別できない。字義どおりの式は実測で偽 |
| **B (採択)** | wrapper は **未信頼の hint** として、H と M の record の再導出に要る未投影値 (`actor` / `sourceCommit` / `basePayloadDigest`) を渡す。verifier は、それらを使って **H の record と M の最新 record の tracked `receipt_digest` を bit 一致で再導出できる場合にだけ**、値を受け入れる。R の preimage では、`actor = actorH`、`basePayloadDigest = sha(stableJson(stripped(M)))` とする。後者は M の record の再導出によって、その instance について証明済みの値である | hint は偽っても通らない。SHA-256 の preimage は偽造できないので、tracked receipt と一致する preimage は真正のものに限られる。信頼の根は Git の tracked data のままである。spike の未測定分 (23 件) に依存しない |
| C | `basePayloadDigest` を hint として受け取るだけにして、M の再導出はしない | hint の真正性を示せない。反証 (2) が残る |
| D | receipt_digest の照合をやめる | §2.3-6 を弱める。FINDING の反例を許す |

信頼境界の注記: chain は `IntegrityOnlyTrustBoundary` のままである (§1)。hint は秘密値ではない。したがって、正しい hint で全 digest を再計算した R は、正規の re-chain と区別できない。
しかしそれは正規の再導出そのものであり、許してよい。本改訂が閉じるのは次の 2 つの経路である。
(a) preimage から導けない任意の digest 値を受け入れる経路。(b) H / M の真正な receipt と整合しない actor・base を R に入れる経路。

---

## B. §2.1-2 (d) の差し替え

新:

> - (d) PR が `H` で append していた record と同じ対象について、正規の `plan revise` で再発行する。対象は 1 PLAN につき 1 record に限る。
>   `command_id` には `:rechain-<n>` suffix を付ける。`plan revise` は `HEAD = X` で実行する。working tree の receipt と PLAN は `X` の blob のままにし、
>   §2.2 で再適用した PLAN 本文は manifest の `source.content` として渡す。manifest の `base.source_commit` は `X` の oid とする。
>   manifest の `actor` は、**`H` の record を発行した actor (`actorH`) と同じ値**にする。wrapper 自身の actor は使わない (rev 3)。
>   wrapper は §2.6 の `ledger` hint (`H` と `M` の未投影値) を検証器へ渡す。hint はローカル ledger から読んでよいが、検証器はそれを信用しない (§2.3-6)。
>   次のいずれかに当たる場合、wrapper は re-chain せず、手動 re-chain と通常の再検へ戻す (fast-path 非適用。§2.3-6 の fail-close 規則と同じ)。
>   `plan draft` の record (`H` で新規作成された PLAN)、1 PLAN に 2 件以上の record、legacy bootstrap。

---

## C. §2.3-6 の差し替え (「admission 以外で変えてよいのは次の項目だけとする」の後に追加)

### C-1. 共通: 1 record の再導出 `rederive(record, blob, A, hint)`

tracked の record 1 件、その PLAN blob、admission `A`、hint `{actor, sourceCommit, basePayloadDigest}` から、`AppendPlanRevisionInput` を組む。

| ledger 入力 | 値の出所 |
| --- | --- |
| `commandId` / `assetId` / `planId` / `sourcePath` | record の `command_id` / `binding` |
| `baseRevision` | `binding.revision − 1` |
| `basePayloadDigest` / `actor` / `sourceCommit` | hint (未信頼) |
| `canonicalPayloadJson` | `stableJson` (assembler 版、UTF-8 bytes 順) に、`parseLegacyPlanSource(blob).frontmatter` から `admission_receipt` を除いたものを渡した結果。production の `plan-ledger-rehydrator.ts:158-161` と同じ式であり、関数として共有する |
| `contentDigest` | `canonicalPlanContentDigest(blob)` を unprefix した値。record の `binding.content_digest` と一致しなければ `fail` |
| `bodyDigest` | `sha(parsed.body)` |
| `reason` / `routeTupleDigest` | `A.escapeReason ?? "route:" + A.routeSignal` / `sha(stableJson(A))` |
| `certificateId` | `"certificate:" + sha(commandId).slice(0, 32)`。record の `receipt_id` と一致しなければ `fail` |
| `occurredAt` | blob の `admission_receipt.admitted_at` (ISO 8601 でなければ `fail`) |

`A` は `admission` 入力 (key = record_digest) の候補である。renderer の `digest(A)` (localeCompare 版の `stableJson`) が record の `decision_digest` と一致しなければ `fail` とする。
再導出が成立する条件は、`"sha256:" + derivePlanRevisionDigests(input).certificateDigest === record.receipt_digest` である。

### C-2. H の record の再導出 (actor の束縛)

`H` 上の再発行対象 record `h` と、H tree の PLAN blob について、`rederive(h, blob_H, A_H, ledger.h)` が成立しなければ `fail` (`rechain-h-receipt-underivable`)。
成立したときの `ledger.h.actor` を `actorH` とする。

- `actorH` は `h` の真正な receipt preimage の一部として証明される。誤った actor 候補では再導出が成立しない。
- H は PR head にある既存の tracked data である。攻撃者が R と一緒に作り直すことはできない。

### C-3. M の最新 record の再導出 (base の per-instance 証明)

`M` の tracked projection のうち、その PLAN (`binding.path` と `plan_id` が一致) の最新 record を `m` とする。M tree の PLAN blob について、
`rederive(m, blob_M, A_M, ledger.m)` が成立しなければ `fail` (`rechain-base-unrecoverable`)。

- 成立すれば、`m` の ledger 上の `canonicalPayloadDigest` が `sha(canonicalPayloadJson(blob_M))` と等しいことが、その instance について証明される。
  理由は、`canonicalPayloadDigest` が `m` の commandPayloadDigest の preimage に入っているからである。
  これを R の `basePayloadDigest` とする。spike (`SPIKE.md`) では同じ primitive 連鎖で 66 件を再導出でき、反例は 0 件だった。
- `A_M` も `admission` 入力の候補であり、`m.decision_digest` で検証する。

### C-4. R の record の再導出と全連鎖の照合

`R` の再発行 record `r` について、`rederive(r, blob_R, A_R, {actor: actorH, sourceCommit: commits.X.oid, basePayloadDigest: sha(canonicalPayloadJson(blob_M))})` が成立し、
かつ `r.binding.revision === m.binding.revision + 1` でなければ `fail` (`rechain-receipt-digest-mismatch`)。R 側の hint は受け取らない。

さらに、全連鎖を production primitive で組み直し、R の実物と照合する。

1. `assemblePlanRevisionCommand` (非 legacy 経路) を呼ぶ。入力は次のとおり。manifest は `{command_id: r.command_id, plan_id, source: {path, content: R の PLAN 本文から admission_receipt を除いたもの}, base: {asset_id, revision: m.revision, revision_digest: "sha256:" + base digest, source_commit: X.oid}, recorded_at: r の admitted_at, actor: actorH, projection}`。
   `environment` は `{sourceCommit: X.oid, actor: actorH, headSource: blob_M}`。返った `commandPayloadDigest` が `derivePlanRevisionDigests(ledgerInput).commandPayloadDigest` と一致すること。
2. `derivePlanRevisionDigests(ledgerInput)` の `certificateDigest` から、receipt binding `{certificateId, certificateDigest, assetId, revision: m.revision + 1}` を組む。
3. `new TrackedReceiptRenderer(inMemoryReader)` の `render(command, receipt)` を呼ぶ。`inMemoryReader.read(path)` は M tree の projection blob を返す。
4. renderer が返した PLAN source と projection を R の blob と比べ、**bytes で完全一致**しなければ `fail` (`rechain-render-mismatch`)。
   比べる対象は、PLAN の frontmatter `admission_receipt` ブロック全体、本文、projection の records 全体である。record の `record_digest` は renderer が内部で呼ぶ `trackedReceiptRecordDigest` の結果として一致する。個別フィールドの部分照合で代えない。

### C-5. 呼び出す primitive (唯一の実装)

`parseLegacyPlanSource`、`canonicalPlanContentDigest`、`bindPlanSourceToAdmission`、`assemblePlanRevisionCommand` (非 legacy)、`derivePlanRevisionDigests`、
`TrackedReceiptRenderer` (内部で `trackedReceiptRecordDigest` を呼ぶ)、assembler 版の `stableJson` / `sha`、renderer 版の `digest` (decision_digest)。

verifier はこれらを import して呼ぶ。同等の関数を自作しない。`commandPayloadDigest` と `certificateDigest` は `JSON.stringify` を使うので、key の挿入順に依存する。
既存 receipt との互換を保つ間は、`derivePlanRevisionDigests` を唯一の実装とする。順序依存の解消は、schema version を上げる別改訂で扱う。
runner (`node-plan-revision-runner.ts`)、ledger transaction、DB、fs、Git は呼ばない。

### C-6. fast-path 非適用 (fail-close) の条件

次のいずれかに当たれば、verifier は digest を照合せずに `fail` を返す。どれも手動 re-chain と通常の再検へ戻る経路である。

- `ledger.h` / `ledger.m` の欠落、または `actor` が trim 後に空 (`rechain-ledger-hint-missing`)。
- M の tracked projection に、その PLAN の record が無い (`rechain-base-unrecoverable`)。これには、`H` で `plan draft` された PLAN と、ledger 未採用の PLAN が含まれる。判定に使うのは tracked projection だけである。DB の行は参照しない。
- `h` または `m` が rev 1 (plan draft の certificate 式)、または `asset_id` が `plan:legacy:` で始まり revision が 2 (bootstrapDigest の式) (`rechain-legacy-or-draft-unsupported`)。
- `H` が同じ PLAN path に 2 件以上の record を append している (`rechain-multi-record-per-plan-unsupported`)。
- C-1 の表の値が 1 つでも決まらない (`admitted_at` が無い、など) (`rechain-ledger-input-incomplete`)。

---

## D. §2.6 の差し替え

### D-1. 型定義

```ts
type Oid = string; // 40 桁の小文字 hex
interface CommitObj { oid: Oid; parents: readonly Oid[]; tree: Oid }
type TreeMap = Readonly<Record<string, Oid>>; // repo 相対 path → blob oid (ls-tree -r の blob だけ)
interface RevisionHint { actor: string; sourceCommit: Oid; basePayloadDigest: string } // 未信頼。§2.3-6 C-2/C-3 で検証する
interface RechainLedgerHints { h: RevisionHint; m: RevisionHint } // rev 3
interface RechainInput {
  commits: { H: CommitObj; X: CommitObj; R: CommitObj; M: Oid; base: Oid };
  trees: { base: TreeMap; H: TreeMap; M: TreeMap; X: TreeMap; R: TreeMap };
  blobs: Readonly<Record<Oid, string>>;
  admission: Readonly<Record<string, PlanAdmissionRequest>>; // key = record_digest。h / m / r の候補 A_H / A_M / A_R
  ledger: RechainLedgerHints; // rev 3
}
type RechainVerdict = { ok: true; verifierDigest: string } | { ok: false; reasons: readonly string[] };
```

### D-2. 番号付き項目

> 5. **ledger hint (rev 3)**: `ledger.h` / `ledger.m` は、`h` / `m` の ledger 入力のうち tracked data に投影されない値である。wrapper はローカル ledger から取ってよい。
>    verifier はこれを信用しない。§2.3-6 C-2 / C-3 で tracked `receipt_digest` を bit 一致で再導出できた場合にだけ使う。R 側の hint は入力に持たない。
>    R の `actor` / `sourceCommit` / `basePayloadDigest` / `occurredAt` は、`actorH`、`commits.X.oid`、M の証明済み canonical payload digest、R の `admitted_at` から導く。
> 6. **出力**: `verifierDigest = "sha256:" + sha("ut-tdd.rechain-verifier.v2\n" + stableJson(input))`。入力形を変えたので、domain separator を v1 から v2 に上げる。
> 7. **信頼境界**: adapter は Git plumbing (`rev-parse` / `ls-tree -r` / `cat-file`) で snapshot を組む。hint だけは Git の外 (ローカル ledger) から来てよい。
>    hint は tracked receipt への再導出によって H / M の tracked receipt への commitment として検証されるので、信頼の根は Git の tracked data から動かない。adapter の出力と実 Git object の一致は、U-RECHAIN-013 で固定する。

---

## E. §4 の表の変更

ORACLES.md のとおりである。

## F. §6 の S2 行

> | S2 | `verifyRechainDelta` (pure function 1 module、§2.6 の入力形) と U-RECHAIN-001..007、011、012、014..023 | serial (S1 の後) | oracle が green、非著者 review が PASS |

## G. §8 への注記追加 (9 番目)

> 9. rev 3 (S2 の差し戻しによる S1 の是正): S2 実装 PR #724 は、Codex Sol r2 の FLAG を受けて close した。FINDING は、§2.6 の入力に `actor` / `sourceCommit` が無いため、`receipt_digest` を再導出できないことである。
>    初版の是正案 (`ledger.actor` の追加 + `canonicalPlanPayload(M)`) は、advisor (gpt-5.6-sol、2026-09-29) が REFUTED とした。
>    spike の結果は次のとおり。字義どおりの式は 0/307。stripped 形は 66/89 を bit 一致で再導出でき、反例 0、未測定 23。
>    これを受けて、H と M の record の再導出で未信頼 hint を H / M への commitment として検証する方式 (案 B) を採った。`actorR = actorH`。fast-path 非適用 (draft / legacy / 複数 record) は fail-close とする。
>    U-RECHAIN-017〜023 を追加し、012 / 013 / 016 を改めた。reviewer の鮮度 (issue #745) は本改訂の範囲外である。

## H. freeze の前に残る作業

1. 本改訂版 (案 B) を advisor (`--decision implementation`) にかけ、再度攻撃させる。
2. 案 B の C-2 / C-3 / C-4 の primitive 連鎖を、実データの golden vector で固定する。PLAN-L7-742 r2→r3→r4 (issue742 branch) は、spike でどの値も確定済みである。
   actor は `claude-opus-5-5-control-lane`、sourceCommit は導入 commit の first parent である。これを H/M/R 相当の組として使える。
3. 実用性の測定 (advisor 指摘): 直近の open PR で、fast-path 非適用 (draft / legacy / 複数 record) になる割合を数える。

---

## I. freeze 前提作業の結果 (advisor 再反証 1〜8 への対応、2026-09-29)

基準は origin/main `895ac2e9` である。spike の正本は `SPIKE-TABLE.md` (再現スクリプト `spike-repro.mts`、`composition-check.mts`)。
(注: §I の数値は、§J-1 の tracked 実行 (minimal introducer 規則) の値 0/314、103/116、103/340 に置き換えてある。) 本節の数値は §A・§C-3・§G・§H の「66/89、23 件」を**置き換える**。置き換え後の値は、字義式 0/314、Tier 2 103/116、undecided 13 である。

### I-1. 再現 spike (項目 1)

`SPIKE-TABLE.md` に表と再現手順をまとめた。要点は次の 3 つである。
(a) 字義式 `sha(canonicalPlanPayload(M).payload)` は 0/314 で、stripped 形とは一致しない。
(b) Tier 2 は 116 件で、そのうち 103 件の receipt_digest を bit 一致で再導出できた。103 件の sourceCommit の内訳は、first parent が 84、history 書き換え前の commit が 19。base の形は stripped が 95、その他が 8 である。
(c) 全連鎖の byte 照合は 4/4 で一致した。

### I-2. first-parent 不一致の分類 (項目 2)

旧 spike が「祖先」と記録した 1 件 (PLAN-L7-512 r3、seq 172) は、実際には**祖先ではない**。
sourceCommit の `0bd363b39c73f117a32788749c1b1bf3e080b36f` は、導入 commit `3188cdd1` の first parent `7841efa3` の、**rebase 前の姿**である。
両者は tree (`152654bd`)、author date、subject が同じで、committer date と parent だけが違う。
これは commitlint の subject repair による history 書き換えであり、`origin/archive/pr529-c5dce6c1-before-subject-repair` からしか到達できない。
再現 spike では、同じ型の record が 19 件ある (PLAN-L7-471 r2/r3、PLAN-L7-512 と REVERSE-512 の r3、PLAN-L7-532 系、PLAN-L7-534 系)。そのうち `f694a381` と `a5e1da14` は local の object database に存在しない。

**案 B の扱い: digest 証明で受理する (非適用にはしない)**。
H / M の hint の sourceCommit は、preimage 上の文字列として扱う。Git object に解決できるか、祖先関係にあるかは要求しない。
要求すると、正規の PR の 18% (19/103) が非適用になる。安全上の理由も無い。偽の sourceCommit では receipt を再導出できないからである。
R の sourceCommit は、構成上 `commits.X.oid` に固定する。golden fixture は ORACLES 029 の G2 とする。

### I-3. preimage 表 (項目 3)

分類は次の 4 つである。
- **T** = tracked 値: record または frontmatter の値をそのまま使う。
- **D** = PLAN bytes からの導出。
- **G** = Git object: 入力の commits / trees / blobs。
- **P** = 証明済み hint: 未信頼の入力を、tracked digest の再導出によって H / M への commitment として検証したもの。

| field (`AppendPlanRevisionInput`) | H (`h`) | M (`m`) | R (`r`) |
| --- | --- | --- | --- |
| commandId | T `h.command_id` | T `m.command_id` | T `r.command_id` (`h.command_id + ":rechain-<n>"` であることも照合する) |
| assetId | T `h.binding.asset_id` | T `m.binding.asset_id` | T。`= m.binding.asset_id` を要求 (026-c) |
| planId | T `binding.plan_id` | T | T。`= h.plan_id = m.plan_id` |
| baseRevision | T `h.binding.revision − 1` | T `m.binding.revision − 1` | T `m.binding.revision` (`r.revision = m.revision + 1`) |
| basePayloadDigest | **P** `ledger.h.basePayloadDigest` (H の receipt で証明する) | **P** `ledger.m.basePayloadDigest` (M の receipt で証明する) | D+P `sha(canonicalPayloadJson(blob_M))`。m の receipt で証明済み (§C-3)。hint は取らない |
| canonicalPayloadJson | D `stableJson(fm(blob_H) − admission_receipt)`。assembler 経由では `canonicalPlanPayload(bound.source).payload` | D (blob_M について同じ) | D (blob_R について同じ) |
| (派生) canonicalPayloadDigest | D `sha(canonicalPayloadJson)` | D | D |
| contentDigest | D `canonicalPlanContentDigest` と T `binding.content_digest` の一致 | D=T | D=T |
| bodyDigest | D `sha(body)` | D | D |
| sourcePath | T `binding.path` | T | T |
| sourceCommit | **P** `ledger.h.sourceCommit` (Git 解決は要求しない。I-2) | **P** `ledger.m.sourceCommit` | G `commits.X.oid` |
| actor | **P** `ledger.h.actor` → `actorH` | **P** `ledger.m.actor` (m の証明にだけ使い、R には流さない) | P `actorH` |
| reason | D+P `A_H.escapeReason ?? "route:" + A_H.routeSignal` | D+P (`A_M`) | D+P (`A_R`) |
| routeTupleDigest | D+P `sha(stableJson(A_H))` (assembler 版) | D+P | D+P |
| certificateId | D `"certificate:" + sha(commandId).slice(0,32)` と T `receipt_id` の一致 | D=T | D=T |
| occurredAt | T blob_H の `admission_receipt.admitted_at` | T blob_M の `admitted_at` | T blob_R の `admitted_at` |

補足 (certificate / record の preimage):
- `certificateDigest` の preimage は、`commandPayloadDigest` (上表から導出)、`assetId` (T)、`revision` (T)、`planId` (T)、`contentDigest` (D=T)、`routeTupleDigest` (D+P) である。
- `record_digest` の preimage は、`sequence` (T、M の projection 長 + 1)、`previous_record_digest` (T、M の projection の tail)、`command_id` (T)、`receipt_id` (T)、`receipt_digest` (上の導出)、`decision_digest` (D+P `digest(A)`)、`binding` (T) である。
- admission `A` (`PlanAdmissionRequest`) の中の `branch` は tracked data に投影されない。`A` は、入力 `admission` の候補を `decision_digest` によって H (または M) への commitment として検証した P である (「認証」ではない。H 自身が exact-head closing review を通っていることが前提。`branch` の意味の正しさは review が担い、verifier は H に commit された値からの逸脱だけを検出する)。`decision_digest` が 1 件に一意に決まらなければ、027-g で非適用とする。
- legacy 用のフィールド (repositoryIdentity、baseSource* ほか) は、027-d で非適用なので、表の対象外とする。

**未分類のフィールドは無い (blocker 0)**。ただし実装上の前提が 1 件ある。
`decision_digest` の計算関数は `tracked-receipt-renderer.ts:285-298` の **private な `digest` / `stableJson` (`localeCompare`)** であり、export されていない。
S2 では、これを export して共有するか (1 行の production 変更。PLAN の `generates` / `implements` に明記する)、H / M も renderer に通して bytes で照合するかを選ぶ必要がある。
自作 (複製) は §C-5 で禁じる。§C-1 の「renderer の `digest(A)`」は、この前提を明記した形に改める。

### I-4. undecided (旧 23 件 → 再現 spike では 13 件) の理由コード

再現 spike の母集団では、hint 経由で旧 undecided のうち 10 件以上が解消した (PLAN-L7-534 r2〜r7、PLAN-L7-532 r2/r3、PLAN-L7-531 r2、PLAN-L7-566 r2、PLAN-L7-512 r5/r6 など)。
残った 13 件の理由コードは、すべて **hint が得られない** である。**候補はあるが digest が一致しない** ものは 0 件である。

| 理由コード | 件数 | record |
| --- | --- | --- |
| `hint-unobtainable/draft-base` (rev 2 で base が draft。hint が無く、base は draft command JSON なので辞書では原理的に出せない) | 7 | PLAN-RECOVERY-16 r2、PLAN-L6-89 r2、PLAN-L6-90 r2、PLAN-L7-627 r2、REVERSE-627 r2、PLAN-L7-628 r2、PLAN-L7-676 r2 |
| `hint-unobtainable/actor-or-commit` (manifest が残っておらず、actor または sourceCommit が辞書に無い) | 6 | PLAN-L7-512 r4、REVERSE-512 r4、PLAN-L6-93 r31、PLAN-L7-530 r14、PLAN-L7-626 r15、PLAN-L7-676 r10 |
| `digest-mismatch-with-hint` | 0 | — |
| 0 record / 2 record / draft (rev 1) / legacy bootstrap | (Tier 2 の対象外。T1 で分類済み: rev1-draft 27、legacy-bootstrap 25) | — |

**将来の通常 PLAN を undecided に入れない機構について**:
spike の undecided は、実行時の verifier では `rechain-ledger-hint-missing` (027-e) に相当する。これは fail-close であり、通常の再検へ戻るだけなので、**安全性の問題ではなく fast-path の適用率の問題**である。
適用率は、wrapper が H / M の hint を取れるかどうかで決まる。hint の出所は、`plan revise` を実行した ledger の `plan_revisions` 行 (`actor` / `source_commit`、base 行の `canonical_payload_digest`) である。
**現状、hint の可用性を機械的に保証するものは無い**。H を別の runtime や worktree で revise した場合、その ledger が merge 時の wrapper から読めなければ非適用になる。
rev 3 の範囲では、次の 2 点を凍結する。
(1) 非適用のときは理由コード付きで fallback し、fallback の率を S3 の実証 PR で数える (§H-3)。
(2) 機械的に保証する手段として、`plan revise` が未投影の preimage 値 (`actor`、`source_commit`、`base_payload_digest`) を tracked の `admission_receipt` に投影する案がある。これは receipt schema v3 の変更であり、renderer と projection の契約変更になるので、**別 PLAN** として起票候補に留める。
    投影すれば hint が不要になり、undecided は構成上 0 になる。ただし IntegrityOnly の境界は変わらない。

### I-5. freeze 判定

- 項目 1〜8 はそろった。再現表は `SPIKE-TABLE.md`、first-parent の分類は I-2、preimage 表は I-3 (blocker 0)、oracle は 024〜029 を追加した。
- 案 B を裏づける新しい実測は次の 3 つである。
  (i) stripped 形の一般則に反例が 8 件ある (draft base)。案 A / C は不可が確定した。
  (ii) first-parent 規則に反例が 19 件ある。sourceCommit は hint 証明が必須である。
  (iii) 全連鎖の byte 照合が 4/4 で一致した。
- **判定 (旧、§J で置き換え)**: 設計は freeze 可能な状態にある、としていた。条件は次の 2 点だった。
  (a) 本版を advisor (`--decision implementation`) に再度かけ、REFUTED が出ないこと。これは工程上の必須手順であり、本 spike の代わりにはならない。
  (b) S2 の範囲に、renderer の `digest` の export (I-3) を含めることを PLAN に明記すること。
  hint の可用性 (I-4) は、適用率の問題として S3 で測る。freeze を止める条件にはしない。

---

## J. advisor 再反証 (r3、gpt-5.6-sol、2026-09-29、REFUTED) への対応

指摘は 3 つの blocker である。(1) 再現用の資材が Git 管理下に無い。(2) 将来の record について fast-path の入力を誰が供給するか決まっておらず、適用率が 0% になり得る。(3) 非適用の状態空間が閉じていない。
あわせて、sourceCommit を opaque として扱う点と、branch の束縛は「認証」ではなく「H への commitment」と呼ぶ点は、条件付きで survive と判定された。

### J-1. 再現資材の Git 固定 (blocker 1)

branch `work/spike-issue711-rechain-evidence` の `docs/research/issue711-rechain-spike/` に、次の 4 群を置いた。
- スクリプト: `spike-repro.mts`、`composition-check.mts`
- hint: `hints.json` (ローカル path を除いた snapshot)
- 全 340 record の機械可読な出力: `records.json`。1 record ごとに seq、record_digest、command_id、分類、理由コード、経路、sourceCommit の Git 状態を持つ。
- 期待値: `aggregate.json`、`spike-output.md`、`exit-code.txt`、`README.md` (実行コマンド)

実行に必要なものは、origin の fetch (`origin/archive/pr529-c5dce6c1-before-subject-repair` を含む) と、依存を導入済みの node_modules だけである。

### J-2. 本番契約と spike 分類の分離

- **本番契約**: `sourceCommit` は **opaque な committed preimage** である。ledgerInput の文字列として receipt_digest に commit されている値であって、provenance の実在を証明するものではない。
  verifier と、その下流の consumer (doctor、gate、audit、projection) は、`sourceCommit` の到達可能性、祖先関係、tree の内容を**推論してはならない**。
  R 自身の commit 構造は、入力の `commits.{H,X,R,M,base}` の Git object で別に検証する (§2.6、U-RECHAIN-013)。
  本番の verifier は introduction commit という概念を使わない。H / M / R は、入力の commit の tree だけで決まる。
- **spike 分類** (Git が利用できることを前提とする、本番の外の分類): `source_commit_git` は `reachable-from-target` / `present-unreachable` / `absent-from-odb` の 3 値である。
  introduction commit の規則は `SPIKE-TABLE.md` の §2 にある: 参照する ref は target だけ、`rev-list --full-history --parents` で辿る、最小導入者が一意であることを要求し、tie-break はしない、時刻は使わない。
  この分類は clean clone の状態で値が変わり得る。そのため、分類結果に本番の合否を依存させない。

### J-3. 将来 record の入力供給 = receipt schema v3 の preimage 投影 (blocker 2)

**設計判断**: 同じ PLAN の中に S0 を置く。S0 では、`plan draft` / `plan revise` / wrapper re-chain が発行する PLAN frontmatter の `admission_receipt` に、`preimage: {actor, source_commit, base_payload_digest, branch}` を投影する。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **v3-FM (採択)** | frontmatter の `admission_receipt.preimage` にだけ投影する。projection の record は変えない | ○ `record_digest` の preimage と projection の schema が変わらない。○ verifier は元々 PLAN blob を読む。○ `bindPlanSourceToAdmission` は `admission_receipt` 全体を除くので、`content_digest` との互換を保てる。△ frontmatter の schema (`frontmatterSchema` の `admission_receipt`) と `schema_version` を v3 に上げ、parser は v2 と v3 の両方を受ける。△ 値は公開の tracked data になる (lane 名、oid、branch 名。secret と PII は含まない) | 採択 |
| v3-PJ | projection の record にも投影する | △ `trackedReceiptRecordDigest` の preimage が変わり、chain の schema を上げる必要がある。projection の consumer すべてに影響する | 不採択 (影響が大きすぎる) |
| sidecar | 別の tracked file (`plan-revision-hints.json`) に置く | △ tracked file が 1 本増え、merge 競合の面も増える。PLAN の blob と原子的に結びつかない | 不採択 |
| local-ledger | 現状どおり、wrapper がローカル ledger から読む | × runtime や worktree をまたぐと取れない。適用率は保証されない (spike で undecided 13 件) | v2 の record 専用の補助経路としてだけ残す |

- **信頼**: `preimage` は依然として未信頼の hint である。verifier は、H / M の tracked receipt_digest を再導出できたときだけ使う (U-RECHAIN-030-b)。IntegrityOnly の境界は変えない。
- **順序**: S0 (producer v3 + U-RECHAIN-030) → S2 (verifier) → S3 (wrapper) の順とする。S0 は「新規 source_module なし、renderer / schema の最小変更 1 論点」の PR とする。
- **v2 の record**: 既存の record は preimage を持たない。wrapper がローカル ledger から hint を渡せる場合だけ適用し、渡せなければ `rechain-ledger-hint-missing` にする。

### J-4. 適用可能性の AC (経路別、母集団全体を分母とする)

- 歴史的な下限は **103/340 = 30.3%** である (target `895ac2e9`、`aggregate.json` の `rederived_over_population`)。103/116 は Tier 2 に限った条件付きの値であり、適用率として報告しない。
- 経路別の内訳 (`aggregate.json` の `per_path`) は J-1 の実行結果で固定する。
- S0 以降の AC は U-RECHAIN-031 のとおりである。revise 経路と rechain 経路は、v3 preimage だけで 100% とする。draft 経路は設計上 0% と宣言し、理由コードを付ける。
  3 本の実経路 (draft→revise、revise→revise、revise→rechain) で、将来の経路が空でないことを示す。§6 の S3 の出口 (「実 PR 1 本」) は、この AC に置き換える。

### J-5. 非適用の状態空間 (blocker 3)

U-RECHAIN-027 を、閉じた列挙と既定拒否の形に改めた。対象は、parse / schema、重複、欠落、revision の異常、H の record 数、draft / legacy、hint、admission、digest の不一致である。
introduction commit が複数あるという状態は、J-2 のとおり本番の状態空間の外 (spike 分類) に移した。
U-RECHAIN-028 (a) は、「assembler が生成する正確な key 順から外れたものは拒否する」という現行仕様の oracle に改めた。

### J-6. freeze 判定 (r3 対応後)

- 3 つの blocker には、J-1〜J-5 で資材と契約の両方を用意した。
- freeze の可否は、本版と tracked の資材を advisor が再審して REFUTED が出ないことで決める。本 agent は freeze を宣言しない。
- 残るリスクは次のとおり。
  (a) S0 は receipt schema の変更である。frontmatter の schema と、`admission_receipt` の consumer (doctor の各 gate) の v2 / v3 両対応が要る。
  (b) 実行時間は約 5 分で、Git 読み出しが律速している。
  (c) `records.json` の `source_commit_git` は、clone の ref 集合によって変わる (J-2 のとおり、本番の合否には使わない)。
