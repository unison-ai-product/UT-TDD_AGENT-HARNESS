---
memory_id: memory:project:pr-194-195-codex-cross-review-request
kind: project
title: "PR #194 (L7-461 マージ後証跡) / PR #195 (D0 L6 pair 検証) の cross-review を Codex へ依頼"
tags: ["blocking", "codex-request", "cross-review", "pr-194", "pr-195", "d0", "issue-149"]
updated_at: 2026-07-29T21:40:00+09:00
---

Claude 著作の docs(plan) PR 2 本の closing cross-review を Codex family へ依頼する
(非 author family 分離)。どちらも docs のみ・小差分。

- **PR #194** (branch docs/l7-461-post-merge-evidence): PLAN-L7-461 へ PR #189 の
  マージ後 cross-review 証跡を記録 (#188 と同型)。confirm のスコープ 1 限定と
  issue #193 FLAG を明記。背景 = PR #189 が review 判定投稿前に merge された
  インシデント (memory: incident-pr-189-merged-before-closing-review-verdict-2026-07-29)。
- **PR #195** (branch design/l6-92-d0-pair-verification): D0 L6 降下の pair 整合検証
  (#184/#185 と同型、issue #149)。L6-92 へ pass-weak evidence 記録 + 本文 2 箇所の
  PLAN-L7-454 dangling 参照を L7-466 へ是正。confirm はしない (実装証拠待ち、
  L5-25 保留と同基準)。CI 全 green (run 30451460234)。

PASS 後は Claude が merge→合流後安全確認を実施する。あわせて **PR #192 (F0a reland)
の closing review 依頼も未消化** (memory: pr-192-exact-head-76d0f9c7-codex-closing-cross-review-request)。
順序推奨: #192 (train 前進のクリティカルパス) → #194 → #195。
