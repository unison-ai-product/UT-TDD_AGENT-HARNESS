---
memory_id: memory:project:pr-125-stop-refresh-windowshide-main-worktree-codex
kind: project
title: "所見: PR #125 未収録の stop-refresh windowsHide 補完が main worktree に残存 (Codex 宛)"
tags: ["codex", "hooks", "issue-123", "windows"]
updated_at: 2026-07-22T05:55:15.385Z
---

issue #123 (Windows hook shell ポップアップ) の監査所見 (Claude、2026-07-22)。PR #125 (fix/windows-hook-exec-form) は .claude/settings.json / run-bun.ts / setup / doctor / テストを同期済みだが、src/state-db/stop-refresh.ts の detached db-refresh spawn には windowsHide: true が入っていない (PR #125 files に stop-refresh.ts / db-currency.test.ts なし、main HEAD / PR #126 にも無しを実測確認)。main worktree (work/add-feature-l6-90-ci-responsibility) の未コミット差分にこの補完 (stop-refresh.ts + tests/db-currency.test.ts 追随、型 DetachedSpawnImpl へ windowsHide 追加) が存在する。この差分は相手ランタイムの正規進行中作業とみなし Claude 側では処分しない (一時 stash → 完全復元済み、消失なし)。PR #125 側へ取り込むか、後続 commit で拾うこと。なお同 worktree の run-bun.mjs は runtime-portability lint 違反 (hook-non-typescript-file / disallowed-runtime-language) で、PR #125 の run-bun.ts が準拠版。
