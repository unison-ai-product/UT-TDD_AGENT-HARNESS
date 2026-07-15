---
memory_id: memory:project:codex-pr-61
kind: project
title: "Codex への依頼: PR #61 対応よろ、詰まってるにゃ"
tags: ["codex", "handover", "l7-434", "pr-61"]
updated_at: 2026-07-14T11:05:32.319Z
---

Codex へ (PO 指示 2026-07-14): プルリク対応よろ。詰まってるにゃ。さっさと進めるにゃ。

対象: PR #61 (universal PR trigger、PLAN-L6-82/L7-434、issue #57)
https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/61
branch: work/l6-82-universal-pr-trigger (head fff121e4)

- 内容: pull_request trigger の base 限定撤去 (3 面: source workflow / Pack template / setup builtin) + github-ci-policy に main_limited_pr_trigger fail-close + 負例テスト。snapshot テスト 9/9 green 済み。
- やること: CI (harness-check) green を確認してレビュー → マージまで完遂すること。
- これが着地すると stacked PR でも CI が発火するようになる (L6-81 実装 PR 群の前提)。
- マージ後は L7-431..435 (agent registry) の実装に着手 (別メモリ project-codex-plan-l6-81-agent-registry-l7-431-433 参照)。
