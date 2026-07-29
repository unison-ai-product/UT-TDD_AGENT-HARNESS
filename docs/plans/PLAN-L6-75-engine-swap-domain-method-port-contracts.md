---
plan_id: PLAN-L6-75-engine-swap-domain-method-port-contracts
title: "PLAN-L6-75 (add-design/function-spec): engine-swap domain class / method / port契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-14
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - public class/method/CQS/依存方向最終判断"
  - role: qa
    slot_label: "QA - invalid state/cycle/god object契約"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-20-engine-swap-module-decomposition.md
  references:
    - docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
    - docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
    - docs/plans/PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts.md
  blocks:
    - docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: cross_agent
    reviewed_at: "2026-07-14T15:03:30+09:00"
    tests_green_at: "2026-07-14T15:00:10+09:00"
    verdict: pass
    worker_model: gpt-5.5-codex
    reviewer_model: claude-opus-4-8
    scope: "PR #55のL4-L8 projection rebuild設計をclaim-blind/spec-blindの2 laneで独立review。spec-blindで検出した構造IDのsecret guard例外、capture 3 fieldの直接oracle、旧projection-writer test移行漏れを設計とL7/L8 oracleへ反映し、focused再review PASSを得た。U-DOMAIN-005/006は既存行が実在するため欠番指摘は不採用。"
    green_commands:
      - kind: unit_test
        command: "bun x vitest run tests/plan-lint.test.ts tests/readability.test.ts tests/merged-plan-status.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-14T15:00:10+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:368462623766175e76783b927571c6db812830af063e413cd5776e7280dc2ebf"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
---

# PLAN-L6-75: engine-swap domain class / method / port契約

- kernel/domain/application/port/adapter/composition rootの依存規則と、各public constructor/factory/command/query/event signatureを固定する。
- domainはkernel以外を逆importせず、I/Oはportへ隔離し、domain間はbranded ID/DTOで参照する。
- aggregate commandはevent/resultを返し、queryはmutationしない。二段階初期化、public mutable field、汎用Manager、barrel相互importを禁止する。
- 新規function 80 nonblank lines、CC12、nesting 3、cycle 0をhard gateとし、既存超過はdebt PLANへ送る。
- `PlanIdReservation.reserve/release/reconstruct`はtransaction、lease、idempotent command、token hash照合、競合errorを公開契約に持つ。
- 423はshared kernelとmodule-boundary移行だけを所有し、417/418/419/420/422のbounded context実装を二重所有しない。
- lint/query側が永続化具象`HarnessDb`をimportすることを禁止する。DB schema introspectionはquery ownerが最小`DbIntrospectionPort.prepare().{get,all}`を公開し、state-db adapterは構造的に実装する。これにより`state-db -> lint/export/graph/vmodel/plan`のprojection方向を維持し、逆向きedgeとmodule cycleを作らない。
