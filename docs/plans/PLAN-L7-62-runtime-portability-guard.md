---
plan_id: PLAN-L7-62-runtime-portability-guard
title: "PLAN-L7-62: runtime portability guard for TS/Bun/Node surfaces"
kind: impl
layer: L7
drive: fullstack
parent_design: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
status: completed
created: 2026-06-16
updated: 2026-06-16
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.4
    tests_green_at: "2026-06-16"
    reviewed_at: "2026-06-16"
    verdict: pass
    scope: "runtime-portability doctor hard gate for TS/Bun core, Node stdlib typing, thin wrappers, and shell/Python drift"
agent_slots:
  - role: tl
    slot_label: "TL - runtime portability guard"
generates:
  - artifact_path: package.json
    artifact_type: config
  - artifact_path: src/lint/runtime-portability.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-portability.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
dependencies:
  parent: PLAN-L7-60
  requires:
    - docs/design/harness/L1-requirements/nfr.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/governance/repository-structure.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
# IMP-146 trace correction (2026-06-26, Codex cross-review AGREE): runtime-portability
# guard は L1 nfr.md の NFR-04 (harness=TS/Bun, ADR-001) + NFR-01/§6 (cross-platform
# native / Bun runtime) の機械強制 (enforcement)。欠落していた上流 descent link を補い
# forward-convergence spine-internal とする (Forward 集約)。新規仕様 back-fill は無し。
---

# PLAN-L7-62: runtime portability guard for TS/Bun/Node surfaces

## Objective

Make Windows portability and ADR-001 runtime boundaries mechanically enforced instead of relying
on review memory.

The harness core is TypeScript with Node standard-library APIs and a Bun runtime/compiled binary
path. Thin POSIX/PowerShell wrappers are allowed, but Python/Bash runtime logic must not move back
into current core surfaces.

## Scope

- Add `runtime-portability` lint for package/tsconfig runtime contract, TS-only core surfaces,
  TypeScript Claude hooks, approved thin wrappers, local absolute paths, and shell/Python dispatch.
- Scan both tracked and untracked non-ignored files so active setup/worktree drift is caught before commit.
- Wire `runtime-portability` into `doctor` as a hard gate.
- Replace CLI `git` helper calls that used shell-string `execSync` with `execFileSync("git", args)`.
- Add detector meta tests and current-repo guard coverage.
- Add a named `test:node-fallback` smoke script for the Node SQLite fallback path.

## Verification

- [x] `bunx vitest run tests\runtime-portability.test.ts`
- [x] `bun run test:node-fallback`

## DoD

- [x] Non-TS runtime files under `src/` or `.claude/hooks/` are detected.
- [x] Untracked non-ignored runtime files are detected during active worktree setup.
- [x] Unapproved `scripts/` runtime wrappers are detected.
- [x] Package/tsconfig drift that weakens TS/Bun/Node guarantees is detected.
- [x] Node SQLite fallback behavior is covered by a named smoke script.
- [x] `runtime-portability` is included in doctor hard-gate aggregation.
