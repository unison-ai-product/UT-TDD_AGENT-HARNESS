---
plan_id: PLAN-REVERSE-410-defect-routing-refactor-backfill
title: "PLAN-REVERSE-410: defect_routing Refactor lifecycle back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
created: 2026-07-09
updated: 2026-07-09
owner: Codex
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
parent_design: docs/plans/PLAN-L7-410-defect-routing-refactor-candidates.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "verification finding から Refactor candidate lifecycle へ投影する関数契約を追加する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "右肺 defect_routing fixture から candidate と linked_plan_id preservation を oracle 化する。"
agent_slots:
  - role: tl
    slot_label: "TL - defect_routing back-fill"
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T21:14:00+09:00"
    tests_green_at: "2026-07-09T21:13:00+09:00"
    verdict: approve
    scope: "PLAN-L7-410 の L6 function spec / L7 unit oracle back-fill。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint docs\\plans\\PLAN-L7-410-defect-routing-refactor-candidates.md docs\\plans\\PLAN-REVERSE-410-defect-routing-refactor-backfill.md docs\\plans\\PLAN-RECOVERY-10-right-lung-quality-assurance.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T21:12:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:7fbed17ede44ed62063555512d05a2e856b4acd3fd7d33087bf7a47da81fa8aa"
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\state-db.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T21:12:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:7fbed17ede44ed62063555512d05a2e856b4acd3fd7d33087bf7a47da81fa8aa"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-410-defect-routing-refactor-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-410-defect-routing-refactor-candidates.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-410-defect-routing-refactor-candidates.md
  requires:
    - docs/plans/PLAN-L7-410-defect-routing-refactor-candidates.md
---

# PLAN-REVERSE-410: defect_routing Refactor lifecycle back-fill

## R0 Evidence

`PLAN-RECOVERY-10` Step 4.4 は、検証 PLAN の `defect_routing` 出口を refactor candidate lifecycle
へ接続する仕様を要求していた。`PLAN-L7-367` は lifecycle table と decision preservation を実装済みだが、
verification finding を lifecycle へ流す投影は未定義だった。

## R1 Observed Gap

右肺 test-design docs は `defect_routing` marker を持つが、実行結果や verification evidence から
`refactor_candidates` へ入る経路が無い。この状態では、検証で見つかった構造的弱さが DB 上の改善候補として
残らず、右肺が品質改善を駆動する閉ループにならない。

## R2 Alignment

DB は authoring source ではないため、Refactor PLAN 本文は生成しない。verification finding のうち
Refactor routing 語を持つものだけを `verification-defect-routing` candidate として投影し、
`decideRefactorCandidate` による triage と `linked_plan_id` だけを永続化する。

## R3/R4 Back-fill

- `docs/design/harness/L6-function-design/function-spec.md`: `projectVerificationDefectRoutingRefactorCandidates`
  の関数契約を追加。
- `docs/test-design/harness/L7-unit-test-design.md`: verification defect routing fixture と linked PLAN
  preservation の oracle を追加。

Reverse / Add-feature への route は既存 `detector_route_candidates` / `routeFiling` の責務とし、本 back-fill は
Refactor lifecycle 接続に限定する。
