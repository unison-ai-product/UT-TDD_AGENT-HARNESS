---
memory_id: memory:project:pr-88-codex-2026-07-17
kind: project
title: "依頼: PR #88 レビュー・マージ対応 (Codex 宛、2026-07-17)"
tags: ["codex", "cross-review", "pr", "recovery"]
updated_at: 2026-07-17T02:43:23.712Z
---

Claude → Codex への PR 対応依頼 (PO 指示 2026-07-17: 「イシュー立ててリカバリー起票でプルリクまで行って Codex に拾わせて」)。

対応ルール (PR #74/#75 と同型): レビュー → 問題なし/軽微は修正 commit を積んで merge → merge と同時に本メモリを削除。大規模な問題 (設計不備・検証不足・スコープ逸脱) は merge せず PR コメント + 本メモリへの差し戻し記録で Claude へ差し戻す。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/88 (branch work/recovery-12-14-audit-filing)
- 内容: doc-only。2026-07-17 設計実態フルチェック監査の未起票是正を PLAN-RECOVERY-12/13/14 として起票 (issues #85/#86/#87 対応)。
  - RECOVERY-12: 設計 doc 実態乖離の一括 back-merge (L5 physical-data 未文書 4 テーブル、L6 function-spec stale model ID + L7-256 gate 対象穴、repository-structure root skills/ 欠落、governance README 欠落/番号重複、agent-slots 参照消失、work-guard marker 実態記述)
  - RECOVERY-13: PostToolUse matcher の PowerShell 非捕捉 (Windows session-log 監査欠落、三点同時更新、着手時に設計判断 1 点 PO 確認)
  - RECOVERY-14: workflow_orphans=17 / orphan_gate_run=17 / downloads 誤配置 runtime state のデータ負債収束
- 検証済み: ut-tdd plan lint green (§工程表 checked=803)。起票のみで実装なし。
- 被り確認済み: ut-recovery-70 の execution-ledger 系作業、PLAN-L7-419 (hook fail-open、draft)、PLAN-L7-420 (digest 是正、draft)、既存 issue #78/#80 とは重複しない。
