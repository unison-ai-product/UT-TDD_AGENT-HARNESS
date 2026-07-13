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
updated: 2026-07-13
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
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/plans/PLAN-L7-429-spec-ir-detector-scope.md
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

## 2026-07-13 spec-ir triage 追記 (PLAN-L7-429 起票に伴う事例補強)

`spec-ir-invalid-subdoc` finding 22 件の triage (PO 採択案 A) で、本 PLAN が対象とする
schema 外 sub_doc の実例が `docs/design/harness/L6-function-design/` 配下に 18 件確認された
(cluster A)。既知の latent-defect (A-174 F-5) と同型であり、本 PLAN のスコープを変更しない —
検出側の副作用縮小は別途 `PLAN-L7-429-spec-ir-detector-scope` が担当する。

代表例 (`VALID_SUB_DOCS.L6 = [function-spec, class-design, edge-case, screen-spec]` に対して):

- `agent-slots.md`: `sub_doc` frontmatter 自体が未宣言 (path 推論に依存し L6 有効値へ解決しない)。
- `skill-index.md`: `sub_doc: skill-index` (schema 外値、独自宣言)。
- `governance-enforcement.md`: `sub_doc: function-spec-addendum` (schema 外値、A-174 F-5 と同型の
  supplemental role 重複)。
- 同型で他に `context.md` (`sub_doc: context`)、`graph.md` (`sub_doc: graph`)、`memory.md`
  (`sub_doc: memory`)、`secret.md` (`sub_doc: secret`)、`skill-admission.md`
  (`sub_doc: skill-admission`) 等、独自 topic 命名の sub_doc 宣言が残る 18 件。

triage の残り (spec-ir-invalid-subdoc 22 件中): cluster B 3 件 (README `doc_type: index` /
roadmap `doc_type: verification-roadmap` 等メタ doc の除外漏れ、`shouldValidateDesignSubDoc` の
scope 側で対処 — PLAN-L7-429)、cluster C 1 件 (`L1-business-requirements.md` stub、別途削除済み
扱いのため本 PLAN 対象外)。

本 PLAN の Step 1/2 (3 者突合 lint) は cluster A の 18 件を確定差分として引き継ぐ。
