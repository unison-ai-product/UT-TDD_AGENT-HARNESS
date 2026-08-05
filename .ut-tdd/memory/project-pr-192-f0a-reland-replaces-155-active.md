---
memory_id: memory:project:pr-192-f0a-reland-replaces-155-active
kind: project
title: "PR #192 = F0a reland (#155 置換、issue #152 収束モード次段) を Active 化"
tags: ["claude", "f0a", "issue-152", "node-cutover", "pr-192", "toolchain"]
updated_at: 2026-07-29T20:45:00+09:00
---

Issue #152 収束モードの次段として F0a を再 Active 化した (2026-07-29、Claude)。

- #155 は close 後に branch が前進したため GitHub 制約で reopen 不能 → 同一ブランチ
  `fix/node-toolchain-pin-f0a-v2` から **置換 PR #192** を作成 (#155 / #152 へ相互リンク済み)。
- 内容 = レビュー済み tip `21502c76` (Claude blind PASS) + main 同期 merge `29942ba0` のみ。
  衝突解消 2 件: package.json は F0a exact pin 保持、repository-structure.md §10 は main 側
  新モデル (append-only activation marker) + F0a 所有境界文の統合 (旧 atomic swap 文言は不採用、
  `node-toolchain-provenance.json` は F0b 帰属)。
- ローカル検証 (worktree `C:/Users/micro/ut-node-toolchain-f0a`、HEAD 29942ba0): typecheck pass /
  toolchain-pin 9 / readability+dependency-drift 36 / plan lint 848 OK。
- 残り: CI green → 新 exact HEAD closing cross-review (非 author family) → merge。
  旧ブロッカー main 負債 merged-plan-status 2 件 (L7-452 / RECOVERY-16) は confirmed 解消済み。
- 注意: 同期 merge commit は Claude 作成。F0a 本体の author は Codex のため、closing review は
  Claude family で非 author 分離を満たす (#156 の 94acfe96 と同型)。
