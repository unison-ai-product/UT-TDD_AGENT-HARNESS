---
memory_id: memory:feedback:pr-489-canonical-receipt-6338225f-flag-blocking-3-legacy-trust-root-blocked-by-plan-l7-465-same-clause-as-pr-442--6e5564fda2e2
kind: feedback
title: "PR #489 canonical receipt 6338225f FLAG blocking 3 legacy trust root blocked by PLAN-L7-465 same clause as PR 442"
tags: ["canonical-receipt", "claude-review", "pr"]
updated_at: 2026-08-31T08:24:12.522Z
---

# PR #489 canonical review receipt (exact head `89e3c7e7`) — **FLAG / blocking 3**

- receipt digest: `6338225f25d7c2930d8c5bc872c384e74c613ea1e62b851d9c0f33c1e8944df1`
- reviewer_family: claude / `claude-opus-5` (review-lane, effort middle)
- at: 2026-08-31T08:22:42Z
- required CI: Linux / Windows / aggregate 3/3 SUCCESS
- 先行 request/receipt `454353d3` / `37bdc60a` は再利用していません

## 先行 blocking の解消状況

- 直前 blocking 1 / 2 (`LegacyF0aBackfillBundleV1` の未定義識別子と L7 内自己矛盾) は
  **解消済み**です。`git grep -c LegacyF0aBackfillBundleV1 89e3c7e7 -- docs/` = **0 hits**。
- 直前 blocking 3 (F0a 側入力の供給正本不在) は**部分的にしか閉じていません**。下記 2 / 3 参照。

## blocking findings

### 1. `legacy.d0-admission` 側に、値も artifact も再構成手順も無い固定入力が残っている

固定入力に列挙された「**canonical two-lane ReviewBundle outer digest**」は、値・保管 artifact・
再構成手順のいずれも exact HEAD 全体に存在しません。出現は
`L5 internal-processing.md:486` と `PLAN-L6-93:170` の **2 箇所のみ**で、PLAN-L6-93 が明示する
決定的再構成 command は `plan-admission-receipts.json` の 4 行と各 `binding.path` の
blob/content digest **だけ**を対象としています。`docs/governance/` 配下に ReviewBundle artifact は
存在しません (確認済み)。

しかもこれは、legacy backfill の前提 (「#154/#192 以前に runtime receipt producer が存在しなかった」)
および本 PR 自身の「独立した wrapper artifact はこの履歴に存在しない」という記述とも矛盾します。
固定 tuple の一要素が導出不能なので `LegacyD0AdmissionBackfillReceiptV1` は決定的に mint できず、
**直前 blocking 3 と同じ欠陥が D0 行側で未閉鎖のまま**です。

### 2. custody digest の再構成関数が一意に固定されていない

`legacy.f0a-custody` の toolchain/lock custody evidence digest
`sha256:2213afcc98863c1883255c24576800fcced77cfbd27e7eec9f89424614dc445c` について。

review record 側は評価できます: 「RFC 8785 preimage は次の UTF-8 JSON literal (末尾改行なし)
exact 1」と byte 列を凍結しており、**実際に再現できました**
(計算値 `a7e5417ffb2e6f9eb1b2df679e1676db6633b9fae902cb478472d0dfb591d474` が一致)。

一方 custody 側は PLAN-L6-93 の「path 昇順の `{path,blob_oid,content_digest}` canonical JSON を
source HEAD から再計算し、その SHA-256」しか規定が無く、次がすべて未定義です:

- (a) RFC 8785 を適用するか否か (適用すれば key 順は `blob_oid < content_digest < path` となり、
  本文の tuple 記載順と食い違う)
- (b) `content_digest` / `blob_oid` の encoding、特に `sha256:` prefix の有無
  (同一 repo 内に `plan-admission-receipts.json` の prefix 付き慣行と PLAN-L6-93 本文の
  prefix 無し慣行が併存している)
- (c) 最上位が bare array か wrapper object か
- (d) 末尾改行の有無

この digest は review record preimage の `artifact_set_digest` にも埋め込まれ、
「artifact 内値・再計算値・L5 固定値が exact 一致」を要求する **load-bearing な値**です。
8 path の blob 実在と tree `1b63e413` の一致は確認できましたが、閉包 digest の正本は
依然として著者の申告値のみであり、第三者は再現できません
(実装者がその場で独自 canonicalization を発明する経路になります)。

### 3. retrospective review record が attestation 無しの自己申告であり、PLAN-L7-465 の禁止に該当する

`LegacyF0aCustodyBackfillReceiptV1` の mint 前提である retrospective review record は、
attestation wrapper (`schemaVersion` / `algorithm` / `authorityId` / `keyVersion` / `signature`) を
持たない **local JSON の自己申告**です。`reviewer_family:"codex"` / `reviewer_model:"gpt-5.6-sol"` /
`review_kind:"retrospective_non_author"` / `verdict:"PASS"` / `blocking_count:0` / `ci.run_id` は
Git object から一切検証できません。

`PLAN-L7-465` §信頼根を誇張しない 2 は逐語で次を禁じています:

> `reviewerFamily` の自己申告、PR comment marker、HARNESS memory本文、commit trailer、
> **local JSON/HMAC**、同一 OS user が利用できる鍵は provider family の信頼根にしない。

`PLAN-L7-458:300` が本 row を「fresh retrospective Sol non-author review record」として
**family / non-author 性に依拠**させている以上、この禁止に該当します。
SHA-256 の凍結は immutability を与えますが attestation を与えません。

加えて F0a (PR #192 / `76d0f9c7`) の**著者 family は repo 内に記録が無く**
(docs 全体で #192 への言及は本 PR が追加した 5 行のみ)、「non-author」も family 分離も
検証不能です。L7-465 が用意する `unverified_family` 相当の降格状態も legacy route には
定義されておらず、self-report が無条件に mint 条件へ昇格しています。

## 依存関係についての注記 (受け手の判断材料)

blocking 3 が引くのは `PLAN-L7-465` の同じ条項であり、これは **PR #442 が Sol から
FLAG/3 を受けた際の 1 番目の blocking と同一の禁止条項**です
(#442: 「same-OS-user repo-outside HMAC を author-family trust root に使っている」)。

つまり「local な自己申告をどう family authority へ昇格させるか」という問題は #489 単独では
閉じられない可能性があります。#442 (Issue #437、author family 検証契約の pair-freeze) が
先に着地して昇格経路を定義するか、あるいは legacy F0a route を family 主張に依存しない形
(non-author 性を要求しない、または `unverified_family` 相当の降格状態を legacy route にも定義する)
へ設計し直すか、いずれかの方針判断が要ります。

## merge gate

FLAG のため `ut-tdd pr merge --pr 489` は deny します。修正後は新しい exact HEAD に対して
`review live-dispatch` を再発行してください (本 receipt は再利用不可)。
