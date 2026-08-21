---
memory_id: memory:feedback:p0-diagnosis-at-exact-main-7dbfa4fd-harness-db-4-41gb-is-100-live-data-from-per-turn-token-run-rows-issue-178-confirmed-vacuum-l7-457-is-the-wrong-lever
kind: feedback
title: "P0 diagnosis at exact main 7dbfa4fd: harness.db 4.41GB is 100% live data from per-turn token-run rows (issue #178 confirmed, VACUUM/L7-457 is the wrong lever)"
tags: ["diagnosis", "exact-main-7dbfa4fd", "harness-db", "issue-169", "issue-178", "issue-227", "issue-236", "p0"]
updated_at: 2026-08-20T02:27:30.963Z
---

Claude が exact main 7dbfa4fd491c6783f8f46fcde930553b6299ae83 で issue #169 / #178 (harness.db 肥大) の根本原因を実測診断した。Task Pack U-1 (memory:feedback:claude-task-u-1-token-run-projection-aggregation-for-issue-178) が要求する「Opus が不変条件と修正契約を先に診断・固定する」段の成果である。実装は未着手のまま (Luna 未発火)。

測定 (2026-08-20、.ut-tdd/harness.db):
- 物理サイズ 4.41GB (page_size=4096 / page_count=1,155,780)。
- **freelist_count = 0、freelist 比率 0.0%**。すなわち空きページ由来の肥大ではなく、4.41GB 全量が live data である。
- 85 table 中 model_runs が 7,985,466 行で突出 (次点 feedback_lifecycle 98,279 行、hook_events 27,929 行)。
- model_runs のうち **7,984,539 行 (99.99%) が started_at 空・plan_id 空**で、run_id は `token-run:<runtime>:<sessionId>:<turnIndex>` 形式。PLAN 紐付きの正規 `model-run:<plan>:<n>:<role>:<model>` 行は 927 行しかない。
- runtime/model 内訳: codex/gpt-5.6-sol 6,143,430 / codex/gpt-5.6-terra 1,453,005 / codex/gpt-5.6-luna 283,479。

診断:
1. **VACUUM は肥大の対策にならない**。PLAN-L7-457 (status=confirmed、2026-07-22、issue #118) は freelist 81% / 2.5GB を根拠に rebuild 後の条件付き自動 VACUUM を実装し、実測 3.07GB→534MB を達成した。その契約は現在も有効に機能しており (freelist=0 がその証拠)、それでも 4.41GB へ再肥大している。つまり #169 の「incident 残置」という framing では閉じない。L7-457 を再実行・強化しても効果はゼロである。
2. **真因は per-turn token telemetry の無制限 projection** であり、issue #178 の主張 (肥大させているのはファイル本文でなく派生イベント) が実測で裏付けられた。書き込み点は `src/state-db/projection-writer.ts:702` の `stableId("token-run", ${u.runtime}:${u.sessionId}:${u.turnIndex})` で、1 セッション 1 ターンあたり 1 行を PRIMARY KEY 付きで永続化する。retention も上限も無い。
3. **所有境界**: #178 と #203 は github_issue_id を持つ owning PLAN が存在しない (未所有)。#169 は PLAN-L4-34 / PLAN-L7-460 / PLAN-L7-473 が言及するのみ。PLAN-L7-460 (db-refresh resource guardrails) は status=draft、PLAN-L7-457 は confirmed だが上記のとおり別レイヤの問題を閉じている。したがって U-1 の実装は L7-457 の再実装ではなく、projection の粒度契約という新しい論点であり、既存 PLAN の拡張先としては L7-460 が最も近い。
4. 修正契約 (Task Pack U-1 の範囲): `projectTokenUsage` を (runtime, sessionId, model) 単位へ集約し run_id を `token-run:<runtime>:<sessionId>:<model>` にする。変更 source は `src/state-db/projection-writer.ts` と `src/state-db/token-tracker.ts` の 2 本に限定。不変条件は (a) 既存 turn 行が rebuild 時に消滅すること (回帰テストで固定)、(b) 集約後も runtime/model 別の token 合算値が保存されること、(c) PLAN 紐付き `model-run:` 行 927 件に影響しないこと。U-2 (上限/typed error)、U-3 (既存 DB 退避/rebuild)、#340 snapshot 固定費、Forward FSM は混ぜない。

副次観測 (#236 memory hygiene): `.ut-tdd/memory` はディスク上 500 ファイル、git 追跡 145 ファイルで **355 件が未追跡**。issue #236 記載時点の 65→291 からさらに悪化しており、共有正本が他ランタイムから不可視な状態が拡大している。

配送事故 (#227 の実例、本セッションで観測): 2026-08-20T01:26:05 に publish された P0/P1 issue queue (memory:feedback:forward-p0-p1-issue-queue-memory-bus-snapshot-db-resource) は targetWorkspaceId が `C:/Users/micro/ut-issue344-pre-gate` 宛であり、稼働セッションのある root workspace には配送されなかった。同様に 2026-08-19 の claude-queue-non-forward-critical-backlog も `C:/Users/micro/ut-issue342-forward-fsm` 宛で未配送。inbox の未 claim entry は 96 件で、うち 93 件が稼働セッションの無い worktree 宛である。publish 成功と配送成立が乖離するという #227 の主張は現時点でも再現する。

本診断では編集・commit・PR・merge を行っていない。次段は Task Pack U-1 の定める順序どおり gpt-5.6-luna による実装であり、その後 Opus 非著者 blind closing に戻す。
