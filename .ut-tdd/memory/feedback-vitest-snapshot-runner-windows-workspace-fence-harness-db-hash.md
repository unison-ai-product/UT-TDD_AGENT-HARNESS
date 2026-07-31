---
memory_id: memory:feedback:vitest-snapshot-runner-windows-workspace-fence-harness-db-hash
kind: feedback
title: "vitest snapshot runner の Windows ハングの根本原因は workspace fence が harness.db を hash していること (旧メモリの訂正)"
tags: ["2026-07-31", "fence", "harness-db", "issue-169", "issue-203", "root-cause", "vitest", "windows"]
updated_at: 2026-07-31T02:05:22.540Z
---

**旧メモリの訂正**: `feedback-official-vitest-snapshot-runner-hangs-after-test-child-start-on-windows`
(2026-07-30、主 worktree に未コミットのまま残置) の「test child start 後にハングする」は**誤り**。
ハングは **test child が起動する前**の workspace fence 前処理で起きている。以後この現象は本メモリを正本とする。

## 根本原因 (2026-07-31 実測、issue #203)

`tests/support/git-workspace-fingerprint.ts` の `captureWorkspaceInventory` は、**root 直下の
`.git` と `node_modules` だけ**を除外して worktree 全体を再帰走査し、すべての通常ファイルを
chunk-hash する。`.gitignore:39` に載っている生成物 `.ut-tdd/harness.db` も**走査対象**。
`tests/global-setup.ts` はこれを fence root と HEAD snapshot root の 2 か所に対し、
テスト前後で実行する (最大 4 回のフル hash)。

したがって `.ut-tdd/harness.db` が GB 級に肥大していると、**vitest は 1 件もテストを開始しないまま
fence の hash で張り付く**。「無出力ハング」の正体はこれ。

## 実測 (変数は DB の有無だけ)

| 条件 | 結果 |
| --- | --- |
| DB あり (3.4GB)、直接 vitest | `workspace fence failed reading .ut-tdd/harness.db (3447660544 bytes): EBUSY: resource busy or locked, read` |
| DB あり、公式 runner | 184 秒無出力で timeout (exit 124) |
| **DB 除去後、公式 runner (同一テスト)** | **11 tests passed / 22.88s / RUNNER_EXIT=0** |

DB 肥大の原因は runaway `session db-refresh`: worktree 作成直後に起動した
`bun <worktree>/src/cli.ts session db-refresh --generation <uuid>` が 27 分走り続け、
`.ut-tdd/harness.db` を 1.0MB → **3.78GB** へ膨らませた (主 worktree 側は 4.66GB)。
2026-07-27 incident の**再発**であり、`PLAN-L7-460` の guardrail は効いていない。
肥大中のファイルは `mv` に対し `Device or resource busy` を返す。

## どう振る舞うべきか

1. **「runner がハングした」と判定する前に `ls -la .ut-tdd/harness.db` を見る**。GB 級なら
   ハングではなく hash 待ちである。retry storm を作らない。
2. 復旧手順: 走っている `session db-refresh` プロセスを **exact command line で特定して停止**し
   (`Get-CimInstance Win32_Process` で `src/cli.ts session db-refresh` を含むもの)、
   その worktree の `.ut-tdd/harness.db` と `harness.db-journal` を削除する。DB は生成物なので
   削除は非破壊。次回起動時に再投影される。
3. **サイズ閾値で fence を skip する形の「対策」を採らない** — 大きいファイルほど見逃す
   fail-open の看板替えになる。除外するなら「生成物である」という理由で除外する
   (git check-ignore ベース、または stat fingerprint への切り替え)。設計判断は issue #203。
4. DB 由来の数値 (rows / gate 集計 / digest) を、肥大中や rebuild 中に読んで判断根拠にしない。
   session-start digest が `no such table: gate_runs` で DEGRADED になるのは
   「引き継ぎ情報が無い」ではなく「index が読めなかった」。

## 波及

issue #169 (harness.db 4.4GB)・#98 (snapshot runner 固定費)・#70 (doctor full が長すぎる)・
#77 (fence が相手ランタイムの並行活動を誤帰責) は**共通根を持つ**。
「ローカルで公式 runner の green が取れない」= close 条件 (実測 green) を出せない、という
前進阻害の実体はここにある。
