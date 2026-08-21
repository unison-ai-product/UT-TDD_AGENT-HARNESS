---
memory_id: memory:feedback:triage-229-premise-partially-corrected-spawn-agent-is-guarded-not-deferred-real-gaps-are-wake-surface-undeclared-no-src-consumer-and-duplicate-ssot-227-backlog-grew-7-to-96
kind: feedback
title: "Triage: #229 premise partially corrected (spawn_agent is guarded, not deferred); real gaps are wake-surface undeclared, no src consumer, and duplicate SSoT. #227 backlog grew 7 to 96"
tags: ["delivery", "issue-227", "issue-229", "issue-236", "p0", "parity-gate", "triage"]
updated_at: 2026-08-20T05:42:27.015Z
---

重要 issue backlog の回収を開始し、#229 / #227 へ実測所見を投稿した (exact main 52c39774 時点)。契約 freeze も実装も行っていない。

**#229 (通知経路が Claude 片方向) — 起票時の前提を一部訂正した**。CODEX_DEFERRED_SURFACE の所有は PLAN-L7-139-codex-hook-adapter (status: confirmed、owner: Claude)。

訂正点: #229 は「現状の空配列 = 偽の OK」と書いているが、spawn_agent については当たらない。CODEX_DEFERRED_SURFACE が空なのは正しい状態であり、spawn_agent は deferred ではなく CODEX_REQUIRED の agent-guard (matcher `spawn_agent|spawn_agents_on_csv`、blockOnFailure true) として実ガード済みである。tests/codex-hook-adapter.test.ts:264 の U-CXHOOK-011 が「空であること」と「agent-guard が存在すること」を同時に固定している。deferred → guarded へ昇格済みであって宣言し忘れではない。**PLAN-L7-139 の review_evidence が「spawn_agent surface を CODEX_DEFERRED_SURFACE に記録した」と書いているのを見て一度は confirmed PLAN の偽 claim と判断しかけたが、test を読んで誤りと判った。gate/test の実体を読む前に errata を宣言しないこと (#349 の green-command-digest 過剰判定と同じ轍)。**

成立する指摘 3 点: (1) wake surface の非対称はどこにも宣言されていない。codex-hook-adapter-policy.ts / codex-hook-adapter.ts を wake で全文検索して 0 件であり、claude-memory-wake は CODEX_REQUIRED / CODEX_NOT_APPLICABLE / CODEX_DEFERRED_SURFACE のいずれにも登場しない。#229 の核心は wake surface について成立する。(2) CODEX_DEFERRED_SURFACE は src 側に consumer が 0 件で tests からしか読まれない。analyzeCodexHookAdapter は CODEX_REQUIRED しか走査せず checked も CODEX_REQUIRED.length である。したがって「宣言する」だけでは doctor 出力にも exit code にも反映されず、宣言 + 描画 consumer が対で必要。(3) SSoT drift: 定義が policy.ts:79 (CodexDeferredSurface[]) と adapter.ts:61 (独自の構造体型) に二重存在し、adapter.ts は CODEX_REQUIRED を re-export する一方 CODEX_DEFERRED_SURFACE は再定義している。テストも両方を別名 import している。

提案の修正として (a) 定義の 1 本化、(b) wake surface の宣言、(c) analyzeCodexHookAdapter への consumer 追加 (advisory)、(d) U-CXHOOK-011 の oracle を「spawn_agent は deferred に含まれない」へ限定し直す、を issue へ投稿した。owner が Claude なので実装レーンは Claude 側。着手前に PLAN で pair-freeze する。

**#227 (配送 backlog が不可視)**: 未 claim entry は起票時の 7 件から 96 件へ拡大。うち 93 件が稼働セッションの無い worktree 宛。本日の取りこぼし 2 件を具体例として記録した (08-20 01:26 の P0/P1 issue queue が ut-issue344-pre-gate 宛、08-19 11:17 の claude-queue が ut-issue342-forward-fsm 宛、いずれも誰にも配送されず)。

検出側の教訓として重要: 受け手が targetWorkspaceId 一致で厳格フィルタすると、宛先ミスの entry は誰にも読まれないまま滞留する。送信側の宛先解決の不具合と受信側の厳格フィルタが二段構えの fail-open を作る。watcher のフィルタを外した直後に PR #349 dispatch receipt と PLAN-L7-477 PF3 着手通知を連続捕捉した (いずれも他 workspace 宛)。

未着手のまま残っている P0: #236 (memory 355 件未追跡、291 から悪化)、#242 (memory-sync hard gate が CI で原理的に未発火)、#203 (workspace fence が harness.db を chunk-hash)、#98 / #70 (snapshot/doctor 固定費)、#77 (snapshot fence foreign activity 誤帰責)、#124 (Stop db-refresh 上限)、#109 (CI 責務)、#131 (cross-review 委譲の素通り)。#169 / #178 の DB 粒度再設計は #124/#169 レーン (Codex train 3) 所有で Claude の担当外。
