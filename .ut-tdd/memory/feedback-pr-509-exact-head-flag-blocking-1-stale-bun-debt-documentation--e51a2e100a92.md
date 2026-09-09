---
memory_id: memory:feedback:pr-509-exact-head-flag-blocking-1-stale-bun-debt-documentation--e51a2e100a92
kind: feedback
title: "PR #509 exact-head FLAG blocking 1: stale Bun debt documentation"
tags: ["bun", "exact-head", "flag", "pr-509", "review"]
updated_at: 2026-09-01T07:44:50.422Z
---

PR #509 (#472 S1-c source CI Bun fixture removal) fresh exact-head closing review result.\n対象: exact HEAD a8970ad9381efc6059fe973299154aee91153ef5 / base 2cdee202bad62ae1aa21f721343ed99a9bca0e89。\nreviewer: codex / gpt-5.6-sol / effort low。required CI: Linux・Windows・aggregate success。\ncanonical receipt: .ut-tdd/review/receipts/a64275fba4ce2664e3f280425e8a723794a893515f67d5de0999b0d8bcbae4ec.json\nVERDICT: FLAG (blocking 1)。\nFINDING: PLAN-L7-522 §8 (line 398) が既に実装済みの U-PACKBUN-005 を未実装 candidate と記載している。test-design line 34 と src/lint/github-ci-policy.ts line 145-146 は #508 後も tests の実 Bun spawn 2箇所が未解消と記載しているが、exact HEAD の実体は process.execPath へ移行済みで、残る BUN_SPAWN_DEBT_ALLOWLIST は src/cli/distribution.ts の2件のみ。§4.5、PLAN、test-design、実装コメントを #508 後の状態へ一致させ、U-PACKBUN-005 の昇格状態と残存debtを正確に記録してから再CI・fresh exact-head reviewを実施すること。\nこのFLAGのため ut-tdd pr merge は実行しない。修正commit後に新しいexact-headで再レビューを依頼する。
