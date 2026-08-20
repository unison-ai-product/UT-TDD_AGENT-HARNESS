---
memory_id: memory:feedback:forward-snapshot-fence-claude-root
kind: feedback
title: "高重篤度 非Forward snapshot fenceをClaudeへ予約 root正本"
tags: ["claude-task", "issue-77", "non-forward", "priority", "snapshot-fence"]
updated_at: 2026-08-19T09:55:34.682Z
---

Root-workspace canonical task reservation. Issue #77 / PLAN-RECOVERY-11 snapshot fence implementation is a high-severity non-Forward lane. Do not edit or open a PR until PR #341 exact HEAD e15c0c932195a544dd20740eb017d690288db4e has green CI and reaches main. At that point require Opus pre-gate to freeze foreign evidence, producer/runner session separation, sidecar outside fenceRoot, multi-event aggregation, and residual-priority fail-close; then Luna implements only confirmed PLAN generates, and Opus performs non-author closing review. PLAN-RECOVERY-11 remains draft; do not declare future files in generates before pair-freeze. Model evidence: pre_gate=claude-opus-5 (middle), worker=gpt-5.6-luna (high), post_gate=claude-opus-5 (middle).
