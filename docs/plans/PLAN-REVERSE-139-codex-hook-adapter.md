---
plan_id: PLAN-REVERSE-139-codex-hook-adapter
title: "PLAN-REVERSE-139: orchestrator-rule parity 採用知見の設計 back-fill (DISCOVERY-06 → L4)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: Claude
forward_routing: L4
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: not_impacted
    evidence_path: docs/plans/PLAN-L7-139-codex-hook-adapter.md
    reason: "Developer-local runtime guard parity only; no product requirement or runtime user behavior changes (mirrors PLAN-L7-139 backprop_decision=not_required; requirements doc untouched, so it is intentionally not in generates)."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/architecture.md
    reason: "§6 横断方針 (hook/CI 配線) に orchestrator-rule parity (Codex repo-local hooks.json) 行を登録し、偽パリティ caveat と scope boundary を設計面へ固定する。"
agent_slots:
  - role: tl
    slot_label: "TL - orchestrator-rule parity 設計 back-fill (architecture §6)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-139-codex-hook-adapter.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-139-codex-hook-adapter.md
  requires:
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/plans/PLAN-DISCOVERY-06-orchestrator-rule-parity.md
---

# PLAN-REVERSE-139: orchestrator-rule parity 採用知見の設計 back-fill

## Objective

`PLAN-DISCOVERY-06-orchestrator-rule-parity` (kind=poc, design-spike) が S4 で
**ADOPT (reuse-with-hardening)** を確定し、実装が `PLAN-L7-139-codex-hook-adapter`
(troubleshoot) で forward 着地した。IMP-064 (confirmed poc → Reverse 合流必須、免除は
redesign のみ) に従い、spike が採用した orchestrator-rule parity モデルを L4 設計へ back-fill する。

## Scope

- L4 architecture §6 横断方針 (hook/CI 配線) に **orchestrator-rule parity (Codex)** 行を登録:
  Claude hook 強制面 (work-guard / session-lifecycle) を Codex repo-local `.codex/hooks.json` へ
  materialize する方針と、判定本体 (`src/lint/codex-hook-adapter.ts` +
  `src/runtime/work-guard.ts#extractEditTargets`)、偽パリティ 4 caveat、scope boundary を固定。
- 要件/挙動は不変 (developer-local guard parity)。requirements への back-prop は not_impacted
  (`PLAN-L7-139` の backprop_decision=not_required と同一根拠)。

## Acceptance Criteria

- `PLAN-DISCOVERY-06` (confirmed poc) が Reverse 合流済 = scrum-reverse ゲート OK。
- architecture §6 に Codex hook parity 行が存在し、偽パリティ caveat / scope boundary を記述。
- DB rebuild 後 doctor が green。

## 壊さない / 再発させない

- 設計記述の正本は L4 architecture §6。DISCOVERY-06 §5 errata / L7-139 と相互参照を保つ。
- global `~/.codex/` 書込みは設計に含めない (repo-local 採用、不可逆操作は PO 判断事項)。
