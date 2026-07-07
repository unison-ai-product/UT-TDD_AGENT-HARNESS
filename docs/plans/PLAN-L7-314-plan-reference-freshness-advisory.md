---
plan_id: PLAN-L7-314-plan-reference-freshness-advisory
title: "PLAN-L7-314 (refactor): PLAN reference freshness doctor advisory"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-312 の pure analyzer を doctor leading advisory として表示するだけであり、doctor hard gate / governance lint / 公開 CLI contract は変更しない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-312-plan-reference-freshness-analyzer.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - PLAN reference freshness doctor advisory"
generates:
  - artifact_path: docs/plans/PLAN-L7-314-plan-reference-freshness-advisory.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-312-plan-reference-freshness-analyzer.md
  requires: []
  references:
    - docs/plans/PLAN-L7-312-plan-reference-freshness-analyzer.md
    - docs/plans/PLAN-L7-309-plan-reference-traceability.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T11:59:00+09:00"
    tests_green_at: "2026-07-03T11:59:00+09:00"
    verdict: approve
    scope: "draft PLAN code-line reference freshness を doctor leading advisory として表示し、hard gate aggregation へ入れないことを確認する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:57:29+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:dbd92229109242552757ca4a4de1f89926f87afc5be8ad4e3bdcbc3e8ef7b1c3"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts tests\\plan-lint.test.ts -t \"reference freshness|code-line references|hard gates wired\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T11:58:10+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:221b2023d4d2582f9651c0bf98083224708053363d2c1162ae99c06191c614df"
      - kind: unit_test
        command: "bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:58:52+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
---

# PLAN-L7-314: PLAN reference freshness doctor advisory

## 背景

PLAN-L7-312 で draft PLAN の `path.ts:line` 参照 freshness analyzer を追加したが、doctor には表示していなかった。このままだと検出器が実運用で見えず、リファクタリング時に stale 行番号参照を減らす効果が弱い。

一方で既存 draft PLAN には古い参照が残っているため、freshness を hard gate 化すると現在の作業を不要にブロックする。今回の変更では doctor の leading advisory として表示し、`runDoctor.ok` には影響させない。

## 変更

- `planReferenceFreshnessMessages()` を追加し、analyzer 結果を doctor 表示用の advisory message に変換する。
- `checkPlanReferenceFreshnessAdvisory()` を追加し、doctor の leading message に接続する。
- `collectDoctorChecks()` の hard gate 配列には入れず、doctor の合否判定から切り離す。
- doctor test で advisory 表示と hard gate 未混入を固定する。

## 非対象

- freshness の hard gate 化。
- 既存 draft debt PLAN への reference back-fill。
- Pack への source PLAN 配布。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\doctor.test.ts tests\\plan-lint.test.ts -t "reference freshness|code-line references|hard gates wired" --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack: `bun run typecheck`
- Pack: `bun run vitest run tests\\doctor.test.ts tests\\plan-lint.test.ts -t "reference freshness|code-line references|hard gates wired" --reporter=dot`
- Pack: `bun run test:pack`

## DoD

- [x] stale draft code-line refs が doctor advisory として表示される。
- [x] freshness advisory が `collectDoctorChecks()` の hard gate aggregation に入らない。
- [x] source / Pack の検証が green。
