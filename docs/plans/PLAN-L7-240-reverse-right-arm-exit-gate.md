---
plan_id: PLAN-L7-240-reverse-right-arm-exit-gate
title: "PLAN-L7-240 (impl): Reverse R4 exit の右腕強制 (③テスト設計確定 + 再入先 pair-freeze 検証)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/reverse.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - R4 exit lint (missing_pair_artifacts / 再入先 gate 通過) 実装"
  - role: tl
    slot_label: "TL - cross-PLAN gate 設計 (routing 先 layer の pair-freeze 判定) レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-240-reverse-right-arm-exit-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - docs/process/modes/reverse.md
    - src/workflow/contracts-policy.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-240 (impl): Reverse R4 exit の右腕強制

## Status

draft 起票 (PO /goal 2026-07-02、A-173 F-4 feature-gap)。

## 背景 (A-173 F-4)

Reverse の schema 強制 (R0-R4 phase / R3 po role / forward_routing) は最厚だが、右腕側 2 点が宣言のみ:

- ③テスト設計確定 (missing_pair_artifacts 記録 or as-is 復元、reverse.md:65-66) を R4 close 前に検証する lint が無く、③不在のまま R4 close 可能。
- 再入先 pair-freeze gate (G1/G3/G4/G5) 通過義務 (reverse.md:85-96) の cross-PLAN 検証が無い (screen-impl-pair-freeze は UI 専用)。`--invalidate-forward` も stub。

## スコープ

1. R4 の completed/confirmed 遷移前に ③確定 (missing_pair_artifacts or 復元済 test-design 参照) を fail-close 検証。
2. forward_routing 先 layer の pair-freeze 通過を確認する cross-PLAN gate。
3. `--invalidate-forward` stub の実装 or 明示 defer 記録。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | ③確定 lint | 直列 |
| 2 | 再入先 pair-freeze cross-PLAN gate | 1 と並列 |
| 3 | invalidate-forward の disposition 確定 | 直列 |

## DoD

- [ ] ③未確定の R4 close が doctor red (regression test)
- [ ] routing 先 gate 未通過の forward merge が検出される
