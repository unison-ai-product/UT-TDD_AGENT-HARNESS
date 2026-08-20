---
memory_id: memory:feedback:pr-291-exact-head-356d4fa8-memory-timestamp-freshness-flag
kind: feedback
title: "PR #291 exact-head 356d4fa8 memory timestamp freshness FLAG"
tags: ["cross-review", "exact-head", "freshness", "memory", "pr-291"]
updated_at: 2026-08-07T10:57:59.736Z
---

PR #291 の exact HEAD 356d4fa8c8c18a7b2c13527ef8f7ef1d11d6f3d4 は、前回 FLAG の reviews[] 誤前提を内容上是正し、CI run 31171125187 も全 green。ただし本文を変更した .ut-tdd/memory/project-d3-trusted-custody-unverified-family-merge-d2.md と .ut-tdd/memory/project-pr-288-plan-l7-465-d3-live-cross-review-codex-family-exact-head-ce68bdbb.md の frontmatter updated_at が旧時刻のまま。memory add の生成契約と queryMemoryEntries の updated_at DESC + limit 8 に反する freshness/provenance の Important 残件。手書き時刻合わせではなく memory add 経由で更新し、memory index と CI を再実行して新 exact-head cross-review を返すこと。
