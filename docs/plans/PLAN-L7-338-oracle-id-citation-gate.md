---
plan_id: PLAN-L7-338-oracle-id-citation-gate
title: "PLAN-L7-338 (impl): テストの oracle_id 引用 ratchet — missing-test-oracle-id 恒常解 (新規 warn + 引用率の縮小のみ許可)"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 + L7-274 (mutation-oracle-hardening) との統合可否の決定"
  - role: qa
    slot_label: "QA - oracle_id 付与様式 (describe/it どちらに置くか) の確定"
  - role: se
    slot_label: "SE - 引用検査 + ratchet 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-338-oracle-id-citation-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-274-mutation-oracle-hardening.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L7-338 (impl): oracle_id 引用 ratchet

## Status

**version-up parked (v2)**。A-182 所見 TQ-1 (QU-11)。PO 指示 2026-07-03「アップデートでプラン化」。**未決分岐 (実装前に PO/TL 決定が必要)**: 既存 draft PLAN-L7-274 (mutation-oracle-hardening) と統合するか独立で進めるか — 重複起票を避けるため、活性化時にどちらかへ一本化する (本 PLAN が吸収される場合は supersedes 宣言)。

## 背景 (実測 2026-07-03、A-182 §2)

- it() 1,391 件中 oracle_id (`U-*`) 引用なしが約 600 件 — missing-test-oracle-id feedback **671 件** (SessionStart telemetry) の実体 (TQ-1)。docs/test-design/ のオラクル定義から実テストへの機械トレースが不能。
- テスト実質自体は B+ (mutation 反転 red 3/3、実 repo 回帰 52 本) — 欠けているのは品質でなく**設計との対応の機械可読性**。

## スコープ (1 要件: 新規テストに oracle_id 引用を warn で要求し、既存欠落数は ratchet で縮小のみ許可する)

1. 付与様式の確定 (QA slot): `// ORACLE_ID: U-xxx` コメント or describe/it 名への埋め込み — 既存 3 件の実例 (workflow-contracts.test.ts の "U-FR-L1-06" 型) に揃えるのが最小。
2. 検査: 新規/変更テストファイルの it() に引用が無い場合 warn-first。既存欠落 ~600 件はベースライン免除 + **ratchet test (欠落数は減るのみ — 増加で red)**。
3. telemetry 接続: missing-test-oracle-id feedback の恒常発生源を本 gate に一本化し、二重計上を解消。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | L7-274 との統合可否 (PO) + 付与様式 (QA) の決定 | 直列 (先行) |
| 2 | 検査 + ratchet 実装 + fixture tests | 直列 |
| 3 | 基線記録 (欠落数実測を review_evidence へ) | 直列 |

## DoD

- [ ] oracle_id なし新規テスト fixture が warn (test 固定)
- [ ] 欠落数 ratchet test (増加で red) が実 repo に対して green
- [ ] L7-274 との関係が一本化されている (統合 or supersedes 宣言)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 既存 600 件の一括付与は本 PLAN のスコープ外 (機械付与は誤対応を量産する) — ratchet による漸進が正。
- 活性化時 kind は add-impl へ昇格 (Reverse pairing 必須)。
