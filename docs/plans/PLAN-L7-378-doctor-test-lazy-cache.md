---
plan_id: PLAN-L7-378-doctor-test-lazy-cache
title: "PLAN-L7-378 (refactor): doctor test の full doctor 実行を lazy cache 化する"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
created: 2026-07-07
updated: 2026-07-07
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-183-doctor-test-performance.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "doctor test の実行方法だけを改善する性能 refactor であり、doctor gate、profile、検証 semantics は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - doctor test lazy cache risk review"
  - role: qa
    slot_label: "QA - targeted timing regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-378-doctor-test-lazy-cache.md
    artifact_type: markdown_doc
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-183-doctor-test-performance.md
  requires:
    - docs/plans/PLAN-L7-183-doctor-test-performance.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T15:16:13+09:00"
    tests_green_at: "2026-07-07T15:16:13+09:00"
    verdict: approve
    scope: "doctor.test の real repo runDoctor cache を beforeAll eager から lazy helper へ変更し、full doctor gate assertions は引き続き 1 回の共有結果を使う。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"doctor profile|toolchain gate|hard-gate aggregation|dependency/regression\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T15:05:05+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:01beb307042518ee1372fd96b5e35df984437cc70c12ace80641ea0aa69e0622"
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"asset-drift hard gate|dependency-drift and regression expansion|roadmap-rollup|Cycle P4\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T15:06:26+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:01beb307042518ee1372fd96b5e35df984437cc70c12ace80641ea0aa69e0622"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T15:06:26+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:01beb307042518ee1372fd96b5e35df984437cc70c12ace80641ea0aa69e0622"
      - kind: unit_test
        command: "bunx vitest run tests\\doctor.test.ts --reporter=dot"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T15:14:50+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:01beb307042518ee1372fd96b5e35df984437cc70c12ace80641ea0aa69e0622"
      - kind: lint
        command: "bunx biome check tests\\doctor.test.ts docs\\plans\\PLAN-L7-378-doctor-test-lazy-cache.md"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: "2026-07-07T15:16:13+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:01beb307042518ee1372fd96b5e35df984437cc70c12ace80641ea0aa69e0622"
---

# PLAN-L7-378 (refactor): doctor test の full doctor 実行を lazy cache 化する

## 0. 目的

`PLAN-L7-183` で `tests/doctor.test.ts` の real repo `runDoctor()` は共有 cache 化されたが、`beforeAll` で eager 実行していたため、`--testNamePattern` で structural/profile test だけを選んだ場合でも full doctor が起動していた。直近 L7-377 の targeted doctor regression では、doctor を必要としない 3 test が約 61 秒かかった。性能改善として、full doctor gate assertion を実行する test だけが lazy に `runDoctor()` を呼ぶ形へ変更する。

## 1. Scope

- `tests/doctor.test.ts` の `beforeAll(runDoctor)` を lazy cached helper に置き換える。
- full doctor gate assertion 群は引き続き同じ cached result を共有する。
- fixture-based / profile / registry structural tests は full doctor を起動しない。

## 2. Non-Scope

- doctor implementation、profile、gate semantics は変更しない。
- test の assertion 内容は弱めない。
- Vitest の global setup や test split は導入しない。

## 3. DoD

- [x] doctor を不要とする targeted pattern が full doctor を起動せず、実行時間が大幅に短縮される。
- [x] full doctor を必要とする targeted pattern は引き続き `runDoctor()` 結果を検証する。
- [x] typecheck が green。Biome / plan lint / doctor は final gate で確認する。

## 4. Verification

- `bun run test -- tests\doctor.test.ts --testNamePattern "doctor profile|toolchain gate|hard-gate aggregation|dependency/regression" --reporter=dot`
- `bun run test -- tests\doctor.test.ts --testNamePattern "asset-drift hard gate|dependency-drift and regression expansion|roadmap-rollup|Cycle P4" --reporter=dot`
- `bun run typecheck`
- `bunx biome check tests\doctor.test.ts docs\plans\PLAN-L7-378-doctor-test-lazy-cache.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
