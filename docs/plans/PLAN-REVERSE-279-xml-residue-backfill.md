---
plan_id: PLAN-REVERSE-279-xml-residue-backfill
title: "PLAN-REVERSE-279: XML 残渣検出 lint の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - xml residue lint back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-279-xml-residue-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-279-xml-residue-lint.md
  requires: []
  references:
    - .claude/CLAUDE.md
---

# PLAN-REVERSE-279: XML 残渣検出 lint の設計 back-fill

## 状態

draft 起票 (PLAN-L7-279 の back-fill 意図保持、R0 メモ)。

## Back-Fill 候補

- Native Tool Invocation 規約 (.claude/CLAUDE.md / AGENTS.md) へ機械検出の存在を追記し、prose 規約から機械強制へ格上げした事実を記録する。

## 未着手 DoD

- [ ] 残渣検出が規約正本に機械裏付けとして記録される。
