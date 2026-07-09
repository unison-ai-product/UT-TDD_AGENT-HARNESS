---
plan_id: PLAN-L7-355-doctor-check-registry-extraction
title: "PLAN-L7-355 (refactor): doctor check registry extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の実行契約を変えずに、長大化した hard-gate 集約責務を同一 top-level module 内の registry へ分離する保守性改善であり、上位要件や業務仕様の変更を伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/governance/harness-v2-quality-uplift-strategy.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor registry extraction"
  - role: qa
    slot_label: "Explorer - doctor extraction risk review"
generates:
  - artifact_path: docs/plans/PLAN-L7-355-doctor-check-registry-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/governance/harness-v2-quality-uplift-strategy.md
  requires: []
  references:
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/governance/harness-v2-update-strategy.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T16:40:00+09:00"
    tests_green_at: "2026-07-03T16:38:00+09:00"
    verdict: approve
    scope: "doctor check registry extraction scope review. Explorers confirmed the minimal safe slice is moving collectDoctorChecks into src/doctor/check-registry.ts while preserving runDoctor and public barrel exports; module-drift is unaffected because no top-level src module is added."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"hard gates wired\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:38:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:fd1b0c687f7b8672f8262193c95fbcdf9de1844ebbdd6d54de37fd9d4a5fb068"
        anchor_commit: 35d941013bdf9a75867f71a3b3831e849c2a144f
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T16:38:00+09:00"
        evidence_path: src/doctor/check-registry.ts
        output_digest: "sha256:1dc2c79a690afbb0ffb97085638acb9a49f754aebfe25cc984ab17203793cf71"
        anchor_commit: 35d941013bdf9a75867f71a3b3831e849c2a144f
      - kind: lint
        command: "bunx biome check src\\doctor\\index.ts src\\doctor\\check-registry.ts tests\\doctor.test.ts docs\\plans\\PLAN-L7-355-doctor-check-registry-extraction.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:38:00+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:86325c170c0f7691f62c2ee7b4ee88d5062ffbaab73844e1a8c6f628c683c437"
        anchor_commit: 35d941013bdf9a75867f71a3b3831e849c2a144f
---

# PLAN-L7-355: doctor check registry extraction

## 背景

`src/doctor/index.ts` は `runDoctor` の公開入口、barrel export、hard-gate 集約を同時に抱えており、変更のたびに hot zone が広がっている。特に `collectDoctorChecks` は多数の detector import と順序付き aggregation を持つため、今後の doctor scoped execution や submodule test 追加の前に責務を分ける価値が高い。

## 変更

- `collectDoctorChecks` と `DoctorOptions` を `src/doctor/check-registry.ts` へ移動する。
- `src/doctor/index.ts` は `runDoctor`、leading warning surface、public re-export を維持する。
- `tests/doctor.test.ts` の hard-gate wiring test は、`index.ts` の内部文字列ではなく registry への委譲と registry 側の aggregation を確認する。

## 非対象

- data-driven registry への全面置換は行わない。`dependencyDrift -> regressionExpansion`、`greenCommandDigest` strict option、`checkPlanTraceGate` の named trace など例外が多く、今回の ROI を超える。
- `checkPlanReferenceFreshnessAdvisory` は warning-only leading surface のまま維持し、hard-gate aggregation へ入れない。
- top-level module は増やさないため、architecture §3.1 の module 表更新は不要。

## 検証

- `bun run vitest run tests\\doctor.test.ts -t "hard gates wired|runDoctor" --reporter=dot`
- `bun run vitest run tests\\module-drift.test.ts tests\\doctor.test.ts --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\doctor\\index.ts src\\doctor\\check-registry.ts tests\\doctor.test.ts docs\\plans\\PLAN-L7-355-doctor-check-registry-extraction.md`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `src/doctor/index.ts` が hard-gate registry の詳細 import を抱えない。
- [x] `runDoctor` の output / fail-close contract が変わらない。
- [x] Source と Pack の runtime/test 差分へ反映される。
