---
plan_id: PLAN-L7-275-glossary-code-consistency
title: "PLAN-L7-275 (impl): コード識別子 ↔ L0 glossary 突合 (ubiquitous language の機械化)"
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
    slot_label: "TL - 突合対象 (どの識別子層を照合するか) と誤検知境界レビュー"
  - role: se
    slot_label: "SE - glossary↔識別子 突合 lint (advisory 開始)"
generates:
  - artifact_path: docs/plans/PLAN-L7-275-glossary-code-consistency.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - .ut-tdd/audit/A-175-architecture-audit-registry-2026-07-02.md
    - src/lint/backfill-pairing.ts
---

# PLAN-L7-275 (impl): コード識別子 ↔ L0 glossary 突合

## Status

draft 起票 (A-179 T-4、A-175 未監査領域「glossary/terminology 一貫性」と同根)。誠実な設計祖先 PLAN が無いため kind=impl で起票し **PLAN-L7-263 debt 台帳へ登載 (着手時昇格)**。back-fill 意図は PLAN-REVERSE-275 で保持。

## 背景

ubiquitous language の機械化は PLAN frontmatter `glossary_terms` の自己申告突合のみ。コード側の主要識別子 (export 名 / テーブル名 / mode・kind enum 値) が L0 glossary と一致するかの照合が無く、用語 drift が silent に進む。

## スコープ

1. **突合対象の限定 (TL)**: 全識別子は誤検知の海になるため、ドメイン語彙が乗る層に限定 — schema enum 値 (kind/mode/drive/status)、harness.db テーブル名、CLI コマンド名 — を glossary と照合。
2. **advisory 開始**: 不一致は warn surface。fail-close 化は誤検知実測後に PO 判断。
3. glossary 側の未登録語は「登録候補」として別 surface (glossary の成長経路)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 突合対象確定 (TL) | 直列 |
| 2 | 突合 lint (advisory) + 初回実測 | 直列 |

## DoD

- [ ] enum/テーブル/コマンド名の glossary 突合が doctor で surface される (test 固定)
- [ ] 初回実測の不一致が棚卸しされる
