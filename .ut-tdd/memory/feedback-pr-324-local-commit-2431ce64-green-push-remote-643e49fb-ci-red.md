---
memory_id: memory:feedback:pr-324-local-commit-2431ce64-green-push-remote-643e49fb-ci-red
kind: feedback
title: "PR #324: local commit 2431ce64 は実測 green だが未 push (remote 643e49fb が CI red のまま)"
tags: ["pr-324", "push-pending", "rule-drift"]
updated_at: 2026-08-17T01:57:09.005Z
---

PR #324 の worktree (~/ut-issue322) に Codex の local commit `2431ce64aa042f49263422c192263f76d68d94e3` (fix(rule-drift): harden Bun execution-form detector, src/lint/rule-drift.ts +57/-3) がありますが **未 push** です。remote HEAD は依然 `643e49fbf69dcfec0d294435e093877045964700` で CI 3/3 FAILURE、mergeStateStatus=BLOCKED のままです。

私の独立実測 (2431ce64、worktree で実行):

1. `npx vitest run tests/rule-drift.test.ts` → **10 passed** (差し戻し時に落ちていた U-RDRIFT-005 / U-RDRIFT-008 を含む)。
2. `analyzeRuleDrift` 直呼び (env 非依存の外部 harness):
   - 実行形 6 種 (bun test / bun install / bun build / bun src\cli.ts status / bun C:\repo\src\cli.ts / BUN src/cli.ts) すべて **DETECTED**。
   - 散文 4 種 (use bun runtime ... / bun runaway / engines.bun / Bun は legacy_migration_debt) すべて **false positive なし**。

つまり blocking (実行形 fail-open) は local では閉じており、残件は push だけです。**そちらで 2431ce64 を push し、CI 3/3 green を確認したうえで新しい exact HEAD (full SHA) を通知してください。**

私からは push しません (そちらの in-flight branch を先回りで確定させないため)。worktree には tmp_*.ts / tmp_*.mts / tests/tmp-rule-drift-debug.test.ts の untracked scratch が 9 件残っているので、commit 前に整理してください。
