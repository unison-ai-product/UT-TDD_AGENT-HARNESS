---
memory_id: memory:feedback:worktree-branch-pr-205
kind: feedback
title: "修正を委譲する前に相手ランタイムの worktree/branch を見る (PR #205 で同一論点を並行実装した)"
tags: ["2026-07-31", "codex", "coordination", "delegation", "hybrid", "pr-205"]
updated_at: 2026-07-31T05:42:13.552Z
---

2026-07-31 14:40、PR #205 (D1 review dispatch 状態機械) の FLAG 修正で **Claude と Codex が同一論点を
並行実装していた**ことを検出した。Claude 側を破棄して Codex 側を正とした。

## 実測

- Claude: `ut-review-204` で luna へ B2/B3 の修正を委譲 (+144 行、未 commit)。
- Codex: `ut-d1-review-dispatch-codex` / branch `codex/d1-review-dispatch-hardening` に
  `23a45d9d` の上へ **5 commit / +771 行**。最終 commit `6216105f` は 14:31、検出時点で作業継続中。
- **B2 / B3 は Codex 側が既に閉じており、内容が広い**:
  - B2: `invalid_timestamp` に加え `future_timestamp` も判定。`nowMs` 自体の妥当性も global reason。
  - B3: `const hasHeadMismatch = hasObservationHeadMismatch;` — receipt 由来の mismatch を
    `stale_head` から完全に外す。
- ただし Codex 側は `PLAN-L7-465` の dispatch 節 (-46 行) を削除しており、
  `src/feedback/review-dispatch.ts` と `tests/review-dispatch.test.ts` が **両方 untraced**。
  `impl-plan-trace` / `deliverable-plan-trace` の両方が fail する (現行 PR HEAD からの退行)。

## 判断

- **二重実装を push しない**。Claude 側の修正は scratchpad へ保全して破棄した
  ([[project-hybrid-runtime-coordination]] の「完了した相手ランタイム成果を引き取る」)。
- analyzer の正本 = Codex。**Claude は所有 PLAN (`PLAN-L7-470`) だけを積む**。
- closing judgement は非 author family = Claude blind-reviewer。

## 恒久教訓: 委譲前に相手ランタイムの worktree を見る

blind review が FLAG を返してから修正を委譲するまでの間に、相手ランタイムが同じ FLAG を読んで
先に直し始めることがある。**依頼メモリと PR コメントは共有されているので、相手も同じ情報を持っている**。

したがって:

1. **修正を委譲する前に `git worktree list` と `git for-each-ref refs/heads` を見る**。
   相手ランタイムの worktree / branch に同一論点の作業が無いか確認する。
   プロセス実測 (`Get-CimInstance Win32_Process` で worktree パスを含むもの) も併用する。
2. 見つけたら**着手前に PR コメントで分担を宣言する**。走ってから調整すると片方の作業が捨てられる。
3. 捨てる側になったときは、**相手の成果が自分のより狭くないか**を実測で確認してから捨てる。
   今回は Codex 側が真に superset だったので破棄が正しかったが、逆なら統合が必要だった。
4. 相手が open にしたまま残した面 (今回は PLAN 所有) を**自分が拾う**。分担の穴を放置しない。
