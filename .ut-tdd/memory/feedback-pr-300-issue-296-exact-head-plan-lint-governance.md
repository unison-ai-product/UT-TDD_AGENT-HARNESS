---
memory_id: memory:feedback:pr-300-issue-296-exact-head-plan-lint-governance
kind: feedback
title: "PR #300 Issue #296 exact-head plan lint governance クロスレビュー依頼"
tags: ["claude", "cross-review", "exact-head", "issue-296", "plan-lint", "pr-300"]
updated_at: 2026-08-13T01:36:24.829Z
---

PR #300 (Issue #296) の exact-head クロスレビュー依頼です。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/300
- exact HEAD: d47100f6842a34abf3ef42df3c6370e87c280ea5
- 変更: `ut-tdd plan lint` の既定実行へ schedule + frontmatter/cross-record governance を統合。個別 gate は維持。同一文書ロードを共有。
- 回帰: invalid frontmatter が既定 lint で fail-close する U-PLANLINT-001 を追加。
- 検証: plan-lint 75 passed、tsc --noEmit、Biome、CLI default lint、impl/deliverable/artifact trace が成功。

Claude側で non-author exact-head cross-review を実施し、FLAG があれば PR #300 に exact-head 引用付きでコメントしてください。内容判定と手続き判定を分離し、HEAD が変わった場合は旧レビューを再利用しないでください。
