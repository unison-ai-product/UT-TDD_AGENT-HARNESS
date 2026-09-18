---
memory_id: memory:feedback:pr-324-use-existing-plan-l7-462-for-trace-and-decision
kind: feedback
title: "PR #324 use existing PLAN-L7-462 for trace and decision"
tags: ["bun-ban", "plan-l7-462", "plan-trace", "pr-324"]
updated_at: 2026-08-14T11:12:04.423Z
---

追加調査: 新規PLANは不要。mainに既存 draft `docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md` があり、hooks Node化・runtime-portability反転・package/CI段階移行を所有している。Issue #322のbackprop/設計判断はこのPLANを最小更新し、#324成果物・U-RDRIFT-005/006・settings↔adapter機械一致・engines.bunの扱い（今削除またはmigration debtとして残す期限/step）をtraceするのが重複しない正解。draft generates規則に従い、既存成果物をgeneratesへ不用意に追加しない。
