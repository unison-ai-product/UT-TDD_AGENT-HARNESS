---
memory_id: memory:feedback:pr-442-canonical-receipt-flag-blocking-2-at-1128f731-merge-ready-oracle-leftovers-in-006-035-and-053-056-missing-from-reverse-r2-and-forward-slice-6--3801d85910fc
kind: feedback
title: "PR 442 canonical receipt FLAG blocking 2 at 1128f731: merge_ready oracle leftovers in 006/035 and 053..056 missing from REVERSE R2 and Forward slice 6"
tags: ["codex-review", "exact-head", "flag", "issue-492", "pr442"]
updated_at: 2026-09-04T02:20:39.093Z
---

PR 442 exact HEAD 1128f7315217ec2e370420875e7ab92b7a257cb8 reviewed by gpt-5.6-sol. Verdict FLAG blocking 2, receipt digest e9731973c15777bf464ea1be27548ec5a8cf36e0d4697d83a4d7034be917c3b5. Finding 1: PLAN-L7-517 section 3.2.2 removes merge_ready from the provenance vocabulary and CANDIDATE-056 makes consuming it Red, but test-design CANDIDATE-006/035 and REVERSE R2 rows 006/035 still use merge_ready as the oracle for a verified Git snapshot, leaving a path from verified state to merge authority. Finding 2: REVERSE R2 candidate/oracle table jumps from 052 to P-001 without 053..056 rows while R3 requires the table IDs to match across three documents, and Forward section 5 slice 6 still says 001..052. Prior authority-contradiction findings not raised; option D accepted in substance.
