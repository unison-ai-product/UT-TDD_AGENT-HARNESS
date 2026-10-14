---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# merge 時の自動 re-chain と簿記差分での再検免除の契約 (Issue #711)

実装状況 (2026-10-14 実測): S2 の pure な `verifyRechainDelta` は `src/plan-admission/rechain-verifier.ts` に実装済み (`RECHAIN_ACTOR`、`LEGACY_BOOTSTRAP_UNSUPPORTED`、`ut-tdd.rechain-verifier.v2` の `verifierDigest`、`tests/rechain-verifier.test.ts`)。S3 (adapter `readRechainSnapshot`、`ut-tdd pr merge` への配線、CLAUDE.md の例外文言、実 PR での実証) は未実装で、`src/` に `readRechainSnapshot` も `rechain_conflict` も存在しない。S3 を含む 2.1・2.4・2.5・2.6 の adapter 部分は未実装の目標契約である。

## 1. 背景と設計判断

`docs/governance/plan-admission-receipts.json` は全 PLAN 共通の hash chain 1 本 (`sequence` / `previous_record_digest`) で、CI の `plan admission-check --base origin/main --head HEAD` が main の tail への chain を検査する。1 本 merge されるたびに、receipt を持つ他の open PR は (1) origin/main の取り込みと `plan revise` による re-chain、(2) 新しい head での required CI (Linux 約 12 分 / Windows 約 20 分)、(3) 新しい head での非著者 closing review (exact-HEAD 束縛) の周回をやり直す。2026-09-28 の 1 日で #685 は 1 回、#686 は 2 回やり直した。2026-09-14 以降 receipt に触れた commit は 90 件で、merge された PR 58 本を上回る。re-chain commit の実差分は receipt への record 追加と、PLAN の `generates` 末尾・§8 注記末尾・frontmatter `admission_receipt` に限られる (衝突の原因は main と PR の双方が同じ末尾位置へ追記すること)。

本契約は上の (1) と (3) を machine-verified な簿記差分に限って自動化・免除する。(2) の CI の再走は免除しない。

| 案 | 内容 | 判定 |
|---|---|---|
| **A (採択)** | `ut-tdd pr merge` が merge の直前に自動で re-chain し、review 済み head から re-chain head への差分を fail-close の whitelist 検証器で確認できたときだけ closing review を引き継ぐ | 同一 PLAN と PLAN 間の衝突の両方に効き、pre-merge の fail-close と既存の receipt schema を保つ |
| B | chain を PLAN 単位に分割 | 同一 PLAN 内は直列のまま残る。schema v2 と既存 323 record の移行コストがかかる |
| C | PR は seq を持たない intent だけを持ち merge 後に集約 | tail 束縛を捨てるため衝突の検出が merge 後へ回り、集約 PR の review で直列化が一段下に再発する |

advisor (`claude-fable-5`、2026-09-28) の adversarial 判定を経て採択し、PO が 2026-09-28 に「機械検証で免除」を承認した。取り込んだ反論は次のとおり。chain は `IntegrityOnlyTrustBoundary` (issuer authenticity は検証しない) で改ざん耐性は比較軸にしない。「差分は 1 record だけ」は誤りで、re-chain は `admission_receipt` 欄全体と `binding.revision` と `content_digest` を動かす (whitelist は構造で定義する)。検証器そのものが review 免除を決める信頼境界になるため、契約を先に凍結して cross-review してから実装し、想定外の差分は常に通常の再検へ fail-close する。

## 2. 契約

### 2.1 自動 re-chain (`ut-tdd pr merge`、S3、未実装)

1. 前提: PR の review 済み exact head `H` は現行どおり merge_ready (非著者 PASS receipt blocking 0、required CI green)。
2. `H` の receipt 末尾が origin/main の tail に chain していない場合に限り、wrapper は re-chain head `R` を作る。(a) PR branch に origin/main を通常の merge で取り込む (history は書き換えず、force / rebase / reset は使わない)。(b) receipt と PR が改訂した PLAN ファイルは main 側を採る。(c) PR の PLAN 差分を 2.2 の規則で main 側へ再適用する。(d) `H` で append していた record と同じ数・同じ対象について、正規の `plan revise` / `plan draft` で再発行する (`command_id` に `:rechain-<n>` suffix)。(e) commit subject は `chore(plan): re-chain after main <short-sha>`、path は明示して stage する。
3. (a) で receipt と PLAN 以外の path に衝突が出たら、wrapper は re-chain を中止し `rechain_conflict` で止めて、人手の re-chain と通常の再検へ戻す。

### 2.2 PLAN 差分の再適用規則

`strip(·)` = PLAN の本文と frontmatter から `admission_receipt` ブロックを除いたもの。`M` = 現在の origin/main、`mb` = `merge-base(H, M)` (git の merge 自体が使う base と同じで 2.6 の `base` と一致)。

1. append-only 領域は 2 つだけ: frontmatter `generates` の要素列、`## 8.` 節の番号付き注記。PR の追加分は `strip(H) − strip(mb)` のうちこの 2 領域への末尾追加だけで決まる。再適用は `M` の要素列の後ろに PR の追加分を元の順序で連結する。§8 の番号は `M` の最終番号から採番し直す。重複した `artifact_path` があれば fail-close。
2. それ以外の領域は `strip(mb)` / `strip(H)` / `strip(M)` の 3-way merge が衝突なしで成立する場合だけ適用する。衝突すれば fail-close。
3. 再適用後の `strip(R)` は上の 1・2 の決定的な結果と byte 一致しなければならない。

### 2.3 whitelist 検証器 `verifyRechainDelta(H, R, M)` (実装済み、pure function)

次の全てを満たす場合だけ `pass` を返す。1 つでも外れれば `fail` と理由を返す (fail-close)。

1. **PLAN と receipt 以外の path**: `R` の tree は `H` と `M` の git 3-way merge の結果と一致する (手で加えた変更が 1 byte でもあれば `fail`)。
2. **PLAN ファイル**: `strip(R)` が 2.2 の決定的な結果と一致する。
3. **receipt**: `R` の `records` は `M` の `records` を先頭にそのまま含み、その後ろに `H` が append していた record 数と同じ数だけ持つ。追加の各 record は `H` 側の対応 record と同じ `binding.plan_id` / `binding.path` / `binding.asset_id` を持つ。`binding.revision` は `M` 上の同 PLAN の最新 revision + 1 から連番。`binding.content_digest` は `R` の PLAN の正規 digest と一致する (同一 asset に再発行 record が 2 件以上なら最後の record。それより前は 2.6 の中間 blob の digest と一致)。`previous_record_digest` は連続する。PLAN frontmatter の `admission_receipt` はその record と一致する。
4. **commit 構造**: `H..R` の rev-list は `M` 側の commit も数えるため件数で判定せず、親を直接束縛する。`R` は親 1 つの re-chain commit で、その親 `X` は親 2 つの merge commit。`X` の first parent は `H`、second parent は `M`。したがって `git rev-list --first-parent --count H..R` は 2。`X` の tree は 1 の 3-way merge 結果と一致し、PR 側の変更は `R` だけにある。
5. **成果物所有**: PR が `generates` に追加した各 `artifact_path` は、`M` の tree に存在せず、`M` のどの PLAN の `generates` にも宣言されていない (`duplicate-artifact-ownership` / `merged-plan-status` と同じ判定を `M` に対して行う)。待機中に main 側で新規作成・他 PLAN 所有化された path の再所有を `fail` にする。
6. **admission の意味の不変**: 再発行した各 record と frontmatter の `admission_receipt` は、正規の assembler (`plan-revision-command-assembler` / `tracked-receipt-renderer` と同じ関数) で再導出した結果と完全一致する。
   - H 側入力の束縛: tracked record と frontmatter は admission 入力の一部 (`branch` など) を投影しないので、verifier は H 側入力をそれらから読まない。wrapper が H 側の `PlanAdmissionRequest` 全体 (`routeMode` / `kind` / `layer` / `workflowPhase` / `routeSignal` / `drive` / `branch` / `status` / `subDoc` / `issue` / `origin` / `transitionDirection` / `implementationDisposition` / `reentry` (`targetPlanId` / `targetRevision` / `phase`) / `implementationTarget` / `escapeReason` / `supersedes`) を候補 `A_H` として渡し、`digest(A_H)` が `H` 側の同じ record の tracked `decision_digest` と一致する場合だけ採用する (一致しない、復元できない候補は `fail`)。
   - R 側の期待値: `A_R` は `A_H` の `reentry.targetRevision` だけを新しい revision に置き換えたもの (自己再合流) で、他は完全一致。`digest(A_R)` が R の record と frontmatter の `decision_digest` と一致することを照合する。frontmatter に投影されるフィールド (`receiptFrontmatter` が出す route / issue / origin / transition / reentry / escape_reason / supersedes の全て) は `A_R` からの投影と一致させ、投影されない入力 (`workflowPhase` / `drive` / `branch` / `kind` / `layer` / `status` / `subDoc` など) は `decision_digest` による `A_H` / `A_R` の束縛だけで検証する。
   - admission 以外で変えてよいのは、base 束縛 (`asset_id` 以外の revision、revision_digest、source_commit、source_blob_oid、source_content_digest、projection_tail_digest) を `M` に合わせること、`command_id` の `:rechain-<n>` suffix、`admitted_at` / `recorded_at` の更新、上の入力から決定的に導かれる digest (source_digest、content_digest、decision_digest、receipt_digest、record_digest、receipt_id) だけ。verifier はこれらの digest を自分で計算し直し、record 内の値を信用しない。`reentry.targetRevision` 以外の admission フィールドが `A_H` と 1 つでも異なれば `fail`。
   - `receipt_digest` の preimage: ledger の certificate digest で、`derivePlanRevisionDigests` (`src/plan-asset/ledger/plan-revision-ledger.ts`) が `AppendPlanRevisionInput` から計算する。verifier は同じ関数で R の各 record の `receipt_digest` を再導出して照合する。preimage の各フィールドは次の既に束縛された源からだけ組む。
     | フィールド | 源 |
     |---|---|
     | `commandId` / `certificateId` | R の tracked record の `command_id` (H 側の値 + 許容 suffix `:rechain-<n>`) と、その `command_id` からの正規導出 |
     | `assetId` / `planId` / `sourcePath` | H 側 tracked record の `binding` (R と一致すること) |
     | `baseRevision` | 同 asset の 1 件目: `M` の tracked receipt の同 asset の最新 record の `binding.revision`。k 件目 (k ≥ 2): 直前 (k − 1 件目) の再発行 record の `binding.revision` (= `M` 側の値 + k − 1。ledger は `revision = baseRevision + 1` で append するので 3 の連番と一致) |
     | `basePayloadDigest` | 1 件目: `M` の PLAN blob から正規の canonical payload 導出 (`plan-ledger-rehydrator` と同じ関数)。k 件目: 直前の再発行 record の PLAN blob (最後でない record なので中間 blob) から同じ関数で導く (ledger の append は直前 revision の `canonical_payload_digest` との一致を要求する) |
     | `canonicalPayloadJson` / `bodyDigest` / `contentDigest` | 各 record 自身の PLAN blob から正規 assembler で導出。最後の再発行 record は R の PLAN blob、それより前は中間 blob |
     | `sourceCommit` | `commits.M` |
     | `reason` / `routeTupleDigest` | `A_R` から導出 (`escapeReason ?? route:<routeSignal>` / `sha(stableJson(admission))`) |
     | `occurredAt` | R の frontmatter `admission_receipt.admitted_at` |
     | `actor` | 契約定数 `ut-tdd-pr-merge-rechain` (`RECHAIN_ACTOR`)。record にも frontmatter にも投影されないので定数に固定して決定的にする。wrapper (S3) はこの定数で append する |
     源が得られなければ `fail` (通常の再検へ戻す)。再導出値が R の値と一致しなければ `fail` (理由 `receipt_digest_mismatch`)。
   - 中間 blob: 同一 asset に再発行 record が 2 件以上のとき、最後以外の各 record について `intermediatePlans` にその `content_digest` の key が無ければ `fail` (`intermediate_plan_missing`)、渡された blob から再計算した content digest が key と一致しなければ `fail` (`intermediate_plan_digest_mismatch`)。`intermediatePlans` の key 集合は、再発行 record が 2 件以上の各 asset の最後以外の record の `content_digest` 集合と完全一致しなければならず、余分な key (各 asset の最後の record の `content_digest` を含む) があれば `fail` (`intermediate_plan_unexpected`)。再発行 record が 2 件以上の asset が無いとき `intermediatePlans` は空でなければならない。
   - **legacy bootstrap 除外**: legacy bootstrap 経路の record は preimage が別 (`BootstrapLegacyPlanRevisionInput` の base 側入力と `bootstrapDigest`) なので再導出せず `fail` (`legacy_bootstrap_unsupported`)。verifier は harness.db を読まず `revisionUsesLegacyBootstrap` は呼ばない。判定は 3 で対応付けた H 側の追加 record `h` と R 側の再発行 record `r` の組ごとに、`h.binding.asset_id` が `plan:legacy:` で始まり、かつ `h.binding.revision === 2` または `r.binding.revision === 2` のとき `fail`。判定に使わないもの: `command_id` の形式、H / R の frontmatter、M に同 asset の record があるか。legacy 判定は他の条件 (preimage の源の有無を含む) と独立に評価し、他の条件の失敗で短絡しない (判定が成立した組が 1 つでもあれば `reasons` に必ず含める)。除外は record 単位で、同じ `plan:legacy:` asset でも revision 3 以上は common 経路 (`AppendPlanRevisionInput`) として再導出し、全条件を満たせば `pass`。
     健全性: 正規 writer が legacy 経路で発行した record は必ずこの判定に当たる。(i) legacy 経路では assembler が `asset_id === legacyAssetId(...)` (`plan:legacy:` prefix) を要求する (`plan-revision-command-assembler.ts:102-106,215-223`)。(ii) bootstrap ledger は `baseRevision !== 1` を拒否し revision 2 だけを作る (`plan-revision-bootstrap.ts:89,407`)。(iii) `revisionUsesLegacyBootstrap` が真になる record も `provenance.revision + 1 = 2` に限られる (`node-plan-revision-runner.ts:342-357`)。よって判定は legacy 経路の集合を包含するが、逆は成り立たない (ローカルで採用済みの asset などは prefix ∧ revision 2 でも common 経路になりうる)。この差は安全側の過剰拒否として許容する (通常の再検へ戻るだけ。過剰拒否が起きないとは主張しない)。H 側も判定するのは、H の bootstrap record (revision 2) が、待機中に M が同 asset を revision 2 で admit すると R では common 経路の revision 3 になる経路を見逃さないため。実測 (origin/main `4b541009`): tracked receipt 413 record のうち `plan:legacy:` asset は 30 個 (record 171 件)、各 asset で revision 2 の record はちょうど 1 件でそれが最初の record、prefix ∧ revision 2 は 30 件、残り 141 件は revision 3 以上。`command_id` の形式では区別できない (`plan-revise:` 6 件、`command:` 10 件、`pr154-` / `pr156-` 13 件、`plan-l6-` 1 件が混在)。
     却下: provenance を入力に足す (DB 由来の値の信頼境界・鮮度・record との束縛が新たに要る)、`plan:legacy:` asset を全て除外 (30 asset の common revision まで拒否する)、R 側だけで判定 (H の bootstrap record が R で revision 3 になる経路を見逃す)。

### 2.4 review 引き継ぎと CI (S3、未実装)

1. 検証器が `pass` のとき、wrapper は `H` の closing review receipt を `R` の merge 判定に引き継ぐ。引き継ぎは merge intent receipt に `rechain: { reviewed_head: H, rechain_head: R, main: M, verifier_digest }` として記録する。review receipt 自体は書き換えず、`R` の review receipt を偽造しない。
2. `R` の required CI は常に新しい run で green になる必要がある (same-run evidence の束縛は維持)。wrapper は CI の完了を待ってから merge する。
3. 検証器が `fail`、または CI が red のとき merge しない。通常どおり `R` への非著者再検を要求する状態に戻す。
4. same-family 拒否、verdict 前の merge 禁止、1 exact head につき 1 request などの既存の merge 規律は変えない。引き継ぎは「`H` の非著者 PASS」を `R` へ運ぶだけで、PASS を作らない。

### 2.5 CLAUDE.md の例外文言 (S3、未実装)

PO 承認 (2026-09-28) により、`CLAUDE.md` §運用規律の再締結 2 (merge) に次の例外を 1 つ追加する。追加は検証器と wrapper の配線が merge された PR で同時に行う。

> 例外: `ut-tdd pr merge` の自動 re-chain で、`verifyRechainDelta` が `pass` を返し、re-chain head の required CI が green の場合に限り、review 済み head の非著者 PASS を re-chain head の merge 判定へ引き継いでよい (merge-time-receipt-rechain 設計 2.4)。

### 2.6 検証器の入力形と Git 取得の境界

`verifyRechainDelta` は Git も file system も読まない pure function。Git からの取得は wrapper 側の adapter `readRechainSnapshot` (S3) が行い、検証器には次の immutable な値だけを渡す。

```ts
type Oid = string; // 40 桁の小文字 hex
interface CommitObj { oid: Oid; parents: readonly Oid[]; tree: Oid }
type TreeMap = Readonly<Record<string, Oid>>; // repo 相対 path → blob oid (ls-tree -r の blob だけ)
interface RechainInput {
  commits: { H: CommitObj; X: CommitObj; R: CommitObj; M: Oid; base: Oid };
  trees: { base: TreeMap; H: TreeMap; M: TreeMap; X: TreeMap; R: TreeMap };
  blobs: Readonly<Record<Oid, string>>; // 下の 3 に挙げた内容だけ
  admission: Readonly<Record<string, PlanAdmissionRequest>>; // key = H 側の再発行対象 record の record_digest、値 = 候補 A_H
  intermediatePlans: Readonly<Record<string, string>>; // key = 最後でない再発行 record の content_digest、値 = その record 時点の PLAN 全文
}
type RechainVerdict = { ok: true; verifierDigest: string } | { ok: false; reasons: readonly string[] };
```

1. **commit**: `H` は review 済み exact head、`X` は merge commit、`R` は re-chain commit、`M` は取り込んだ origin/main の tip、`base` は `merge-base(H, M)` (2.2 の `mb` と同じ。旧 main tip は使わない)。stack した PR で `H` が含む別 PR の commit `C` が待機中に `M` へ入ると `base` は `C` へ前進し、`C` の変更は main 由来として扱われて PR 自身の追加に数えない。git の 3-way merge (`X` の生成) も同じ `base` を使うので期待値と `X` の生成規則が一致する。
2. **tree**: 5 つの commit それぞれの全 blob を path → oid で渡す。2.3-1 の 3-way は path 単位で決める。`H[p] = base[p]` なら `M[p]`、`M[p] = base[p]` なら `H[p]`、`H[p] = M[p]` ならその値。それ以外 (両側が別々に変えた path) は、簿記 path (receipt と PR が改訂した PLAN) を除き検証器の対象外として `fail` を返す。git の内容レベル merge が成立する場合でも免除しない。
3. **blob の範囲**: 簿記 path (receipt と `H` が改訂した各 PLAN) の `base` / `H` / `M` / `R` の内容と、2.3-5 の所有判定のための `M` の全 `docs/plans/*.md` の内容。それ以外の blob は oid だけで比較し内容は渡さない。同一 asset に再発行 record が 2 件以上なら、最後以外の各 record 時点の PLAN 全文を `intermediatePlans` に `content_digest` を key として渡す (Git の tree に存在しない内容で、正しさは key の digest との一致と 2.3-6 の再導出で束縛する。最後の record は `R` の PLAN blob を使い入れない)。
4. **admission**: `A_H` は adapter が `H` の PLAN frontmatter と PR の head branch などから組む候補で、検証器は 2.3-6 のとおり `digest(A_H)` と `H` の tracked `decision_digest` を照合してから使う。
5. **出力**: `ok: true` の `verifierDigest` は `"sha256:" + sha("ut-tdd.rechain-verifier.v2\n" + stableJson(input))`。`sha` と `stableJson` は `src/plan-admission/plan-revision-command-assembler.ts` の既存関数 (`stableJson` は key を UTF-8 bytes 順に整列し `undefined` を落とす)。先頭行は domain separator 兼 schema version で、入力形を変えるときは版を上げる (`intermediatePlans` を足したとき v1 から v2 へ上げた)。2.4 の intent receipt の `rechain.verifier_digest` はこの値を記録する。
6. **legacy 判定の入力**: 2.3-6 の除外は `blobs` で渡す H / R の receipt の `binding.asset_id` と `binding.revision` だけで決め、provenance や harness.db 由来の値は入力に加えない (入力形は変えず `verifierDigest` の版は v2 のまま)。
7. **信頼境界**: adapter は harness 自身のコードで、Git の plumbing (`rev-parse` / `ls-tree -r` / `cat-file`) だけを使う。検証器は adapter の出力を信用するが、adapter の出力が実 Git object と一致することは別の oracle (U-RECHAIN-013) で固定する。
8. **衝突の分担**: git の 3-way merge 自体が衝突した場合は wrapper が検証器を呼ぶ前に `rechain_conflict` で止める (U-RECHAIN-008、S3)。検証器は wrapper に依存せず、両側変更の非簿記 path を 2 のとおり独立に `fail` にする (U-RECHAIN-002 / 014、S2)。

## 3. 責務どうしの依存

- 2.3 の検証器は 2.6 の adapter の出力に依存する (adapter の忠実性は U-RECHAIN-013)。
- 2.4 の引き継ぎは 2.3 の `pass` と R の新 run の CI green の両方に依存する。
- 2.1 の wrapper は、正規の `plan revise` / `plan draft` と、PLAN 台帳 (ledger) を生成する同じ assembler (2.3-6) に依存する。別レーンの checkout から headless に `plan revise` を実行できることは S0 で確認した (2026-10-09、control lane の checkout、`origin/main` `9f94fd86` を base とする PR #948 の branch。checkout 固有の ledger が別 checkout で発行された PLAN-L6-816 rev2 を認識していなくても、manifest の base は tracked frontmatter と projection ledger から機械的に導出でき、writer は revision 3 を発行し `plan admission-check --base origin/main --head HEAD` は PASS した)。S0 で確認した範囲は、別 ledger の checkout でも tracked frontmatter / projection から base を導いて正規 writer が headless に revision を発行できることに限る。merge 後の author branch での re-chain と、同時に複数 writer を動かす場合は確認しておらず、S0 の実績から推定しない。

## 4. 範囲外

receipt の schema 変更と既存 323 record の移行 (案 B)、intent と集約の方式 (案 C)、CI の免除や短縮 (Windows の shard 化などは別 Issue)、issuer authenticity の追加、receipt 以外の簿記 (projection DB など) の自動化。

## 5. 実装の順序

S0 (PoC、済) → S1 (本契約の pair-freeze、済: 2026-10-13 に confirm) → S2 (`verifyRechainDelta` と U-RECHAIN-001..007・011・012・014..019、PR #839 で実装済み。所有 PLAN は PLAN-L7-711) → S3 (adapter `readRechainSnapshot` と `ut-tdd pr merge` への配線、U-RECHAIN-008・009・010・013、CLAUDE.md の例外文言、実 PR 1 本での自動 re-chain による merge の実証)。S3 は別 PLAN と pair-freeze の後に扱う。

## 6. 検証 oracle と実測の根拠

- oracle は `docs/test-design/harness/L7-unit-test-design.md` の `U-RECHAIN-*` (S2、実装済み) と `CANDIDATE-U-RECHAIN-008/009/010/013` (S3、未実装) が正本。
- 実測の根拠コマンド:

```bash
git show origin/main:docs/governance/plan-admission-receipts.json | node -e "const a=JSON.parse(require('fs').readFileSync(0)).records;const p={};for(const r of a.slice(-60))p[r.binding.plan_id]=(p[r.binding.plan_id]||0)+1;console.log(a.length,Object.keys(p).length,p)"
git log origin/main --since=2026-09-14 --format=%H -- docs/governance/plan-admission-receipts.json | wc -l
git log origin/main --since=2026-09-14 --merges --format=%s | grep -c "Merge pull request"
git show 4b541009:docs/governance/plan-admission-receipts.json | node -e "const r=JSON.parse(require('fs').readFileSync(0)).records;const L=r.filter(x=>x.binding.asset_id.startsWith('plan:legacy:'));console.log(r.length,L.length,L.filter(x=>x.binding.revision===2).length)"
```
