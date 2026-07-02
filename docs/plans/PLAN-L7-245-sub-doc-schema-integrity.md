---
plan_id: PLAN-L7-245-sub-doc-schema-integrity
title: "PLAN-L7-245 (impl): 設計 doc frontmatter sub_doc の schema 整合 (schema 外値・重複の解消)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/document-system-map.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - VALID_SUB_DOCS 拡張 or supplemental role 区別 lint"
generates:
  - artifact_path: docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - src/schema/index.ts
---

# PLAN-L7-245 (impl): 設計 doc frontmatter sub_doc の schema 整合

## Status

draft 起票 (PO /goal 2026-07-02、A-174 F-5 latent-defect)。

## 背景 (A-174 F-5)

- L2: business-flow.md / screen-detail.md が primary doc と同一 `sub_doc` (screen-flow / screen-list) を supplemental_* role で重複宣言 — 1:1 前提 lint の誤判定源。
- L6: skill-index.md (`sub_doc: skill-index`)、governance-enforcement.md (`sub_doc: function-spec-addendum`) が VALID_SUB_DOCS[L6] 外の値。

## スコープ

設計 doc frontmatter の sub_doc 値集合と VALID_SUB_DOCS / document-system-map §1b の 3 者を突合する lint を追加し、schema 外値は (a) VALID_SUB_DOCS へ正式登録 or (b) artifact_role 区別で吸収のどちらかへ寄せる (方式は TL 判断)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 3 者突合 lint (report-only) で現状差分の全量確定 | 直列 |
| 2 | 登録 or role 吸収の適用 + fail-close 化 | 直列 |

## DoD

- [ ] 全設計 doc の sub_doc が schema/map と 3 者一致 (lint green)
