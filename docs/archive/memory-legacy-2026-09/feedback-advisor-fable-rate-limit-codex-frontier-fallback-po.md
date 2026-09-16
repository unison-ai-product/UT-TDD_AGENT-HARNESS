---
memory_id: memory:feedback:advisor-fable-rate-limit-codex-frontier-fallback-po
kind: feedback
title: "advisor: Fable rate-limit時のCodex frontier fallbackは正しい設計挙動 (PO確認済み)"
tags: ["advisor", "codex", "fable", "fallback", "po-rule", "skill-audit"]
updated_at: 2026-07-09T05:10:22.993Z
---

PO確認 (2026-07-09): ut-tdd advisor --decision design の一次相談先 Fable (advisor-policy.ts fableRoute, PO仕様2026-07-08) がレート上限 ("You've reached your Fable 5 limit.") で失敗した場合、設計どおり Codex frontier (gpt-5.5) へ自動 fallback するのは正しい挙動であり、不具合として扱わない。Fable への無理な再試行は行わない。

背景: PO指示「Fableに相談投げてみて」でAgent tool経由の直接呼び出しを試みたが agent-guard (src/runtime/agent-guard.ts normalizeModelFamily) が haiku/sonnet/opus の3ファミリーしか認識せず fable は必ずブロックされた (model-policy.ts の MODEL_IDS には fable 登録済みで agent-guard 側だけ未対応という drift、未修正のまま記録のみ)。正規経路 ut-tdd advisor --decision design --execute を使うと Fable が実際に一次相談先として起動し、レート上限到達 → 設計通り Codex frontier へ fallback → 実際の応答取得に成功した (exit=0)。

詳細・関連監査: .ut-tdd/audit/A-186-skill-quality-design-impl-audit-2026-07-09.md §5。同日、Fable/Codex 相談結果を踏まえ pmo-project-explorer sonnet x3 の独立3レンズ優先順位パネルを実施し、PLAN-L7-277-skill-recommendation-discrimination を最優先着手候補として収束済み。
