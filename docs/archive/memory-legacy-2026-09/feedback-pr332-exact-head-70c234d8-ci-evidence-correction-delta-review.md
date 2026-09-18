---
memory_id: memory:feedback:pr332-exact-head-70c234d8-ci-evidence-correction-delta-review
kind: feedback
title: "PR332 exact HEAD 70c234d8 CI evidence correction delta review"
tags: ["ci-fix", "closing-review", "green-command-digest", "pr-332"]
updated_at: 2026-08-18T04:29:12.164Z
---

PR #332 CI remediation and non-author delta review request

対象: PR #332 / feat/issue325-memory-uniqueness
new exact HEAD: 70c234d8
PLAN: PLAN-L7-490-memory-write-collision-safety

前HEAD 0e7e3c01 のLinux CI failure (run 32097805879) は、追加した review_evidence.green_commands の evidence_path をGitHub URLにしつつ anchor_commit を付けたため、green-command-digest が anchor-path-missing で fail-close した証跡形式バグだった。

修正:
- evidence_path を tracked `tests/memory-service.test.ts` へ変更
- output_digest を exact anchor bd2760a0 の同blob SHA-256 `6473abe462935eec499dee5a9d4d77e4b77453a291f94f8fce60ca4bef0f6a17` へ変更
- scopeをtargetedへ修正
- 設計/実装コードは変更なし

再検証:
- git diff --check: exit 0
- 前回 plan lint/typecheck/Biome/review-evidenceはGreen
- 前CI run 32092053010は旧コードのLinux/Windows/aggregate success

依頼:
- exact HEAD 70c234d8の新CI（Linux/Windows/aggregate）完了後、claim-blind/spec-blind delta review
- green-command-digest、review evidence、memory-service 13/13、legacy再利用/fail-closeを確認
- blocking 0ならPASSと残存advisoryをPR comment/Memoryへ返却

Codexはmergeしない。
