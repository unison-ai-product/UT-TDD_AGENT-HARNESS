---
memory_id: memory:project:fable-5-7-13-rate-limit
kind: project
title: "Fable 5 非常用の主要因は運用制約 (7/13 従量課金化・単価・rate limit)"
tags: ["advisor", "escalation", "fable", "gpt-5.6", "plan-discovery-10", "po-rule", "routing", "sol"]
updated_at: 2026-07-10T03:41:44.416Z
---

PO 事実 (2026-07-10): Fable 5 (claude-fable-5) が常用 routing に入っていない主要因は運用・経済制約。

1. Anthropic 公式が 2026-07-13 以降 Fable を従量課金化すると告知 — サブスクプラン内で解けない。
2. 単一タスクのコストが高すぎ、常用 lane の $/解決タスク 基準に合わない。
3. 仮に解放されてもレート上限に即到達する (2026-07-10 のベンチ実走でも Sol/Fable 側で上限イベントを実測)。

設計側の整合 (帰結は同一): 判断頂点の非消費原則 — orchestrator と同格以上のモデルを常用 worker lane に入れると same_model_approval 禁止 / review>=orchestrator 不変条件が組めなくなる。希少性と escalation 席の役割は噛み合っている。

routing への含意 (PO 訂正 2026-07-10):
- **従量課金は購入しない方針**。したがって 7/13 以降 Fable はほぼ 100% 利用不可に落ちる想定。予算ガードは不要 — 必要なのは「Fable ルートの失敗を正常系として扱う fallback」(既存の Codex frontier fallback 設計は PO 確認済みの正しい挙動、その常態化)。
- **プラン内で解放が戻ったら Fable を使う** (opportunistic 運用)。advisor の Fable 一次相談先設定は変更せず、落ちたら fallback、復帰したら自然に戻る形を保つ。
- gpt-5.6-sol は GPT 側の対称 escalation 席 (PLAN-DISCOVERY-10 で価格性能成立を実測済)。7/13 以降の実効的な一次 frontier 相談先は Sol / Codex frontier 側になる。
- agent-guard が fable を正規化できない件 (FAMILY_RANK に Claude 5 世代なし) の修正は「fable を最上位 rank に追加しつつ worker role 割当は policy で禁止」が正: 単に通せばよいバグではない。
