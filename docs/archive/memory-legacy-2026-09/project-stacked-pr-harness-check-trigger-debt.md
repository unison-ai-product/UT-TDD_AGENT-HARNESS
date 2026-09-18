---
memory_id: memory:project:stacked-pr-harness-check-trigger-debt
kind: project
title: "stacked PR harness-check trigger debt"
tags: ["ci", "debt", "github", "vmodel"]
updated_at: 2026-07-14T05:04:31.784Z
---

2026-07-14にPR #56（base=設計PR #55）でharness-checkが起動しないことを実測。source workflowのpull_request branches:[main]が親子PRを除外する。concept §7.2/requirements §7.5の『全PRでharness-check』と不整合。Issue #57を入口に、PLAN-L7-197/221の後続訂正でsource/Packのtrigger contractとgithub-ci-policyの負例テストを追加し、stacked PRでも同一aggregate gateが走ることをGitHub receiptで固定する。branch protection等のproduction設定変更はPO承認後のみ。
