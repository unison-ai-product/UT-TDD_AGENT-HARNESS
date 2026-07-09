---
plan_id: PLAN-L7-376-consumer-toolchain-template-guidance
title: "PLAN-L7-376 (refactor): consumer toolchain profile を adapter 案内へ同期する"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
created: 2026-07-07
updated: 2026-07-07
owner: PM / Codex
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "consumer-facing adapter template の案内文を既存 consumer-toolchain profile contract に同期する変更であり、doctor gate や setup CI の意味論は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - consumer adapter doctor guidance review"
  - role: se
    slot_label: "SE - setup template regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-376-consumer-toolchain-template-guidance.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: docs/templates/adapter/AGENTS.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/commands/ut-tdd-status.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/commands/ut-tdd-test.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/agents/ut-tdd-tl.md
    artifact_type: markdown_doc
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-375-consumer-toolchain-profile.md
  requires:
    - docs/plans/PLAN-L7-375-consumer-toolchain-profile.md
    - docs/plans/PLAN-L7-372-consumer-doctor-command-templates.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T14:31:09+09:00"
    tests_green_at: "2026-07-07T14:31:09+09:00"
    verdict: approve
    scope: "consumer-facing adapter templates と hidden mirror に consumer-toolchain profile guidance を同期し、full doctor の source/governance 境界を維持する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\setup.test.ts --testNamePattern \"built-in fallback|managed blocks|consumer doctor|model-id\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:29:54+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:2f80f9a41096374f4d733c88b8c748457fe2d859d1435bee7ab8e9fb520e8ad2"
        anchor_commit: 5c424eb5d1231964a97b7f575349c8958c8adbd0
      - kind: unit_test
        command: "bun run test -- tests\\model-id-ssot-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:29:54+09:00"
        evidence_path: docs/templates/adapter/.claude/CLAUDE.md
        output_digest: "sha256:4160aa165c09d2061332c2e7f5a058ac1519ae7ac528cfeaafd23dc50b98526d"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T14:31:09+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:8b1cc68d565af29ccecd32e0c9a317de735061cff1133b048d8bdc67f1f6eb12"
        anchor_commit: 5c424eb5d1231964a97b7f575349c8958c8adbd0
      - kind: lint
        command: "bunx biome check src\\setup\\templates.ts tests\\setup.test.ts docs\\plans\\PLAN-L7-376-consumer-toolchain-template-guidance.md docs\\templates\\adapter\\AGENTS.md docs\\templates\\adapter\\CLAUDE.md docs\\templates\\adapter\\.claude\\CLAUDE.md docs\\templates\\adapter\\.claude\\commands\\ut-tdd-status.md docs\\templates\\adapter\\.claude\\commands\\ut-tdd-test.md docs\\templates\\adapter\\.claude\\agents\\ut-tdd-tl.md"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: "2026-07-07T14:31:09+09:00"
        evidence_path: docs/templates/adapter/AGENTS.md
        output_digest: "sha256:55c67e338427e8447ad0f0171b237dd6351203012eb8bdaa6b45b3e97fede136"
        anchor_commit: 5c424eb5d1231964a97b7f575349c8958c8adbd0
---

# PLAN-L7-376 (refactor): consumer toolchain profile を adapter 案内へ同期する

## 0. 目的

`consumer-toolchain` profile を追加した後も、生成 adapter docs / Claude command / hidden disk mirror は setup smoke だけを案内していた。Consumer project で source/governance full doctor に寄らず toolchain health を確認できるよう、consumer-facing guidance に `consumer-toolchain` を明示する。

## 1. Scope

- `src/setup/templates.ts` の adapter docs / generated command guidance に `consumer-toolchain` を追加する。
- `docs/templates/adapter/AGENTS.md` / `CLAUDE.md` と `docs/templates/adapter/.claude/**` の disk mirror を同期する。
- setup regression と model-id SSOT drift test で built-in fallback / disk mirror が両 consumer-safe profile を含むことを固定する。

## 2. Non-Scope

- 生成 CI の既定 gate は `doctor --setup-smoke` のまま維持する。
- full doctor の consumer profile は追加しない。
- `consumer-toolchain` の実行内容は変更しない。

## 3. DoD

- [x] generated adapter docs が `consumer-setup-smoke` と `consumer-toolchain` の両方を案内する。
- [x] generated commands が両 consumer-safe profile を案内する。
- [x] hidden disk mirror `docs/templates/adapter/.claude/**` が built-in template と一致する。
- [x] generated CI は `doctor --setup-smoke` のまま。
- [x] setup regression / model-id drift / typecheck / biome が green。plan lint / doctor は final gate で確認する。

## 4. Verification

- `bun run test -- tests\setup.test.ts --testNamePattern "built-in fallback|managed blocks|consumer doctor|model-id" --reporter=dot`
- `bun run test -- tests\model-id-ssot-drift.test.ts --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\setup\templates.ts tests\setup.test.ts docs\plans\PLAN-L7-376-consumer-toolchain-template-guidance.md docs\templates\adapter\AGENTS.md docs\templates\adapter\CLAUDE.md docs\templates\adapter\.claude\CLAUDE.md docs\templates\adapter\.claude\commands\ut-tdd-status.md docs\templates\adapter\.claude\commands\ut-tdd-test.md docs\templates\adapter\.claude\agents\ut-tdd-tl.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
