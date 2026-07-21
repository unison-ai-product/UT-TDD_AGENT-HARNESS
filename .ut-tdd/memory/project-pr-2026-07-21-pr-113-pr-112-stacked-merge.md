---
memory_id: memory:project:pr-2026-07-21-pr-113-pr-112-stacked-merge
kind: project
title: "PR整理 2026-07-21: PR 113 を PR 112 上へ stacked 化 (merge 順固定)"
tags: []
updated_at: 2026-07-21T09:04:31.668Z
---

PO 指示による PR 整理を実施した。(1) PR #113 (work/l7-420-strict-evidence-gates) は base を work/l7-455-ci-cost-phase1 (PR #112) へ変更し stacked PR 化。harness-check.yml doctor 行の衝突は merge commit 8e7c5de8 で事前解消済み (doc-lane skip 判定 + --strict-green-command-digest 両立、advisory-aging/ci-policy/change-lane 80/80 green)。merge 順は #112 → #113 に固定、#112 merge 後は GitHub が #113 base を main へ自動 retarget する。(2) PR #112 body の Closes #109 を Refs #109 へ修正 (issue #109 は Phase 2+ と before/after 実測が残るため close しない)。(3) issue #83 close (PR #99 対応済み、項目2は #98 へ承継) / issue #97 close (aggregate gate は main に実在確認)。(4) issue #108 に PLAN-L4-24/L4-28 との重複注記を追加 — 着手時は新規 PLAN 重複起票ではなく既存 PLAN 拡張/supersede とすること。(5) merged 済 remote branch work/l7-421-test-hygiene-live-tree-fence を削除。
