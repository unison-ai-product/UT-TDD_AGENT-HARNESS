---
plan_id: PLAN-REVERSE-280-skill-root-doc-sync
title: "PLAN-REVERSE-280: skill canonical root 移行の設計 back-fill (docs/skills → skills)"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - root 記述是正の対象範囲確定 (ADR/PLAN/SKILL_MAP/agent 定義)"
  - role: se
    slot_label: "SE - doc 是正 + dead link 修正 + 索引外 asset の明示"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-280-skill-root-doc-sync.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/plans/PLAN-L5-06-skill.md
    - skills/SKILL_MAP.md
---

# PLAN-REVERSE-280: skill canonical root 移行の設計 back-fill

## 状態

draft 起票 (A-180 S-2/S-3/S-4/S-5)。実装が先行して root を `skills/` へ移行済みなのに設計側が旧 `docs/skills/` のまま凍結している drift の正規化 = Reverse 駆動 (実装→設計 back-fill)。

## 対象 (2026-07-02 実測)

1. **root 記述の是正**: ADR-004:21 / PLAN-L4-12:52 / PLAN-L5-06:54,72 の `docs/skills/**/*.md` 記述を現行 root (`skills/`) へ更新 (confirmed doc の修正は correction note 付き)。`skills/SKILL_MAP.md:14` の自己説明 "Catalog index for docs/skills/." を修正。
2. **dead link 修正**: `.claude/agents/refactor-scout.md:24` の `docs/skills/refactoring.md` → `skills/refactoring.md` (refactor-scout はコード側 allowlist 現役 agent)。
3. **索引外 asset の明示**: `skills/review-checklist.yaml` (gate checklist SSoT) が skill 索引対象外であることの意図確認 (PO/TL) と、意図的なら索引外マーカーの明示。
4. **domain_tags 空値の是正**: `skills/technical-writing.md` の `domain_tags` を実値で埋める (L6-37 の situation-pull 索引を唯一の domain skill で機能させる)。

## R0→R4

R0 (本 doc) → R1 対象確定 → R2 是正実施 → R3 検証 (asset-drift / SKILL_MAP 突合 green) → R4 fullback (backprop_scope 記録)。

## 未着手 DoD

- [ ] 上記 4 系統の是正が landed し、`docs/skills` への stale 参照が tracked docs からゼロになる
- [ ] review-checklist.yaml の索引外扱いが明示される (PO 確認済みで)
