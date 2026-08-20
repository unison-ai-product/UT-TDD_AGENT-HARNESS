---
memory_id: memory:project:issue-303-305-filed-drive-model-workflow-autogen-flag-feedback-loop
kind: project
title: "issue #303-305 filed: drive-model workflow autogen + FLAG feedback loop"
tags: ["issue-303", "issue-304", "issue-305", "skill-engine", "workflow"]
updated_at: 2026-08-13T05:44:49.469Z
---

2026-08-13、PO 指示で #303 (駆動モデル workflow 自動生成 + FLAG 教訓の永続還流) を起票、正式 sub-issue #304 (S1: workflow suggest 生成器 = classifyTask + routeFiling + classifyProposalDocumentCoverage + recommendSkills の合成、advisory 出力から開始) / #305 (S2: FLAG 類型を findings kind=review-flag:* へ構造化格納し emitFeedbackEvents で surface、checklist 資産へ版管理還流)。前提の棚卸し実測: issue→route certificate は routeFiling() で既に導出可能、文面→必要 doc/gate/subagent は classifyProposalDocumentCoverage() が既存、team YAML schema と delegation-routing 実在、review-checklist.yaml (v1) が checklist 資産の雛形、FLAG の構造化格納先は現状なし (prose memory 85 ファイルに散在)。#252 の absence-blindness 家族 (~15 件) が本機構の対象類型で、#252 へ横断リンク済み。PLAN-L7-437 (issue inbound projection、draft) はブロッカー化しない。task classify の実走では本件のような機構開発文面は kind=unknown / drive 低信頼になる実測があり、S1 の分類前処理 (issue label / 見出しの活用) が設計論点。
