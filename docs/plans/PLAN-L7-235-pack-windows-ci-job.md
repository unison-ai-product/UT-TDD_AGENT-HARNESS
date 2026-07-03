---
plan_id: PLAN-L7-235-pack-windows-ci-job
title: "PLAN-L7-235 (impl): Pack CI への windows-latest job 追加"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - Pack harness-check への windows job 追加 (.cmd 経路被覆)"
generates:
  - artifact_path: docs/plans/PLAN-L7-235-pack-windows-ci-job.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - docs/templates/github/common/pack-harness-check.yml
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-235 (impl): Pack CI への windows-latest job 追加

## Status

draft 起票 (PO /goal 2026-07-02、A-172 feature-gap)。

## 背景 (A-172 + A-147 教訓)

Pack は Windows-first 3 プラットフォーム対応を公開主張し Windows 専用実行経路 (`scripts/ut-tdd.ps1`、`.cmd` provider spawn) を同梱するが、CI は ubuntu-latest のみ。`.cmd` spawn は Linux CI では構造的に検証不能な既知の永続盲点 (A-147 実退行の実績)。

## スコープ

Pack の harness-check workflow (source 側 template `docs/templates/github/common/pack-harness-check.yml`) へ windows-latest job を追加 (typecheck + test:pack + setup smoke)。source repo CI への同時追加は本 PLAN のスコープ外 (別判断)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | windows job 定義 (bun setup / パス差異吸収) | 直列 |
| 2 | template 更新 → Pack sync → 実 run green 確認 | 直列 |

## DoD

- [ ] Pack repo の CI が ubuntu + windows の 2 job で green
