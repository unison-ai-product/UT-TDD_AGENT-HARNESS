---
plan_id: PLAN-L7-337-plan-design-reference-lint
title: "PLAN-L7-337 (impl): 実装系 PLAN の設計 doc 参照義務 lint (V-model 左腕との runtime 断絶是正)"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 + 対象 kind 範囲の追認"
  - role: tl
    slot_label: "TL - warn 対象 (add-impl/refactor) と免除条件のレビュー"
  - role: se
    slot_label: "SE - plan lint への warn-first 検査追加"
generates:
  - artifact_path: docs/plans/PLAN-L7-337-plan-design-reference-lint.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-312-plan-reference-freshness-analyzer.md
---

# PLAN-L7-337 (impl): PLAN→設計 doc 参照義務 lint

## Status

**version-up parked (v2)**。A-182 所見 DQ-4 (QU-10)。PO 指示 2026-07-03「アップデートでプラン化」。L7-312 (参照鮮度、Codex landed) の姉妹 gate — あちらは「参照が新鮮か」、本 PLAN は「設計参照がそもそも在るか」。

## 背景 (実測 2026-07-03、A-182 §2)

- 直近 confirmed PLAN 5 本 (L7-321/322/325/326 等) の dependencies.references に `docs/design/` が **0 件** — 実装 PLAN が設計 doc を参照しない慣例が固定化しつつある (DQ-4)。
- 影響: 設計 doc が実装判断の現役資料から構造的に外れる。V-model 左腕 (設計) と右腕 (実装) の接続が runtime で断絶 — 「設計 doc を書いても読まれない」は L5 凍結 stale (L7-328) の発生機序そのもの。

## スコープ (1 要件: 実装系 PLAN が対応設計 doc を references に持つことを warn-first で検査する)

1. `ut-tdd plan lint` に検査追加: kind が add-impl / refactor (活性化時に TL 追認で範囲確定) の PLAN について、`dependencies.references` または `parent_design` に `docs/design/` 配下が 1 件以上あることを warn-first で要求。
2. 免除: 設計対象を持たない PLAN (docs-only、台帳整理系) は route_mode / kind で機械判定 — 免除条件はテストで固定し、判定不能なら warn 側に倒す。
3. 段階 hard 化 (warn → fail) は運用実績を見て別 PLAN で判断 (本 PLAN は warn まで — スコープ宣言)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 対象 kind / 免除条件の TL 追認 | 直列 (先行) |
| 2 | plan lint 検査 + fixture tests | 直列 |
| 3 | 実 repo 走査で warn 件数の基線記録 (A-18x 系列へ) | 直列 |

## DoD

- [ ] 設計参照なし add-impl fixture が warn (test 固定)
- [ ] docs-only PLAN が warn されない (免除の test 固定)
- [ ] 実 repo warn 件数が基線として記録されている
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 触るファイル: `src/plan/lint.ts` 系 (Codex の抽出対象になり得る — 着手前に非接触確認)。
- 活性化時 kind は add-impl へ昇格 (Reverse pairing 必須)。
