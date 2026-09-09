---
memory_id: memory:feedback:pr-446-exact-head-6432c1f7-claude-closing-review-flag-blocking-3
kind: feedback
title: "PR 446 exact head 6432c1f7 Claude closing review FLAG blocking 3"
tags: ["closing-review", "flag", "issue-444", "pr-446"]
updated_at: 2026-08-27T09:22:28.911Z
---

PR #446 exact HEAD `6432c1f74de9cd5f263e2c41e60927c639832f8e` の Claude non-author closing review。

**Verdict: FLAG / blocking 3**
receipt digest `abce6f0d2c133a12b3616c97c87acda09234c308d5068f7999f4fe2c780c3064`

## blocking 1: observation port が poll ループ内で無制御に呼ばれる

`waitForClaudeMemory` は `pullRequestState` port を poll ループ内 (`const inbox = readInbox(...)` 直後の
`for (const candidate of inbox)` ブロック) で **cache / memoization / backoff なし**に呼ぶ。
production の port は `src/cli.ts` の `observeClaudeInboxPullRequest` = **同期の
`execFileSync("gh", ["pr","view",...])`** であり、Stop hook `claude-memory-wake` に配線されている。

出荷既定 (poll 2000ms / max 900000ms = 約 450 iteration) と、この HEAD での実測 backlog
(inbox 166 件、うち `purpose=review` 15 件 / 9 PR) を掛けると、**Stop hook の 1 wake 窓あたり
数千回の同期 subprocess spawn と GitHub API 呼出**になる。event loop を塞ぎ、API rate budget を焼く。

## blocking 2: terminal marker 自身が GC されない

`pruneRuntimeFiles` が `.terminal.json` を**無条件に skip** する
(`if (name.endsWith(".terminal.json")) continue;`) 一方、marker が参照する inbox JSON は
`RETENTION_MS = 7 日` で prune される。よって marker は単調増加し、**永久に orphan 化**する。
さらに `terminalIds(root)` はこの増え続ける集合を `readdirSync` + `readFileSync` + `JSON.parse` で
**`waitForClaudeMemory` の poll 毎回**と `summarizeUnclaimedInbox` / SessionStart digest の
描画毎回に再走査する。

## blocking 3: U-MEMTERM-004 の pair-frozen oracle が実測を伴っていない

`docs/test-design/harness/L7-unit-test-design.md` の U-MEMTERM-004 は、注入した MERGED observation が
「marker/receipt evidence を保持し、summary の pending から除外する」と宣言している。
しかし `tests/claude-memory-terminal-gc.test.ts` の U-MEMTERM-004 は
**`result.kind === "timeout"` と `existsSync(inbox json)` と `src/cli.ts` のソース文字列に対する
regex 2 本しか assert していない**。terminal marker が書かれたことも、永続化された receipt identity も
assert せず、`summarizeUnclaimedInbox` を一度も呼ばない。よって wake 経路の marker/receipt write に
**asserting oracle が存在せず**、PLAN R3 の「marker 保持を test が確認する」という主張は根拠がない。

同 case は `pollIntervalMs 10` / `maxWaitMs 20` (約 2 iteration) を使っており、
**blocking 1 の per-poll observation コストが suite から不可視になっている**理由でもある。

## 補足 (非 blocking)

receipt 本文に取り込まれた test-design の日本語が mojibake 化している
(`marker/receipt evidence を保持し…` が `evidence��ێ����A…` として記録されている)。
verdict の判断には影響しないが、verdict file の encoding 経路に Shift-JIS 誤読が
混入している可能性がある。

## 事前分析との対応

2026-08-27 の事前分析で挙げた懸念のうち、blocking 1 / 2 が closing review で blocking へ確定した。
事前分析で挙げた「本番経路に配線が無い」は本 HEAD で解消されている
(`observeClaudeInboxPullRequest` が `src/cli.ts` に実装され Stop hook へ配線された)。
ただしその配線が blocking 1 のコストを本番で発生させる形になっている。
