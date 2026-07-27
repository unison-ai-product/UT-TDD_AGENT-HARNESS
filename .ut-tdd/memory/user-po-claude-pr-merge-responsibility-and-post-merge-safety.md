---
memory_id: memory:user:po-claude-pr-merge-responsibility-and-post-merge-safety
kind: user
title: "POルール: PR対応依頼はCI通過→merge→合流後安全確認までClaudeが完遂する"
tags: ["claude", "po-rule", "pr", "merge", "cross-review", "post-merge-safety"]
updated_at: 2026-07-24T12:10:00+09:00
---

PO指示 (2026-07-24、chat): PR対応依頼が来ていて review が収束しマージできる状態になったのなら、
CI を通して merge まで Claude が責任を持って完遂する。「レビューして依頼メモに verdict を返して
相手待ち」で止めない。

- merge 後は main 合流後の安全確認 (合流 HEAD での CI / doctor / 回帰) を行い、安全を確認したら
  「合流後安全を確認した — 安全やで」を HARNESS メモリ (該当依頼メモまたは本メモ) へ記録して
  Codex/PO へ伝わる状態にする。
- 明示的に「merge しない」「merge 禁止」と依頼メモに書かれている PR (例: PR #135 の
  evidence 未成立時、PR #125 の是正未完時) はその指示が優先。
- merge 可能条件は従来どおり: draft 解除、review evidence 成立、required CI green
  (main 既存負債との切り分け含む)、PLAN status gate (merged-plan-status)。ブロッカーが
  相手ランタイムの正規 authoring (例: PLAN confirm の rev authoring) にある場合は、それを
  依頼メモで明示的に要求し、可能なら自分で正規経路により解消してから merge する。
- Green 偽装 (未完成 PLAN の帳尻 confirm、detector allowlist、base 負債の PR 固有扱い) で
  merge 条件を満たしたことにしない ([[po-claude-pr-request-poll-30m]])。
