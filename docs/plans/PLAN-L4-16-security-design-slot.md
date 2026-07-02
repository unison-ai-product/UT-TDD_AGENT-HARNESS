---
plan_id: PLAN-L4-16-security-design-slot
title: "PLAN-L4-16 (add-design): セキュリティ設計 slot の定義と L4 設計起票"
kind: add-design
layer: L4
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L1-requirements/nfr.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - security slot 新設の採否 (document-system-map + VALID_SUB_DOCS 拡張)"
  - role: tl
    slot_label: "TL - 脅威モデル/DevSecOps 設計の構成案"
generates:
  - artifact_path: docs/plans/PLAN-L4-16-security-design-slot.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-02-architecture.md
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - docs/governance/document-system-map.md
---

# PLAN-L4-16 (design): セキュリティ設計 slot の定義と L4 設計起票

## Status

draft 起票 (PO /goal 2026-07-02、A-174 F-4 feature-gap)。slot 新設は document-system-map / VALID_SUB_DOCS の規範変更を含むため PO gate 先行。

## 背景 (A-174 F-4)

NFR-17 (セキュリティ) は L1 nfr.md で親宣言され「詳細は L4 方式設計 sub-doc で確定」と明記されるが、L4 に security の独立節/sub-doc slot が無く ADR 参照のみ。escalation gate (auth/PII/破壊操作) を製品機能として持つハーネスとして、脅威モデル/DevSecOps 設計の置き場が未定義。ロギング/可観測性の横断方針 (何をいつどの粒度で記録するか) も部分被覆。

## スコープ

1. security slot の新設判断 (PO): document-system-map §1b + VALID_SUB_DOCS[L4] へ `security` を追加 or architecture.md 内の独立節で確定。
2. 採択方式で L4 security 設計 (脅威モデル・escalation 境界・秘密情報取扱) を起票・記述。ロギング横断方針の同居可否も判断。
3. V-pair: 対応する test-design band (L8/L9 の security 検証群) への接続を明記。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | slot 方式決定 (PO gate) | 直列 |
| 2 | L4 security 設計本文の起票 | 直列 |
| 3 | pair test-design 接続 + doctor green | 直列 |

## DoD

- [ ] NFR-17 の L4 降下先が実在し descent-obligation が接続を認識
- [ ] security 設計に対応する右腕 (test-design) 参照が存在
