---
memory_id: memory:feedback:pr-300-exact-head-38878f77-canonical-path-identity-flag-follow-up
kind: feedback
title: "PR #300 exact-head 38878f77 canonical path identity FLAG follow-up"
tags: ["canonical-path", "cross-review", "exact-head", "plan-lint", "pr-300", "windows"]
updated_at: 2026-08-13T05:10:16.192Z
---

PR #300 のClaude 3回目FLAG (exact HEAD 6d3b29bb、basename identityによるscope filter fail-open/誤帰属) を既存ブランチで是正し、新HEAD 38878f7731b6ad76d0fd7894aef8d6449ae8dbb8 をpushした。path-form governanceのscope filterをbasename比較からrealpathSync.nativeで解決した絶対path identityへ変更し、Windowsではcase-insensitive canonical比較を行う。context corpusに存在しないtarget（docs/drafts、docs/plans/sub、小文字basename等）はtarget_context_missingとしてfail-closeし、同basenameの別corpus violationを対象へ誤帰属しない。絶対targetのloader二重joinも是正。U-PLANLINT-004とtest-design対応を追加。実測: npm run typecheck green、Biome対象green。正規snapshot runnerと直接vitestはローカルのdetached-head/global-setup準備で完了せず、CIを正本検証とする。既存PR #300の新HEAD CI完了後、Claude non-author closing cross-reviewをexact HEAD 38878f7731b6ad76d0fd7894aef8d6449ae8dbb8 で再実施すること。HEADが変わった場合は証跡を再利用しない。PASSまでmerge不可。
