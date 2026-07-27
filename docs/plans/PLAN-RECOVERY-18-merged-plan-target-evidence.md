---
plan_id: PLAN-RECOVERY-18-merged-plan-target-evidence
title: "PLAN-RECOVERY-18 (recovery): stacked PR merged-plan target evidence (issue #138)"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-23
updated: 2026-07-23
owner: PO / Codex
github_issue_id: 138
parent_design: docs/plans/PLAN-L7-87-merged-plan-status-kind-independent.md
backprop_decision: not_required
backprop_decision_reason: "merged-plan-status の deliverable-driven 契約は維持し、GitHub stacked PRで immediate base を landed target と誤認する証拠解決だけを是正する。"
agent_slots:
  - role: aim
    slot_label: "AIM - canonical landed targetの証拠境界とstacked base非採用の判断"
  - role: se
    slot_label: "SE - canonical target evidence resolver と loader 統合"
  - role: qa
    slot_label: "QA - main / stacked base / child の三段fixtureとfail-close回帰"
  - role: tl
    slot_label: "TL - main負債を隠さないこととLinux/Windows一致の検収"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-18-merged-plan-target-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/merged-plan-target-evidence.ts
    artifact_type: source_module
  - artifact_path: tests/merged-plan-target-evidence.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-87-merged-plan-status-kind-independent.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-54-merged-plan-status.md
    - docs/plans/PLAN-L7-86-merged-plan-status-deliverable-scope.md
    - src/lint/merged-plan-status.ts
    - tests/merged-plan-status.test.ts
review_evidence: []
---

# PLAN-RECOVERY-18: stacked PR merged-plan target evidence

## 1. 事故と不変条件

PRの immediate base SHA はreview stackの親であり、mainへ着地済みの証拠ではない。`merged-plan-status`がこれを読むと、親PRの未merge成果物を「merged」と誤判定し、子PRを永久Redにする。

- merged判定はrepository default branchのcommit treeだけを正本とする。
- immediate base ref/SHAは監査証拠として残すが、landed判定には使わない。
- Git repoでcanonical targetが解決不能ならworking treeへfail-openしない。
- 非Git fixtureだけは既存のdisk fallback互換を維持する。
- mainに本当に存在するdraft deliverable（PLAN-L7-452 / PLAN-RECOVERY-16等）は引き続きRedにする。

## 2. TDD順序

1. pure target選択、artifact分類、三段stack fixture、証拠完全性、target不在fail-closeをRed化する。
2. `merged-plan-target-evidence`を短いpure selector/classifierとGit I/O resolverへ分離して実装する。
3. 既存loaderをcanonical target treeへ接続し、Linux/Windows/aggregateで同一判定を検証する。

## 3. 完了条件

- main → 親PR → 子PR fixtureで、main成果物だけをmerged、親PR成果物をunmergedと判定する。
- evidenceがtarget ref/SHA、subject HEAD、merge-base、immediate base ref/SHA、decision sourceを保持する。
- main上の真のdraft負債を隠さない。
- PR #138のACとLinux/Windows/aggregate gateがGreenになる。
