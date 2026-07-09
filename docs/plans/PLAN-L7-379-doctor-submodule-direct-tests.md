---
plan_id: PLAN-L7-379-doctor-submodule-direct-tests
title: "PLAN-L7-379 (refactor): doctor submodule direct tests"
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
backprop_decision_reason: "抽出済み doctor submodule の adapter 境界に直接 unit test を追加するテスト補強であり、doctor の実行意味論、配布 Pack の surface、上位要求は変更しない。PLAN-L7-342 の一部 discharge として扱う。"
agent_slots:
  - role: tl
    slot_label: "TL - doctor submodule direct test scope review"
  - role: qa
    slot_label: "QA - Pack-safe targeted regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-379-doctor-submodule-direct-tests.md
    artifact_type: markdown_doc
  - artifact_path: tests/doctor-setup-smoke.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor-lint-gates.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-342-doctor-submodule-tests.md
  requires: []
  references:
    - docs/plans/PLAN-L7-342-doctor-submodule-tests.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T15:30:02+09:00"
    tests_green_at: "2026-07-07T15:30:02+09:00"
    verdict: approve
    scope: "PLAN-L7-342 の小 slice として setup-smoke / lint-gates の direct unit tests を追加し、barrel 経由だけでは落ちにくい invalid hook JSON、wrapper placeholder、missing repo root、non-git distribution skip 境界を固定する。production code は変更しない。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests\\doctor-setup-smoke.test.ts tests\\doctor-lint-gates.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T15:29:49+09:00"
        evidence_path: tests/doctor-setup-smoke.test.ts
        output_digest: "sha256:2bac370ea3d85ec29257f6bde844277787e58775dfaeb5801e7d628b32cb3b17"
        anchor_commit: 25513aaf0473ab33f4b515acb6516dca5d387a94
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T15:30:02+09:00"
        evidence_path: tests/doctor-lint-gates.test.ts
        output_digest: "sha256:17f9e0cb85fa934536abdd5cee47695b011495361c0950228f9edba41949576b"
        anchor_commit: 25513aaf0473ab33f4b515acb6516dca5d387a94
      - kind: lint
        command: "bunx biome check tests\\doctor-setup-smoke.test.ts tests\\doctor-lint-gates.test.ts docs\\plans\\PLAN-L7-379-doctor-submodule-direct-tests.md"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: "2026-07-07T15:29:49+09:00"
        evidence_path: tests/doctor-setup-smoke.test.ts
        output_digest: "sha256:2bac370ea3d85ec29257f6bde844277787e58775dfaeb5801e7d628b32cb3b17"
        anchor_commit: 25513aaf0473ab33f4b515acb6516dca5d387a94
---

# PLAN-L7-379: doctor submodule direct tests

## 0. 目的

`PLAN-L7-342` は doctor 抽出後に submodule の直接 unit test を追加する parked plan だった。L7-378 までで doctor runner / registry / definitions の分割が進んだため、今回は production code を触らず、Pack-safe な小さい direct test を追加する。

## 1. Scope

- `src/doctor/setup-smoke.ts` の hook JSON parse、complete fixture、invalid JSON、wrapper placeholder residue を直接 test する。
- `src/doctor/lint-gates.ts` の missing repo root fail-close と non-git distribution skip を直接 test する。
- `tests/doctor.test.ts` の barrel re-export fence は維持し、直接 test は submodule 境界の red fixture 補強に限定する。

## 2. Non-Scope

- doctor implementation、profile、Pack artifact set、setup smoke semantics は変更しない。
- `PLAN-L7-342` 全体の完遂は宣言しない。runtime-state / plan-governance などの残り direct test は後続 slice とする。
- `projection-writer.ts` や `src/cli.ts` の巨大分割は別 scope として後送する。

## 3. DoD

- [x] setup-smoke submodule に直接 import の unit test がある。
- [x] lint-gates submodule に直接 import の unit test がある。
- [x] 各対象に red fixture が少なくとも 1 件ある。
- [x] targeted test / typecheck / Biome / plan lint / doctor が green。

## 4. Verification

- `bunx vitest run tests\doctor-setup-smoke.test.ts tests\doctor-lint-gates.test.ts --reporter=dot`
- `bun run typecheck`
- `bunx biome check tests\doctor-setup-smoke.test.ts tests\doctor-lint-gates.test.ts docs\plans\PLAN-L7-379-doctor-submodule-direct-tests.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
