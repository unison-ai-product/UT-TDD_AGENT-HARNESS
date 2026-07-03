---
plan_id: PLAN-L7-274-mutation-oracle-hardening
title: "PLAN-L7-274 (impl): 変異検証の定常化 (テストが欠陥を検出できるかの機械確認)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/ddd-tdd-rules.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 変異セット設計 (最小変異 vs ツール導入) と CI コスト評価"
  - role: se
    slot_label: "SE - 変異検証の実装 + CI optional job"
generates:
  - artifact_path: docs/plans/PLAN-L7-274-mutation-oracle-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - src/lint/ddd-tdd-rules.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-274 (impl): 変異検証の定常化

## Status

draft 起票 (A-179 T-3)。誠実な設計祖先 PLAN が無いため kind=impl で起票し **PLAN-L7-263 debt 台帳へ登載 (着手時昇格)**。back-fill 意図は PLAN-REVERSE-274 で保持。

## 背景

oracle 強度の保証は静的検査 (weak matcher / expect 数 / GWT 粒度、ddd-tdd-rules) 止まり。「テストが実装欠陥を実際に検出できるか」の変異検証は過去に手動 1 回 (IMP-079 で gate-confirm の片方向盲点を発見した実績) のみで、機構が無い。手動 1 回で重大盲点を見つけた実績自体が定常化の価値の証拠。

## スコープ

1. **方式選定 (TL)**: Stryker 等の導入 vs 重要 lint/gate 群に絞った自作最小変異セット (fail-close 系 lint の条件反転・境界改変で fail するテストが存在するか)。コスト評価込み。
2. **定常発火点**: CI optional job (nightly/週次) or release checklist (PLAN-L7-249) 項目 — 常時 CI に載せない (実行コスト)。
3. 検出された「殺せない変異」は latent-defect として route eval へ流す (A-156 契約)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 方式選定 + 対象範囲 (TL) | 直列 |
| 2 | 変異検証実装 + 発火点設置 | 直列 |
| 3 | 初回実測 → 殺せない変異の起票 | 直列 |

## DoD

- [ ] 重要 gate/lint 群に対する変異検証が定常発火点を持つ
- [ ] 初回実測の残存変異が route 起票される
