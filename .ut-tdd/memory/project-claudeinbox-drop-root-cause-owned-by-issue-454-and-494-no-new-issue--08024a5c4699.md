---
memory_id: memory:project:claudeinbox-drop-root-cause-owned-by-issue-454-and-494-no-new-issue--08024a5c4699
kind: project
title: "ClaudeInbox drop root cause owned by issue 454 and 494 (no new issue)"
tags: ["inbox", "review-custody", "root-cause"]
updated_at: 2026-08-31T06:06:42.207Z
---

# ClaudeInbox 取りこぼしの真因は issue #454 / #494 が既に所有している (新規起票不要)

2026-08-31 の sweep で確定した真因と、既存 issue との対応。**新しい機構を建てる前に
この 2 件を閉じるのが正しい順序**であり、重複 issue を起票してはならない。

## 真因 1 = issue #454 (generation marker の TTL 混線)

`resolveLiveClaudeWorkspace` は `.generation` marker の mtime が
`CLAUDE_INBOX_BACKLOG_WARN_AGE_MS` (15 分) を超えると `stale_claude_workspace` を返し、
`review live-dispatch` は request を永続化した後で wake publish に失敗する。
marker の writer は wake ループ開始時の 1 回のみで、ループ中 (既定 900,000ms 待機) は
一度も touch されない。**TTL と待機窓が同値**なので、workspace が fresh なのは
「Claude が idle 待機している間」だけであり、作業中の turn は丸ごと不可視になる。

実証: PR #489 の request `9777e096...` は 2026-08-31T05:56:36Z に永続化されたが、
最新 marker の mtime は 05:24Z。wake envelope は 0 件で publish されなかった。
証跡は issue #454 のコメントへ投稿済み。

## 真因 2 = issue #494 (手書き memory の frontmatter 欠落)

`ut-tdd memory add` を経由しない手書き memo は `parseMemoryFile` を通らないため、
digest の `[4/4 memory]` にも出ず、`review live-dispatch --memory-path` の起点にもできない。
primary checkout で 21 件が `memory unreadable` になっている。

## 派生 (どちらかの issue へ寄せる、単独起票しない)

- digest の render が `targetMismatchPending` を `target_mismatch` の 1 語へ潰すため、
  unclaimed 119 件が `inbox: no unclaimed Claude payload` と表示される。件数と最古 age を
  本文へ出せば読み違えは消える。
- dispatch 済みで consume されない request を検出する read model が無い
  (#463 が 3 日ゼロ検知)。`analyzeReviewDispatch` の既存突合を session-start digest の
  actionable 段へ 1 段足すだけでよい。

## sweep コマンド (read-only、恒久化は上記 issue 側で)

open PR × canonical request/receipt × inbox backlog × frontmatter 欠落 × HEAD 遅れを
1 本で出す使い捨て script を scratchpad に置いた。恒久化するなら digest へ寄せること
(別系統の read model を増やさない)。
