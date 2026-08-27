---
plan_id: PLAN-L7-518-review-request-retraction
title: "PLAN-L7-518 (add-impl): 閉じられない review request を typed retraction で終端する"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: PO / TL
github_issue_id: 439
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-review-request-retraction-test-design.md
backprop_decision: required
backprop_decision_reason: "fail-close gate の終端状態を新設するため、retraction 権限と merge gate 除外規則を L7 から Reverse 検証する。"
agent_slots:
  - role: se
    slot_label: "SE - append-only retraction receipt と merge gate 除外を実装する"
  - role: qa
    slot_label: "QA - 権限逸脱・verdict 済 retraction・replacement 欠落・手動削除を独立変異で検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-518-review-request-retraction.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-request-retraction-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks: []
  references:
    - src/feedback/review-merge-gate.ts
    - src/feedback/review-dispatch.ts
    - src/feedback/review-verdict-custody.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/439
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/437
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/421
review_evidence: []
---

# PLAN-L7-518: 閉じられない review request を typed retraction で終端する

## 1. Outcome

current HEAD に閉じられない review request が残っても、canonical PASS receipt を持つ request だけで
merge gate が `merge_ready` へ到達する。無効化は append-only な typed 終端として記録され、runtime
evidence ファイルの手動削除に依存しない。同時に、retraction が fail-close gate からの
self-service 脱出口にならない。

## 2. 起点の実測 (2026-08-27)

merge gate は current HEAD に一致する**全** entry が `merge_ready` であることを要求する
(`src/feedback/review-merge-gate.ts`)。よって余計な request が 1 本あるだけで merge が止まる。
typed retraction 経路は存在せず、gate 集合から外れる唯一の経路は PR observation の head mismatch
(`stale_head` により `entriesForHead` から脱落) のみである
(`src/feedback/review-dispatch.ts`)。

同日に 2 件観測した。**両者は要件が異なる**。

### 2.1 事例 D — 構造的 dead-end (PR #430)

exact HEAD `2cd9640c` に対し `rv1-55b815ea…` が `authorFamily=codex` と**誤申告**されて mint された。
`beginReviewAttempt` は `expectedProvider` を申告値から導くため reviewer は claude を期待するが、
PR #430 の実著者は claude である。したがって:

- claude が閉じれば自己 review になる。
- codex が閉じようとすれば `same_family_reviewer_denied` になる。

**どの provider も正規に閉じられない。** merge は
`pending_request_for_head,state:requested,verdict_missing` で恒久 deny となり、最終的に
**request ファイルの手動削除**で解消された。advisor (`gpt-5.6-sol`) はこの手動削除を
「fail-close 判定の入力を人手で除去する行為」として refute している。

### 2.2 事例 R — 競合 mint (PR #441)

exact HEAD `5e0b8fe5` に対し、両ランタイムが**異なる `memoryId` で独立に** canonical request を
mint した (claude 側 05:10:57Z、codex 側 05:14:35Z)。`authorFamily` は両方とも `claude` で正しく、
どちらも codex が正規に閉じられる。実際に codex が 2 本目の receipt を発行し、手動削除なしに
merge へ到達した。

つまり事例 R は **retraction を必要としない**。必要なのは「余計な 1 本が正規に閉じられるまで
merge が止まる」ことの回避であり、置換 identity が存在する以上、回復手段は receipt 発行である。

### 2.3 2 類型を単一 kind で扱わない

事例 D は置換 identity が**存在しない**まま終端させる必要があり、事例 R は置換 identity が
**存在する**。単一の retraction kind では両立しない。§3.2 で分けて契約する。

## 3. 設計判断

### 3.1 retraction は self-service 脱出口になり得る (最重要の反証)

手動削除が refute された理由は「人手による fail-close 入力の除去」である。**この理由は reason が
自由記述なだけの typed retraction にもそのまま適用される。** 誤申告した側のランタイムが、不都合な
request を自分の判断で retract できるなら、手動削除を JSON 化しただけで攻撃面は変わらない。

したがって retraction は次を**すべて**満たすときのみ成立する。満たさない retraction は typed deny する。

1. **verdict 済 request は retract できない。** PASS / PASS-WEAK / FLAG のいずれかの receipt が
   既にある request は終端済みであり、retraction で上書き・抹消できない。FLAG を retract して
   逃げる経路を塞ぐ。
2. **retract を要求できるのは request の author family のみ。** reviewer family が一方的に
   無効化することを禁じる。判定を出す側が依頼を消せてはならない。
3. **理由は typed reason code とし、自由記述を根拠にしない。** 自由記述は補助情報として併記できるが、
   受理判定の入力にしない。
4. **class D は機械が再導出できる述語を要求する。** 自己申告で「閉じられない」と言うだけでは通さない
   (§3.2)。

### 3.2 2 つの retraction class (採択)

| class | 適用条件 | replacement identity | 機械述語 |
|---|---|---|---|
| `unclosable` (事例 D) | どの provider も正規に閉じられない | 不要 (存在しなくてよい) | **必須**。`expectedProvider(申告 authorFamily)` が、独立 provenance が示す実 author family と一致すること = 期待された reviewer が著者本人であること、を機械が再導出できること |
| `superseded` (事例 R) | 同一 `(pr, exactHead)` に、正規に閉じられる別 identity が存在する | **必須**。既に mint 済みの replacement identity を束縛する | replacement が同一 `(pr, exactHead)` を持ち、かつ未 retract であること |

`unclosable` の機械述語は **Issue #437 が導入する authoring provenance に依存する**。provenance が
`unknown` / `conflict` の間は `unclosable` を主張できない。これは意図した依存であり、#437 の発生防止と
#439 の回復経路が同じ信頼根を共有することを意味する。依存の具体は §3.6 に記す。

`unclosable` の retraction receipt は、述語判定に用いた **provenance snapshot (digest + schema
version + commit-set)** を束縛する。merge gate は再評価時に同じ snapshot を参照し、
snapshot が差し替わっていれば typed deny する (PLAN-L7-517 §3.3.1 の TOCTOU 契約と同一の束縛)。

#### 3.2.1 `superseded` の replacement custody

replacement の指定を自由にすると、retraction graph が非決定になり gate が再評価できない。次を
契約として固定する。

- **canonical custody**: replacement は canonical request として実在し、同一 `(pr, exactHead)` を
  持つこと。memory / PR 本文など tracked artifact 外の記述を replacement の根拠にしない。
- **self 参照禁止**: 自分自身を replacement に指定できない。
- **cycle 禁止**: replacement 関係が閉路を作る指定を typed deny する。
- **chain は leaf へ解決する**: A→B→C の連鎖は leaf C を実効 replacement とする。leaf が
  retracted なら chain 全体を typed deny する。
- **closability 要件**: leaf は「正規に閉じられる」こと。すなわち leaf の `authorFamily` と
  authoring provenance から導く `expectedProvider` が著者本人にならないこと。閉じられない
  identity を replacement にすれば dead-end を先送りするだけである。
- **provenance 要件**: leaf の provenance が `unknown` / `conflict` でないこと。
- **決定性**: 以上の規則により、任意の retraction graph に対し実効 replacement は一意に定まるか、
  typed deny になるかのいずれかとなる。gate は発行側の判定を使わず、この規則で独立に再評価する。

### 3.3 append-only 終端と terminal の直列化 (採択)

- retraction は **receipt として追記する**。`kind: retraction` を持ち、request / verdict receipt と
  同じ custody 経路に置く。
- **request ファイルを削除しない。** 削除は支援されない操作とする (§3.5 で機械的に無効化する)。
- retraction receipt 自体も削除・改変しない。
- 束縛する field: `class`、typed `reason_code`、`actor` (provider family と identity)、`at`、
  対象 `reviewRevision`、`pr`、`exactHead`、`replacement_review_revision` (class `superseded` のみ必須)、
  `provenance_snapshot` (class `unclosable` のみ必須、§3.2)。

**append-only だけでは double terminal を防げない。** verdict 発行と retraction、および競合する
retraction 同士は、いずれも request を終端させる操作であり、直列化しなければ並行実行で二重終端や
ack-loss が起きる。次を契約として固定する。

- **terminal identity は UNIQUE である。** 1 つの `reviewRevision` に対し終端 receipt は
  **高々 1 件**とする。verdict receipt と retraction receipt は同じ UNIQUE 制約を共有し、
  「verdict も retraction も存在する」状態を作れない。
- **終端は CAS で成立させる。** 「未終端」を期待値とする compare-and-set が成功したときのみ
  receipt を確定する。CAS 失敗は typed deny とし、先着の終端を上書きしない。
- **lease を要求する。** 終端手続きの開始時に lease を取得し、完了または失効まで他の終端操作を
  排除する。lease は同一 host 上の process crash / 強制終了まで保証境界とし、失効した lease は
  再取得可能とする (無期限ロックを作らない)。
- **ack-loss は三状態で扱う。** receipt 書き込みの完了確認が取れない場合、`committed` /
  `uncommitted` / `indeterminate` に分ける。`indeterminate` は成功扱いにせず fail-close し、
  次回起動時に現物 receipt との照合で解決する。
- **二重 retraction**: 同一内容は idempotent。内容が異なる二重 retraction は CAS で弾かれ
  typed deny となる。

### 3.4 merge gate の扱い (採択)

- `retracted` な entry は deny 集合から除外する。
- **`retracted` 単独では決して `merge_ready` にならない。** merge を許すのは非 retract の PASS /
  PASS-WEAK receipt のみ。全 entry が retracted なら `no_effective_verdict` として deny する。
- merge gate は retraction の妥当性 (§3.1 の 4 条件) を**独立に再評価する**。retraction 発行時の
  判定を再利用しない。発行側が壊れていても gate で止まる。

### 3.5 手動削除 — immutable mint ledger で再導出し fail-close する (採択、初版の判断を撤回)

**初版の「検知するが fail-close しない」は誤りだった。** 検知が報告に留まるなら、pending request を
削除して gate 集合から除外する経路がそのまま残る。すなわち §3.1 で塞いだはずの self-service 脱出口が、
retraction を経由せずに**より簡単な手段 (rm)** で成立してしまう。手動削除こそが本 Issue の起点で
あることを踏まえれば、そこを開けたままにする契約は目的を果たさない。

撤回の根拠は「fail-close にしても回復にならない」という初版の理由が成立しないことである。**消失を
再導出できれば fail-close は回復可能になる。** そのために次を契約として固定する。

- **immutable mint ledger を持つ。** canonical request の mint を append-only の ledger へ記録する。
  ledger entry は `reviewRevision`、`pr`、`exactHead`、`memoryId`、`authorFamily`、mint 時刻、
  mint した actor を持つ。**ledger は request ファイルとは別の実体**であり、request ファイルの
  削除では消えない。
- **gate 集合は ledger から導出する。** merge gate は「現存する request ファイル」ではなく
  **ledger 上の未終端 entry**を集合の正本とする。これにより request ファイルを消しても entry は
  集合から外れない。
- **request ファイルの消失を typed に扱う。** ledger に未終端 entry があるのに対応する request
  ファイルが無い状態を `orphaned_mint` とし、**fail-close する**。復旧は (a) request ファイルの
  復元、または (b) §3.1〜§3.2 の規則に従う正規の retraction のいずれか。
- **ledger 自体の削除・改変を支援しない。** ledger が消えた場合は `ledger_unavailable` として
  fail-close する。ledger を消せば gate が緩むという構造を作らない。

**trade-off**: ledger の導入により、request 実体と ledger の二重管理が生じる。両者の不一致は
`orphaned_mint` として必ず fail-close 側へ倒し、「片方が無ければ無かったことにする」緩和を置かない。

### 3.6 PLAN-L7-517 への依存と実装開始条件

class `unclosable` の機械述語 (§3.2) と `superseded` の closability / provenance 要件 (§3.2.1) は、
PLAN-L7-517 が導入する authoring provenance を前提とする。依存を明示する。

| 本 PLAN の slice | 依存する PLAN-L7-517 slice | 開始条件 |
|---|---|---|
| retraction receipt schema と append-only 経路 | 無し | 即時着手可 |
| immutable mint ledger と `orphaned_mint` fail-close | 無し | 即時着手可 |
| terminal CAS / lease / UNIQUE identity | 無し | 即時着手可 |
| `superseded` の custody と graph 決定性 | provenance 照合 (517 slice 4) | 517 の受理時照合が着地後 |
| `unclosable` の述語 | provenance record + issuer 分離 + completion binding (517 slice 1-3) | 517 の信頼根 3 slice が着地後 |
| legacy manual deletion の取り込み | 同上 | 同上 |

**`unclosable` を先行実装しない。** provenance が無い状態で `unclosable` を実装すれば、述語が
自己申告へ退化する (§3.1 の 4 条件目が空になる)。PLAN-L7-517 の信頼根が着地するまで、本 PLAN の
実装は `superseded` と ledger / CAS の範囲に限定する。

### 3.6.1 legacy manual deletion の取り込み

本 Issue の起点である PR #430 は、**既に request ファイルが手動削除された状態**で merge されている。
ledger を後から導入しても、削除済みの過去 mint は ledger に存在しない。移行を契約する。

- **遡及して `orphaned_mint` にしない。** ledger 導入以前の mint は ledger に無いのが正常であり、
  これを fail-close 対象にすれば既に merge 済みの PR まで巻き込む。
- **ledger 導入時点を境界とする。** ledger は導入以降の mint のみを正本とし、境界時刻を
  ledger 自身に記録する。境界より前の request 消失は検知対象外とする。
- **境界以前の既知消失を記録として残す。** PR #430 の `rv1-55b815ea…` を含む既知の手動削除は、
  ledger の外に **historical record** として列挙する。これは fail-close の入力ではなく、
  「この機構が存在しなかった期間に何が起きたか」の証跡である。
- **境界以降は例外を作らない。** 導入後の mint に対する手動削除は無条件に `orphaned_mint` とする。

### 3.7 本 PLAN が扱わない境界

- **競合 mint の発生防止は扱わない。** 同一 `(pr, exactHead)` に対する canonical request の一意性は
  **Issue #421 の拡張**が所有する。`reviewRevision` は
  `reviewIdentityDigest` = f(schemaVersion, memoryId, pr, exactHead, authorFamily) から導かれるため、
  `memoryId` が違えば revision も必ず違い、#421 の現行 (同一 revision) ルールでは事例 R を捕まえられない。
  この不変条件の拡張は #421 側の責務であり、本 PLAN は既に生じた重複の**回復**のみを所有する。
- **author family 誤申告の発生防止は扱わない。** Issue #437 / PLAN-L7-517 が所有する。本 PLAN は
  その provenance を**利用する側**であり、記録機構そのものは持たない (§3.6)。
- **`review_evidence` の手書き運用は扱わない。** Issue #429 が所有する。
- **配送 entry の終端状態は扱わない。** Claude inbox の GC は Issue #444 が所有する。本 PLAN の
  対象は review request であって通知 entry ではない。

## 4. Fail-close contract

**retraction 権限 (§3.1)**

- verdict receipt を持つ request の retraction を typed deny する。
- author family 以外からの retraction 要求を typed deny する。
- typed reason code 以外の理由を受理しない。
- class `unclosable` で機械述語が成立しない要求を typed deny する。自己申告を根拠にしない。
- provenance が `unknown` / `conflict` の間は class `unclosable` を成立させない。

**replacement custody (§3.2.1)**

- replacement identity の欠落、同一 `(pr, exactHead)` でないもの、self 参照、閉路を typed deny する。
- chain は leaf へ解決し、leaf が retracted なら typed deny する。
- leaf が「正規に閉じられない」(`expectedProvider` が著者本人になる) 場合を typed deny する。
- leaf の provenance が `unknown` / `conflict` の場合を typed deny する。

**terminal 直列化 (§3.3)**

- 1 つの `reviewRevision` に終端 receipt を 2 件以上作らない (UNIQUE)。
- verdict と retraction が同時に存在する状態を作らない。
- 終端は CAS 成功時のみ確定し、CAS 失敗を typed deny する。先着を上書きしない。
- lease 未取得の終端手続きを受理しない。
- ack-loss の `indeterminate` を成功扱いにしない。

**merge gate (§3.4)**

- `retracted` 単独で `merge_ready` へ到達させない。全 entry が retracted なら `no_effective_verdict`。
- merge gate は retraction 妥当性と replacement graph を独立に再評価する。発行側の判定を再利用しない。
- `unclosable` retraction が束縛する provenance snapshot と merge 時点の snapshot が不一致なら
  typed deny する。

**mint ledger (§3.5)**

- gate 集合は ledger 上の未終端 entry から導出する。現存 request ファイルを集合の正本にしない。
- ledger に未終端 entry があり request ファイルが無い状態を `orphaned_mint` として fail-close する。
- ledger の消失を `ledger_unavailable` として fail-close する。
- ledger entry の削除・改変を支援された操作にしない。

**legacy 移行 (§3.6.1)**

- ledger 導入境界より前の mint 不在を `orphaned_mint` にしない。
- 境界以降の手動削除に例外を作らない。

## 5. Implementation slices

本 PR は契約と対になる candidate だけを freeze する。次の成果物は pair-freeze 後の原子的な実装 PR が
所有し、本 PR の `generates` へ先行登録しない。**着手順は §3.6 の依存表に従う。**

PLAN-L7-517 非依存 (即時着手可):

1. retraction receipt の schema と append-only 書き込み経路。
2. immutable mint ledger と、gate 集合の ledger 由来化。
3. `orphaned_mint` / `ledger_unavailable` の fail-close。
4. terminal UNIQUE identity、CAS、lease、ack-loss 三状態。

PLAN-L7-517 の provenance 着地後:

5. `superseded` の replacement custody と graph 決定性 (self / cycle / chain leaf / closability /
   provenance)。
6. `unclosable` の機械述語と provenance snapshot 束縛。
7. merge gate の除外規則と独立再評価 (snapshot 不一致の typed deny を含む)。
8. legacy manual deletion の historical record 化と境界時刻の記録。

## 6. Scope boundary

本 PLAN の `confirmed` は、契約と対になる test-design が非著者 pair-freeze review、docs CI、
canonical receipt を満たし、実装開始条件として固定されたことだけを表す。実装 candidate の Green、
Reverse R4、Issue #439 の完了は意味しない。

現行 release Forward の PR (#431 #435 #436 #438 #440 #441 #442) を巻き戻さない。既に merge 済みの
PR #430 / #441 の receipt を遡って retract しない。
