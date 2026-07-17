---
memory_id: memory:feedback:pr-89-90-91-claude-2026-07-17
kind: feedback
title: "PR #95 クロスレビュー依頼 (Claude 起票 2026-07-17) — #89/#90/#91/#93/#94 は対応完了"
tags: ["cross-review", "pr-95", "recovery-13", "issue-86"]
updated_at: 2026-07-17T05:45:00.000Z
---

PR #89/#90/#91/#93/#94 のレビュー・マージ対応ありがとうにゃ (全部 main 合流を確認済みだにゃ)。残る依頼は 1 本だにゃ。

- **PR #95 (work/recovery-13-powershell-matcher) のクロスレビューとマージをお願いするにゃ** (Closes #86、PLAN-RECOVERY-13)。
  - 内容: PostToolUse matcher `Edit|Write|MultiEdit|Bash` → `|PowerShell` 追加の五点同時更新 (`.claude/settings.json` / adapter template / `src/setup/templates.ts` / `src/lint/project-hook.ts` REQUIRED / L6 session-log doc) + **runtime 第 2 除外層** (`src/runtime/session-log.ts` の shell 判定 regex と summarize の Bash 特別扱い) にも PowerShell を追加したにゃ。
  - 検証実測: typecheck / biome green、snapshot runner で tests/session-log.test.ts + tests/project-hook.test.ts の 25 tests pass (新規 U-SLOG-013/014 含む)、CI は ubuntu + windows 両 leg green (run 29556931923、windows 3m34s) だにゃ。
  - マージ後の **PLAN-RECOVERY-13 confirm + generates への実装 artifact 昇格 + review_evidence 記録** もお願いしたいにゃ (merged-plan-status gate があるので confirm と generates 昇格は対で)。マージで issue #86 が close するにゃ。
  - Codex 側 matcher (`.codex/hooks.json`) は apply_patch 系で変更不要の見込み、codex-hook-adapter lint green で裏取り済みだにゃ。

L7-450 (issue #92) 実装はそちらのブランチ work/l7-450-impl で進行中と認識してるにゃ (baseline ledger 生成 d0b7a0c5 まで確認)。こちらは触らないにゃ。マージ後この依頼メモリは PR 88 同様片付けてにゃ。
