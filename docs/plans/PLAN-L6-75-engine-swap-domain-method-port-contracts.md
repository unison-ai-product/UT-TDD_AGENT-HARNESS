---
plan_id: PLAN-L6-75-engine-swap-domain-method-port-contracts
title: "PLAN-L6-75 (add-design/function-spec): engine-swap domain class / method / port契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-13
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
---

# PLAN-L6-75: engine-swap domain class / method / port契約

- kernel/domain/application/port/adapter/composition rootの依存規則と、各public constructor/factory/command/query/event signatureを固定する。
- domainはkernel以外を逆importせず、I/Oはportへ隔離し、domain間はbranded ID/DTOで参照する。
- aggregate commandはevent/resultを返し、queryはmutationしない。二段階初期化、public mutable field、汎用Manager、barrel相互importを禁止する。
- 新規function 80 nonblank lines、CC12、nesting 3、cycle 0をhard gateとし、既存超過はdebt PLANへ送る。
- `PlanIdReservation.reserve/release/reconstruct`はtransaction、lease、idempotent command、token hash照合、競合errorを公開契約に持つ。
- 423はshared kernelとmodule-boundary移行だけを所有し、417/418/419/420/422のbounded context実装を二重所有しない。
- lint/query側が永続化具象`HarnessDb`をimportすることを禁止する。DB schema introspectionはquery ownerが最小`DbIntrospectionPort.prepare().{get,all}`を公開し、state-db adapterは構造的に実装する。これにより`state-db -> lint/export/graph/vmodel/plan`のprojection方向を維持し、逆向きedgeとmodule cycleを作らない。
