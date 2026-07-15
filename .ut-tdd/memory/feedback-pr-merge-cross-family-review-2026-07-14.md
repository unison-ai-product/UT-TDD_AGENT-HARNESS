---
memory_id: memory:feedback:pr-merge-cross-family-review-2026-07-14
kind: feedback
title: "PR merge 承認ゲートと cross-family review の実効性 (2026-07-14)"
tags: ["classifier", "hybrid", "merge", "pr", "review", "sol", "stacked-pr"]
updated_at: 2026-07-14T05:54:16.606Z
---

2026-07-14 PR #54/#55/#56 解消作業の教訓 (Claude Fable orchestrator + Sol TL + Sonnet risk-read):

1. main への PR merge (gh pr merge) は AI レビューのみでは Claude Code auto-mode classifier が拒否する。PO が対象 PR を明示指名した承認 (例:「#55 と #54 をマージしてよい」) が必要。一般指示「プルリクの解消」では [named+specifics] bar を満たさない。
2. Codex は PR を draft で開く運用。merge 前に gh pr ready が必要で、これも merge と同一の承認ゲート内。
3. cross-family review は実効: Sonnet が OK とした #56 の secret 硬化に対し、Sol (gpt-5.6-sol) が structured-ID 免除迂回 (derived finding subjectId 再検査で正当 projection を rollback する false positive) を検出。同時に全回帰実走で token-tracker 回帰 (SAVEPOINT 再入による transaction 文列変化) を実測。「レビュー通過」と「全回帰 green」は別 oracle であり両方必要。
4. stacked PR (base≠main) は harness-check が発火しない (pull_request: branches:[main])。stacked のまま「MERGEABLE」表示を信用しない。merge 順は base 側 first、子 PR は retarget + 固定 SHA で CI green を取り直す。
