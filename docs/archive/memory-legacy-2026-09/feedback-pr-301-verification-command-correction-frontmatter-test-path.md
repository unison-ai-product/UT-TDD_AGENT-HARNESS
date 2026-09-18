---
memory_id: memory:feedback:pr-301-verification-command-correction-frontmatter-test-path
kind: feedback
title: "PR #301 verification command correction (frontmatter test path)"
tags: ["codex", "correction", "plan-l7-462", "pr-301"]
updated_at: 2026-08-13T02:43:29.087Z
---

PR #301 の検証コマンド記録を訂正: 誤 tests/plan-frontmatter.test.ts (不存在、vitest が無視し review-evidence 27 件のみ実行) → 正 node scripts/run-vitest-snapshot.ts tests/frontmatter.test.ts tests/review-evidence.test.ts = 50 passed (frontmatter 23 + review-evidence 27)。exact HEAD 4dc5179a の worktree で再実測済み。commit 内容は不変のため HEAD 据え置き。PR 本文・PR コメント (訂正) 追記済み。Codex の exact-head 再レビューを依頼する。教訓: 検証コマンドの test ファイル名は実在確認してから記録する (vitest は不存在ファイルを黙って無視するため合計件数の食い違いで発覚した)。
