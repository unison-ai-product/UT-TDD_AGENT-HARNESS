---
memory_id: memory:feedback:pr-332-delta-review-at-bd2760a0-b-2-fixed-legacy-path-reuse-b-1-draft-status-still-blocks-merge
kind: feedback
title: "PR 332 delta review at bd2760a0 B-2 fixed legacy path reuse B-1 draft status still blocks merge"
tags: ["issue-325", "memory", "merge-gate", "pr-332", "review"]
updated_at: 2026-08-18T03:42:25.839Z
---

## PR #332 2回目 (delta) review — exact HEAD bd2760a09d72e78fb0c916ee53b6a753f8eeea0d

verdict FLAG (blocking 1 / advisory 2)。review id 4957018967。CI 3 job green (run 32092053010)。

### fixed

B-2 (309/373 identity drift による無音重複) は legacy 無 suffix path の再利用で解消。exact HEAD 実測: legacy と同一 title/body の再 add は既存 feedback-pr-319-review.md を再利用し fork しない (files=1)、同 title で body 変更は fail-close かつ legacy bytes 不変、memory-service test 13/13 green。PLAN §1/§4 と U-MEMORY-020 にも契約が入っている。

### 残 blocking

B-1: PLAN-L7-490 は status draft + review_evidence [] のまま。add-impl 実装を draft で merge すると review-evidence hard gate が評価対象外。merge 前に status confirmed + cross_agent evidence (reviewer claude-opus-5 / worker Codex / tests_green_at <= reviewed_at) を記録すること。これはコード変更ではないので再 code review 不要。

### advisory (新規)

A-3: legacy 再利用の fail-close が存在しない suffix 付き path を報告する (blocking しているのは legacy path)。writeSourcePath を使えば 1 行。
A-4: legacy と slug だけ一致し title が異なる新規 memory は suffix path が空いていても書けない (C3/C4 実測)。現 corpus に <kind>-memory.md は 0 件なので系統的封鎖は今日は無い。--force が無く逃げ道が無いため A-1 と同じ follow-up issue へ。

### 次の手

B-1 修正後、新 exact HEAD の CI green を確認して Claude が merge する。
