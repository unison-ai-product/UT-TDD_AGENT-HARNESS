---
plan_id: PLAN-L7-325-doctor-lint-gate-extraction
title: "PLAN-L7-325 (refactor): doctor lint gate extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の単一巨大ファイルから lint gate adapter を分離する局所リファクタリングであり、要求・受入条件の意味変更を伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-321-personal-path-guard-generalization.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor lint gate extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-325-doctor-lint-gate-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/lint-gates.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-321-personal-path-guard-generalization.md
  requires: []
  references:
    - src/doctor/index.ts
    - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T12:57:25+09:00"
    tests_green_at: "2026-07-03T12:57:16+09:00"
    verdict: approve
    scope: "doctor lint gate adapter の抽出範囲、public re-export、非 git skip / missing-root fail-close の維持を確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:52:25+09:00"
        evidence_path: src/doctor/lint-gates.ts
        output_digest: "sha256:6cc0a72fcbc2711f4557a122382c085babc254998123065946d84e83a1c78670"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"lint gate re-exports\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:53:16+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:d979145e09f73537997ff842f120a496885f528ee17e5647ff093d42d0f1517e"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"lint gate re-exports|hard gates wired|fails closed when hard-gate checker inputs cannot be read\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:54:48+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:d979145e09f73537997ff842f120a496885f528ee17e5647ff093d42d0f1517e"
      - kind: typecheck
        command: "Pack: bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:56:09+09:00"
        evidence_path: src/doctor/lint-gates.ts
        output_digest: "sha256:6cc0a72fcbc2711f4557a122382c085babc254998123065946d84e83a1c78670"
      - kind: unit_test
        command: "Pack: bun run vitest run tests\\doctor.test.ts -t \"lint gate re-exports|hard gates wired|fails closed when hard-gate checker inputs cannot be read\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:56:43+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:d979145e09f73537997ff842f120a496885f528ee17e5647ff093d42d0f1517e"
      - kind: unit_test
        command: "Pack: bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:57:16+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
---

# PLAN-L7-325: doctor lint gate extraction

## 背景

`src/doctor/index.ts` は doctor の集約責務に加えて、module / asset / skill / descent / change / verification / branch 系の lint gate adapter 実装も保持していた。これにより、doctor の run orchestration と個別 lint adapter の変更理由が同じファイルに集まり、以後の doctor 分割の見通しが悪くなっていた。

## 変更

- `checkModuleDrift` / `checkAssetDrift` / `checkSkillAssignment` / `checkDescentObligation` / `checkChangeImpact` / `checkChangeSetIntegrity` / `checkVerificationProfile` / `checkBranchKind` を `src/doctor/lint-gates.ts` へ移す。
- `src/doctor/index.ts` は `collectDoctorChecks` の集約責務を維持し、新モジュールから import / re-export する。
- `doctor/index` からの public import surface が維持されることを `tests/doctor.test.ts` で確認する。
- `checkBranchKind` を missing-root fail-close 表と hard-gate aggregation 期待配列に追加する。

## 非対象

- doctor の gate 実行順序・判定条件・message 文言変更。
- lint analyzer 本体の変更。
- Pack artifact set の変更。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\doctor.test.ts -t "lint gate re-exports" --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack: `bun run typecheck`
- Pack: `bun run vitest run tests\\doctor.test.ts -t "lint gate re-exports|hard gates wired" --reporter=dot`
- Pack: `bun run test:pack`

## DoD

- [x] doctor lint gate adapter が `src/doctor/lint-gates.ts` に分離されている。
- [x] `src/doctor/index.ts` の public re-export が維持されている。
- [x] `branchKind` が fail-close / hard-gate aggregation のテスト対象に含まれている。
- [x] Source / Pack の検証が green である。
