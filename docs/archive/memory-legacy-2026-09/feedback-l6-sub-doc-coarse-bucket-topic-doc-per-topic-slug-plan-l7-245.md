---
memory_id: memory:feedback:l6-sub-doc-coarse-bucket-topic-doc-per-topic-slug-plan-l7-245
kind: feedback
title: "L6 sub_doc は coarse bucket: 新topic docへper-topic slugを追加しない (PLAN-L7-245)"
tags: ["lint", "schema", "sub-doc"]
updated_at: 2026-07-14T01:25:05.802Z
---

L6 機能設計の VALID_SUB_DOCS (function-spec/class-design/edge-case/screen-spec) は artifact 種別の coarse bucket であり、L4 §1b の per-product-artifact catalog とは粒度が異なる (document-system-map §1b-1、PLAN-L7-245 方式 b、2026-07-14 確定)。
- docs/design/harness/L6-function-design/ に新しい topic doc を足すときは sub_doc: function-spec + artifact_role: topic_<name> を宣言する。VALID_SUB_DOCS.L6 へ per-topic slug を追加すると sub-doc-catalog-drift gate (要件 v1.2 §G.1 mirror) が要件側未同期で fail-close する。
- 3者整合 (doc frontmatter ↔ VALID_SUB_DOCS ↔ map §1b/1b-1) は sub-doc-schema-integrity gate (src/lint/sub-doc-schema-integrity.ts、doctor full profile) が機械検証する。基準値: checked=54, meta skipped=3, drift 0。
