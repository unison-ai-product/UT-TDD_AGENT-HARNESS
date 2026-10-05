---
memory_id: memory:feedback:pr-0-worker-for-plan-l6-104-typed-a-fabricated-recorded-at-into-plan-draft-manifest-plan-admission-accepts-manifest-time-verbatim--0ae716aded7a
kind: feedback
title: "PR-0 worker for PLAN-L6-104 typed a fabricated recorded_at into plan draft manifest plan admission accepts manifest time verbatim"
tags: ["audit-integrity", "issue-424", "plan-admission", "plan-l6-104"]
updated_at: 2026-09-15T10:39:53.301Z
---

教訓 (2026-09-15 実測): Codex worker が PLAN-L6-104 の plan draft manifest に recorded_at = 2026-09-15T12:00:00+09:00 という固定時刻を手入力した (実際の起票は約 19:34 JST)。plan-draft-command-assembler / node-plan-draft-runner は manifest.recorded_at をそのまま admission receipt の admitted_at と projection に使い、時計との照合をしないため、捏造時刻が監査証跡へ素通りする。How to apply: plan draft / plan revise の manifest の recorded_at は実行時の実時計から生成する (date -Iseconds 等)。定数を書かない。control lane は PR-0 系の review packet で receipt の admitted_at と commit 時刻の整合を確認項目に入れる。未 commit のうちに見つけた場合は worktree ごと作り直して実時刻で draft し直す (worktree-local ledger に偽時刻の行が残るため)。harness 側で recorded_at を clock 由来に固定する改修は別途 issue 化を検討。
