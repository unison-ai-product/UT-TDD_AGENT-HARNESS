---
memory_id: memory:feedback:gpt-5-6-effort-crossover-tendency-h4
kind: feedback
title: "GPT-5.6 effort crossover tendency (H4)"
tags: ["bench", "effort", "gpt-5.6", "model-routing"]
updated_at: 2026-07-10T10:07:32.014Z
---

H4 effort-crossover 実測 (2026-07-10、PLAN-DISCOVERY-10 後続、bench = D1 多言語設計 / D2 Pack 配布監査 / F1 実 flake 診断):

- gpt-5.6-sol の effort-token 関係は**非単調で不安定**: D1 で low 30.6k → high 95.3k → medium 125.5k tokens。一方 low でも品質は落ちない (F1 root cause 完全正解 15k tokens、D2 は 13 defect で主要キー網羅 21k tokens)。
- gpt-5.6-terra は medium ≈ high (計 67.7k vs 73.9k、品質差検出できず)。
- 交差: Sol low (66.8k) は Terra high (73.9k) を品質同等以上・低コストで上回る。Terra medium とはほぼ等価。

**運用指針 (PO 裁定 2026-07-10): 型にはめない。傾向として扱い、計測を継続する。**
固定ルール化 (frontier lane effort=low の機械 pin 等) はしない。エスカレーション/判断系で Sol を使うとき low から始めるのは妥当な傾向だが、タスクごとに実測で更新する。Claude 側 (Sonnet xhigh vs Opus high) の tier×effort 交差は未計測の残課題。bench 資材は /tmp/bench (out-h4/, prompts-h4/) と ~\AppData\Local\Temp\bench に保存。
