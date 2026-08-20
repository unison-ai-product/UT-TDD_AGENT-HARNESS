---
memory_id: memory:feedback:flag-4th-round-pr-349-exact-head-9a086edd-coding-rules-7-unchanged-since-first-flag-switched-to-concrete-signature-param-count-citation
kind: feedback
title: "FLAG (4th round): PR #349 exact HEAD 9a086edd — coding-rules 7 unchanged since first FLAG; switched to concrete signature/param-count citation"
tags: ["ci-red", "flag", "forward-fsm", "issue-344", "pr-349", "review-technique", "verdict"]
updated_at: 2026-08-20T03:21:30.333Z
---

PR #349 の 4 巡目 delta closing review を claude-opus-5 が非著者として exact HEAD 9a086eddeb749fad94b1f3d7d4462c21c2d2ca77 で実施し FLAG (blocking 2) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/349#issuecomment-5350949670

CI は harness-check-linux / harness-check-windows / aggregate の 3 job とも failure (96301416023 / 96301415950 / 96302533319)。

本 HEAD で初めて src が変更された (forward-workflow.ts +33、tests/forward/fsm.test.ts +61、U-FSM-007/008 の fail-close と replay recovery)。しかし doctor coding-rules の違反 7 件は初回 31c69e77 から集合として一つも変わっていない。forward-workflow.ts の行番号が 243→268 へ動いたのは同ファイル +33 行による移動であって是正ではない。

**レビュー手法の教訓**: 3 巡にわたり「引数列を typed input object へ畳む」という抽象表現で指摘していたが是正されなかった。4 巡目で機械出力を具体形へ展開し、(a) ルール閾値 (引数最大 3 個、SSoT docs/governance/coding-rules.md:50、実装 src/lint/coding-rules.ts:393 の node.parameters.length > 3)、(b) 7 箇所それぞれの実シグネチャと実引数個数の表、(c) repo 内の既存対処実例 (src/feedback/review-dispatch.ts:346、src/handover/index.ts:291、src/lint/descent-obligation.ts:499) を添えた。違反 7 件の内訳は evaluate 4 引数 / evaluateRequirement 4 / envelope 8+ / spec 5 / requirement 6 / constructor 5 / deny 6。

B-5 (plan-dod の回避) は 3 巡続けて未修正。## 5. PR closing gate へ移された 2 項目が未チェックのまま、## 3 Acceptance criteria / DoD は全 [x]。## 5 の見出し重複も残存。

B-4 は B-1 の従属項目へ格下げした (B-1 が解消すれば自動的に真になるため独立 blocking から外す)。

merge していない。

配送の但し書き: 本メモリは git 未追跡で別 worktree の Codex からは不可視。実効経路は PR コメントのみであり、同内容を PR へ投稿済み。
