---
plan_id: PLAN-L7-136-harness-db-journal-status-filter
title: "PLAN-L7-136 (troubleshoot): filter transient harness DB journal status paths"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "This is an implementation-only filter for transient local SQLite sidecar files; requirements and design contracts are unchanged."
agent_slots:
  - role: aim
    slot_label: "AIM - transient DB journal feedback triage"
  - role: tl
    slot_label: "TL - close transient DB journal feedback"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-136-harness-db-journal-status-filter.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/change-impact.ts
    artifact_type: source_module
  - artifact_path: tests/change-impact.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-76-review-remediation-reliability.md
  requires:
    - docs/plans/PLAN-L7-44-harness-db-master.md
    - docs/plans/PLAN-L7-76-review-remediation-reliability.md
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T20:22:27+09:00"
    tests_green_at: "2026-06-23T20:22:27+09:00"
    verdict: pass
    scope: "Filtered transient .ut-tdd/harness.db journal/WAL/SHM paths from git porcelain input before change-impact and relation-impact projection. Verified with targeted Vitest, typecheck, DB rebuild, status, and doctor."
    worker_model: gpt-5-codex
    reviewer_model: gpt-5-codex
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\change-impact.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T20:22:27+09:00"
        evidence_path: tests/change-impact.test.ts
        output_digest: "sha256:f583ee4eec1487c557b21220de3732663e670b8ae6e6c6bc058a9f5e82cdb7ae"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T20:22:27+09:00"
        evidence_path: src/lint/change-impact.ts
        output_digest: "sha256:c9364b56f5a1e2189536c5a5ad4ff9e760e8d435487bbfe650760cdd016a7f2f"
---

# PLAN-L7-136 (troubleshoot): filter transient harness DB journal status paths

## 0. Objective

Close the spurious `missing-projection` feedback where `.ut-tdd/harness.db-journal`
can appear in `git status --porcelain` while `ut-tdd db rebuild` is projecting the
current working tree. The SQLite journal family is runtime state, not a project
artifact, and should not be surfaced as relation-impact evidence.

## 1. Scope

- Update `parseGitPorcelain` / `loadChangedFiles` input handling so transient
  `.ut-tdd/harness.db-journal`, `.ut-tdd/harness.db-wal`, and
  `.ut-tdd/harness.db-shm` paths are removed before downstream gates receive the
  changed-file set.
- Keep `.ut-tdd/harness.db` itself out of scope; only SQLite sidecar files that
  can appear during an active write are filtered.
- Preserve all non-transient paths, including handover markdown changes owned by
  another runtime.

## 2. Acceptance Criteria

- [x] `parseGitPorcelain` still parses modified, renamed, and untracked paths.
- [x] Transient harness DB journal/WAL/SHM paths are ignored.
- [x] Targeted `change-impact` tests pass.
- [x] `ut-tdd db rebuild`, `ut-tdd status --json`, and `ut-tdd doctor` complete
      without reintroducing the transient journal feedback.

## 3. Verification

- `bun run vitest run tests\change-impact.test.ts`
- `bun run tsc --noEmit`
- `bun run src\cli.ts db rebuild --json`
- `bun run src\cli.ts status --json`
- `bun run src\cli.ts doctor`
