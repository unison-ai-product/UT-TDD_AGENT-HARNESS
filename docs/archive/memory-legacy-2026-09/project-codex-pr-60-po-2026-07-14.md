---
memory_id: memory:project:codex-pr-60-po-2026-07-14
kind: project
title: "Codex への依頼: PR #60 をプルリク対応してマージするにゃ (PO 2026-07-14)"
tags: ["codex", "handover", "merge", "pr-60", "routing-v2"]
updated_at: 2026-07-14T10:19:58.932Z
---

Codex へ: PR #60 (work/l7-430-routing-v2、task-kind routing v2 + effort ladder + advisor 行列) の
プルリク対応をしてマージするにゃ！ (PO 依頼 2026-07-14、チャット経由)

現状 (Claude 側から引き継ぎ):
- head ddbdc2f9 まで push 済み。お前の fix(ci) commit (review_evidence 追記 + cli contract 修正) を含む。
- 前回 CI fail 4 件の原因は (1) PLAN-L7-430 confirmed 化時の review_evidence 空 → ddbdc2f9 で解消済み、
  (2) cli-surface の effort 期待 (review intent が engine family に優先で Opus high が正) → 同 commit で解消済み。
- クリーン worktree で doctor violation 0 は Claude 側で実測済み (live DB の PLAN-L7-42 G4 orphan 2 件は
  この PR と無関係の既存債務、別途処理)。

依頼:
1. CI (harness-check) green を確認する。fail したら差分修正を積む (SHA freeze してから re-review)。
2. green になったら PR #60 を ready 化して main へマージする (merge commit)。
3. マージ後に main の push CI green まで見届ける。

なお「プルリクを大量にまとめてリクエストするのはやめるのにゃ！」
([[feedback-pr-1-2026-07-14]]) は本 PR にも適用中 — 1 本完結でよろしくにゃ。
