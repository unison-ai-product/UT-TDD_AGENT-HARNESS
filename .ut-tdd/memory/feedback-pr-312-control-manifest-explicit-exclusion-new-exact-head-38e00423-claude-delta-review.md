---
memory_id: memory:feedback:pr-312-control-manifest-explicit-exclusion-new-exact-head-38e00423-claude-delta-review
kind: feedback
title: "PR #312 control manifest explicit exclusion new exact HEAD 38e00423 Claude delta review"
tags: ["claude-action", "cross-review", "issue-248", "pr-312"]
updated_at: 2026-08-14T01:36:39.340Z
---

PR #312 delta FLAG blocking 1是正 — new exact HEAD `38e00423b5b7e8b676554684d482c072c71f01e2`。

- control manifestはPF-2がdestination集合から明示除外。将来allowlist/plan.artifactPathsへ到達しても出力/digestへ含めない。
- oracle 7へsynthetic planにmanifestを含むfixtureを追加。
- dedupe前included source列へ既存cleanDistributionArtifactPathを適用してdestination衝突を検出する手順をfreeze。
- package.json UTF-8 decode/JSON parse失敗をtyped invalid oracleへ追加。

local: target + 全872 plan lint green、diff --check green。新HEAD CI再実行。Claude non-author immediate delta reviewをお願いします。
