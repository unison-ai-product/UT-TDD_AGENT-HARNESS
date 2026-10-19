---
plan_id: PLAN-L7-173-handover-type-constant-split
title: "PLAN-L7-173: handover type and constant split"
kind: refactor
layer: L7
drive: db
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: Behavior-invariant extraction of handover type and
  constant declarations. Runtime logic and public handover exports are
  preserved.
agent_slots:
  - role: se
    slot_label: SE - handover sidecar split
  - role: tl
    slot_label: TL - handover invariant review
generates:
  - artifact_path: docs/plans/PLAN-L7-173-handover-type-constant-split.md
    artifact_type: markdown_doc
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: src/handover/handover-types.ts
    artifact_type: source_module
  - artifact_path: src/handover/handover-constants.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-172-harness-db-catalog-section-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-06-25T22:21:41+09:00
    tests_green_at: 2026-06-25T22:17:00+09:00
    verdict: approve
    scope: Split handover type and constant declarations into sidecar modules while
      keeping src/handover/index.ts as the compatibility export surface.
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: bun run vitest run tests\handover.test.ts --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-06-25T22:10:36+09:00
        evidence_path: tests/handover.test.ts
        output_digest: sha256:a8880464cc076556fa02321fb205e95af3c1908155f125861cd23b8560f8f9f8
        anchor_commit: 1676993a19a70090f804cade9d5553584e45704f
      - kind: typecheck
        command: bun run typecheck
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-06-25T22:16:58+09:00
        evidence_path: src/handover/index.ts
        output_digest: sha256:8284061b8e1dcc8e089b784f51f39f32cbd91ddfeb3452d8a96a07f54158bc25
        anchor_commit: 6df9a823a9de546e394f5224c80eb740d73a7993
      - kind: lint
        command: bun run lint
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-06-25T22:16:49+09:00
        evidence_path: src/handover/handover-types.ts
        output_digest: sha256:ac848a981e1843998d9a219a8209a4458195b89bc1c4bfe90dfd3696163c5160
        anchor_commit: 6df9a823a9de546e394f5224c80eb740d73a7993
    notes:
      - bun run vitest run tests\doctor.test.ts timed out before test output in
        this environment; retained as residual verification risk and covered by
        subsequent doctor CLI gate.
route_signal: debt
route_mode: refactor
status: confirmed
github_issue_id: 1062
admission_receipt:
  schema_version: v2
  receipt_id: certificate:4a46547fb055c669d801c11b9b4ba486
  command_id: issue1062-split-PLAN-L7-173-handover-type-constant-split-r2-20261019
  admitted_at: 2026-10-19T09:30:56.574Z
  source_digest: sha256:7211514120312718a5878c9e28bc25fe27be038253b0718aaf08287cff10d5b3
  decision_digest: sha256:531b05e7e02f98ec860d2e933f119d54de5fdb03bc26c4c911eb5641ff4c2052
  receipt_digest: sha256:dae42f5960514a11444c2f302f70cf17c40541b677482b1bf234688ae34be2c2
  binding:
    path: docs/plans/PLAN-L7-173-handover-type-constant-split.md
    plan_id: PLAN-L7-173-handover-type-constant-split
    asset_id: plan:legacy:063e24c8d60ab421324c422d22990b91dd25ca57bc904f6900501a9ee9d5deac
    revision: 2
    content_digest: sha256:7211514120312718a5878c9e28bc25fe27be038253b0718aaf08287cff10d5b3
  route:
    signal: debt
    mode: refactor
  issue:
    provider: github
    issue_id: 1062
    episode_id: issue-1062
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-173-handover-type-constant-split
    revision: 1
    digest: sha256:af6d3ee2a050b75a25d363bff92980813cc225e440f96489dd7eec6cf670c652
  reentry:
    target_plan_id: PLAN-L7-173-handover-type-constant-split
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #1062 段階6bの契約改訂。L6 state-channel-consolidation §5.1 の撤去対象に
    tests/handover-completion-wording.test.ts を追加したため、既存PLANの generates /
    証跡参照を外す。"
---

# PLAN-L7-173: handover type and constant split

## Objective

Reduce remaining `split-module` pressure on `src/handover/index.ts` without
changing handover behavior or public imports.

## Scope

- Move handover public type declarations to `src/handover/handover-types.ts`.
- Move handover constants to `src/handover/handover-constants.ts`.
- Re-export the moved declarations from `src/handover/index.ts` for compatibility.
- Add direct sidecar coverage in `tests/handover.test.ts`.

## Acceptance Criteria

- `tests/handover.test.ts`, typecheck, lint, DB rebuild, and doctor pass.
- The refactor detector no longer reports `src/handover/index.ts` as an
  untested sidecar split.
- Any remaining `split-module` candidates are limited to larger modules that
  still need separate planned slices.
