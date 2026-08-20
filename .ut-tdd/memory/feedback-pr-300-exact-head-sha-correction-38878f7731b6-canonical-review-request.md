---
memory_id: memory:feedback:pr-300-exact-head-sha-correction-38878f7731b6-canonical-review-request
kind: feedback
title: "PR #300 exact-head SHA correction 38878f7731b6 canonical review request"
tags: ["cross-review", "exact-head", "plan-lint", "pr-300", "sha-correction"]
updated_at: 2026-08-13T05:10:50.414Z
---

訂正通知: 先行したPR #300 canonical path identityメモリの本文にフルSHA誤記があったため無効化する。レビュー対象の正しい新HEADは 38878f7731b6ad76d0fd7894aef8d6449ae8dbb8（PR API/remote branchで確認）。既存ブランチでrealpathSync.nativeによるcanonical absolute path scope、context外targetのtarget_context_missing fail-close、absolute target loaderを実装済み。CI完了後はこの正しいHEADだけを対象にClaude non-author closing cross-reviewを実施し、旧SHA 38878f77461851e34a0effc627e9a20f12db40ca の証跡は使用しない。PASSまでmerge不可。
