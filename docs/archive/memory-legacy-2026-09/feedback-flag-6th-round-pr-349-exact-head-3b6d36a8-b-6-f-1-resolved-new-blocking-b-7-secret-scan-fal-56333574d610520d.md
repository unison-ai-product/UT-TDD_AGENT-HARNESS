---
memory_id: memory:feedback:flag-6th-round-pr-349-exact-head-3b6d36a8-b-6-f-1-resolved-new-blocking-b-7-secret-scan-false-positive-at-tests-forward-fsm-test-ts-39-breaks-5-clean-distribution-tests-one-line-fix-in-repo-precedent
kind: feedback
title: "FLAG (6th round): PR #349 exact HEAD 3b6d36a8 — B-6/F-1 resolved; new blocking B-7 secret-scan false positive at tests/forward/fsm.test.ts:39 breaks 5 clean-distribution tests (one-line fix, in-repo precedent)"
tags: ["distribution", "flag", "forward-fsm", "issue-344", "pr-349", "review-technique", "secret-scan", "verdict"]
updated_at: 2026-08-20T04:17:36.571Z
---

PR #349 の 6 巡目 delta closing review を claude-opus-5 が非著者として exact HEAD 3b6d36a8f7b0690b882b20463ab205f7b5c4ee38 で実施し FLAG (blocking 1) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/349#issuecomment-5351290047

前回の blocking B-6 と非 blocking F-1 はいずれも解消を実測確認した。B-6 は PLAN の output_digest sha256:7608eba85a8fdce86dfda4aa77e1f8c5539c93606c7281c1ba5a7e54fbd565d5 が exact HEAD の tests/forward/fsm.test.ts 実 blob hash と完全一致し doctor の green-command-digest note も消滅。F-1 は explain の判定順が「未知 event → exit 1」「exception context 欠落 → exit 2」「evidence 欠落 → exit 2」「edge 不正 → exit 1」となり L6-72 §2 の『だけ』条件と厳密に一致。doctor は violation 0 で clean。

内容面も確認済み: application 層 explain は verdict 内容に関わらず exitCode 0、ledger/projection 不整合のみ exit 3 で L6-72 §4 準拠。U-FSM-001 の 17×17 closed world は全組合せに正当な evidence と exception context を与えた上で非 edge に exit 1 を要求しており #348 pre-gate の条件 C-1 を満たす。U-FSM-009 は期限切れ evidence を forward-evidence-missing / exit 2 かつ ledger 追記 0 件で固定し lifecycle 12 event 全部の rule mapping を走査。

B-7 (新規 blocking): CI failure の原因は doctor ではなく vitest 5 件 (Tests 5 failed | 3129 passed)。tests/cli-surface.test.ts の 3 件と tests/distribution-acceptance.test.ts の 2 件で、すべて clean distribution / Pack artifact 系。共通原因は secretScan.ok=false。ローカル再現で violations を取得: tests/forward/fsm.test.ts:39 marker=secret-assignment (test-only fixture の引用)。該当行は `secret: Buffer.alloc(32, 7),` で、src/lint/secret-scan.ts:32 の secret-assignment パターンに `secret: Buffer.alloc` が合致する (Buffer.alloc がちょうど 12 文字で {12,} を満たす)。

**一行で解消できる。前例が同 repo にある**: tests/plan-asset/evidence-policy.test.ts:19 は同一構文 `secret: Buffer.alloc(32, 0x2a), // test-only deterministic fixture` を使うが、末尾注記が src/lint/secret-scan.ts:38 の ALLOW_LINE_MARKERS (dummy|placeholder|redacted|example|fake|fixture|test-only|not-a-secret) に合致するため検出されない。tests/forward/fsm.test.ts:39 に同等の注記を付ければ解消する。実鍵ではないため安全性の実害はないが、当該ファイルは clean Pack artifact に含まれて配布されるため gate は fail-close で正しく動作している。

**レビュー手法の記録**: CI ログの AssertionError は payload が巨大で secretScan の内訳が省略表示されるため原因が判らなかった。worktree を PR head へ detached checkout し、fence env (UT_TDD_TEST_EXECUTION_ROOT / UT_TDD_TEST_FENCE_ROOT / UT_TDD_HEAD_SNAPSHOT_ROOT を worktree root に直指定) で targeted vitest を走らせて再現、さらに distribution sync-pack --json を直接叩いて violations 配列を取得した。snapshot runner 経由でなくても fence env 直指定で targeted 実行できる。

merge していない。配送の但し書き: 本メモリは git 未追跡で別 worktree の Codex からは不可視。実効経路は PR コメントのみであり同内容を投稿済み。
