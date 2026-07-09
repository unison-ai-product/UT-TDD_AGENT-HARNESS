---
plan_id: PLAN-L7-318-doctor-plan-gate-extraction
title: "PLAN-L7-318 (refactor): doctor PLAN gate wrapper extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の薄い PLAN/governance wrapper を既存 doctor submodule へ移すだけで、CLI contract / lint 判定 / Pack 配布境界は変更しない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-314-plan-reference-freshness-advisory.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor PLAN gate extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-318-doctor-plan-gate-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/plan-governance.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-314-plan-reference-freshness-advisory.md
  requires: []
  references:
    - docs/plans/PLAN-L7-314-plan-reference-freshness-advisory.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T12:19:37+09:00"
    tests_green_at: "2026-07-03T12:19:37+09:00"
    verdict: approve
    scope: "doctor の PLAN/governance wrapper 抽出が public re-export と hard gate wiring を壊さないことを確認する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:16:17+09:00"
        evidence_path: src/doctor/plan-governance.ts
        output_digest: "sha256:ab1cae6dc63d91d8ff15914e12449174fe25bb887b70256dba0195fb80c0410a"
        anchor_commit: 6bc6bdd9c6822c7691c64e56420f471210107d4f
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"reference freshness|hard gates wired|plan gate re-exports\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:17:20+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:66b8255338e60f9489923cd6a8ea1e53248d88e44e63607784dc3cecd8ca1956"
        anchor_commit: 6bc6bdd9c6822c7691c64e56420f471210107d4f
      - kind: unit_test
        command: "bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:19:37+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
        anchor_commit: c18872c85c31a3a316cdcc0290cf55348f11b69d
---

# PLAN-L7-318: doctor PLAN gate wrapper extraction

## 背景

`src/doctor/index.ts` は doctor の orchestration 本体でありながら、個別 lint を呼ぶだけの wrapper も多数抱えている。過剰な大分割は避けるべきだが、PLAN/governance 系 wrapper は既存の `src/doctor/plan-governance.ts` と責務が揃っており、低リスクに移せる。

## 変更

- `checkPlanSchedule()` / `checkPlanGovernance()` / `checkPlanReferenceFreshnessAdvisory()` を `src/doctor/plan-governance.ts` へ移す。
- `checkForwardConvergence()` / `checkForwardConvergenceAudit()` を同じ PLAN/governance 系 wrapper として移す。
- `src/doctor/index.ts` は既存 import 経路を壊さないよう re-export を維持する。
- freshness advisory は leading message のまま残し、`collectDoctorChecks()` の hard gate aggregation には入れない。

## 非対象

- doctor 全体の大規模再設計。
- hard gate の意味変更。
- PLAN-L7-315 以降の v2 gate 実装。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\doctor.test.ts -t "reference freshness|hard gates wired|plan gate re-exports" --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack: `bun run typecheck`
- Pack: `bun run vitest run tests\\doctor.test.ts -t "reference freshness|hard gates wired|plan gate re-exports" --reporter=dot`
- Pack: `bun run test:pack`

## DoD

- [x] `src/doctor/index.ts` から PLAN/governance wrapper の実装が減る。
- [x] `src/doctor/index.ts` からの既存 import API が維持される。
- [x] freshness advisory が hard gate aggregation に入らない。
- [x] source / Pack の検証が green。
