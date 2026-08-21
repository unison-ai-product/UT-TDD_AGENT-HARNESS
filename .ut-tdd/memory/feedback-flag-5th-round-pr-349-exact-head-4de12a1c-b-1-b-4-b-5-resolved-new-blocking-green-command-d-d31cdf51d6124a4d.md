---
memory_id: memory:feedback:flag-5th-round-pr-349-exact-head-4de12a1c-b-1-b-4-b-5-resolved-new-blocking-green-command-digest-stale-f-1-exception-context-vs-illegal-transition-ordering-unspecified-in-l6-72
kind: feedback
title: "FLAG (5th round): PR #349 exact HEAD 4de12a1c — B-1/B-4/B-5 resolved, new blocking green-command-digest stale; F-1 exception-context vs illegal-transition ordering unspecified in L6-72"
tags: ["contract-gap", "flag", "forward-fsm", "green-command-digest", "issue-344", "pr-349", "verdict"]
updated_at: 2026-08-20T03:29:01.233Z
---

PR #349 の 5 巡目 delta closing review を claude-opus-5 が非著者として exact HEAD 4de12a1c6de76400e2f9dca2bbb6566ea370ac6a で実施し FLAG (blocking 1) を返した。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/349#issuecomment-5350993332

前回 blocking 3 件はすべて解消を実測確認した。B-1 は doctor coding-rules の violation 行が消え design-detection も OK (coverage=8) になり、7 箇所の typed input object 化が効いている。B-4 は PLAN-L7-419:155 が未チェックへ戻り事実と整合。B-5 は移動されていた 2 項目が ## 3 Acceptance criteria / DoD (:157 :158) へ戻り ## 5. PR closing gate 節が削除されて見出し重複も解消。

B-6 (新規 blocking): doctor green-command-digest が output_digest と evidence_path 実 hash の不一致を fake/stale substance として検出。PLAN-L7-419:79 の sha256:dd9509cad716... と anchor_commit fc2c4c10 は中間 commit 時点のものであり、その後 tests/forward/fsm.test.ts が変更されたため stale。exact HEAD での独立計算値は c314342888329a11ceef665689e59daac9feda92cd6bf5c555fd56110b54e786。最終リビジョンで再実走し digest と anchor_commit を exact HEAD へ更新する必要がある。CI は harness-check-linux failure (96303119167)、windows は review 時点で in_progress。

F-1 (非 blocking、Reverse R2 までに契約側で要決着): src/forward/domain/workflow.ts の explain は (1) 未知 event → illegal exit 1、(2) evidence 不足 → spec.missingRule exit 2、(3) edge 不正 → illegal exit 1、(4) exception context 不足 → exit 2 の順で判定する。(2) が (3) より前にあるのは L6-72 §2 の precedence と一致し #348 pre-gate の C-1/C-2 を満たす正しい実装である。しかし (4) が (3) より後にあるため、exception event を不正な from state から context 欠落で呼ぶと exit 1 が返り exit 2 が返らない。L6-72 §2 の「これらの前置条件が満たされているのに表にない state/event を指定した場合『だけ』exit 1」を厳密に読むと exit 2 優先に見えるが、exception context は EvidenceRecord ではないため前置条件に含まれないという読みも成立する。契約が一意に決めていない相互作用であり、実装が明確に違反しているとは言えないため blocking にしなかった。現行 U-FSM-006 は block を proposed (合法 from state) から呼んでおりこの組合せを踏んでいない。Reverse-419 R2 までに (a) context 判定を edge 判定の前へ移す、または (b) exception event は illegal-transition 優先と L6-72 に明記する、のいずれかで閉じること。

merge していない。配送の但し書き: 本メモリは git 未追跡で別 worktree の Codex からは不可視。実効経路は PR コメントのみであり同内容を投稿済み。
