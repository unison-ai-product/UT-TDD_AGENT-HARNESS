---
plan_id: PLAN-L7-380-doctor-runtime-state-direct-tests
title: "PLAN-L7-380 (refactor): doctor runtime-state direct tests"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
created: 2026-07-07
updated: 2026-07-07
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-342-doctor-submodule-tests.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "抽出済み doctor runtime-state adapter 境界の直接 unit test を追加するテスト補強であり、doctor の実行意味論、Pack surface、上位要求は変更しない。PLAN-L7-342 の部分 discharge として扱う。"
agent_slots:
  - role: tl
    slot_label: "TL - runtime-state direct test scope review"
  - role: qa
    slot_label: "QA - Pack-safe runtime-state regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-380-doctor-runtime-state-direct-tests.md
    artifact_type: markdown_doc
  - artifact_path: tests/doctor-runtime-state.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-342-doctor-submodule-tests.md
  requires: []
  references:
    - docs/plans/PLAN-L7-342-doctor-submodule-tests.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T16:00:28+09:00"
    tests_green_at: "2026-07-07T16:00:28+09:00"
    verdict: approve
    scope: "runtime-state submodule の handoverDeps / doctorSlotsDeps / checkHandover / checkAgentSlots を直接 unit test し、doctor read-only 境界と stale/healthy agent-slot surface を固定する。production code は変更しない。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests\\doctor-runtime-state.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T16:00:28+09:00"
        evidence_path: tests/doctor-runtime-state.test.ts
        output_digest: "sha256:5e311cc28afd6c9eb136719cc4665b34b72a7e740184c72a85ff99dc840c26b9"
        anchor_commit: 10fa97ddd5f8c0c9dc971add8e6f8756e0017b1d
      - kind: lint
        command: "bunx biome check tests\\doctor-runtime-state.test.ts docs\\plans\\PLAN-L7-380-doctor-runtime-state-direct-tests.md"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: "2026-07-07T16:00:28+09:00"
        evidence_path: tests/doctor-runtime-state.test.ts
        output_digest: "sha256:5e311cc28afd6c9eb136719cc4665b34b72a7e740184c72a85ff99dc840c26b9"
        anchor_commit: 10fa97ddd5f8c0c9dc971add8e6f8756e0017b1d
---

# PLAN-L7-380: doctor runtime-state direct tests

## 0. 目的

`PLAN-L7-342` の直接 unit test 追加を、小さい Pack-safe slice として継続する。L7-379 では `setup-smoke` / `lint-gates` を固定したため、今回は `src/doctor/runtime-state.ts` の deps adapter と warning surface を直接 test する。

## 1. Scope

- `handoverDeps` が doctor の read-only 境界を保ち、`now` / `readText` / `listDir` を正しく委譲することを固定する。
- `checkHandover` が missing / malformed pointer で throw せず warning surface を返すことを固定する。
- `doctorSlotsDeps` が slot state を read-only に扱い、doctor 用 ID を返すことを固定する。
- `checkAgentSlots` が stale / healthy slot state を injected deps から surface することを固定する。

## 2. Non-Scope

- runtime-state implementation、agent-slots implementation、doctor profile、Pack artifact set は変更しない。
- `PLAN-L7-342` 全体の完遂は宣言しない。plan-governance などの残り direct test は後続 slice とする。
- Source 専用の重い PLAN/governance fixture は追加しない。

## 3. DoD

- [x] runtime-state submodule に直接 import の unit test がある。
- [x] doctor read-only 境界を破る変更が test で落ちる。
- [x] agent-slots stale / healthy surface が direct test で固定される。
- [x] targeted test / typecheck / Biome / plan lint / doctor が green。

## 4. Verification

- `bunx vitest run tests\doctor-runtime-state.test.ts --reporter=dot`
- `bun run typecheck`
- `bunx biome check tests\doctor-runtime-state.test.ts docs\plans\PLAN-L7-380-doctor-runtime-state-direct-tests.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
