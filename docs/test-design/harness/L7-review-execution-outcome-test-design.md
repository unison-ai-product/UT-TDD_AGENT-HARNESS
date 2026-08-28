---
title: "L7 reviewer execution outcome test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-520-review-execution-outcome
updated: 2026-08-27
---

# Reviewer execution outcome test design

対になる契約は `docs/plans/PLAN-L7-520-review-execution-outcome.md`。candidate は対象実装と
Red 実測を同一 commit へ束縛してから正式 oracle へ昇格する。

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RVATT-037 | identity-bound verdict file が存在し provider exitCode=7 | verdict 本文を変えず `executionOutcome.status=failed` / `exitCode=7` の receipt を発行し、PASS を合成しない |
| CANDIDATE-U-RVATT-038 | outcome 付き receipt を current-head / green PR へ投入、または live consume へ渡す | D1 reason に `reviewer_execution_failed` を含め、`merge_ready` へ到達しない。live consume は receipt を公開後も typed failure を返す |
| CANDIDATE-U-RVATT-039 | non-zero + verdict 欠落、wrong envelope、外部 path | typed missing/identity/path reason、receipt 0。provider failure を valid verdict として補完しない |
| CANDIDATE-U-RVATT-040 | failed outcome receipt の同一request再試行後に成功receiptを投影 | attemptを進め、failed receiptを監査ログへ退避して成功receiptへ置換する。failed receiptが同一HEADを恒久blockしない |
| CANDIDATE-U-RVATT-041 | non-zero execution outcome をhuman-facing receiptへ投影 | `executionOutcome`、exit code、typed reasonを本文に保持し、真因を一般化されたexecution failureへ潰さない |

実装・receipt・reviewer mutation boundary は既存 U-RVATT-030〜036 と同一の consumer-derived
path / exact Edit allow / fail-close 契約を再利用し、provider権限を広げない。
