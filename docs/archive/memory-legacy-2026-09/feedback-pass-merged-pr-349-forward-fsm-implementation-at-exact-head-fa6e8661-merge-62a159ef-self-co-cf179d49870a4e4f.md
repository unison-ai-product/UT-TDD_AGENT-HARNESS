---
memory_id: memory:feedback:pass-merged-pr-349-forward-fsm-implementation-at-exact-head-fa6e8661-merge-62a159ef-self-correction-on-green-command-digest-severity
kind: feedback
title: "PASS + merged: PR #349 Forward FSM implementation at exact HEAD fa6e8661 (merge 62a159ef); self-correction on green-command-digest severity"
tags: ["forward-fsm", "issue-344", "merge", "pass", "pr-349", "self-correction", "verdict"]
updated_at: 2026-08-20T04:55:09.044Z
---

PR #349 (Forward FSM bounded implementation、Issue #344 / PLAN-L7-419) の非著者 closing review を claude-opus-5 が exact HEAD fa6e8661e3a4a12c5a84d7e1841b1835b559c791 で実施し **PASS (blocking 0)** を返し、Claude が merge した。squash merge commit 62a159ef338bafb048e5fd9aca00eb3771dc4b22、mergedAt 2026-08-20T04:53:34Z。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/349#issuecomment-5351524678

CI は harness-check-linux / harness-check-windows / aggregate の 3/3 success、Tests 3134 passed | 1 skipped、doctor violation 0、mergeState CLEAN。

B-7 は tests/forward/fsm.test.ts:39 へ `// test-only deterministic fixture` を付す 1 行で解消し、clean distribution / Pack 系 5 テストが green に戻った。

**自己訂正 (reviewer 側の過剰判定)**: 4de12a1c の回で green-command-digest を blocking B-6 とし CI red の原因として扱ったのは誤りだった。実測で (1) このチェックは note であり hard gate ではない、(2) digest は評価対象 HEAD ではなく anchor_commit 時点の blob に束縛される仕様である、の 2 点が判明した。fa6e8661 でも記録値 sha256:7608eba8... は anchor_commit 986a296c 時点の blob と一致し doctor は OK を返す。現 HEAD の blob hash 2c7539d5... との差は仕様上の不一致ではない。当時の CI red の実因は B-7 と同じ vitest 失敗だった。gate の severity (hard/advisory) と束縛対象を確認せずに blocking を宣言しないこと。

内容検証で確認した事項: explain の precedence が「未知 event → exit 1 / exception context 欠落 → exit 2 / evidence 欠落 → exit 2 / edge 不正 → exit 1」で L6-72 §2 の『だけ』条件と厳密一致。application 層 explain は verdict 内容に関わらず exitCode 0 で ledger/projection 不整合のみ exit 3 (L6-72 §4)。U-FSM-001 の 17×17 closed world は全組合せに正当な evidence と exception context を与えた上で非 edge に exit 1 を要求しており #348 pre-gate の C-1 を満たす。U-FSM-009 は期限切れ evidence を forward-evidence-missing / exit 2 かつ ledger 追記 0 件で固定し lifecycle 12 event 全部の rule mapping を走査。scope は src/forward、tests/forward、CLI registrar、PLAN 2 件、test-design のみで Episode / D1-D3 / PF-5 / Pack copy / promotion への越境なし。Reverse 対 PLAN-REVERSE-419 健在。

非 blocking の申し送り (merge 後に実施すること): PLAN-L7-419 は status draft のまま generates に src/tests 12 件を宣言している。DoD :155 / :157 / :158 は本 verdict が出るまで満たせない項目のため未チェックだったが、merge 済みの今は status を confirmed へ移し 3 項目をチェックし review_evidence を本 verdict (exact HEAD / worker_model gpt-5.6-luna / reviewer_model claude-opus-5) 付きの cross_agent として記録すること。現在の intra_runtime_subagent は実態と異なる。F-1 (exception context と illegal-transition の優先順位) は実装側で解消済みだが Reverse-419 R2 で L6-72 §2 に明文化しておくとよい。

レビュー経過: 初回 FLAG (31c69e77) から PASS まで 7 リビジョン。coding-rules max-source-params 7 件は 3 巡にわたり抽象表現の指摘では是正されず、4 巡目で実シグネチャと引数個数の表 + 閾値の SSoT 引用 + repo 内前例の提示へ切り替えて解消した。secret-scan の原因特定は CI ログでは payload 省略で判らず、PR head を detached checkout し fence env 直指定で targeted vitest を再現、distribution sync-pack --json を直接叩いて violations 配列を得た。
