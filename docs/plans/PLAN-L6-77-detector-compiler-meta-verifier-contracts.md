---
plan_id: PLAN-L6-77-detector-compiler-meta-verifier-contracts
title: "PLAN-L6-77 (add-design/function-spec): detector compiler / independent meta-verifier契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - deterministic compiler / independent verifier ports"
  - role: qa
    slot_label: "QA - U/I/M-SP mutation oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-22-detector-self-proof-receipt-physical-data.md
  references:
    - docs/plans/PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts.md
    - docs/plans/PLAN-L6-76-semantic-assessment-debt-routing-contracts.md
  blocks:
    - docs/plans/PLAN-L7-425-independent-detector-meta-verifier.md
---

# PLAN-L6-77: detector compiler / independent meta-verifier契約

- `compileVModelContract`をdeterministic compiler、`runSelfProof(request,deps)`を独立meta-verifier facadeとする。
- verifier depsはProcessRunner/SourceHasher/ReceiptStoreで、対象detectorのverdict関数をoracleとしてimportしない。
- `U-SP-001..008`、`I-SP-001..002`、`M-SP-001..007`でregistry exactly-once、digest、surface、fixture、未配線、例外、DB-only補完、mutation killを検証する。
- receipt無しruleを未統制としてcoverageから除外し、mutation survivor 0と正常fixture false-positive 0をaccept条件にする。
