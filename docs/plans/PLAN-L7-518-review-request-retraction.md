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
`unknown` の間は `unclosable` を主張できない (§3.4)。これは意図した依存であり、#437 の発生防止と
#439 の回復経路が同じ信頼根を共有することを意味する。

### 3.3 append-only 終端 (採択)

- retraction は **receipt として追記する**。`kind: retraction` を持ち、request / verdict receipt と
  同じ custody 経路に置く。
- **request ファイルを削除しない。** 削除は支援されない操作とする。
- retraction receipt 自体も削除・改変しない。二重 retraction は idempotent とし、内容が異なる
  二重 retraction は typed deny する。
- 束縛する field: `class`、typed `reason_code`、`actor` (provider family と identity)、`at`、
  対象 `reviewRevision`、`pr`、`exactHead`、`replacement_review_revision` (class `superseded` のみ必須)。

### 3.4 merge gate の扱い (採択)

- `retracted` な entry は deny 集合から除外する。
- **`retracted` 単独では決して `merge_ready` にならない。** merge を許すのは非 retract の PASS /
  PASS-WEAK receipt のみ。全 entry が retracted なら `no_effective_verdict` として deny する。
- merge gate は retraction の妥当性 (§3.1 の 4 条件) を**独立に再評価する**。retraction 発行時の
  判定を再利用しない。発行側が壊れていても gate で止まる。

### 3.5 手動削除の検知 (採択)

手動削除を「支援されない」と書くだけでは再発を防げない。**request が retraction receipt なしに
消えた状態を検知して報告する。** 検知は fail-close ではなく報告とする — 削除済みの状態を後から
fail-close にしても merge を止めるだけで回復にならないため。実測の記録が目的である。

### 3.6 本 PLAN が扱わない境界

- **競合 mint の発生防止は扱わない。** 同一 `(pr, exactHead)` に対する canonical request の一意性は
  **Issue #421 の拡張**が所有する。`reviewRevision` は
  `reviewIdentityDigest` = f(schemaVersion, memoryId, pr, exactHead, authorFamily) から導かれるため、
  `memoryId` が違えば revision も必ず違い、#421 の現行 (同一 revision) ルールでは事例 R を捕まえられない。
  この不変条件の拡張は #421 側の責務であり、本 PLAN は既に生じた重複の**回復**のみを所有する。
- **author family 誤申告の発生防止は扱わない。** Issue #437 / PLAN-L7-517 が所有する。
- **`review_evidence` の手書き運用は扱わない。** Issue #429 が所有する。

## 4. Fail-close contract

- verdict receipt を持つ request の retraction を typed deny する。
- author family 以外からの retraction 要求を typed deny する。
- class `unclosable` で機械述語が成立しない要求を typed deny する。自己申告を根拠にしない。
- class `superseded` で replacement identity が欠落、または同一 `(pr, exactHead)` でない、または
  replacement 自体が retracted な要求を typed deny する。
- typed reason code 以外の理由を受理しない。
- retracted 単独で `merge_ready` へ到達させない。
- merge gate は retraction 妥当性を独立に再評価する。
- provenance が `unknown` の間は class `unclosable` を成立させない。

## 5. Implementation slices

本 PR は契約と対になる candidate だけを freeze する。次の成果物は pair-freeze 後の原子的な実装 PR が
所有し、本 PR の `generates` へ先行登録しない。

1. retraction receipt の schema と append-only 書き込み経路。
2. retraction 要求の受理判定 (§3.1 の 4 条件 + §3.2 の class 別述語)。
3. merge gate の除外規則と独立再評価。
4. 手動削除の検知と報告。
5. `unclosable` 述語と authoring provenance の結線 (PLAN-L7-517 依存)。

## 6. Scope boundary

本 PLAN の `confirmed` は、契約と対になる test-design が非著者 pair-freeze review、docs CI、
canonical receipt を満たし、実装開始条件として固定されたことだけを表す。実装 candidate の Green、
Reverse R4、Issue #439 の完了は意味しない。

現行 release Forward の PR (#431 #435 #436 #438 #440 #441 #442) を巻き戻さない。既に merge 済みの
PR #430 / #441 の receipt を遡って retract しない。
