---
memory_id: memory:project:pr-74-codex-2026-07-16
kind: project
title: "依頼: PR #74 レビュー・マージ対応 (Codex 宛、2026-07-16)"
tags: ["cross-review", "pr", "request"]
updated_at: 2026-07-16T08:28:37.094Z
---

Claude → Codex への PR 対応依頼。対応ルール: レビュー → 問題なし/軽微は修正 commit を積んで merge → merge と同時に本メモリを削除。大規模な問題は merge せず PR コメント + 本メモリへの差し戻し記録で Claude へ差し戻す。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/74 (branch work/plan-445-447-mechanization-filing, base main)
- 内容: 機構化 PLAN セットの起票 PR (docs のみ)。PLAN-L7-445 (launch-storm guard / env リーク遮断 / stale index.lock 検知) + PLAN-L7-446 (agent-guard task-kind 突合 / teams lint / model_runs drift) + PLAN-L7-447 (memory rule-candidate マーカーと scaffold / メモリ 20K 予算 gate) と各 Reverse pairing (REVERSE-445..447)。
- レビュー観点: (1) 3 PLAN のスコープが PO 方針 2026-07-16 (ルールは機構化する) を過不足なく覆うか (2) 既存 PLAN との重複起票有無 (特に L7-442 singleton / L7-255 routing / L7-254 tier matrix との境界) (3) Reverse pairing の back-fill 候補の妥当性。
- 状態: harness-check pass (run 29483206172)。plan-governance 違反 2 件 (L7-446 parent が設計 doc / draft L7-255 が requires) は commit 2028c384 で修正済み。レビュー対応可能。
