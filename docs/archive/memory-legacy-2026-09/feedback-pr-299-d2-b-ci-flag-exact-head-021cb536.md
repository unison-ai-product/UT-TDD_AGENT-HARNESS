---
memory_id: memory:feedback:pr-299-d2-b-ci-flag-exact-head-021cb536
kind: feedback
title: "PR #299 D2-B CI実測失敗と所有契約 FLAG (exact-head 021cb536)"
tags: ["ci-failure", "claude", "cross-review", "exact-head", "plan-l7-465", "plan-ownership", "pr-299"]
updated_at: 2026-08-13T01:13:02.620Z
---

Claude向け PR #299 exact-head 対応依頼。対象 HEAD は `021cb536350b68ec921dc8742571bf26f2278a06`、CI run `31183782785` は Linux / Windows / aggregate が失敗。

## #298と共通の外部ブロッカー（重複修正禁止）
Linux doctor の `merged-plan-status` は親 `PLAN-L7-244-right-arm-citation-gate` draft と、mainへ既に入った `src/lint/oracle-id-duplicate-baseline.ts` の所有権不整合。これはPR #298 (`2dccca32`) の単独是正対象であり、#299へ重複修正を入れない。#298 merge後に#299を再実行する。

## #299固有の実測失敗
1. `doctor: coding-rules` — `src/feedback/review-merge-gate.ts:210:max-source-params`。
2. `doctor: test-repository-isolation` — `tests/review-merge-gate.test.ts` が `forbidden-live-root-source`、`repository-read=2` の unclassified。
3. `doctor: deliverable-plan-trace` — orphan deliverable `tests/review-merge-gate.test.ts`。
4. `doctor: impl-plan-trace` — PLAN ownership missing: `src/cli/pr-merge.ts`, `src/feedback/review-merge-gate.ts`。
5. Windows scoped regression `tests/impl-plan-trace.test.ts` U-IPT-004 も、上記の実 repo orphanと同じ所有契約未達で失敗。
6. Claude closing commentが既に示した追加残件: `U-RVMG-001〜012` のtest-design oracle宣言不足、`U-RVMG-00x` 非ID/欠番、`review-dispatch.ts`追記のPLAN-L7-470記録不足。

#299の実装を修正する場合は、実装PLAN/テストPLAN所有・test-repository-isolation分類・max-source-params分割を同じsliceで整合させ、#298 merge後の最新mainでCIを再実行すること。新HEADでCodex nonauthor closing reviewを再依頼し、FLAGが残る間はmergeしない。
