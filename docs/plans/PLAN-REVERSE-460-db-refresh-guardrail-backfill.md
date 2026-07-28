---
plan_id: PLAN-REVERSE-460-db-refresh-guardrail-backfill
title: "PLAN-REVERSE-460: db-refresh 資源ガードレール実装事実の上流合流 (L6 契約 + L5 物理データ)"
kind: reverse
layer: cross
drive: db
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
parent_design: docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
pair_artifact: docs/design/harness/L6-function-design/function-spec.md
agent_slots:
  - role: tl
    slot_label: "TL - L7-460 実装から L5/L6 契約への gap-only backfill と pragma 衝突判定"
  - role: qa
    slot_label: "QA - 上流 doc の記述と実装挙動 (上限値・fail-close 条件・pragma) の照合"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-460-db-refresh-guardrail-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - .ut-tdd/memory/project-incident-bun-session-db-refresh-runaway-on-2026-07-27.md
  blocks: []
workflow_phase: R0
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-460: db-refresh 資源ガードレールの上流合流

## 対起票の根拠 (設計判断、2026-07-28)

PLAN-L7-460 は **既存挙動の修理ではなく新しい契約の追加** である: db-refresh の
起動 runtime 制約 (Node 固定 + Bun 起動 fail-close)、資源上限 (size/time/memory) の
fail-close、single-flight、SQLite pragma。したがって実装後に「実装だけが知る
fail-close 条件」が残り、後続の db-refresh 改修や L5 物理データ設計が旧前提で進む。
これは backfill-pairing ゲートが防いでいる drift そのものなので、
`backprop_decision: not_required` ではなく Reverse 対起票を選ぶ。

**線引き (今後の troubleshoot 起票基準)**: 既存 spec への回帰 = 純修理なら
`not_required`、新しい契約 (制約 / fail-close 条件 / 物理パラメータ) を足すなら
Reverse 対。「troubleshoot レーンが重い」は基準にしない (ゲートの fail-open 化)。

## gap の実測 (2026-07-28、scope 確定のため)

- `docs/design/harness/L6-function-design/function-spec.md` に db-refresh /
  stop-refresh の記述は **0 件** (grep 実測) → L6 に機能契約が存在しない。
- `docs/design/harness/L5-detailed-design/internal-processing.md:922` は
  ledger connection について `PRAGMA journal_mode=WAL` / `PRAGMA synchronous=FULL`
  を規定。L7-460 スコープ 6 は db-refresh 経路に `synchronous=NORMAL` を入れる案で
  あり、**同一 DB の pragma 方針が doc 上で衝突しうる**。どちらの connection に
  どの耐久性水準を適用するかを L5 で明示するのが本 PLAN の主眼。

## スコープ (gap-only backfill)

1. L6 function-spec に db-refresh の機能契約を追記 — 起動 runtime 制約、
   single-flight、資源上限超過時の fail-close 挙動と rollback。
2. L5 internal-processing に pragma 適用境界を明示 — ledger connection (FULL) と
   db-refresh connection の耐久性水準を分けて規定し、衝突を解消。
3. L4 architecture への影響有無を判定 (無ければ「影響なし」を明記して閉じる)。

## スコープ外

- L7-460 の実装そのもの (Forward 側の責務)。
- Bun 撤退全体 (PLAN-L7-462)。

## Schedule

- R0 (serial): L7-460 実装の観測 — 確定した上限値・fail-close 条件・pragma を採取
- R1 (serial): gap 判定 (L4/L5/L6 のどこに何が欠けているか、影響なし面の明記)
- R2 (serial): 上流 doc への gap-only 追記
- R3 (serial): pair_artifact (L6 function-spec) と実装の照合 (QA slot)
- R4 (serial): Forward 再合流判定 → confirm

## AC

- AC-1: L6 function-spec に db-refresh の契約 (runtime 制約 / single-flight /
  上限 fail-close / rollback) が記載され、実装挙動と一致することを照合済み。
- AC-2: L5 の pragma 規定が connection 単位に分離され、`synchronous` 水準の
  doc 内衝突が解消 (before = L5:922 の FULL 単一規定を引用)。
- AC-3: L4 への影響有無が明示的に判定され、未判定の面が残っていない。
