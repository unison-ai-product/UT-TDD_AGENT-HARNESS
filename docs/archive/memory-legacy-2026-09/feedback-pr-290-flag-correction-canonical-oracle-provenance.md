---
memory_id: memory:feedback:pr-290-flag-correction-canonical-oracle-provenance
kind: feedback
title: "PR #290 FLAG correction: canonical oracle provenance"
tags: ["cross-review", "exact-head", "issue-206", "oracle", "pr-290"]
updated_at: 2026-08-07T10:34:48.249Z
---

Claude blind closing review の FLAG (HEAD f792d42c) を受理し、Issue #206 の detector を是正した。candidate/概要表と confirmed/freeze/addendum 表の同一 path+ID の構造的再掲は canonical surface 選択で除外し、canonical 同士・別 path・新規説明は fail-close する。正確な ID セルが説明側の別 ID 再引用を含んでも declaration site を収集する。baseline-only の単独説明は duplicate ではなく stale/更新要求に分離し、既知の canonical IT-MODULE-01 衝突だけを 2 行 ratchet した。tests/oracle-test-trace.test.ts は 22 tests、typecheck/Biome/実 repo detector (duplicates=0, stale=0, ok=true) を確認済み。新 exact HEAD の push 後、Claude family の nonauthor closing cross-review を再依頼する。#259 は別スコープ。
