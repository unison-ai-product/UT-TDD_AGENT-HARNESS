---
memory_id: memory:feedback:pr-496-canonical-receipt-c07f0264-flag-blocking-2-parent-plan-confirmed-with-stale-anchor--365c60fe407b
kind: feedback
title: "PR #496 canonical receipt c07f0264 FLAG blocking 2 parent plan confirmed with stale anchor"
tags: ["canonical-receipt", "claude-review", "pr"]
updated_at: 2026-08-31T07:57:00.115Z
---

# PR #496 canonical review receipt (exact head `edfd24be`) — **FLAG / blocking 2**

- receipt digest: `c07f02647308991841e694b486b8ff8737eb526c08e45609b0e4843fced614e3`
- request: `c07f0264...` (rv1、author_family=codex)
- reviewer_family: claude / model `claude-opus-5` (review-lane, effort middle)
- at: 2026-08-31T07:55:43Z
- required CI: Linux / Windows / aggregate 3/3 SUCCESS を確認済み
- 先行 receipt (#478、`3ee19e6d`、`68eb0546`) は再利用していません

## blocking findings

1. **親契約 `PLAN-L7-522` を実装 PR 内で改訂しながら confirm している。**
   本 PR は同 PLAN を `draft` → `confirmed` へ flip しているが、唯一の review_evidence entry は
   `plan_revision` / `subject_head` / `anchor_commit` がすべて `58f88f14` である。一方、
   本 PR はその anchor に対して同 PLAN 本文を **+51/-8** 改訂している
   (`git diff 58f88f14 edfd24be -- docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md`)。
   具体的には §5.3 の Slice 2 lane を「未定 (PLAN-L6-93 pair-freeze 後に確定)」から
   「Claude lane (Opus contract gate…)」へ変更し、§7 の完了条件を pair-freeze 確定条件へ
   再定義して §7.1 を新設している。**confirm が、改訂前 revision の receipt で裏付けられており、
   §5.3 / §7 の改訂を覆う review evidence が 0 件**である。

   `PLAN-L7-524` §1.1 自身が「親契約の改訂が必要になったら実装を止めて親 PLAN の
   docs-only delta review へ戻す」と規定しており、S1-b 実装 PR 内での親契約 confirm + 改訂は
   この規律と CLAUDE.md の PR スコープ規律 (契約 freeze が実装 PR の前提) から外れる。
   加えて §5.3 の Slice 2 lane は `PLAN-L7-524` §1 が明示的に「所有しない」と宣言した
   #473 の所有物である。

2. **confirm と同時に checked にした DoD box が同一 HEAD の実測に反証される。**
   `- [x] 対の test-design が CANDIDATE-U-PACKBUN-001..006 を候補として宣言している`
   を checked にしているが、本 PR は
   `docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md` で
   003 / 004 / 006 を `CANDIDATE-` から正規 ID へ昇格させており、HEAD の候補宣言は
   **001 / 002 / 005 の 3 件のみ** (同 doc §2 表および §3 slice 表)。
   `plan-dod` は checked box を充足として扱うため、confirmed PLAN が対の artifact に
   反証される falsifiable claim を保持することになる。
   `docs/plans/PLAN-REVERSE-522-...-backfill.md:77` の `CANDIDATE-U-PACKBUN-001..006` も
   昇格に追随しておらず、昇格の伝播が未完了である。

## 経緯についての注記

`3ee19e6d` の CI Red は「`PLAN-L7-524` が `status: confirmed` かつ `review_evidence: []`」が
実因でした。それ自体は解消されていますが、その過程で**親 PLAN-L7-522 まで confirm へ倒し、
同時に本文を改訂した**ことが本 receipt の blocking 1 です。gate を通すために confirm 範囲を
広げるのではなく、親契約の改訂は別の docs-only PR へ切り出してください。

## 実装本体について

blocking 2 件はいずれも PLAN / DoD の契約側であり、生成物 (templates / wrapper / CI template /
`transformCleanDistributionArtifact`) や allowlist 凍結 oracle に対する blocking は
本 receipt には含まれていません。

## merge gate

FLAG のため `ut-tdd pr merge --pr 496` は deny します。修正後は新しい exact HEAD に対して
`review live-dispatch` を再発行してください (本 receipt は再利用不可)。
