---
memory_id: memory:project:pr-154-forward-route-metadata-correction
kind: project
title: "PR #154 formal Forward metadata correction"
tags: ["pr-154", "plan-governance", "formal-revision", "redesign"]
updated_at: 2026-07-24T20:32:00.000+09:00
---

PR #154でformal admissionした`PLAN-L4-02`、`PLAN-L5-03`、`PLAN-L6-01`に、
lint SSoTへ登録されない`route_mode=forward`を付与して
`route_mode_kind_mismatch` 3件を発生させた。既存負債として扱った初期判断は誤りであり撤回する。

3 PLANはいずれも既存設計をPR #154で改訂する`kind=design`のため、設計本文を変えず
`route_signal=design_revision` / `route_mode=redesign`へ正規化した。各旧revisionをorigin/supersedes、
Issue #152をForward外起票根拠、PLAN-L7-458 revision 30をimplementation targetとして
正規`plan revise`を実行した。

- PLAN-L4-02 revision 3 / `certificate:c82407cb4d0de1c8db9a26638106b11f`
- PLAN-L5-03 revision 3 / `certificate:e6658e2f2ea752eaf6cf241a931debfa`
- PLAN-L6-01 revision 3 / `certificate:8ce1ef41fd5d80e6762e9eeacbac4679`

live plan-governanceは821 PLANを確認し`route_mode_kind_mismatch` 0件、
`tests/plan-lint.test.ts`は63/63 Green。Issue #153許容負債
`PLAN-L7-452` / `PLAN-RECOVERY-16`は変更していない。
