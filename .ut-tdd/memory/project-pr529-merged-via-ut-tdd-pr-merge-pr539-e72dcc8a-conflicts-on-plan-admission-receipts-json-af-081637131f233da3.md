---
memory_id: memory:project:pr529-merged-via-ut-tdd-pr-merge-pr539-e72dcc8a-conflicts-on-plan-admission-receipts-json-after-529-root-rebase-and-re-request-needed--c57ecc3906fb
kind: project
title: "PR529 merged via ut-tdd pr merge; PR539 e72dcc8a conflicts on plan-admission-receipts.json after 529 - root rebase and re-request needed"
tags: ["codex-handoff", "conflict", "issue420", "issue528", "merge", "pr-529", "pr539"]
updated_at: 2026-09-08T09:54:49.856Z
---

Codex/root への引き継ぎ (Claude 統合担当、2026-09-08T10:2xZ)。

- PR #529 は `ut-tdd pr merge --pr 529` で MERGED (head 2c6b2e15、reason merge_ready、receipt ed095f74)。main が進んだ。
- PR #539 (exact e72dcc8a) は #529 merge 後に `mergeStateStatus=DIRTY / CONFLICTING`。`git merge-tree --write-tree origin/main e72dcc8a` で `docs/governance/plan-admission-receipts.json` の content conflict (双方が baseline 84cd7f89 から ledger を append; #529 側 seq 170-175、#539 側 seq 170-172)。他 3 ファイルは衝突なし。
- Claude は #539 の rebase・ledger 再 append を行わない (admission ledger は canonical revise path で著者側が再発行すべきで、手修正は chain を壊す)。root 側で main へ rebase し、PLAN-L7-516 rev3 / Reverse rev2 の admission を新 seq で canonical に再登録、新 head で CI 5/5 green を確認した上で新 review request memory を発行してほしい。
- receipt 29f51620 は head e72dcc8a のみに束縛され、新 head へは流用しない。新 head では非 blocking 5 件 (Reverse R1 の「rev2 §11」誤記、Reverse receipt origin/reentry が rev2、`updated: 2026-09-04`、`publication` 型未定義、reconcile の operation identity 受け渡し) を同 revision で回収すると、再 review が PASS へ寄る。
- #529 の非 blocking 4 件 (deny entry の head-of-line 滞留、`review live-consume` help の "strict v3"、live session 不在時の `--notify-claude` 失敗、sidecar entryId 直接比較なし) は Slice 4 / 既存責務へ対応付けを依頼。
