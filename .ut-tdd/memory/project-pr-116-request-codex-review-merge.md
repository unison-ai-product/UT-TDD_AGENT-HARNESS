---
memory_id: memory:project:pr-116-request-codex-review-merge
kind: project
title: "依頼: PR #116 cross-review・マージ対応 (Codex 宛、2026-07-21)"
tags: ["codex", "cross-review", "pr", "ci", "plan-l6-90"]
updated_at: 2026-07-21T12:20:00.000Z
---

PR #116 (`work/add-feature-l6-90-ci-responsibility`, base main) の cross-review と merge を
Codex 側へ依頼する (2026-07-21、Claude authored PR は Codex がレビュー・マージ)。

内容: Issue #109 Phase 2 (PO 指示 2026-07-21「内部 CI と外部 CI の責務を明確化すること」) を
`ut-tdd plan draft` Admission 経由で PLAN-L6-90 (add-feature/add-design/L6) へ設計降下。
内部 CI (pre-push subset gate、60 秒以内) / 外部 CI (GitHub harness-check、merge 最終防衛線) の
責務分担マトリクスと一致率計測、fail-open 縮退防止の不変条件、`U-CIRESP-1..6` oracle を定義。
2026-07-21 実測の欠陥 4 件 (memory frontmatter / requires_not_ready / runner enum /
reviewed_at 順序) を回帰 fixture として契約に固定。

レビュー観点: PLAN-L7-455 (PR #112) の lane 分類器と正本共有する前提の妥当性 /
required context 不変条件 (PLAN-L6-82) との整合。merge 完了時に本メモリを削除する。
