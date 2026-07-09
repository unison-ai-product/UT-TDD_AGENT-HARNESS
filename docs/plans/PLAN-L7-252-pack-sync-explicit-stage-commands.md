---
plan_id: PLAN-L7-252-pack-sync-explicit-stage-commands
title: "PLAN-L7-252 (refactor): Pack sync explicit staging commands"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Behavior-preserving distribution command guidance cleanup. The clean artifact set and copy behavior stay unchanged; only generated follow-up git command guidance and Pack repo default ownership are made safer and consistent with repository staging rules."
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - Pack sync explicit staging guidance"
generates:
  - artifact_path: docs/plans/PLAN-L7-252-pack-sync-explicit-stage-commands.md
    artifact_type: markdown_doc
  - artifact_path: src/cli/distribution.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\cli\\distribution.ts"
        output_digest: "sha256:cde6ed7ef3c9dd71a707e80cfbbafcd3d2c90914a0f79f84011dd3893de684e8"
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\setup\\distribution.ts"
        output_digest: "sha256:3ab54ef69699e216d3f74148b3af6097f07390c9858cc94a4dab5b1d8f347018"
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\setup\\index.ts"
        output_digest: "sha256:9b1ffefbfc9322217c4e5c0ce7f1f26de58a598cc3407ae8f9a93050ad93a4a9"
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\cli-surface.test.ts"
        output_digest: "sha256:e6b9eb910fd0e98acf44d53f814ddbbab3937eeb503ae0188fe28bb0ff250727"
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\setup.test.ts"
        output_digest: "sha256:3b17e1677cbed01dd614f2a702a38f0518c1d5513487a93ece0a01e63285407c"
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
  references:
    - docs/plans/PLAN-L7-232-sync-pack-clean-tree-guard.md
    - src/cli/distribution.ts
    - src/setup/distribution.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T16:10:00+09:00"
    tests_green_at: "2026-07-02T16:10:00+09:00"
    verdict: approve
    scope: "Distribution sync command guidance: remove broad git add guidance, centralize Pack repo default, and honor cleanRepo in tagPin."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:10:00+09:00"
        evidence_path: src/setup/distribution.ts
        output_digest: "sha256:3ab54ef69699e216d3f74148b3af6097f07390c9858cc94a4dab5b1d8f347018"
        anchor_commit: 2566a7eb0b8e63b481053a2dae437e84f7f83501
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts tests\\cli-distribution-registrar.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:10:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:3b17e1677cbed01dd614f2a702a38f0518c1d5513487a93ece0a01e63285407c"
        anchor_commit: 2566a7eb0b8e63b481053a2dae437e84f7f83501
---

# PLAN-L7-252: Pack sync explicit staging commands

## 背景

`distribution sync-pack` は commit / push を実行しないが、JSON evidence の `nextCommands` で `git add --all` を提示していた。これは repository rule の「明示 path stage」の方針と衝突し、Pack checkout に意図外の local change がある場合に混入を誘発する。

同じ配布境界で、`buildPackSyncPlan.commands` も `git add -- .` を提示していた。また Pack repo default が CLI と setup/distribution に重複し、`--clean-repo` override が readiness `tagPin` に反映されない不整合もあった。

## 変更

- `DEFAULT_PACK_REPO` を `src/setup/distribution.ts` から export し、CLI 側の重複定数を廃止する。
- `buildConsumerReadinessPlan` に `cleanRepo` を渡し、`tagPin` を clean repo override と一致させる。
- `gitAddPathspecCommands` を追加し、`sync-plan` / `sync-pack` の follow-up command を `git add -- "<artifact>" ...` の明示 path stage にする。
- tests で `add --all` / `add -- .` が出ないこと、代表 artifact path が含まれること、custom clean repo の `tagPin` を固定する。

## 検証

- `bunx biome check --write src\\cli\\distribution.ts src\\setup\\distribution.ts src\\setup\\index.ts tests\\cli-surface.test.ts tests\\setup.test.ts`
- `bun run typecheck`
- `bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts tests\\cli-distribution-registrar.test.ts --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `sync-pack` の follow-up guidance に `git add --all` が残っていない。
- [x] `sync-plan` の guidance に `git add -- .` が残っていない。
- [x] `--clean-repo` / `cleanRepo` override が readiness `tagPin` に反映される。
- [x] 対象 test と full doctor が green。
- [x] Pack repo へ sync され、Pack gate が green。
