---
plan_id: PLAN-L6-49-refactor-and-qa-release-gates
title: "PLAN-L6-49 (add-design): ZIP108 refactor and ZIP109 QA release gate contracts"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL / QA
parent_design: docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T19:10:00+09:00"
    tests_green_at: "2026-07-08T19:10:00+09:00"
    verdict: approve
    scope: "U13b add-design slice. ZIP108 Refactor 不変性/閾値/切り戻しと ZIP109 QA Go/No-Go/ISO25010/スモークを HARNESS authoring source へ翻訳。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/vmodel-refactor-qa-release-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T19:10:00+09:00"
        evidence_path: tests/vmodel-refactor-qa-release-contracts.test.ts
        output_digest: "sha256:69b388dcb8698630b9b45abefc63d9c3b509f80e81dc872ab37aabb8a5fc0420"
        anchor_commit: a9accba5c8cc59eb53308e84613191b84dc54e22
agent_slots:
  - role: tl
    slot_label: "TL - ZIP108/109 design translation"
  - role: qa
    slot_label: "QA - Go/No-Go contract"
generates:
  - artifact_path: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-refactor-qa-release-gates.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/refactor.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
  requires: []
  references:
    - docs/governance/vmodel-refactor-qa-release-gates.md
---

# PLAN-L6-49: ZIP108 refactor and ZIP109 QA release gate contracts

## 0. 役割

本 PLAN は ZIP 108 / 109 を HARNESS の V-model upgrade 設計へ取り込む。ZIP 108 は
Refactor を振る舞い不変の完全化保守として固定する。ZIP 109 は release / accept 前の
QA 診断を Go/No-Go として固定する。

## 1. 設計差分

1. `docs/governance/vmodel-refactor-qa-release-gates.md` を authoring source にする。
2. `docs/process/modes/refactor.md` を ZIP108/109 authoring source へ接続する。
3. Refactor trigger は複雑度、重複、テスト時間、変更失敗率を測定可能な閾値として扱う。
4. QA release gate は ISO/IEC 25010、Go/No-Go G01-G08、スモーク/回帰最小集合を持つ。

## 2. 受け入れ条件

- `VMS-012` が governance authoring source、typed spec ledger、body に存在する。
- ZIP108/109 の Refactor / QA release 契約が authoring source に存在する。
- 後続 `PLAN-L7-394` が `refactor-qa-release-contracts` gate と unit oracle を実装する。
