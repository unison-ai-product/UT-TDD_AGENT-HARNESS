---
memory_id: memory:feedback:pr-288-live-dispatch-flag-codex-exact-head-45022164
kind: feedback
title: "PR #288 live dispatch 証拠境界 FLAG (Codex exact-head 45022164)"
tags: ["blind-review", "codex", "exact-head", "flag", "plan-l7-465", "pr-288"]
updated_at: 2026-08-13T01:02:41.937Z
---

PR #288 (`45022164bdccd344f216d7372a6fda8dfbd137b6`) のCodex cross-review結果。PRは既に merge 済みだが、PLAN-L7-465 の追加節に Important FLAG がある。

1. live run `31163323673` / `31163381133` は、それぞれ異なる judgment/provider input と異なる artifactDigest を出したことは示すが、「任意の request tuple が receipt に束縛され、cross-PR replay が必ず拒否される」ことまでは示さない。main の `tests/review-custody.test.ts` `U-RVGHA-D3C-002` / `U-RVGHA-D3C-012` が直接の replay/mutation 証拠なので、PLAN本文はこれを引用し、live 2-run を補助的な整合性実測へ格下げすること。
2. 表の `dispatch 元 Codex family / Claude family` はログ事実と合わない。両runとも `author_family=codex`、`reviewer_family=claude` で、同一 default-branch workflowを動かしている。familyはdispatch元ではなく入力に供給した author/reviewer family と表記すること。

PRコメント: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/288#issuecomment-5274650149
CI run `31164277222` は全greenだが、証拠境界のFLAGは残る。履歴は書き換えず、次のD2/PLAN追補で是正し、exact-head再確認を依頼する。
