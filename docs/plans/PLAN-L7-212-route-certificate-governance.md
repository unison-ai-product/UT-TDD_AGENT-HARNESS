---
plan_id: PLAN-L7-212-route-certificate-governance
title: "PLAN-L7-212 (impl): 新規 PLAN の route certificate を plan-governance で fail-close"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex / PO
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - route certificate governance"
  - role: qa
    slot_label: "QA - plan-governance regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-212-route-certificate-governance.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: .ut-tdd/audit/A-154-workflow-drive-telemetry-substance-audit.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-types.ts
    artifact_type: source_module
  - artifact_path: src/schema/route-map.ts
    artifact_type: source_module
  - artifact_path: src/workflow/routing-contracts.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-123-route-eval-recommended-command.md
    - docs/plans/PLAN-L7-129-incident-route-token-coverage.md
    - .ut-tdd/audit/A-154-workflow-drive-telemetry-substance-audit.md
review_evidence:
  - reviewer: codex-cli
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T22:30:00+09:00"
    tests_green_at: "2026-06-30T22:29:00+09:00"
    verdict: approve
    scope: "Future PLAN authoring route certificate gate: created>=2026-07-01 non-archived PLANs must carry route_signal/route_mode and plan-governance checks the mode against the shared route-map candidates. Existing PLANs are not backfilled."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts tests\\workflow-contracts.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:5200049532ce0cb4b1210298bb346151ea184c90ff89440a0ef71b831eaf1653"
        anchor_commit: 4c4401b66dff08751e7e15ffc16cb064f4ef66ac
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:096c894039dd0664cd7a60bcc6b417da34883587a278a16362296ccbb3bdf020"
        anchor_commit: 4c4401b66dff08751e7e15ffc16cb064f4ef66ac
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/schema/route-map.ts
        output_digest: "sha256:895f3be1928954139e1e34abd98ffdb0ca5ba6629e663d47d568def07b436078"
        anchor_commit: 4c4401b66dff08751e7e15ffc16cb064f4ef66ac
---

# PLAN-L7-212: route certificate governance

## 目的

A-154 で残った「入口の signal -> mode / route selection が advisory」という弱点を、future authoring の
`plan-governance` gate に落とす。既存 PLAN の大量 backfill は要求せず、2026-07-01 以後に作成される
non-archived PLAN の frontmatter に `route_signal` / `route_mode` を要求し、共有 route-map と一致しない
mode を fail-close する。

## 変更

- `src/schema/route-map.ts` に cycle-free な route-map / candidate helper を分離する。
- `src/workflow/routing-contracts.ts` は同じ helper を使い、既存 public type export を維持する。
- `src/plan/lint.ts` は `routeSignalCandidates` だけを参照し、`plan -> workflow -> state-db -> graph -> plan` の module cycle を作らずに route certificate を検査する。
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` と L6 function-spec に future authoring rule を記録する。

## 受入

- 欠落 certificate は `route_certificate_missing`。
- signal/mode 不一致は `route_certificate_mismatch`。
- `version_deferral` / `version-up` のように route-map と一致する certificate は pass。
- 既存 PLAN は作成日 gate により遡及 backfill を要求しない。

## 証跡

- `bun run vitest run tests\plan-lint.test.ts tests\workflow-contracts.test.ts --reporter=dot`: 48 tests passed。
- `bun run typecheck`: pass。
- `bun run lint`: pass。
