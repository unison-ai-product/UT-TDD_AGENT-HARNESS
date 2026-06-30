---
plan_id: PLAN-L7-208-design-language-gate
title: "PLAN-L7-208: Design language gate for public design docs"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/governance/document-system-map.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "Design-language gate is a local governance lint enforcement for existing public-doc language policy; no new Forward requirement back-prop is required."
agent_slots:
  - role: se
    slot_label: "SE - design language lint"
  - role: tl
    slot_label: "TL - governance language boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-208-design-language-gate.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-148-design-language-and-evidence-rebind.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/design-language.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/design-language.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-002-dependency-direction-and-auto-map.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-003-runtime-adapter-boundary-subscription-cli.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-005-distribution-model-and-central-ui.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-006-cli-framework-commander.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-007-harness-db-sqlite-projection.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L1-requirements/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L1-requirements/technical-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L10-ux/visual-design.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/business-flow.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/screen-detail.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L2-screen/screen-list.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L3-functional/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L3-functional/nfr-grade.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L3-functional/roadmap.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L3-functional/screen-functional.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/ui-standard.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/if-detail.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/ui-detail.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/backfill-pairing.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/cross-review-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/descent-obligation.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/edge-case.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/forced-stop-feedback.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/gate-confirm.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/governance-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/plan-schedule-lint.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/review-evidence-stale.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/review-evidence.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/screen-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/session-log.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/test-before-review.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/vmodel-pair-freeze.md
    artifact_type: design_doc
  - artifact_path: docs/governance/README.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ai-dev-team-concept_v1.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ai-dev-team-operations_v1.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/audit-framework.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/coding-rules.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/conditional-backfill-decision-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ddd-tdd-rules.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/forward-convergence-legacy-debt-audit.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/gate-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/repository-structure.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/reverse-fullback-backprop-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/runtime-parity-l0-l3-design-audit-2026-06-02.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  requires:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
  references:
    - AGENTS.md
    - docs/governance/document-system-map.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T15:21:18+09:00"
    tests_green_at: "2026-06-30T15:21:18+09:00"
    verdict: approve
    scope: "Add design-language doctor hard gate and translate public design/governance/ADR prose so English remains limited to identifiers and development terms."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\design-language.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T15:21:18+09:00"
        evidence_path: tests/design-language.test.ts
        output_digest: "sha256:d0cc3bae406181fbcbb834b921b4e60a65ecb9d129f1a99dfc7226d80d5b1656"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T15:21:18+09:00"
        evidence_path: src/lint/design-language.ts
        output_digest: "sha256:53886f743fa03d1f4565be54184a36cb47a489b369bd43b3cb6de04e629e7569"
---

# PLAN-L7-208: Design language gate for public design docs

## 目的

設計系、governance、ADR の public-facing prose は日本語を正本とし、英語は識別子、コマンド、PLAN/FR/AC/AT ID、DB table、runtime 名などの開発用語に限定する。この方針を reviewer の注意喚起ではなく、`ut-tdd doctor` の hard gate として扱う。

## 範囲

- `docs/adr/`、`docs/design/`、`docs/governance/` の Markdown を対象にする。
- code fence、frontmatter、inline code、URL は prose 判定から除外する。
- 日本語を含まない heading/prose を violation として報告する。
- diagnostic は file:line と reason を返し、修正対象を特定できるようにする。
- 今回変更した public design/governance/ADR 文書をこの PLAN の生成物として明示し、relation-impact の PLAN DoD/trace-freeze 要求に対する所有関係を残す。

## 範囲外

- source code の identifier を日本語化しない。
- command、PLAN ID、FR/AC/AT ID、DB table、runtime 名などの開発用語は原語維持を許容する。
- 翻訳品質の自然言語評価はこの L7 gate の対象外とし、機械的な英語 prose 混入検出に限定する。

## 受け入れ条件

- `src/lint/design-language.ts` が対象 Markdown を走査し、英語 prose/headings を deterministic に検出する。
- `runDoctor` の hard gate aggregation に `designLanguage.ok` が含まれる。
- unit test が English-only prose の fail と、日本語 prose + technical terms の pass を覆う。
- 対象 docs の既知 violation が 0 件になる。
- 設計 doc の日本語化で既存 gate marker を壊した場合は、本文 prose は日本語のまま、machine marker だけを開発用語として保持する。

## Trace-freeze evidence

- `bun run vitest run tests\design-language.test.ts --reporter=dot`: pass
- `bun run typecheck`: pass
- `bun src\cli.ts doctor`: pass (`design-language OK`)
- `bun src\cli.ts db rebuild`: pass

この PLAN は設計・governance・ADR の言語境界を固定する L7 実装であり、公開 release、remote CI、tag、署名 tarball、post-publication consumer install は主張しない。
