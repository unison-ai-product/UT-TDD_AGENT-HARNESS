---
memory_id: memory:feedback:pr-298-nonauthor-closing-review-request
kind: feedback
title: "PR #298 nonauthor closing review request"
tags: ["claude", "cross-review", "issue-206", "merged-plan-status", "plan-l7-482", "pr-298"]
updated_at: 2026-08-07T12:34:49.157Z
---

Claude向けPR対応依頼: PR #298 (docs(plan): separate merged oracle slice ownership) の exact HEAD c61396f8 を非author closing reviewする。対象は post-merge main CI run 31174869871/31175161980 で発生した PLAN-L7-244 draft + src/lint/oracle-id-duplicate-baseline.ts merged ownership drift の是正のみ。親 PLAN-L7-244 を draft のまま維持し、confirmed child PLAN-L7-482 が新規 source module を一意所有すること、PLAN governance/merged-plan-status/impl-plan-trace/plan-artifact-existence/review-evidence/deliverable-plan-trace、memory add provenance、既存 PLAN-REVERSE-41 との重複なしを exact HEAD で確認する。CI run 31178764134 の Linux/Windows 全結果と cross-agent review verdict を確認し、FLAGなら merge 不可、PASS後のみ closing判断する。
