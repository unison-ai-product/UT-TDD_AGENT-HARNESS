---
memory_id: memory:project:claudeinbox-review-custody-dropped-item-mechanisms-2026-08-31
kind: project
title: "ClaudeInbox review custody dropped-item mechanisms 2026-08-31"
tags: ["inbox", "process-gap", "review-custody"]
updated_at: 2026-08-31T06:00:36.640Z
---

# ClaudeInbox / review custody の取りこぼし機構 (2026-08-31 実測)

open PR 全 5 件 (#442 #463 #478 #489 #492) を canonical review store と inbox の両面から
突き合わせた結果、**判定要求が機械経路から落ちる経路が 4 つ**実在する。個別 PR の当否とは
別の、機構側の欠陥として記録する。

## 1. PR #463 の review 要求が 3 日間 receipt なしで滞留 (実害・最優先)

`.ut-tdd/review/requests` を全 linked worktree 横断で走査した実測:

| requestedAt | PR | exactHead | receipt |
|---|---|---|---|
| 2026-08-28T04:01:24Z | #463 | `c462007b` | **なし** |
| 2026-08-28T04:09:55Z | #463 | `3be4a18c` | **なし** |
| 2026-08-28T04:39:03Z | #463 | `84c0d14e` | **なし** |

`ut-tdd review live-dispatch` は request を書いたが、対応する
`ut-tdd review live-consume` が一度も走っておらず、Claude 側の wake も残っていない
(inbox の purpose=review envelope は 2026-08-28T11:10:25Z の #483 分が最後)。
dispatch したが consume されなかった request を検出する仕組みが無いため、
3 日間ゼロ検知だった。

さらに #463 head `84c0d14e` の merge-base は `3794a151` (PR #459) であり、現 main
`7cc60772` の子孫ではない。exact HEAD に対する closing review は rebase 前には無意味なので、
**rebase → 新規 live-dispatch** が正しい復旧手順である。

### 恒久対策の候補

`analyzeReviewDispatch` は既に request/receipt の突合を持つので、
「open PR の最新 request に receipt が無い状態が N 分継続」を session-start digest の
actionable 段へ出すだけで検出できる。新規機構ではなく既存 read model への 1 段追加。

## 2. 現行 exact HEAD に canonical request が 1 件も無い (merge 経路が閉じている)

2026-08-31 時点で `.ut-tdd/review/requests` に存在する最新 request は
PR #489 `0baf7570` (05:01Z) のみ。以下は **request も receipt も存在しない**:

- #442 `d127defa` / #478 `8a7dd2c1` / #489 `117f0f7c` / #492 `54eb3cb1`

`evaluateMergeGate` は当該 exactHead の `merge_ready` entry が無ければ deny するので、
Sol / Opus の verdict が出揃っても `ut-tdd pr merge --pr <N>` は必ず deny する。
判定は prose memory にしか無く、機械側は「未 review」と同じ状態にある。
verdict を出す前に `review live-dispatch` を必ず先行させること。

## 3. 手書き memory の frontmatter 欠落が dispatch と digest の両方を殺す

`session start` digest が `memory unreadable: ... memory frontmatter is required` を
20 件報告している (#442 #478 #483 #489 #492 の最新依頼を含む)。原因は
`ut-tdd memory add` を経由しない手書き作成。影響は 2 系統:

- digest の `[4/4 memory]` 段に出ないので、引き継いだ session が最新依頼を見落とす。
- `review live-dispatch --memory-path` は `parseMemoryFile` を通すため、
  frontmatter が無い memo は **canonical dispatch の起点にできない**。
  上記 2 の「request が無い」の直接原因がこれである。

CLAUDE.md §Hybrid 多ランタイム commit 協調 の「メモリファイルの手書き作成は禁止」は
既存ルールであり、新規ルールではなく遵守の問題。

## 4. ClaudeInbox は 119 件が target_mismatch で滞留

`summarizeUnclaimedInbox` の実測: unclaimed 119 件、すべて
`targetWorkspaceId !== 現 workspace` のため `inbox: no unclaimed Claude payload` と表示され、
警告は `target_mismatch` / `session_absent` の 2 語だけ。最古は 2026-08-24T05:50Z。
terminal GC (PLAN-REVERSE-600) が回収できたのは 14 件のみ。

digest の文言が「no unclaimed Claude payload」なので、**119 件滞留を「空」と読み違える**。
`targetMismatchPending` は summary に載っているのに render で 1 語に潰れている。
最低限、件数と最古 age を digest 本文へ出すべき。

## 5. primary checkout が main から 39 commit 遅れ

`runtime/primary-main-20260827` = `44416e18` (PR #452) に対し `origin/main` = `7cc60772` (PR #491)。
review 用 worktree (ut-issue488-f0b-pregate / ut-issue471-s1a-readiness / ut-issue470-s1b-generated)
は各 PR の exact HEAD に一致しているので review 自体は worktree 側で成立するが、
primary で `git log` / test を回すと現状と乖離する。
既存 memo `feedback-issue-434-primary-checkout-repaired-claude-workspace-restart-required` と同根。
