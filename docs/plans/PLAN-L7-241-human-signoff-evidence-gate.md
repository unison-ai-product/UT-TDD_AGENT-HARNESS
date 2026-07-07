---
plan_id: PLAN-L7-241-human-signoff-evidence-gate
title: "PLAN-L7-241 (impl): 人間サインオフ証拠の PLAN body fail-close 検証 (Recovery/Incident/Scrum 横断)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/recovery.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - サインオフ証拠 schema + lint 実装"
  - role: po
    slot_label: "PO - サインオフ証拠の必須フィールド (承認者/日時/verdict) 確定"
generates:
  - artifact_path: docs/plans/PLAN-L7-241-human-signoff-evidence-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - src/workflow/routing-contracts.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-241 (impl): 人間サインオフ証拠の PLAN body fail-close 検証

## Status

draft 起票 (PO /goal 2026-07-02、A-173 F-5 feature-gap)。

## 背景 (A-173 F-5)

Recovery (tl+po)、Incident (三者確認)、Scrum S4 (po 受入) の人間承認が正本 doc で必須とされる一方、PLAN body 内の承認証拠を fail-close 検証する lint が存在しない。RouteApprovalPolicy は schema として存在するが PLAN への投影チェックが無い。

## スコープ

対象 kind/mode の PLAN が landed 遷移する際、承認証拠 (承認者 role・日時・verdict) の構造化記録を必須化し、欠落を doctor で fail-close。review_evidence 既存 schema との統合を優先し二重定義を避ける。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 証拠フィールド定義 (PO gate、review_evidence 統合判断) | 直列 |
| 2 | lint 実装 + 既存 PLAN の grandfather 方針 | 直列 |

## DoD

- [ ] 承認証拠なしの recovery/incident PLAN landed 化が doctor red (test 固定)
