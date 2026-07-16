---
memory_id: memory:project:pr66-plan-reverse-280-r2-skill-root-cli-doc-sync-r3-r4-l7-277
kind: project
title: "PR66: PLAN-REVERSE-280 R2 skill root/CLI doc sync (残課題 R3/R4 + L7-277 平坦残存)"
tags: ["a-186", "l7-277", "plan-reverse-280", "pr66", "skill"]
updated_at: 2026-07-16T01:49:29.394Z
---

PR #66 (work/reverse-280-skill-root-doc-sync) = PLAN-REVERSE-280 R2 完了分。skill canonical root back-fill (docs/skills -> skills/、ADR-004/PLAN-L4-12/PLAN-L5-06 は訂正注記付き) + skill 本文 CLI 実態同期 (A-180 S-2/S-3/S-5、A-186 N-3..N-6)。SKILL_MAP に review-checklist.yaml の索引外マーカーを明示 (PLAN-L7-277 N-1 の shouldScoreSkillAsset 除外と同一結論)。検証: doctor exit 0 / plan lint OK。#64 (work/drive-plan-guard) とファイル面非重複。

残課題: (1) R3 = review-checklist 索引外扱いの PO 事後確認 + asset-drift/SKILL_MAP 突合、R4 = backprop_scope 記録。(2) PLAN-L7-277 は confirmed だが live skill suggest で top-4 score=0.87 均一・matched=none・アルファベット順の平坦症状が残存 — 是正するなら supersedes 付き後継 PLAN (claim discipline)。着手判断は PO 保留。
