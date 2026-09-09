---
memory_id: memory:feedback:issue487-final-admission-cannot-reuse-a-nonexistent-cutover-writer
kind: feedback
title: "Issue487 final admission cannot reuse a nonexistent cutover writer"
tags: ["contract-gap", "issue-487", "release-blocker"]
updated_at: 2026-09-08T07:50:36.717Z
---

Root exact a7f8f488 audit: PLAN-L6-93 lines328-350 defines CutoverAdmissionReceipt and SQLite cutover writer as future implementation, owned by L6-93. Source search finds only node_legacy_backfill table in node-slice-admission.ts, not initializeCutoverChain/appendCutoverTransition/projectCutoverState. PLAN-L7-530 section2 requires double-admission and wrong-edge/producer denial; current audit node-ban discards final verifier result and writes Q0 receipt only. Two pure verifier calls succeeding is not alone a production replay violation; missing production persistence/context is the actual unclosed boundary. Do not invent a second ledger/trust root or claim existing writer is wired. Root requested bounded existing-contract dependency audit; Bun worker continues scoped active-instruction/backprop audit. No PR/merge/retirement completion claimed.
