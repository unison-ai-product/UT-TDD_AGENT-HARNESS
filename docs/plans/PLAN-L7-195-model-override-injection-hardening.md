---
plan_id: PLAN-L7-195-model-override-injection-hardening
title: "PLAN-L7-195 (impl): model override injection hardening (Security) - strict modelOverrideSchema validation, Windows .cmd launch with shell=false, and injection regression tests. A-144/A-145 SEC-2"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-06-30
owner: PM (Opus) / PO
parent_design: docs/design/harness/L6-function-design/agent-slots.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE (Codex delegation) - strict modelOverrideSchema validation, shell=false adapter launch, injection regression tests"
  - role: qa
    slot_label: "security-audit - injection surface, shell=false launch, and model compatibility review"
generates:
  - artifact_path: docs/plans/PLAN-L7-195-model-override-injection-hardening.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: tests/team-schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-160-runtime-adapter-policy-extraction.md
  references:
    - .ut-tdd/audit/A-145-02-runtime-config-delegation.md
    - .ut-tdd/audit/A-144-02-runtime-config-security.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T10:43:30+09:00"
    tests_green_at: "2026-06-30T10:42:58+09:00"
    verdict: approve
    scope: "PLAN-L7-195 model override injection hardening: strict model token validation plus Windows .cmd provider invocation with Node shell=false."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:17:40+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:ed8855117f7827e1da70ef4677cd539833169b02e858e56dc96cd922378f62d9"
      - kind: unit_test
        command: "bun run test tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:42:58+09:00"
        evidence_path: tests/team-schema.test.ts
        output_digest: "sha256:39e64a5d87d7cfc4417ac5b94c67c574d12695bed0c7f027950ae4604965f676"
      - kind: unit_test
        command: "bun run test tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:17:40+09:00"
        evidence_path: tests/team-run.test.ts
        output_digest: "sha256:48679da7a5a6db9c2bce6753cf353943e40f0865b240244fff4a3f4c966f70d9"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T10:17:40+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:331fcf4747f9ca0f3b7b1bf9456ad50f77630c309c047bd81097e367ede41101"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T10:39:47+09:00"
        evidence_path: src/schema/team.ts
        output_digest: "sha256:bf18b8132eee3fddfdb1e4405a1c876915596a9a152debed9d9ba8ee54e64519"
---

# PLAN-L7-195 (impl): model override injection hardening (Security)

## 0. Finding

- `modelOverrideSchema` previously accepted any string starting with `gpt-`, `claude-`, or `codex-`, so shell metacharacters and path-like payloads could pass validation.
- Windows `.cmd` provider shim invocation previously used `shell:true`, increasing the risk if unsafe argv ever reached the provider launch path.
- A-144/A-145 classified this as Security HIGH and recommended closing it before broader version-up work.

## 1. Scope

- Tighten `modelOverrideSchema` to provider-prefixed safe tokens (`[A-Za-z0-9._-]` after the provider prefix) or exact aliases (`haiku`, `sonnet`, `opus`, `local`).
- Launch Windows `.cmd` / `.bat` provider shims through canonical `cmd.exe` with Node `shell=false`.
- Add regression tests for shell metacharacters and path-like model override payloads while preserving valid model ids.

## 2. Acceptance Criteria

- Invalid model strings containing shell metacharacters are rejected by schema tests.
- `.cmd` invocation no longer emits `shell:true` and keeps free-form task text in stdin.
- Valid provider model ids and family aliases remain accepted.
- doctor / lint / typecheck / targeted vitest are green.

## 3. Implementation / Evidence (2026-06-30)

- `modelOverrideSchema` accepts only provider-prefixed safe tokens or exact family aliases.
- `buildProviderInvocation` returns `shell:false` for both Windows command scripts and non-script binaries.
- Regression coverage lives in `tests/team-schema.test.ts`, `tests/runtime-adapter.test.ts`, and `tests/team-run.test.ts`.

Review evidence:

- `bun run test tests\team-schema.test.ts tests\runtime-adapter.test.ts tests\team-run.test.ts` -> 46 passed.
- `bun run lint` -> passed.
- `bun run typecheck` -> passed.
- `bun run src\cli.ts doctor` -> passed after digest/readability correction.
