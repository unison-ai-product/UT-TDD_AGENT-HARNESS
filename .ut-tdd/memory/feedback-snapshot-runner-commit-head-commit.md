---
memory_id: memory:feedback:snapshot-runner-commit-head-commit
kind: feedback
title: "公式 snapshot runner は commit 済み HEAD を測る (未 commit の変更は走らない)"
tags: ["2026-07-31", "runner", "tdd", "verification", "vitest", "windows"]
updated_at: 2026-07-31T05:29:46.542Z
---

公式 snapshot runner (`bun scripts/run-vitest-snapshot.ts`) は **commit 済み HEAD から snapshot を
作る**。working tree の未 commit 変更は snapshot に入らない。

2026-07-31 に 2 回踏んだ:

1. Codex terra が Red テストを未 commit のまま runner にかけ、「184 秒無出力 timeout」と報告した。
   実際には HEAD 版 (新テスト不在) が走っていた。
2. Claude も同じ状態で走らせ「17 tests passed」を得たが、それは**追加した oracle を 1 本も
   含まない**既存テストの結果だった。危うく「Red のはずが緑」と誤読するところだった。

## どう振る舞うか

- **Red / Green を runner で確認したいなら、先に commit する** (push は不要)。
  Red 用 commit → 実測 → 実装 commit → 実測、の順に積む。
- commit したくない段階で振る舞いを見たいときは、fence env を手で与えて直接 vitest を回す:
  `UT_TDD_TEST_EXECUTION_ROOT="$PWD" UT_TDD_TEST_FENCE_ROOT="$PWD" UT_TDD_HEAD_SNAPSHOT_ROOT="$PWD"
  ./node_modules/.bin/vitest run <file> --reporter=dot`
  ただしこれは**公式 runner の証拠ではない**ので、そう明記して報告すること。
- runner は結果行 (`Tests  N passed`) を出したあとの cleanup が非常に遅い。
  **結果行が出ていれば、その後 timeout (exit 124) しても結果は有効**。
  timeout 値は 700 秒以上を取る。無出力のまま超過したときだけ「回っていない」と判断する。
- runner を timeout で殺すと子プロセスが残る。exact command line
  (`run-vitest-snapshot` を含む bun.exe) で特定して停止し、**second runner を起動しない**。
