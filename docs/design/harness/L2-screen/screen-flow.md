---
layer: L2
sub_doc: screen-flow
status: placeholder
pair_artifact: (TBD L2 着手時に確定)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
created: 2026-05-28
---

# L2 画面遷移 (screen-flow) — placeholder

> **status**: placeholder。L2 着手時に PLAN-L2-02-screen-flow で本起票する。
> **必須実施**: drive=be (UI を持つ) のため必須 (L1 §3.7 / A-37 参照)。

## 上流 baton (L1 §2 6 遷移シナリオ + 3 カテゴリ間 deep-link)

| シナリオ | 遷移 | L1 参照 |
|---------|------|---------|
| 1. Forward 通常 | PM-01 → PM-02 → PM-03 → PM-01 | screen §2 シナリオ 1 |
| 2. Gate fail | PM-03 → PM-02 → PM-04 → HM-07 | screen §2 シナリオ 2 |
| 3. Incident | PM-01 → HM-06 → HM-05 → PM-01 | screen §2 シナリオ 3 |
| 4. Handover 再開 | PM-05 auto → PM-02 → PM-03 | screen §2 シナリオ 4 |
| 5. Recovery 収束 | HM-06 → PM-01 → PM-02 → PM-03 | screen §2 シナリオ 5 |
| 6. Discovery | PM-01 → PM-02 → HM-05 → PM-03 → PM-01 | screen §2 シナリオ 6 |
| 追加 | 3 カテゴリ間 deep-link (PM ↔ HM ↔ GD) | screen §2 |

## L2 で確定すべき項目 (本起票時)

- 各遷移の trigger 詳細 (クリック / hook イベント / 通知 / 自動)
- 遷移条件 (gate fail / drift 検出 / handover ready 等)
- 遷移時のステート保持 (filter / scroll position)
- 遷移後の auto 表示要素 (例: handover の next_action 強調)
- 戻る挙動 (browser back / breadcrumb)

## carry / 次工程

- **L2 PLAN-L2-02 で本起票**: 本 placeholder を本起票で置換
