---
plan_id: PLAN-L7-271-deviation-signal-tokens
title: "PLAN-L7-271 (add-impl): 逸脱 signal 語彙の拡張 (NFR/性能/セキュリティ/外部前提)"
kind: add-impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 新 token の routing 先確定 (NFR 逸脱→どの mode か 等)"
  - role: se
    slot_label: "SE - route-map token 追加 + modes README §4 更新 + test"
generates:
  - artifact_path: docs/plans/PLAN-L7-271-deviation-signal-tokens.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-212-route-certificate-governance.md
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - src/schema/route-map.ts
    - docs/process/modes/README.md
---

# PLAN-L7-271 (add-impl): 逸脱 signal 語彙の拡張

## Status

draft 起票 (A-179 D-3/D-4)。正規形 = parent: PLAN-L7-212 (routing 統治の実装追補、drive 一致) + Reverse pairing = PLAN-REVERSE-271 (parent 参照、PLAN-L7-265 方式)。

## 背景

route-map 全行実読の結果、以下の逸脱を受ける token が無い:

- **NFR/性能逸脱**: `performance_regression` / `nfr_violation` / `cost_overrun` (現行は機能退行 `regression_dev`→Recovery のみ)
- **セキュリティ脆弱性**: 依存 CVE (最新版でも脆弱)・自コード監査指摘。security-audit agent の所見に routed mode が無い
- **外部前提変更**: provider API 仕様変更 (`external_api_change`)。retrofit の `config_drift` と recovery の premise-gap の隙間

## スコープ

1. token 追加 + routing 先の PO 確定: 案 = `performance_regression`/`nfr_violation` → Recovery (dev) or Incident (prod, env 判定)、`security_vulnerability` → Retrofit (依存) / Incident (prod 実害)、`external_api_change` → Retrofit。
2. modes README §4 表の同期 (rule-drift 系 doc 整合)。
3. NFR グレード AC (PLAN-L4-15) 着地後の検出→signal 発火接続は references に留め、本 PLAN は語彙と routing のみ (検出器は別 PLAN)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | routing 先 PO 確定 | 直列 |
| 2 | token 追加 + README 同期 + route eval test | 直列 |

## DoD

- [ ] `route eval --signal performance_regression` 等が確定先へ routing する (test 固定)
- [ ] modes README §4 と route-map の drift が無い
