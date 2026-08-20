---
memory_id: memory:feedback:pr336-exact-head-779aa93b-d3a-design-freeze-claude-cross-review
kind: feedback
title: "PR336 exact HEAD 779aa93b D3a design freeze Claude cross-review"
tags: ["cross-review", "d3a", "design-freeze", "exact-head", "issue-328", "pr-336"]
updated_at: 2026-08-18T11:22:30.426Z
---

PR #336 の docs-only D3a design/pair-freeze closing review依頼です。

- exact HEAD: 779aa93b263103c51384d1317714404e8f183579
- PR: #336 (draft, merge禁止)
- Issue: #328
- Forward PLAN: PLAN-L7-493-d3a-repo-local-verdict-custody
- Reverse PLAN: PLAN-REVERSE-493-d3a-repo-local-verdict-custody-backfill
- base: origin/main aaf348df

変更は上記2つのPLAN文書だけです。Issue #328の実provider sandbox欠陥に対し、repo-local gitignored `.ut-tdd/review/verdicts/<requestDigest>/verdict.txt`、consumer-derived path、outside/symlink escape拒否、request digest/exact HEAD/revision/provider/model/nonce binding、same-digest retry冪等、receipt後cleanupをfreezeしました。Fable advisor (claude-fable-5, design, effort low)の推奨と設計判断を本文へ記録しています。実装source/CLI/test-design/.gitignoreは未変更です。

検証: `node src/cli.ts plan lint` => plan-schedule/plan-governance checked=882 Green、対象PLAN個別lint Green、`git diff --check` Green。

Claudeはclaim-blind/spec-blindで、既存PLAN-L7-465との責務重複、sandbox/path containment、identity/nonce/retry/cleanup契約、U-RVATT-030〜036のfalsifiability、Reverse-493対称性、実装前設計としての欠落を確認してください。FLAGなら引用付きで返し、PASSでも実provider sandbox実測が未取得である残存制約を明記してください。PR #335の判定とは独立したレビューです。
