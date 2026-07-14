---
plan_id: PLAN-REVERSE-245-sub-doc-schema-integrity-backfill
title: "PLAN-REVERSE-245 (reverse): sub_doc schema 整合 lint の上位整合 backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-14
updated: 2026-07-14
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - PLAN-L7-245 実装後に document-system-map / L7 unit oracle へ backfill する範囲を確認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-245-sub-doc-schema-integrity-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
  requires: []
---

# PLAN-REVERSE-245: sub_doc schema 整合 lint の上位整合 backfill

## 0. 位置づけ

`PLAN-L7-245-sub-doc-schema-integrity` は設計 doc frontmatter `sub_doc` と
`VALID_SUB_DOCS` / `docs/governance/document-system-map.md` §1b の 3 者突合 lint
(`src/lint/sub-doc-schema-integrity.ts`) を追加し、方式 b (L6 topic doc 18 件を
`sub_doc: function-spec` + `artifact_role: topic_<name>` へ正規化、§1b-1 新設) を
採択した add-impl である。add-impl が単独で着地しないよう、本 Reverse は実装事実を
上位設計正本へ backfill するためのペアとして起票する (route_mode=add-feature の
kind=impl 禁止 taxonomy に基づく昇格、2026-07-14)。

## 1. R0-R4 方針

- R0: lint 実装 (3 者突合、meta doc skip、artifact_role 吸収) が document-system-map
  §1b/§1b-1 の記述と矛盾しないかを確認する。
- R1: 方式 b で確定した正規化規約 (topic doc = function-spec + topic_<slug>) を
  `docs/governance/document-system-map.md` §1b-1 へ戻す (実装時に同一変更内で反映済み —
  差分が無いことを確認して close する)。
- R2: `tests/sub-doc-schema-integrity.test.ts` の正例/負例 fixture を L7 単体テスト設計
  (`docs/test-design/harness/L7-unit-test-design.md`) へ同期する。
- R3: doctor gate (`sub-doc-schema-integrity` / `sub-doc-catalog-drift`) の検査範囲
  (checked=54, meta skipped=3) を L6 側の対象 doc 台帳と突合し、drift 0 を確認する。
- R4: 残 gap が無ければ Forward へ合流して close する。

## AC

- [ ] document-system-map §1b-1 と lint 実装の間に規約 drift が無い。
- [ ] L7 unit test design に sub-doc-schema-integrity の oracle が記載されている。
- [ ] doctor `sub-doc-schema-integrity` / `sub-doc-catalog-drift` が green である。
