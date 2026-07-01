---
plan_id: PLAN-L7-203-windows-provider-spawn-verbatim
title: "PLAN-L7-203: Windows provider .cmd spawn quoting"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - Windows .cmd provider launch repair"
  - role: qa
    slot_label: "QA - provider-spawn regression verification"
generates:
  - artifact_path: docs/plans/PLAN-L7-203-windows-provider-spawn-verbatim.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-196-runtime-config-hardening.md
  requires:
    - docs/plans/PLAN-L7-196-runtime-config-hardening.md
    - docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Fix A147-1 by launching Windows .cmd provider shims through cmd.exe with a fully wrapped inner command and windowsVerbatimArguments propagated through probe, adapter execute, and team execute paths."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T11:58:50+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:ed8855117f7827e1da70ef4677cd539833169b02e858e56dc96cd922378f62d9"
      - kind: integration_test
        command: "bun run vitest run tests\\runtime-hook-entrypoints.test.ts tests\\cli-surface.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T11:57:24+09:00"
        evidence_path: tests/runtime-hook-entrypoints.test.ts
        output_digest: "sha256:74c3e99f9b6a45a68e0de00eb5715010c03eee6cf9ab235d11dd6f975a227eac"
      - kind: unit_test
        command: "bun run test"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:282deaee2fd3064d743310e503fefbf08c2749d6cd9be8ebc815deed99e3fd31"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T11:57:24+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:91e14872daecee813cb26ca822f18b72fd1f4c41534cbdcfd493557a916e2454"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:eccbd8a33367495b48d5c6af7651194e11bd9579a3528a888c1dab912c6981b0"
---

# PLAN-L7-203: Windows provider .cmd spawn quoting

## Objective

Fix the Windows provider-spawn regression recorded as A147-1. A Codex or Claude
provider shim ending in `.cmd` must be spawnable from the harness on native
Windows, including paths containing spaces.

## Problem

The provider adapter wrapped `.cmd` providers as:

```text
cmd.exe /d /s /c "<script.cmd>" "<arg>"
```

with `shell:false`, but the child-process call did not set
`windowsVerbatimArguments`. On Windows, Node/Bun can re-escape the quote
boundary before `cmd.exe` receives it, causing `cmd.exe` to treat the quoted
script path as a broken literal. Provider probing then reports the runtime as
unavailable even when the shim exists.

## Implementation

- `ProviderInvocation` now carries `windowsVerbatimArguments`.
- Windows `.cmd`/`.bat` providers are launched as a fully wrapped inner command:

```text
cmd.exe /d /s /c ""<script.cmd>" "<arg>""
```

- `isProviderCommandSpawnable`, direct adapter `--execute`, and `team run
  --execute` all propagate the same `windowsVerbatimArguments` value.
- `tests/runtime-adapter.test.ts` includes a Windows-host regression test that
  writes a fake provider under a path with spaces and verifies `--version`
  probing succeeds.

## Acceptance

- Windows `.cmd` provider probing succeeds with a space-containing path.
- The provider-spawn lane that A-147 reported as failing is green locally:
  `runtime-hook-entrypoints`, `cli-surface`, and `distribution-acceptance`.
- No provider prompt text is moved back into argv; prompts remain on stdin.
