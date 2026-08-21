---
memory_id: memory:project:p0-task-pack-harness-db-4-73gb-root-cause-is-per-turn-token-run-rows-from-external-codex-session-history-97-5-percent-of-all-rows
kind: project
title: "P0 task pack: harness.db 4.73GB root cause is per-turn token-run rows from external codex session history, 97.5 percent of all rows"
tags: ["harness-db", "issue-169", "issue-178", "p0", "task-pack", "token-telemetry"]
updated_at: 2026-08-19T09:23:54.208Z
---

P0 (Forward 外) runtime/DB runaway 再監査の結果と Task Pack。exact main HEAD 21c4e03d382173f5343abd629fa3c49c9639a56e、2026-08-19 実測。Issue #169 / #178 / #203 / #98 / #109 の共通根を特定した。

## 根因 (実測、仮説ではない)

.ut-tdd/harness.db = 4,734,074,880 bytes (4.73GB)。node:sqlite (readOnly) で全 85 table の行数を実測: 総 8,187,980 行のうち **model_runs が 7,985,466 行 = 97.5%**。次点は feedback_lifecycle 98,279、hook_events 27,929。

model_runs の内訳をさらに実測: **7,984,539 行 (99.99%) が plan_id 空**。run_id は distinct 7,985,466 で重複ではない。空 plan_id 群の実体は `token-run:<runtime>:<sessionId>:<turnIndex>` で、role="session"、drive/plan_id/started_at/completed_at がすべて空。runtime 内訳は codex 7,957,038 / claude 27,501。model 内訳は gpt-5.6-sol 6,143,414 / gpt-5.6-terra 1,452,999 / gpt-5.6-luna 283,473。evidence_path 上位は単一 rollout ファイルで 24,155 行 / 24,002 行 / 23,983 行。

生成経路: src/state-db/token-tracker.ts が session JSONL を 1 行ずつ走査し assistant turn ごとに RunUsage を push (turnIndex = turn++)。src/state-db/projection-writer.ts:695 projectTokenUsage がその 1 件ごとに model_runs 行を 1 行書く。走査対象は process.env.UT_TDD_CODEX_SESSIONS_DIR ?? join(homedir(), ".codex", "sessions") で、**repo 外の外部履歴**。実測 2,374 個の .jsonl が存在する。

つまり **DB サイズは repo の履歴ではなく、ローカルマシンに溜まった外部 session 履歴の総 turn 数に比例して無制限に増える**。#178 の「太らせているのは派生イベント」仮説は正しく、正体は token-run 行だった。#169 の 4.4GB → 4.73GB の増加も、この経路が今も動いていることの帰結。

## 不変条件 (これを破らない実装のみ受理する)

1. **DB サイズは repo 履歴に対して有界であること**。外部 session 履歴の件数に比例して増えてはならない。
2. **token/cost 集計の分析価値を落とさないこと**。runtime / model / session 単位の合計と cost が引ければ、turn 単位の行は不要 (現に plan_id / started_at / completed_at が空で、turn 行は時系列分析にも使えていない)。
3. **非破壊**。既存 DB を DELETE / DROP しない。projection は再生成可能なので、退避 (rename) + rebuild で復旧する。
4. **fail-close**。取り込み件数が上限を超えたら「黙って書き続ける」のではなく typed error で停止する。上限超過を silent truncation にしない。

## fail-close 修正契約

- C-1: `projectTokenUsage` は **(runtime, sessionId, model) 単位の集約行**を書く。turn 単位の行を書かない。run_id は `token-session:<runtime>:<sessionId>:<model>` とし、input/output/cached/reasoning/cost を合算する。
- C-2: 1 回の projection で書く token 集約行数に上限を設け、超過は `token_projection_overflow` の typed error で fail-close する (件数は実測で決める。現状 2,374 session × model 数が上界)。
- C-3: 外部 session ディレクトリの走査範囲を明示契約にする (env で差し替え可能な現状を維持しつつ、既定の走査上限と対象期間を宣言する)。
- C-4: 既存 4.73GB は削除でなく **退避 + rebuild** で解消する。rebuild 後のサイズを実測し、正常値 (約 62MB) との差分を evidence に残す。

## 最小実装単位 (1 単位 = 1 PR、所有を重複させない)

- **U-1 (所有: Issue #178)**: `projectTokenUsage` の集約化 (C-1) + 既存 turn 行の rebuild 時消滅を回帰で固定。触る source は `src/state-db/projection-writer.ts` と `src/state-db/token-tracker.ts` の 2 本のみ。
- **U-2 (所有: Issue #178)**: 上限と typed error (C-2 / C-3)。U-1 と同じ source なので **U-1 の後に直列**。
- **U-3 (所有: Issue #169)**: 退避 + rebuild 手順と実測 (C-4)。source 変更なし、運用手順 + evidence。
- **U-4 (所有: Issue #98 / PLAN-L7-463)**: nested snapshot 固定費。**本 pack のスコープ外** — 既に PR #340 で before 実測を固定済みであり、実装は L7-463 の降下で行う。ここに混ぜない。

**既存所有との重複回避**: `PLAN-L7-457-fence-stream-hash-db-vacuum` (status: confirmed) が fence stream hash と DB vacuum を既に所有しているため、**U-1〜U-3 で vacuum 機構を再実装しない**。U-3 は L7-457 の vacuum を呼ぶ運用手順に留める。`PLAN-L7-192-db-telemetry-provenance-enforcement` (confirmed) が telemetry provenance を所有しているので、provenance の意味論変更も本 pack では行わない (集約単位の変更のみ)。

## ルーティング

実装 (U-1 / U-2) は **gpt-5.6-luna** へ明示ルーティング。U-3 は運用手順なので同じく Codex 側で可。**Opus (Claude) は非著者 blind closing review を担当**し、実装は書かない。PR #340 (docs) へ実装を混ぜない。

## 検証で使う evidence

再現コマンド (readOnly、DB を壊さない):
node -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(".ut-tdd/harness.db",{readOnly:true});console.log(db.prepare("select count(*) c from model_runs").get().c, db.prepare("select count(*) c from model_runs where plan_id = \x27\x27").get().c)'

after 側は同じコマンドで行数を測り、DB ファイルサイズと合わせて before (7,985,466 / 7,984,539 / 4.73GB) と比較する。prose 断定は禁止。

## スコープ境界

Forward R3/R4/FSM/Episode へ広げない。データ削除・DB 破壊を行わない。#203 の fence 側対策 (volatileRuntimeIndex による harness.db 一族の content hash 除外) は既に landed 済みであることを tests/support/git-workspace-fingerprint.ts:26-30 で確認済みなので、本 pack では触らない。
