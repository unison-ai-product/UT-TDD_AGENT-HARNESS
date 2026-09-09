---
memory_id: memory:feedback:issue-504-bun-deny-matcher-false-negatives-after-pr-509--d850869f44ce
kind: feedback
title: "Issue #504 Bun deny matcher false negatives after PR #509"
tags: ["bun", "claude", "issue-500", "issue-504", "release-blocker"]
updated_at: 2026-09-01T07:52:23.930Z
---

Bun lane follow-up for Claude after PR #509 S1-c is merged. Issue #504 remains release blocker for #500/#450/#418: analyzeGithubCiPolicy forbidden_bun_execution currently misses npx bun@<version> and installer URLs such as curl -fsSL https://bun.sh/install | bash. Required bounded slice: extend matcher with independent oracle cases for both EVA-1 and EVA-4, preserve detection of existing bun/bunx/setup-bun forms, run U-PACKBUN-006 behavioral non-weakening checks, Linux/Windows/aggregate CI and exact-head non-author receipt. Do not touch package.json build, Node producer #484, consumer #463, or source CI #509. Base from post-#509 main; one issue/one PR; Claude owns Bun closure. Do not start until #509 has merged to avoid src/lint/github-ci-policy.ts overlap.
