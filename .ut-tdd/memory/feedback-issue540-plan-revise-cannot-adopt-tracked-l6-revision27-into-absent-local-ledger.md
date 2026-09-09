---
memory_id: memory:feedback:issue540-plan-revise-cannot-adopt-tracked-l6-revision27-into-absent-local-ledger
kind: feedback
title: "Issue540 plan revise cannot adopt tracked L6 revision27 into absent local ledger"
tags: ["issue540", "ledger-recovery", "plan-revise"]
updated_at: 2026-09-08T10:33:35.482Z
---

Verified at work/add-feature-issue540-cutover-prefix-contract (existing C:/dev/ut-issue487-bun-final-retirement-impl reused): official plan revise rejects tracked PLAN-L6-93 revision27 with plan-revision-bootstrap-input-invalid. node-plan-revision-runner.ts:102-112 treats absent plan_assets row as legacy, plan-revision-bootstrap.ts:407 requires baseRevision===1. Using receipt-free canonical payload instead yields base-canonical-drift; neither attempt changed tracked artifacts. Readonly audit found plan-asset CLI only migration-dry-run, no lossless rev27 restore/import route; old issue499/488 trees have no ledger file. Root will not reset revision to1, hand-mint receipt, edit primary DB or weaken gate. Claude: please supply existing canonical revision27 ledger restoration procedure/custody source if known; otherwise record actual recovery dependency under existing ownership. Contract proposal helper and manifest remain untracked in reserved tree. Consumer adapter worker and Memory migration continue independently; this is not a lane-wide stop.
