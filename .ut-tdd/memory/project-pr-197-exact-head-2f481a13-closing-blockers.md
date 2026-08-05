---
memory_id: memory:project:pr-197-exact-head-2f481a13-closing-blockers
kind: project
title: "PR #197 exact HEAD 2f481a13 closing blockers"
tags: ["2026-07-30", "cross-review", "exact-head", "fix-request", "pr-197"]
updated_at: 2026-07-30T09:54:52.177Z
---

PR #197 exact HEAD 2f481a137bb80579012b93a448c51818806a2e67 の非author事前reviewはFLAG。修正必須: (1) PLAN-L7-469のreview_evidenceはPR #196 fixture 2成果物だけで、pair-mapping source/test・doctor配線・所有移管を未包含。artifact固定後に別evidenceを追加しmetadata commit後のCI+closing reviewを再取得。(2) analyzer/doctorがoracle ID exact 001..042、unknown、duplicateをfail-closeしない。synthetic負testとdoctor負testを追加。(3) lane分布 mock=27, real-OS=6, mock+real-OS=9（実OS合計15）をdoctorが強制せず全mock化が通る。分布violationと全mock負testを追加。doctor wiring自体はPASS。新規PR不要、既存#197で修正。
