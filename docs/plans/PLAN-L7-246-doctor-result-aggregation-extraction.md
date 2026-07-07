---
plan_id: PLAN-L7-246-doctor-result-aggregation-extraction
title: "PLAN-L7-246 (refactor): Doctor result aggregation extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction inside the existing doctor orchestration boundary. The individual doctor checks, fail-close policy, CLI surface, and output text ordering are preserved; only result aggregation and doctor-message prefixing move to a small helper."
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - doctor result aggregation extraction"
  - role: qa
    slot_label: "Codex - doctor output regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-246-doctor-result-aggregation-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/result.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-231-skill-projection-extraction.md
  requires:
    - docs/plans/PLAN-L7-130-right-arm-gate-planning.md
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
references:
  - src/doctor/index.ts
  - src/doctor/result.ts
  - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:30:00+09:00"
    tests_green_at: "2026-07-02T17:30:00+09:00"
    verdict: approve
    scope: "Doctor result aggregation refactor: runDoctor keeps check execution and output order, while ok aggregation and doctor-message prefixing move to src/doctor/result.ts."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:30:00+09:00"
        evidence_path: src/doctor/result.ts
        output_digest: "sha256:8ba6aacd7e18b99ac940b481c3936f32cc5901a86fdc16c02ee13ad910fbadae"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:30:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:67b623e7e28c197db3ded2e2c949995438c1516af2e1c1e8b397161f1dea574b"
---

# PLAN-L7-246: Doctor result aggregation extraction

## 目的

`src/doctor/index.ts` は各 detector の実行と、fail-close 判定と、表示メッセージ組み立てを同じ巨大な `runDoctor` 末尾で抱えていた。doctor は品質 gate の中心なので、個別 check を増やすほど `ok` 条件と `messages` 配列の同期漏れが起きやすい。今回の slice では、個別 check の実行順と既存出力順を保ったまま、結果集約だけを `src/doctor/result.ts` に切り出す。

## 変更

- `buildDoctorResult` を追加し、先頭メッセージ、check 結果、doctor prefix 付与、fail-close 集約を一箇所へ集める。
- `runDoctor` は check 実行と表示順序の定義に集中させる。
- `setup --smoke` 経路、個別 detector、CLI option、出力文言は変更しない。

## デグレ対策

- `tests/doctor.test.ts` で aggregator 単体の prefix と fail-close を固定する。
- 既存 doctor tests で real repo doctor output と主要 gate surface を確認する。
- `tests/cli-surface.test.ts` で doctor CLI surface が壊れていないことを確認する。
- `bun run src\\cli.ts doctor` と Pack `doctor --setup-smoke` で distribution 側も確認する。
