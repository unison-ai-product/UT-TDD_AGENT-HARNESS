---
plan_id: PLAN-L7-286-cli-delegation-command-registration
title: "PLAN-L7-286 (refactor): CLI delegation command registration extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "codex/claude runtime command 登録を既存の delegation helper module へ寄せる責務分離であり、公開 CLI contract と provider adapter 方針は変更しない。design back-fill は不要。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-285-cli-runtime-delegation-helper.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - CLI delegation command registration extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-286-cli-delegation-command-registration.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/cli/delegation.ts
    artifact_type: source_module
  - artifact_path: tests/cli-delegation.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-285-cli-runtime-delegation-helper.md
  requires: []
  references:
    - src/cli.ts
    - src/cli/delegation.ts
    - tests/cli-delegation.test.ts
    - tests/cli-surface.test.ts
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T11:33:31+09:00"
    tests_green_at: "2026-07-03T11:30:42+09:00"
    verdict: approve
    scope: "codex/claude runtime command 登録を registerDelegationCommands に抽出し、CLI surface と delegation helper の責務境界を縮小する。subagent の claude dry-run 片側未固定指摘は tests/cli-surface.test.ts で反映済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:27:05+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:9e65be107dd0b29c429ac320027e2f967726db77147f7b278a7d6d106f86fbc7"
        anchor_commit: 308e6f2b768ff307bea961e18e883268489fe133
      - kind: unit_test
        command: "bun run vitest run tests\\cli-delegation.test.ts tests\\cli-surface.test.ts -t \"delegation|model/effort|claude runtime|executes codex adapter\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T11:27:29+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:0587b86b989f110cf57fec87b76cd6430f46cfe75e35d38c7c50d8894562c4cb"
        anchor_commit: 308e6f2b768ff307bea961e18e883268489fe133
      - kind: unit_test
        command: "bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:30:42+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
        anchor_commit: c18872c85c31a3a316cdcc0290cf55348f11b69d
---

# PLAN-L7-286: CLI delegation command registration extraction

## 背景

PLAN-L7-284/285 で provider 実行処理は `src/cli/delegation.ts` に寄せたが、`codex` / `claude`
runtime command の登録本体は `src/cli.ts` に残っていた。`src/cli.ts` は複数 surface の登録と実装が集中しており、
delegation 固有の command 定義を helper module へ移すと保守境界が明確になる。

## 変更

- `registerDelegationCommands(program, deps)` を `src/cli/delegation.ts` に追加する。
- `src/cli.ts` は task 解決、skill injection、session side-effect など既存依存だけを注入し、command 本体を持たない。
- `tests/cli-delegation.test.ts` で `codex` / `claude` command と governed override option を固定する。
- `tests/cli-surface.test.ts` で `codex` / `claude` の dry-run surface を両側固定する。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\cli-delegation.test.ts tests\\cli-surface.test.ts -t "delegation|model/effort|claude runtime|executes codex adapter" --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `codex` / `claude` command 登録が `registerDelegationCommands` 経由になる。
- [x] `--model` / `--effort` / `--execute` / `--json` の CLI surface が維持される。
- [x] source と Pack の検証が green。
