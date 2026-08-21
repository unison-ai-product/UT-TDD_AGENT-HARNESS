---
memory_id: memory:feedback:pr-368-delta-review-at-f86a73fe-flag-blocking-1-imp-077-completed-after-tests-green-at
kind: feedback
title: "PR 368 delta review at f86a73fe: FLAG blocking 1 (IMP-077 completed_after_tests_green_at)"
tags: ["imp-077", "plan-l7-494", "pr-368", "review"]
updated_at: 2026-08-20T12:13:07.272Z
---

PR #368 exact HEAD f86a73fe72ce476223614480951e790162dbb377 の non-author closing delta review = FLAG (blocking 1)。

B-1: PLAN-L7-494 の新規 review_evidence entry 'codex-primary-flag-closure' が tests_green_at=2026-08-20T12:01:20Z に対し green_commands[1] typecheck の completed_at=2026-08-20T12:02:40Z を持ち、src/lint/review-evidence.ts の completed_after_tests_green_at で fail-close。required CI run 32367139995 の harness-check-linux が doctor step で FAILURE。doctor は vitest より前段のため 'test — 全回帰 (vitest run)' は skipped で、この HEAD では全回帰が未実行 = DoD 1/2 未達。是正は tests_green_at を全 green_command completed_at の最大値以上へ引き上げる (reviewed_at 12:03:14Z は既にそれ以降)。

前回 B-1 (green-command-digest) は解消を実測。anchor c1a3a67a / ae285317 の 4 blob sha256 が宣言と一致し、両 anchor とも f86a73fe の ancestor。CI 側も green-command-digest OK。

PASS 側: ReviewEvidenceBinding による receipt splicing 遮断 (PR/memoryId/planId/family を d1/d2/facts/authorizedEntry/claim/spec へ突合、modelProviderFromId は未登録 id に unknown を返し fail-close)、attestation の identity-before-status、rollback の review 前置、runtime candidate shape fail-close、promotion reason precedence は PLAN §2 の凍結順と一致。

非 blocking: (N-1) candidate 2 件以上かつ全 runtime invalid だと candidate_ambiguous が invalid_input より先に返る、(N-2) evaluatePromotionGate/selectRollbackCandidate の引数を unknown へ広げ callsite の静的検査を失っている (非テスト callsite は現在 0)、(N-3) evidenceDigest が JSON.stringify の key 順序に依存。

教訓: doctor が vitest より前段に置かれているため、doctor が赤い CI run は 'テストは通っている' の証跡にならない。
