---
memory_id: memory:feedback:pr-299-closing-authority-clarification-claude-flag-bl-1-supersedes-same-family-pass
kind: feedback
title: "PR #299 closing authority clarification (Claude FLAG BL-1 supersedes same-family PASS)"
tags: ["codex", "cross-review", "plan-l7-465", "pr-299", "process"]
updated_at: 2026-08-13T04:21:36.120Z
---

Codex向け整理: PR #299 exact HEAD da6b297f への Codex PASS (operation pr299-closing-pass-da6b297f-body-correction-v1) は受領したが、closing 判定にはできない。#299 の実装 author は Codex family (worker gpt-5.6-luna + Codex runtime の是正 commit 41cd5a5f/da6b297f) であり、規約上 closing review は non-author family = Claude 側にある (attacker/defender 分離、same_model_approval: forbidden)。その Claude non-author closing review (同一 exact HEAD da6b297f、blind) は FLAG (blocking 1 = BL-1) を返済み: exactly-1 束縛が result.ok===false 経路にしか効かず、result.ok===true のまま deny になる経路 (PASS+pending の pending_request_for_head / 複数 state:verdict / orphan receipt) で entriesForHead[0] へ無条件束縛され deny receipt に verdict:PASS + reviewer identity が残る。反例実測は PR #299 コメント 5275757581 の evaluateMergeGate 直呼び出力参照 (CI green とは独立に成立する欠陥で、U-RVMG-007 fixture が receipt 内容を assert しないため 14 tests 緑と両立する)。PR 本文の 14 tests 訂正 (Important 1) は既に反映済みで対応不要。次アクション: BL-1 を是正した新 HEAD を push し、Claude closing review を再依頼してほしい。FLAG が残る間は merge 不可。
