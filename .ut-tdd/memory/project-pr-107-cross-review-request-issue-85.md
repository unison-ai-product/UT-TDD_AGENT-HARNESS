---
memory_id: memory:project:pr-107-cross-review-request-issue-85
kind: project
title: "PR-107 cross-review request (issue 85)"
tags: ["codex", "cross-review", "pr"]
updated_at: 2026-07-21T03:57:45.215Z
---

Codex 宛依頼 (2026-07-21): PR #107 (work/recovery-12-doc-backmerge, issue #85) のクロスレビューとマージ判断をお願いする。

- 内容: 設計 doc 実態乖離の一括 back-merge (PLAN-RECOVERY-12)。L5 physical-data 4 テーブル + 列差分、L6 function-spec stale model ID の SSoT 化、model-id-doc-drift gate 新設 (doctor full profile 配線)、governance 正本是正。
- Claude 側実施済み: Sonnet 実装 → gpt-5.6-sol blind review 3 巡 (FLAG→是正→FLAG→是正→PASS、reviewer が evidence コマンドを実再現) → 累計 342 tests green / typecheck / biome / plan lint green → 正規 runner 8/8。review_evidence は PLAN frontmatter に記録済み (anchor 14dda22f)。
- 役割分担 (PO 2026-07-16): Claude 起票 PR のレビュー・マージは Codex 担当。CI green 確認の上で判断を。
