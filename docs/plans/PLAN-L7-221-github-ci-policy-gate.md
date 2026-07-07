---
plan_id: PLAN-L7-221-github-ci-policy-gate
title: "PLAN-L7-221 (impl): GitHub CI policy hard gate"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - GitHub CI policy gate"
  - role: qa
    slot_label: "Codex - CI regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-221-github-ci-policy-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-218-setup-distribution-module-extraction.md
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-213-project-local-setup-wrapper.md
references:
  - .github/workflows/harness-check.yml
  - docs/templates/github/common/pack-harness-check.yml
  - src/lint/github-ci-policy.ts
  - src/doctor/index.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T12:24:00+09:00"
    tests_green_at: "2026-07-02T12:23:00+09:00"
    verdict: approve
    scope: "GitHub CI regression hardening: source harness-check must keep full governance gates, Pack harness-check must keep Pack-safe setup-smoke gates, and doctor now surfaces github-ci-policy as a hard gate."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T12:20:00+09:00"
        evidence_path: src/lint/github-ci-policy.ts
        output_digest: "sha256:7e7a3cfcb5a292d3f5912ae433efc169f64f1a4ee98ad943cf73897dfc4aa4db"
      - kind: unit_test
        command: "bun run vitest run tests\\github-ci-policy.test.ts tests\\doctor.test.ts --testNamePattern \"github-ci-policy|GitHub CI policy|ok=true includes\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T12:23:00+09:00"
        evidence_path: tests/github-ci-policy.test.ts
        output_digest: "sha256:2cb7bea823ea77133836c369531529febdfba35d81e9b82d5aa62b34574453b9"
---

# PLAN-L7-221: GitHub CI policy hard gate

## 目的

refactor 中に source repo と clean Pack repo の検証 surface が分岐した。source repo は full governance doctor を要求し、Pack repo は source-only docs を持たないため `doctor --setup-smoke` を要求する。この違いが GitHub Actions 上で崩れると、source 側では governance gate が抜け、Pack 側では consumer-safe CI が source 前提へ戻る。

この slice では `.github/workflows/harness-check.yml` と `docs/templates/github/common/pack-harness-check.yml` の contract を `src/lint/github-ci-policy.ts` として機械検査し、doctor に hard gate として接続する。

## 変更

- source `harness-check` に checkout / Bun setup / frozen install / GitHub guard / typecheck / DB rebuild / full test / lint / audit quality / full doctor が残ることを検査する。
- Pack `harness-check` に checkout / Bun setup / frozen install / typecheck / `test:pack` / lint / setup projection / `doctor --setup-smoke` が残ることを検査する。
- Pack workflow が source full doctor に戻った場合は `forbidden_full_doctor` として fail-close する。
- doctor 出力に `github-ci-policy` を追加し、GitHub 連携のデグレ対策を local gate と CI gate の両方に載せる。

## デグレ対策

- `tests/github-ci-policy.test.ts` で source full doctor 欠落と Pack setup-smoke 欠落/誤置換を検出する。
- `tests/doctor.test.ts` で runtime path として `doctor: github-ci-policy - OK` が出ることを検証する。
- `lint-wiring` と full doctor で新 lint module の runtime 到達性と PLAN trace を検証する。
