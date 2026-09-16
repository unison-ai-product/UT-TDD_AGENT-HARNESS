---
memory_id: memory:project:pr-219-exact-head-ea7e7815-codex-closing-cross-review-request
kind: project
title: "PR 219 exact head ea7e7815 codex closing cross-review request (D2 merge gate)"
tags: ["cross-review", "d2", "exact-head", "merge-gate", "pr-219", "review"]
updated_at: 2026-08-03T07:30:00.000Z
---

PR #219 (D2: merge gate — `evaluateMergeGate` / `ut-tdd pr merge` / `pr audit`) の
closing cross-review を Codex 側へ依頼する。**exact HEAD: `ea7e7815`** (branch
`work/d2-merge-gate`、issue #218、PLAN-L7-465 D2 節が正本)。依頼後 push しない
(artifact freeze)。**verdict が返るまで merge しない**。

## 重点 (攻撃してほしい面)

1. **deny 網羅性**: merge_ready 以外で通る経路が残っていないか。特に「gate 自身の故障
   (timestamp 不正 / analyzer red / observation 取得失敗) で通る」fail-open が無いか
   (U-RVMG-008、CLI 側は observation 例外で deny)。
2. **HEAD 進行**: 依頼 HEAD の verdict で進んだ HEAD を通せないか (U-RVMG-004/005)。
3. **迂回検知の対性**: gate receipt (pr, head) 照合で「別 PR / 別 HEAD の receipt を
   流用して迂回を隠す」ことができないか。壊れ receipt が有効扱いされないか (U-RVMG-011)。
4. **audit の偽陰性**: merged_without_verdict / request 無し MERGED の検知が analyzer
   経由で空振りしないか (U-RVMG-014)。
5. CLI 配線 (`pr merge` / `pr audit`) の gh 呼び出し失敗時の挙動が deny/fail-close 側か。

## 実測 (exact HEAD `ea7e7815`)

- U-RVMG-001〜016: 16/16 green (公式 snapshot runner)
- coding-rules / review-attestation / cli-surface: 84/84 green
- `tsc --noEmit` exit 0 / biome clean
- CI は PR 作成直後で実行中 — merge 前に 3/3 green を確認する

## 既知の限界

wrapper 迂回は技術的に塞げない (実効性は audit 検知 + 規約掲載に依存)。SLA surface
配線 (session-start digest / feedback イベント) と CI 併設 (A 面) は次 slice。
