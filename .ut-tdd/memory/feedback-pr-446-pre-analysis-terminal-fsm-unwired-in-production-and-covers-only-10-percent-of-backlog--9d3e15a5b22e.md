---
memory_id: memory:feedback:pr-446-pre-analysis-terminal-fsm-unwired-in-production-and-covers-only-10-percent-of-backlog--9d3e15a5b22e
kind: feedback
title: "PR 446 pre-analysis: terminal FSM unwired in production and covers only 10 percent of backlog"
tags: ["inbox-terminal", "issue-444", "pr-446", "pre-analysis"]
updated_at: 2026-08-27T08:42:08.572Z
---

PR #446 (draft) の Claude 側 **事前分析** (正式 verdict ではない)。型設計と fail-safe の方向は
妥当だが、現状のままでは Issue #444 の closure condition を満たさない。重い順に 3 点。

## 1. 本番経路に配線が無く、merge しても症状が止まらない

- `src/cli.ts:1205-1209` の `hook claude-memory-wake` は `pullRequestState` を渡していない
  (この PR は `src/cli.ts` を変更していない)。
- `recoverClaudeInboxBacklog` は **src/ 内の呼出元 0 件**、CLI subcommand も未定義。
  実測: `git grep -n "recoverClaudeInboxBacklog" -- src/` は定義行 (`claude-memory-wake.ts:576`) のみ。
  `pullRequestState` も `claude-memory-wake.ts` の中にしか現れない。
- 結果、merge 後の本番挙動の変化は「claim 時に `.terminal.json` を 1 本余計に書く」だけ。
  claim 経路は元々 inbox JSON を unlink するので、実効的な再配信抑止はゼロ。
- PLAN-REVERSE-600 §R3 の「CLI/SessionStart adapter が observation port を渡す」は
  **差分に存在しない主張** (`coding ≠ substance`)。

## 2. 対象母集団が backlog の約 10% で、今日実際に再配信されたエントリは全部対象外

inbox 実測 (読み取りのみ):

| 区分 | 件数 | 本 PR で終端可否 |
|---|---|---|
| v3 / `purpose=memory` | 154 | **不可** (設計上の除外) |
| v2 legacy | 6 | **不可** (設計上の除外) |
| v3 / `purpose=review` | 18 | observation を与えれば可 |
| 計 | 178 (decode 通過 ≒175、malformed 9) | |

- `.claim` は 76 本あるが **inbox JSON との stem 一致は 0 件** (claim 時に unlink するため)。
  よって `reason=claimed` による backlog 回収は **0 件**。
- 本日 Stop hook が再配信した PR #440 系エントリは
  `memory:feedback:pr-440-claude-pass-receipt-ready-at-a334f2e4` 等で **すべて `purpose=memory`**。
  `evaluateClaudeInboxTerminal` は `purpose !== "review"` で即 `{terminal:false}` を返し、
  U-MEMTERM-002 がこれを仕様として固定している。つまり**実害の中心が仕様として除外されている**。
- 既存の `RETENTION_MS = 7日` prune が既に効いており (最古 2026-08-20)、backlog は
  「7 日ローリング窓で常時 ~175 件」。本 PR を入れても窓の中身は 90% 残るので、
  体感の再配信頻度はほぼ変わらない。

**設計判断点**: purpose 横断の dedup キー (memory_id + pr + exactHead) を terminal FSM の
一次キーに据えるか。現状は同一 memory_id の memory/review 二重保持に対し review 側だけ
marker が付き、**非対称が固定化**される。

## 3. CI 赤は governance hard gate

```
doctor: merged-plan-status - violation: PLAN-REVERSE-600-claude-inbox-terminal-gc は
  status=draft (未 confirm) なのに generated deliverable が landing:
  tests/claude-memory-terminal-gc.test.ts
```

CLAUDE.md §PLAN Filing Rules の「draft PLAN の `generates` に既存ファイルを書かない」に
正面から当たっている。Windows は pass、Linux fail、集約 fail。

## その他 (中〜軽)

4. **malformed entry 9 件に typed な受け皿が無い**。`memory:{project,feedback}:pr--a24f53fc7dfb`
   (PR 番号欠落) が 6 workspace に散在。`readInbox` は decode 失敗を無言で捨てるだけで
   warning code も terminal reason も付かない。`quarantined` / `undecodable` reason と、
   publish 側の引用符サニタイズ (二重引用符リテラル残存 / body の空白切断) が別途必要。
   これは publish 経路のバグなので #444 とは別起票が妥当。
5. **`.terminal.json` の無限増殖**。`pruneRuntimeFiles` が明示除外する一方、参照先の inbox JSON は
   7 日で消えるため marker は「存在しないエントリの墓標」として増え続ける (実測ペース ~25 件/日)。
   `terminalIds()` は marker 全件を `readdirSync`+`JSON.parse` し、`waitForClaudeMemory` の
   **poll 毎回** (2 秒間隔 × 最大 900 秒 = 最大 450 回) と SessionStart から呼ばれる。
6. **observation port に呼出制御が無い**。poll ごとに inbox 全件 × `pullRequestState(pr)` を
   無キャッシュで呼ぶ。実 `gh` を挿すと 175 件 × 450 回 の外部 API 呼出になり得る。
   port 契約として「1 wake サイクル内で PR あたり 1 回」を型か実装で保証すべき。
7. **PR 本文の検証コマンドが実在しないパスを指す** — `PLAN-REVERSE-4440-...` は
   実ファイル `PLAN-REVERSE-600-...` と不一致。検証記録として成立していない。
8. `summarizeUnclaimedInbox` の `terminalized` は workspace で絞らず全 workspace の terminal を
   数えており、`pending` / `targetMismatchPending` が workspace 絞り込み済みなのと粒度が揃っていない。

## テスト欠落 (主要)

- CLI hook が observation port を渡す配線 — **実装もテストも無い** (本番で終端が発火しないことを誰も検出できない)
- `recoverClaudeInboxBacklog` の CLI 到達性 (dead export)
- `purpose=memory` backlog の終端 (#444 の症状の大半)
- malformed / undecodable entry の隔離
- `.terminal.json` の retention / prune 除外の回帰
- 不正 observation (pr 不一致・非 40hex・state 未知) の負 oracle — PLAN §R3 が
  「mutation 相当の負 oracle を実行」と書いているが該当ケースが無い
- 破損 `.terminal.json` を `readTerminalMarker` が拒否する (検証ロジックは厚いのにテストが無い)
- digest の `terminalized=N` 表示

## スコープ外として別起票すべき 2 件

**(a) `stale_claude_workspace`** — 本 PR の差分は `claude-memory-wake.ts:540-578` の
live workspace routing を**一切触れていない** (PLAN 本文にも語が出ない)。
機序: generation marker は `waitForClaudeMemory` の**開始時に 1 回だけ書かれ、ループ中に touch されない**。
判定側は mtime > 15 分で stale 扱いし、全 marker stale なら `stale_claude_workspace` を返して
live-dispatch が fail-close する。つまり **Claude が能動的に作業していて Stop hook 待機に
入っていない時間が 15 分続くと、生存しているのに stale 判定になる**。
これが本日 PR #445 の v3 envelope 取りこぼしの機序であり、#444 とは**因果が独立**
(#444 = 入った後に出られない、#445 = そもそも入れない)。
併せて backlog の宛先 workspace が **40 種類**に散っており、大半は受け取り手が消滅済みで
永久に unclaimable であることも実測した (現 workspace 宛はわずか 8 件)。
推奨スコープ: (1) marker のハートビート更新または liveness の別根拠、(2) fail-close 時に
review request を落とさない退避経路、(3) 宛先 workspace 消滅エントリの typed 終端 (`workspace_retired`)。

**(b) publish 経路の引用符バグ** — 上記 4 の malformed 9 件の生成源。

現 PR に混ぜるのは §PR スコープ規律 (1 PR = 1 論点) 違反になるため、追加ではなく分離が正解。
