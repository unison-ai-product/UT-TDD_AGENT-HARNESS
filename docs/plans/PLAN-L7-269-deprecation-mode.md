---
plan_id: PLAN-L7-269-deprecation-mode
title: "PLAN-L7-269 (impl): 廃止駆動モデル (deprecation) — 機能退役の工程・signal・整合手順"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 廃止 mode の工程定義 (退役条件 / 人間承認点) の承認"
  - role: tl
    slot_label: "TL - trace/projection 整合退役手順と gate 整合のレビュー"
  - role: se
    slot_label: "SE - mode doc + signal token + 退役 lint 整合の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-269-deprecation-mode.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - docs/process/modes/README.md
    - src/schema/route-map.ts
    - src/lint/forward-convergence.ts
---

# PLAN-L7-269 (add-impl): 廃止駆動モデル (deprecation)

## Status

draft 起票 (A-179 D-1。PO 依頼 2026-07-02 逸脱モデル監査)。新 mode 定義には誠実な設計祖先 PLAN が存在しないため偽 parent を作らず kind=impl で起票し、**PLAN-L7-263 の debt 台帳へ登載 (着手時に add-design/add-impl 降下へ昇格)**。back-fill 意図は PLAN-REVERSE-269 (R0 メモ、parent 参照) で保持。

## 背景 — 「減らす」工程が存在しない

全 mode が accretion (追加) か correction (是正) を前提とし、**確定済み機能の退役を governs する工程が無い**。本ハーネスは V-model 最終整合 (孤児 0 の機械保証) + forward-convergence を fail-close で強制するため、場当たりの機能削除は trace 系 gate と正面衝突する。signal token (feature_removal/deprecation 系) もゼロ (route-map 全行実読)。

## スコープ

1. **mode 定義**: `docs/process/modes/deprecation.md` — 退役の入口条件 (PO 判断必須 = 承認必須 mode)、工程 (影響調査 → 退役計画 → trace 整合の畳み込み → 検証 → 記録)、既存機能の supersede/correction 規律との接続。
2. **signal token**: `feature_removal` / `deprecation` / `sunset` → mode=deprecation (requiresApproval: true) を route-map へ追加。
3. **整合退役手順**: FR/設計/テスト設計/tests/trace_edges/DB projection を整合したまま退役する手順を機械補助 (退役対象の trace 到達範囲を graph から列挙 → 退役 checklist 生成)。forward-convergence / descent-obligation / orphan 検査と矛盾しない「退役済み」表現 (archived 系 status / retired マーカー) を設計。
4. **kind/§1.6 整合**: deprecation mode に対応する kind の扱いを PLAN-L7-263 の対応表確定と同時に決める (references 接続)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | mode 定義 + 退役条件の PO 承認 | 直列 |
| 2 | signal token + routing (承認必須) | 直列 |
| 3 | 退役 checklist 生成 + gate 整合表現 | 直列 |
| 4 | regression test (退役後に orphan/convergence が fail しない) | 直列 |

## DoD

- [ ] `route eval --signal feature_removal` が deprecation へ routing する (test 固定)
- [ ] 退役手順で trace/projection 整合が保たれる (実 repo 回帰で確認)
- [ ] mode doc が modes README 台帳へ登録される
