---
plan_id: PLAN-REVERSE-448-source-repo-windows-ci-job-backfill
title: "PLAN-REVERSE-448: source repo Windows CI 被覆の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude (起票) / Codex (pairing)
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - source repo Windows CI の設計境界と検出後 debt route"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-448-source-repo-windows-ci-job-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-448-source-repo-windows-ci-job.md
  requires: []
  references:
    - docs/plans/PLAN-L7-448-source-repo-windows-ci-job.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
---

# PLAN-REVERSE-448: source repo Windows CI 被覆の設計 back-fill

## 状態

draft 起票 (PLAN-L7-448 の Reverse pairing、R0 メモ)。source repo の Windows CI を
追加する実装計画に対して、CI が担う検出境界と検出後の debt route を設計へ戻す。

## Back-Fill 候補

- source repo と Pack repo の CI 責務境界を L6 設計へ追記し、同じ `harness-check` 名でも
  対象リポジトリと被覆範囲を混同しない判定軸を固定する。
- Windows 固有の path / provider spawn / SQLite handle 差異を「検出するCI」と「修正を
  所有する個別PLAN」に分離する遷移を、Forward 外の起票ルールとして設計へ戻す。
- scoped doctor と scoped test の選定根拠、full doctor をCIから外す場合の残余リスクと
  review evidence の記録項目を検証設計へ追加する。

## DoD

- [ ] source/Pack CI の責務境界が設計 doc に記録される。
- [ ] Windows 固有 Red の検出から debt route への遷移が設計 doc に記録される。
- [ ] scoped CI の残余リスクと review evidence の必須項目が検証設計 doc に記録される。
