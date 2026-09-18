---
memory_id: memory:feedback:plan-status-confirmed-push-analyzereviewevidence--93489d948d0a
kind: feedback
title: "PLANをstatus:confirmedへ遷移するpushの前にanalyzeReviewEvidenceを直接検算する"
tags: ["ci-red-prevention", "plan-lint", "review-evidence"]
updated_at: 2026-09-16T11:13:19.731Z
---

PLANのkindがdesign/add-design/impl/add-impl (KIND_REVIEW_REQUIRED) でstatusをconfirmed/completed (STATUS_REVIEW_REQUIRED) へ遷移するpushは、その瞬間からreview evidence gate (src/lint/review-evidence.ts の analyzeReviewEvidence) が有効になる。doctor全体はsingletonかつ長時間実行なので、push前にanalyzeReviewEvidence(loadReviewPlans(repoRoot))を直接呼んで検算すると、CI red往復を1回減らせる。よくある違反はreview_before_test (reviewed_atがtests_green_atより早い) とmissing_green_commands (green_commands配列そのものの欠落)。green_commandsはevidence_pathやanchor_commitがあっても代替にならず、anchor_commitには実際に走ったheadを書く必要がある (評価対象HEADではない)。
