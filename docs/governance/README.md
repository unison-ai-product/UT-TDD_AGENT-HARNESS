# Governance Documents

This directory contains the current governance documents for UT-TDD Agent Harness.
Historical source snapshots, migration notes, and local runtime state are reference
material only.

## Current Source Of Truth

Claude Code, Codex, and human reviewers should read these documents for normal work:

1. `ut-tdd-agent-harness-concept_v3.1.md`
2. `ut-tdd-agent-harness-requirements_v1.2.md`
3. `../adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
4. `repository-structure.md`

> **ADR-001 boundary**: implementation is UT-TDD-owned TypeScript/Bun. Migration
> docs and source snapshots are reference-only material for porting audits and
> regression ideas; they are not Current Source Of Truth and are not an execution
> route.

## Reference Only

These documents support background, team operations, or upper-layer planning. They
do not override the Current Source Of Truth list above:

- `ai-dev-team-concept_v1.1.md`
- `ai-dev-team-operations_v1.1.md`
- `audit-framework.md`
- `coding-rules.md`
- `ddd-tdd-rules.md`
- `document-system-map.md`
- `gate-design.md`
- `recovery-workflow.md`

## Archived Or Vendor Material

Archived documents, source snapshots, migration inventories, and local legacy
checkouts are historical evidence only. Do not use them as UT-TDD runtime state,
execution routes, or current command paths. The current runtime command is
`ut-tdd`.
