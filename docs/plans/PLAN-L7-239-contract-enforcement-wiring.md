---
plan_id: PLAN-L7-239-contract-enforcement-wiring
title: "PLAN-L7-239 (impl): contract 関数の doctor 配線 + lint-wiring 監視境界の拡張"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - evaluateRetrofitMatrix / evaluateResearchDecision の gate 接続"
  - role: tl
    slot_label: "TL - lint-wiring 監視境界 (workflow/contracts 層) の設計レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-239-contract-enforcement-wiring.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - src/workflow/contracts.ts
    - src/lint/lint-wiring.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-239 (impl): contract 関数の doctor 配線 + lint-wiring 監視境界の拡張

## Status

draft 起票 (PO /goal 2026-07-02、A-173 F-3 feature-gap)。

## 背景 (A-173 F-3)

`evaluateRetrofitMatrix` (contracts.ts:435) と `evaluateResearchDecision` (contracts.ts:449) は実装+テスト済みだが doctor/gate に未配線で、retrofit-matrix 完了 / research ADR・memo の exit が実質未強制。lint-wiring meta-gate は `src/lint/*` のみ監視するため、workflow/contracts 層の enforcement 資産の死蔵を検出できない (meta 盲点)。

## スコープ

1. 両 contract 関数の doctor 配線 (retrofit/research PLAN 検出時に評価)。
2. lint-wiring の監視境界を enforcement 意図を持つ contract 関数へ拡張 (DEFERRED 台帳と同型の宣言必須化)。
3. 同型資産の棚卸し (A-176 F-C): `recordGuardrailDecision` (src/guardrail/ledger.ts:45、callers 0) の disposition 確定 — review_evidence ベース gate への意図的置換なら定義を supersede、必要なら配線 (verify-intent 先行、2026-06-15 L7 監査指摘の残存確認)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | doctor 配線 + 対象 PLAN 検出条件の設計 | 直列 |
| 2 | lint-wiring 境界拡張 (未配線 contract の fail-close) | 直列 |

## DoD

- [ ] retrofit/research PLAN が exit 条件未充足で doctor red になる regression test
- [ ] enforcement 意図の contract 関数が未配線のまま追加されると lint-wiring が検出
