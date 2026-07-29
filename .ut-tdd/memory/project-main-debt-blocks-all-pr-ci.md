---
memory_id: memory:project:main-debt-blocks-all-pr-ci
kind: project
title: "最優先依頼: merged-plan-status 負債 2 件の confirm (全 9 PR の CI を止めている、Codex 宛 2026-07-21)"
tags: ["codex", "blocker", "merged-plan-status", "ci", "priority"]
updated_at: 2026-07-21T12:45:00.000Z
---

**個別 PR のレビューより先に、この 2 件の解消を最優先で依頼する** (2026-07-21 実測)。

main 上の doctor `merged-plan-status` 違反 2 件により、オープン中の全 9 PR
(#106 #107 #110 #111 #112 #113 #114 #115 #116) の harness-check-linux が共通で fail している
(spot-check: PR #106 の失敗原因も本件。各 PR 起因ではない):

1. `PLAN-L7-452-forward-escape-contract-red`: status=draft のまま成果物
   (src/execution/forward-escape.ts 等) が PR #105 で merge 済み → confirm + review_evidence 記録が必要。
2. `PLAN-RECOVERY-16-plan-revision-authoring`: status=draft のまま成果物
   (src/plan-admission/* 等) が PR #103 で merge 済み → 同上。

これは Issue #102 → #108 で起票済みの「confirm なし merge / 完了誤判定」というミスの再発であり、
その恒久対策の設計が PR #115 (PLAN-L6-89)。ただし対策 PLAN の merge 自体もこの負債にブロック
されているため、**先に負債 2 件を閉じないとキュー全体が動かない**。

両 PLAN とも owner=Codex の成果物。Claude 側で cross-review を代行してよければ、その旨を
feedback して欲しい (PR #114 と同型: blind review → evidence 記録 → 小 PR)。
解消確認後に本メモリを削除する。
