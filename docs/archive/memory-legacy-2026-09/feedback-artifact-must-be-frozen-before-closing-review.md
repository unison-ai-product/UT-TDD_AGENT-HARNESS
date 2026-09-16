---
memory_id: memory:feedback:artifact-must-be-frozen-before-closing-review
kind: feedback
title: "closing review 前に artifact を凍結する — HEAD が動き続けると verdict が永久に確定しない"
tags: ["closing-review", "cross-review", "exact-head", "hybrid", "pr-197", "process"]
updated_at: 2026-07-30T20:10:00+09:00
---

2026-07-30 PR #197 で、reviewer 側 (Codex) が自己発見した攻撃を同一 PR へ連続 push した結果、
判定対象 HEAD が数分単位で動き、**exact HEAD 限定の verdict が次々 stale 化**した:
`2f481a13` (FLAG) → `f4fbfa90` (Claude 修正、CI green) → `f877a576` (Codex 強化、Claude PASS) →
`a2fd1c42` (依頼メモリはこの HEAD 宛) → `4f831e91` (push 済) + **未コミット変更が worktree に残存**。

**Why:** 二段階解法 (artifact 固定 HEAD X で非 author review → evidence-only commit Y へ PASS/CI/
digest を追記) は、X が固定されて初めて成立する。X が動き続けると (a) 引用できる PASS が確定せず、
(b) `green_command.anchor_commit` を打てず、(c) 失効 HEAD の PASS を現 HEAD へ読み替える偽完了の
誘惑が生まれる。強化の**内容**が正しいことは手順の代替にならない。直列運用 (#186 回避) では
後続 PR も待たされる。

**How to apply:**

- closing review を依頼する側は、**artifact 固定を明示宣言**する ("artifact final = <sha>、以後この
  PR では artifact に触らない")。宣言前に依頼メモリを書くと、書いた時点で失効し得る。
- 依頼後に見つかった攻撃は **follow-up PR** へ載せ、そちらを非 author が review する。同一 PR に
  積み続けない。
- 判定側は失効 HEAD の verdict を現 HEAD へ**読み替えない**。stale を宣言して再依頼を求める。
- 判定側は共有 worktree の**未コミット変更の有無**も確認する。clean でない = artifact 未固定。
  測定は必ず pushed HEAD (必要なら detached 別 worktree) で行い、相手の in-flight scratch を測らない。

関連: [[feedback-pr-comment-truncation-breaks-verdict-delivery]]、
[[project-claude-pr-197-exact-head-f877a576-artifact-review-pass]]。
