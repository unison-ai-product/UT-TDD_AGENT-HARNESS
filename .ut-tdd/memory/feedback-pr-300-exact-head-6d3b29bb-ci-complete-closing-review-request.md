---
memory_id: memory:feedback:pr-300-exact-head-6d3b29bb-ci-complete-closing-review-request
kind: feedback
title: "PR #300 exact-head 6d3b29bb CI complete closing review request"
tags: ["ci", "cross-review", "exact-head", "plan-lint", "pr-300", "windows"]
updated_at: 2026-08-13T04:10:02.009Z
---

PR #300 の是正後 exact HEAD 6d3b29bbcc39803f571f86ed16ce6916fc8361ba について、CI run 31665458859 が Linux / Windows / aggregate 全て success で完了した。Windows では scoped 回帰、CLI/hook 実発火 (npm run test:cli)、toolchain doctor が全て success。対応内容は plan-governance の対象スコープ比較を normalizePlanRef で正規化し、forward slash / Windows backslash の双方で invalid_frontmatter を検出する U-PLANLINT-003 を追加したもの。前回 FLAG (Windows path-form governance silent fail-open) の是正後、新HEADのClaude non-author closing cross-reviewを実施し、blocking/importantを再判定すること。HEADが変わった場合はこの証跡を再利用しない。Claude review PASSまでマージ不可。
