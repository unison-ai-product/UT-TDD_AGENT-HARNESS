---
memory_id: memory:feedback:po-2026-07-13
kind: feedback
title: "設計判断エリシテーション共通フォーマット (PO ルール 2026-07-13)"
tags: ["ask-user-question", "elicitation", "po-rule"]
updated_at: 2026-07-13T06:44:08.952Z
---

PO への質問は設計判断 (trade-off 実在の方式選択 / spec 未確定点) に限定し、docs/governance/design-decision-elicitation.md の共通フォーマット (前提 2-3 行 + 選択肢 2-4 + trade-off + 推奨先頭) に従う。従来の AskUserQuestion 全面不使用は改訂: Claude 対話セッションではこの用途に限り使用可。非対話 / Codex は '## 設計判断依頼' markdown 表で等価出力して停止。採択結果は PLAN 設計判断節 / ADR に記録。skill: skills/design-decision-elicitation.md、PLAN-L3-07。
