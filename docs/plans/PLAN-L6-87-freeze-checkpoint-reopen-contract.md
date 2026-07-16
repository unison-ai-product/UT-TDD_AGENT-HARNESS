---
plan_id: PLAN-L6-87-freeze-checkpoint-reopen-contract
title: "PLAN-L6-87 (add-design/function-spec): Freeze checkpoint・再開放・再合流契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-31-freeze-checkpoint-reopen-architecture.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - reopen境界とcertificate policy"
  - role: se
    slot_label: "SE - command/value object/tag port"
  - role: qa
    slot_label: "QA - closure/reverify fail-close oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-87-freeze-checkpoint-reopen-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-31-freeze-checkpoint-reopen-architecture.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-442-freeze-checkpoint-ledger-tag-projection.md
    - docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
  references:
    - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
    - docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
review_evidence: []
---

# PLAN-L6-87: Freeze checkpoint・再開放・再合流契約

## 1. Command / value object

`RequestFreezeCheckpoint` はgate/scope、commit/tree、manifest、trace/oracle/evidence/approval digest、parent freeze、branch protection snapshotを必須とする。`AssessReopen` はbaseline freezeとcandidate commitを必須とし、任意のscope指定で影響を狭められない。`VerifyRefreeze` はassessment内の全required impactと対象gateのfresh evidenceを要求する。CLIは `ut-tdd plan freeze checkpoint|assess-reopen|verify` とし、既存legacy Issue queueへ混在させない。

## 2. policy

`evaluateReopen` はrelation/traceのtyped closureを使い、最上流gate、invalidated checkpoint、required re-freeze gateを返す。unanchored/tag不一致、artifact digest差、closure未計算、no-impact偽装はstructured violationにする。tag portはannotated immutable tagだけを受け入れ、Release/version tagを拒否する。

## 3. certificate / merge

`certifyReentry` はorigin freeze、assessment digest、reopen_from、invalidated checkpoint、全required re-freeze evidenceをcertificateへcanonicalに束縛する。E10/E12/E14判定は一つでも未再検証のcheckpointがあればfail-closeする。off-Forward Issue projectionはこれらを本文・typed payload双方に持つ。

## 4. Unit oracle

`U-FREEZE-001..006` はreceipt immutability、tag reconciliation、duplicate request、branch protection snapshot、manifest改変を固定する。`U-REOPEN-001..007` はno-impact、上流再開放、閉包、無効化、再検証、certificate/PR/merge拒否を固定する。実装はこれらのRedを先に置く。
