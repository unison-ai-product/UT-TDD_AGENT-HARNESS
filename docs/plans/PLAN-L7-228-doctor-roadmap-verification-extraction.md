---
plan_id: PLAN-L7-228-doctor-roadmap-verification-extraction
title: "PLAN-L7-228 (impl): Doctor roadmap verification extraction"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - doctor roadmap verification extraction"
  - role: qa
    slot_label: "Codex - roadmap verification regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-228-doctor-roadmap-verification-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/roadmap-verification.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-roadmap-verification.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-227-doctor-doc-registry-extraction.md
  requires:
    - docs/plans/PLAN-DISCOVERY-05-roadmap-registration.md
    - docs/plans/PLAN-L7-12-verification-trigger.md
references:
  - src/doctor/index.ts
  - src/doctor/roadmap-verification.ts
  - tests/doctor.test.ts
  - tests/doctor-roadmap-verification.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T15:15:00+09:00"
    tests_green_at: "2026-07-02T15:15:00+09:00"
    verdict: approve
    scope: "Doctor roadmap verification refactor: roadmap registration and verification group checks move out of src/doctor/index.ts while preserving runDoctor wiring and exported check functions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T15:15:00+09:00"
        evidence_path: src/doctor/roadmap-verification.ts
        output_digest: "sha256:4f219dd19a968b673df8fd57dfe789b783239d9bc8a22a32058aadba6b96fd88"
        anchor_commit: 7076a3e3d964b0470dffa0c60a9e9482f230f2e3
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-roadmap-verification.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T15:15:00+09:00"
        evidence_path: tests/doctor-roadmap-verification.test.ts
        output_digest: "sha256:a616deb83f2f11b16ddef78e1e35c72df9a10188cf5424e10afeb19a7399243e"
        anchor_commit: 7076a3e3d964b0470dffa0c60a9e9482f230f2e3
---

# PLAN-L7-228: Doctor roadmap verification extraction

## 目的

`src/doctor/index.ts` は doctor の実行順序と hard gate 集約を担う一方で、roadmap registration と verification group の adapter 実装まで保持している。特に `checkRoadmap` は PLAN frontmatter を読みながら status map を構築するため、doctor 本体の I/O 責務を増やしている。

この slice では roadmap verification 系の check 関数を `src/doctor/roadmap-verification.ts` に移し、`src/doctor/index.ts` は import / re-export と `runDoctor` wiring に寄せる。

## 変更

- `checkRoadmap` / `checkVerificationGroupsResult` / `checkVerificationGroups` を `src/doctor/roadmap-verification.ts` へ移す。
- `checkRoadmap` が使う PLAN status map 構築も新モジュール内へ閉じる。
- `src/doctor/index.ts` の public export と `runDoctor` の message order は維持する。
- 新規テストで切り出し先モジュールの fail-close と index re-export を直接検証する。

## デグレ対策

- `tests/doctor-roadmap-verification.test.ts` で新モジュール直接参照と `src/doctor/index.ts` re-export の fail-close を検証する。
- full doctor で roadmap / verification group hard gate の配線を確認する。
- Pack 側の `setup --solo` / `doctor --setup-smoke` で clean distribution artifact でも同じ gate が通ることを確認する。
