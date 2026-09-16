---
memory_id: memory:feedback:advisor-design-fable-codex-frontier-fallback--82fc24ae76f9
kind: feedback
title: "advisor design相談でFableがレート上限で失敗したらCodex frontierへの自動fallbackが正しい挙動"
tags: ["advisor", "fallback", "model-routing"]
updated_at: 2026-09-16T11:13:05.628Z
---

ut-tdd advisor --decision design の一次相談先 Fable がレート上限で失敗した場合、設計どおり Codex frontier (gpt-5.6-sol) へ自動 fallback するのは正しい挙動であり、不具合として扱わない。Fable への無理な再試行は行わない。agent-guard の normalizeModelFamily は haiku/sonnet/opus の3ファミリーしか認識せず fable を直接 Agent tool 経由で呼ぶと必ずブロックされるため、正規経路 ut-tdd advisor --decision design --execute を使うこと。
