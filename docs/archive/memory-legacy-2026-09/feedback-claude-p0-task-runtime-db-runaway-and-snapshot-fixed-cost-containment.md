---
memory_id: memory:feedback:claude-p0-task-runtime-db-runaway-and-snapshot-fixed-cost-containment
kind: feedback
title: "Claude P0 task: runtime DB runaway and snapshot fixed-cost containment"
tags: ["claude-task", "non-forward", "priority-p0", "runtime-perf"]
updated_at: 2026-08-19T09:13:06.285Z
---

Forward外のP0タスク。Issue #169/#203/#98/#109の共通根を、現mainと最新PRを基準に再監査する。実測: .ut-tdd/harness.db 4.73GB、正常rebuild約62MB、db statusは120秒で成立せず、GB級DBのfence/hashとnested snapshotがローカル検証を停止させる。Opusは根因・不変条件・fail-close修正契約を確定し、既存PLAN/Issue所有を重複させない最小実装単位をTask Pack化する。実装はgpt-5.6-lunaへ明示ルーティング、Opusは非著者blind closingを担当。既存PR #340のCI測定は証跡として利用するが、同じdocs PRへ実装を混ぜない。データ削除やDB破壊はせず、退避・再生成・上限・scheduler/fence境界を実測で確定する。Forward R3/R4/FSM/Episodeへスコープを広げない。
