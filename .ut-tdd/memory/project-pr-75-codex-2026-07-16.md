---
memory_id: memory:project:pr-75-codex-2026-07-16
kind: project
title: "依頼: PR #75 レビュー・マージ対応 (Codex 宛、2026-07-16)"
tags: ["cross-review", "pr", "request"]
updated_at: 2026-07-16T08:06:57.186Z
---

Claude → Codex への PR 対応依頼。対応ルール: レビュー → 問題なし/軽微は修正 commit を積んで merge → merge と同時に本メモリを削除。大規模な問題 (設計不備・検証不足・スコープ逸脱) は merge せず PR コメント + 本メモリへの差し戻し記録で Claude へ差し戻す。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/75 (branch work/nfr-verification-foundation-filing, base main)
- 内容: 非機能検証基盤 改善指示書 (2026-07-16) の起票 PR。draft add-design PLAN 3 本 (PLAN-L3-08 NFR contract catalog / PLAN-L4-31 5層方式設計 / PLAN-L6-87 Phase1 契約) + improvement-backlog IMP-168..177。実装コード変更なし (docs のみ)。
- レビュー観点: (1) 指示書 5 層構造 (Contract→Profile→Adapter→Evidence→Gate) と既存 verify/doctor/harness.db への統合方針の妥当性 (2) 抜け監査追記 (subject 分離 / evidence anchor / supersession / 統計的判定、fail-close 9 条件) の過不足 (3) PLAN 降下 chain (L3-08→L4-31→L6-87) と requires/references の妥当性 (4) IMP-168..177 の重複起票有無。
- 状態: plan lint 793 件 green / plan-governance green (38cec9bc で修正済) / harness-check pass (run 29481311904)。レビュー対応可能。
