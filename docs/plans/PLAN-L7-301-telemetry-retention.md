---
plan_id: PLAN-L7-301-telemetry-retention
title: "PLAN-L7-301 (impl): harness.db telemetry retention + logs rotation — 無制限成長の恒常抑制"
kind: impl
layer: L7
drive: db
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 保持期間ポリシーの承認 (既定 90 日) と v2 活性化時期"
  - role: tl
    slot_label: "TL - 監査系テーブル除外境界のレビュー (監査改ざん回避)"
  - role: se
    slot_label: "SE - prune 実装 + retention check"
generates:
  - artifact_path: docs/plans/PLAN-L7-301-telemetry-retention.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - docs/plans/PLAN-L7-44-harness-db-master.md
---

# PLAN-L7-301 (impl): harness.db telemetry retention + logs rotation

## Status

**version-up parked (v2)**。A-181 DV-1/DV-3。活性化前提 = PLAN-L7-246 (feedback close 経路) 完了後 — close 済み行の存在が prune の安全条件。

## 背景 (実測 2026-07-03)

- harness.db 60.9 MB / 43,410 行。上位: hook_events 11,150 / feedback_events 6,298 / quality_signals 4,835 / skill_recommendations 2,405 / skill_invocations 1,955。全イベント型が無制限追記で、`src/state-db/maintenance.ts` に retention/prune/compaction は存在しない (grep 裏取り済)。
- `.ut-tdd/logs/` 3.3 MB、rotation なし。
- 成長はセッション頻度に線形比例。放置すれば DB 肥大 → projection/query 劣化 → doctor/status 遅延という経済性の複利劣化になる。

## スコープ (1 要件: telemetry データの無制限成長を retention 機構で恒常抑制する)

1. **prune 対象の分類正本**: テーブルを telemetry (prune 可: hook_events / quality_signals / skill_recommendations / skill_invocations / feedback_events の closed 行) と audit (prune 不可: review_evidence_registry / guardrail_decisions / plan_registry / trace 系 / roadmap 系ほか) に分類する定数表を `src/state-db/retention-policy.ts` に新設。**分類は TL レビュー必須** (監査改ざん回避が柱)。
2. **`ut-tdd db prune`**: 保持期間 (既定 90 日、`--older-than` で上書き) を超えた telemetry 行を削除。削除前に件数サマリを表示し、実行結果を `.ut-tdd/logs/db-prune.jsonl` に append (いつ・何を・何行)。open 状態の feedback_events は期間に関わらず prune しない。
3. **logs rotation**: `.ut-tdd/logs/` の jsonl を同コマンドで rotation (90 日超エントリの世代退避)。
4. **`db-telemetry-retention` doctor check**: DB ファイルサイズと telemetry テーブル行数に advisory 閾値 (DB 200 MB / 単一テーブル 5 万行) を設け、超過で warning。hard 化はしない (運用データで閾値を調整してから別途判断)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | retention-policy.ts の分類正本 + TL レビュー | 直列 |
| 2 | `ut-tdd db prune` 実装 (dry-run 既定、--execute で実行) | 直列 |
| 3 | logs rotation | Step 2 と並列 |
| 4 | doctor check `db-telemetry-retention` | 直列 |
| 5 | regression test (prune が audit 分類を絶対に消さない / open feedback を消さない / prune 記録が残る) | 直列 |

## DoD

- [ ] audit 分類テーブルの行が prune で 1 行も減らない (test 固定: prune 実行前後の COUNT 一致)
- [ ] telemetry の期限超過行のみ削除され、削除が db-prune.jsonl に記録される (test 固定)
- [ ] open 状態の feedback_events が保持される (test 固定)
- [ ] `db-telemetry-retention` が閾値超過で warning を出す (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/state-db/retention-policy.ts` (新規)、`src/state-db/maintenance.ts` (prune 関数)、`src/cli.ts` (db prune サブコマンド)、doctor check の追加は分割後の doctor 配置に従う (着手時に Grep で再特定)。
- 既定 dry-run: 破壊的操作なので `--execute` なしでは削除しない (Guard Rules の destructive operations 原則)。
- prune は projection の再構築 (`db rebuild` 系) と独立に動くこと。rebuild が prune 済み行を復元する場合 (ソース jsonl から再投影) は、rotation 済みソースとの整合を Step 1 の設計で先に決める — ここが本 PLAN 最大の設計判断であり、決定は PLAN 本文へ書き戻す (pending_decision 扱いにしない)。
