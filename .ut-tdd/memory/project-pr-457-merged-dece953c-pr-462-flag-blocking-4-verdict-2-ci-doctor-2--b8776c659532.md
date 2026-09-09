---
memory_id: memory:project:pr-457-merged-dece953c-pr-462-flag-blocking-4-verdict-2-ci-doctor-2--b8776c659532
kind: project
title: "PR #457 merged (dece953c) / PR #462 FLAG blocking 4 (verdict 2 + CI doctor 2)"
tags: ["duplicate-artifact-ownership", "merged", "oracle-test-trace", "plan-l7-514", "pr-457", "pr-462", "review"]
updated_at: 2026-08-28T03:26:34.677Z
---

PR #457 は exact HEAD dece953cef0d750e8751c834b2abdc6ceb465bca で receipt
e93ba3bca1d0d821029b21e6a520e596192071b3bbf2a43c388e20c090e5291f (PASS-WEAK / blocking 0)、
CI run 33137790425 が 3/3 pass となり ut-tdd pr merge --pr 457 で MERGED (reason=merge_ready)。

PR #462 (issue #433 / PLAN-L7-514 Claude hook generation rolling upgrade) は exact HEAD
35716374ec1d7fac34a4b6cb6f857d348552d4a4 で receipt
e4667ee5cade9b444b523d0d4d957790bbd11e4b750aeb7df05651712681eede が FLAG / blocking 2。
さらに orchestrator 実測で CI 由来の blocking 2 件を追加報告した。合計 4 件。

review verdict の 2 件:
1. src/runtime/claude-wake-generation-upgrade.ts:274-281 の reconcileActivationJournals が
   journal_planned 直後・supersede rename 直前の中断で恒久 wedge する。previousMarkerName が
   non-null なのに superseded/<epoch>-<previousMarkerName> が未作成のため
   activation_recovery_failed を返し journal が planned のまま残り、以後
   waitForClaudeMemory が恒久的に superseded を返す。巻き戻し対象が無い no-op ケースなので
   recoverable 扱いが正しい。U-CHSCHEMA-009 は marker_written にしか fault 注入しておらず
   6 ActivationStep のうち最初の 1 つが無防備。
2. U-CHSCHEMA-016 が実体なしで U- へ昇格。宣言 Green invariant の
   historical_payload_unavailable fixture admission deny は grep -rn で 0 hits、
   admission validator が差分に存在しない。テストは existsSync(...) === false のみで
   ファイル不在の観測に過ぎず deny の実行ではない。

CI 由来の 2 件 (run 33137716188 が Linux/Windows/aggregate 3 本とも fail、doctor で落ち
test/doc lane/lint/audit quality はすべて skipped):
3. deliverable-plan-trace violation: duplicate-artifact-ownership src/runtime/claude-memory-wake.ts。
   PLAN-L7-472 (status confirmed) が既に generates 所有しているのに PLAN-L7-514 も宣言した。
   本 PR は当該ファイルを新規生成しておらず改変しているだけなので generates から外すのが正。
4. oracle-test-trace: U-CHSCHEMA-002/003/007/008/010/013/015/016 の 8 件が tests 未 citation
   (docs=1 tests=0 を個別実測)。未実装 oracle は CANDIDATE-* で宣言する規約。上記 2 はこの 8 件の
   うち 016 を掘り下げたもので根は同じ。

重要な教訓: 依頼本文の Green 申告一覧 (snapshot 8/8、既存 38/38、tsc、PLAN lint 929、Biome、
diff-check) に doctor が含まれていなかった。落ちていたのはまさに doctor である。著者の Green 申告は
「どの gate を回したか」を必ず確認し、doctor 不在なら CI を先に見る。

vitest はリポジトリ既定で tests/global-setup.ts が UT_TDD_TEST_EXECUTION_ROOT /
UT_TDD_TEST_FENCE_ROOT / UT_TDD_HEAD_SNAPSHOT_ROOT を要求し、npx vitest run 直叩きは
"Vitest must run through the detached HEAD snapshot runner" で fail-close する。
正規経路は node scripts/run-vitest-snapshot.ts <files>。reviewer subprocess が
テストを再現できない理由の一つがこれ。
