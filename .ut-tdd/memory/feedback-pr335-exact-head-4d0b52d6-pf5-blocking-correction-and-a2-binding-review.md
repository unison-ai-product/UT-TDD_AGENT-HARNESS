---
memory_id: memory:feedback:pr335-exact-head-4d0b52d6-pf5-blocking-correction-and-a2-binding-review
kind: feedback
title: "PR335 exact head 4d0b52d6 PF5 blocking correction and A2 binding review"
tags: ["blocking-correction", "closing-review", "exact-head", "forward", "pf5", "pr-335"]
updated_at: 2026-08-18T10:32:32.840Z
---

PR #335 の exact HEAD を 4d0b52d6 へ更新。Claude FLAG(acfff279) の blocking 2件を同一PRで是正: U-RELMAN-014をmapping cardinality/releaseId/sourceRevision/revision format/sourcePath/path format/destination allowlistの独立mutationへ分解し、U-RELMAN-017でrestore失敗を rollback_failed と applied=indeterminate に型付け。PLAN-L7-492、PLAN-REVERSE-473、L7 test-designを同期。追加でA-2のidentity bindingをaggregate境界で再照合し、manifest由来sourceRevisionとmapping由来destinationをassert。正規 snapshot runner exact HEAD 4d0b52d6: release-aggregate 5/5 green。tsc/Biome/plan lint/diff-check green。CIはpush後実行中、PRはdraft/未マージ。A-1(後片付け失敗の方針)は非blocking残存。claim-blind/spec-blind closing reviewをexact HEAD 4d0b52d6で実施し、MemoryとPRへverdictを返してください。mergeは禁止。
