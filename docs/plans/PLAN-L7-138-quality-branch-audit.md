---
plan_id: PLAN-L7-138-quality-branch-audit
title: "PLAN-L7-138 (add-impl): read-only quality and branch audits"
kind: add-impl
layer: L7
drive: be
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "This adds read-only audit surfaces for existing quality and maintenance concerns; no new product requirement or destructive operation is introduced."
agent_slots:
  - role: tl
    slot_label: "TL - quality and branch audit implementation"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-138-quality-branch-audit.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/if-detail.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: src/audit/quality.ts
    artifact_type: source_module
  - artifact_path: src/audit/branches.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/quality-audit.test.ts
    artifact_type: test_code
  - artifact_path: tests/branch-audit.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
  requires:
    - docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
    - docs/plans/PLAN-REVERSE-138-quality-branch-audit.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T22:15:00+09:00"
    tests_green_at: "2026-06-23T22:15:00+09:00"
    verdict: approve
    scope: "Read-only quality and branch audit surfaces; no destructive branch operation."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\quality-audit.test.ts tests\\branch-audit.test.ts tests\\cli-surface.test.ts -t \"quality audit|branch audit\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T22:03:46+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:02dfec21181e8478f0ba3da13c010c8f155d45c9202ef008eb13fcbf3364dfb5"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T22:03:49+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:be796648c6b7a34bcc93f007ad7a6b9c4c5ac0765a42f243b10b3b7378f2147b"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T22:05:10+09:00"
        evidence_path: src/audit/quality.ts
        output_digest: "sha256:21df0de2a64028799e47b02f30e38b0221895cce18d09c07240e577b96874b22"
      - kind: smoke
        command: "bun run src\\cli.ts audit quality --limit 10"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T22:06:00+09:00"
        evidence_path: tests/quality-audit.test.ts
        output_digest: "sha256:67ff3c7faa901eb99914661b2b5b16fdc8c7ffee66d028c6e362891631b10c58"
      - kind: smoke
        command: "bun run src\\cli.ts branch audit --limit 20"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T22:06:00+09:00"
        evidence_path: tests/branch-audit.test.ts
        output_digest: "sha256:83860fcceb15d570c46c5e156b1345fddc5170685f10ff1c99b35fa66aee33a1"
---

# PLAN-L7-138 (add-impl): read-only quality and branch audits

## 0. Objective

Add practical read-only surfaces for:

- hardcoded values, security risks, and technical debt markers;
- large local branch cleanup inventory.

The branch surface must not delete anything. It only classifies candidates for
human review.

## 1. Scope

- Add `ut-tdd audit quality`.
- Add `ut-tdd branch audit`.
- Classify findings using the existing `gate` / `actionable` / `telemetry`
  display discipline.
- Keep destructive branch deletion out of scope.

## 2. Acceptance Criteria

- [x] Secret-like literals and dangerous shell execution are gate findings.
- [x] Hardcoded path, local endpoint, model/provider literals, and legacy runtime
      references are actionable findings.
- [x] TODO/FIXME/HACK/XXX are telemetry findings.
- [x] Branches are classified as keep, delete-candidate, or review from
      current/protected/gone/merged/stale evidence.
- [x] CLI supports text and JSON output.
- [x] No command deletes branches or rewrites history.

## 3. Verification

- `bun run vitest run tests\quality-audit.test.ts tests\branch-audit.test.ts`
- `bun run vitest run tests\cli-surface.test.ts -t "quality audit|branch audit"`
- `bun run tsc --noEmit`
- `bun run lint`
- `bun run src\cli.ts audit quality --limit 10`
- `bun run src\cli.ts branch audit --limit 20`
