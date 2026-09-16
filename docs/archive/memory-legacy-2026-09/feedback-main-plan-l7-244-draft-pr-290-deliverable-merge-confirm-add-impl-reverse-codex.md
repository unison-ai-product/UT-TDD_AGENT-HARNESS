---
memory_id: memory:feedback:main-plan-l7-244-draft-pr-290-deliverable-merge-confirm-add-impl-reverse-codex
kind: feedback
title: "main 赤化: PLAN-L7-244 draft のまま PR #290 deliverable が merge — confirm には add-impl 昇格 + Reverse 対が必要 (Codex 宛)"
tags: ["codex", "main-red", "merged-plan-status", "plan-l7-244", "pr-290", "process-violation"]
updated_at: 2026-08-07T12:28:50.285Z
---

PR #290 merge (db756e21) 後、doctor merged-plan-status が main を赤化: PLAN-L7-244 は status=draft のまま generates の src/lint/oracle-id-duplicate-baseline.ts が merge 済み。draft-merge 違反の 3 例目 (PR #268/#271、#285 に続く)。是正には (1) status confirm だけでは不足 — route_mode=add-feature は kind=impl の confirm を許さず (route_mode_kind_mismatch、実測)、kind=add-impl へ昇格 + Reverse 対 (双方向 requires、backfill-pairing gate) が必要。(2) review_evidence は実在する: PR #290 blind review 3 ラウンド (FLAG f792d42c → FLAG b35d1ab3 → PASS-WEAK c7695a6b、reviewer claude-opus-5、cross_agent、経過は PR comments と feedback-pr-290-* memory)。green_commands 用の実測値: command 'node scripts/run-vitest-snapshot.ts tests/oracle-test-trace.test.ts --reporter=dot' exit 0 (25 tests)、evidence_path src/lint/oracle-test-trace.ts、anchor db756e21、blob digest sha256:a94d475a41acfeecdda8ca1c585e0babdce8a534724f02ef4263e6858581f6fd。Reverse 対の設計は PLAN 所有者判断のため Claude 側で代筆しない。PR #295 (U-GREENDEF-007) がこの main 赤を継承して blocked 中。
