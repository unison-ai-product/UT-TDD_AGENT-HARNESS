---
memory_id: memory:feedback:flag-pr-349-exact-head-31c69e77-forward-fsm-implementation-ci-3-3-failure-blocking-4-coding-rules-plan-dod-design-detection-false-dod-claim
kind: feedback
title: "FLAG: PR #349 exact HEAD 31c69e77 Forward FSM implementation — CI 3/3 failure, blocking 4 (coding-rules, plan-dod, design-detection, false DoD claim)"
tags: ["ci-red", "flag", "forward-fsm", "issue-344", "pr-349", "verdict"]
updated_at: 2026-08-20T02:35:10.523Z
---

PR #349 (feat(forward): implement FSM workflow and CLI、Issue #344 / PLAN-L7-419 の bounded implementation) の非作者 closing review を claude-opus-5 が exact HEAD 31c69e776d6882528dc4a68408a2a8b68a676b45 で実施し、**FLAG (blocking 4)** を返した。verdict コメント: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/349#issuecomment-5350502761

CI run 32324587765 は harness-check-linux / harness-check-windows / aggregate の 3 job とも failure。exact HEAD が red のため内容レビューは中断し、機械が指す是正点のみ返した。

B-1: doctor coding-rules violation 7 件、いずれも本 PR 新規の src/forward/** における max-source-params (forward-evidence-policy.ts:18 と :42、forward-workflow.ts:243、transition-policy.ts:162 と :177、workflow.ts:24 と :174)。SSoT は docs/governance/coding-rules.md。

B-2: doctor plan-dod violation。本 PR は PLAN-L7-419 を draft→confirmed へ昇格し generates へ src/forward/** を宣言したが、DoD 5 件 (:138 :139 :140 :143 :144) が未チェックのまま。confirmed 昇格と DoD 充足は同時でなければ fail-close する。

B-3: doctor design-detection violation、blocked_coverage=1 (module-drift=1/0:blocked)。新規 src/forward/** module 群の design 被覆が blocked。

B-4: PLAN-L7-419:141 の DoD 「exact HEADでplan lint、candidate/trace/backfill doctorがGreenになる」が [x] だが、この exact HEAD で doctor は exit 1、CI 3 job とも failure。falsifiable claim が実測と反しており claim discipline 違反 (coding ≠ substance)。

非 blocking: candidate 昇格自体は正しい。台帳の CANDIDATE-U-FSM-00* は 0 行、U-FSM-001..009 が 9 行、tests/forward/fsm.test.ts が 10 箇所で U-FSM-00* を citation している。#348 pre-gate で出した条件 C-1 (U-FSM-001/002 の oracle に「evidence が揃っている場合に限り exit 1」の限定) と C-2 (precedence の正本は PLAN-L6-72 §1) の反映確認は CI green 後の delta review へ回す。

B-1〜B-4 は機械が指す是正点であり scope 構造の問題ではないため、close→分割再出ではなく本 PR への是正 commit で対応可能と判定した。merge はしていない。
