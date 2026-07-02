---
plan_id: PLAN-L7-277-skill-recommendation-discrimination
title: "PLAN-L7-277 (add-impl): skill 推奨の差別化 (学習ループ接続 + 平坦 score の解消)"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - score 式の差別化設計 (実績項の重み / 汚染データ除外) レビュー"
  - role: se
    slot_label: "SE - evaluations→score 接続 + reason 個別化 + test"
generates:
  - artifact_path: docs/plans/PLAN-L7-277-skill-recommendation-discrimination.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-53-learning-engine.md
  requires: []
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
    - src/skill-engine/recommend.ts
    - src/state-db/skill-projections.ts
---

# PLAN-L7-277 (add-impl): skill 推奨の差別化

## Status

draft 起票 (A-180 S-6)。正規形 = parent: PLAN-L7-53 (learning-engine、drive 一致) + Reverse pairing = PLAN-REVERSE-277。**実質前提 = PLAN-L7-262** (provenance 浄化。汚染データのまま学習項を接続すると偽実績で推奨が歪む) — requires には landed 後に張る (requires_not_ready 規約)。

## 背景 — 推奨は「均一 score の平坦フィルタ」(live 実走で確定)

- `skill suggest --plan PLAN-L7-272` の全 5 候補が **score 0.8・reason 同一** (layer/drive/mode/kind の言い換え)、rank はアルファベット順。lint 発火化 PLAN に browser-testing が rank 2 で出る等の無関係推奨。
- 原因: score 式 (layer +0.3 / drive_model +0.3 支配) で候補が全員同点 + **学習ループが片道** — `skill_evaluations` (skill_rating/adoption_count/unused_flag) は算出されるが `src/skill-engine/` から参照ゼロ (grep 確定)。「学習エンジン」は推奨精度に効いていない。
- 併発: スコアリングが 2 重実装 (`recommend.ts:232 scoreSkill` vs `skill-projections.ts:27 skillScore`、overlap 処理が乖離) — 統合は本 PLAN のスコープに含める (A-180 S-7)。

## スコープ

1. **score 式の差別化**: metadata overlap / trigger 適合を実効化し同点均一を解消。reason を候補ごとの根拠 (どの trigger/tag が効いたか) に個別化。
2. **学習項の接続**: `skill_evaluations` (runtime provenance のみ、L7-262 準拠) を score へ反映 (採用実績/unused の減点)。汚染データ (auto-projection 由来) は入力から除外することを test 固定。
3. **スコアリング統合**: scoreSkill / skillScore を単一実装へ (どちらかへ寄せ、もう片方は参照化)。CLI 推奨と DB 投影のランキング一貫性を test 固定。
4. 本文品質 (scaffold TODO 残存等) を score 減点項にするかは実装時に TL 判断 (A-180 S-9 の接続先)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | score 式再設計 + 汚染除外境界 (TL) | 直列 |
| 2 | 差別化 + reason 個別化 + 実装統合 | 直列 |
| 3 | 学習項接続 (L7-262 landed 後、requires を張る) | 直列 |
| 4 | regression test (同点均一が解消 / 無関係推奨の抑制 / CLI↔DB 一貫) | 直列 |

## DoD

- [ ] 実 PLAN に対する推奨で score が差別化される (均一 0.8 でないことを test 固定)
- [ ] reason が候補固有の根拠を含む (test 固定)
- [ ] scoreSkill/skillScore の実装が単一化される (test 固定)
- [ ] 学習項の入力が runtime provenance に限定される (test 固定)
