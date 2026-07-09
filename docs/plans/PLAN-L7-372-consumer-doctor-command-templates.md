---
plan_id: PLAN-L7-372-consumer-doctor-command-templates
title: "PLAN-L7-372 (refactor): consumer adapter の doctor 案内を profile 化する"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
created: 2026-07-07
updated: 2026-07-07
owner: PM / Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "consumer-facing adapter template の案内文を既存 doctor profile contract に合わせる修正であり、上位要求の変更は不要。"
agent_slots:
  - role: tl
    slot_label: "TL - consumer template doctor profile boundary review"
  - role: se
    slot_label: "SE - hidden adapter template regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-372-consumer-doctor-command-templates.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/templates/adapter/AGENTS.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/commands/ut-tdd-status.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/adapter/.claude/agents/code-reviewer.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-370-doctor-profile-cli.md
  requires:
    - docs/plans/PLAN-L7-370-doctor-profile-cli.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T13:26:00+09:00"
    tests_green_at: "2026-07-07T13:25:00+09:00"
    verdict: approve
    scope: "consumer-facing adapter docs/commands/agents の full doctor 案内を consumer-setup-smoke profile へ同期し、hidden template stale をテストで禁止。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\setup.test.ts --testNamePattern \"U-SETUP-004b|U-SETUP-009|U-SETUP-010\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T13:05:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:14727edf6b46059836b1064613ec46db392a8ac2e53282189e1c54e72f066a8f"
        anchor_commit: 261d749f80222529e7b2abacffb847ac3a8823f8
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T13:05:00+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:8f032cf39d2246de38020f922817158342d4af504bb20bbd82fa0004dccb9c66"
        anchor_commit: 261d749f80222529e7b2abacffb847ac3a8823f8
      - kind: unit_test
        command: "bun run test -- tests\\model-id-ssot-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T13:25:00+09:00"
        evidence_path: tests/model-id-ssot-drift.test.ts
        output_digest: "sha256:deeb257f306463332312514a1d010b0044819a687eeb2686ea34dbd40790424e"
        anchor_commit: 6bad31bdc24f67adb1978120dd3afa030111646c
---

# PLAN-L7-372 (refactor): consumer adapter の doctor 案内を profile 化する

## 0. 目的

clean Pack / consumer project に投影される adapter docs、Claude commands、Claude agents が full `ut-tdd doctor` を既定案内しないようにする。consumer での既定 health check は `ut-tdd doctor --profile consumer-setup-smoke` とし、full doctor は PLAN/design/test-design を持つ source/governance repository 用として明示する。

## 1. 背景

`doctor --profile` が公開 surface になった後も、disk template mirror の hidden `.claude/**` には full `ut-tdd doctor` の案内が残っていた。`loadTemplates()` は built-in template を作った後に `docs/templates/adapter` を読み込んで上書きするため、hidden mirror が stale だと consumer 生成物へ古い自己開発前提が流れる。

## 2. Scope

- built-in adapter docs/commands/agents の doctor 案内を consumer-safe profile に更新する。
- `docs/templates/adapter/.claude/**` の disk mirror を built-in と同期する。
- `tests/setup.test.ts` に hidden template stale denylist を追加する。
- full doctor は削除せず、source/governance repository 用として残す。

## 3. Non-Scope

- doctor profile の実行意味論は変更しない。
- setup-smoke の検査対象は変更しない。
- adapter file の追加・削除は行わない。

## 4. 実装結果

- `src/setup/templates.ts` の generated agent / command / adapter docs を `consumer-setup-smoke` profile 既定へ更新した。
- `docs/templates/adapter/AGENTS.md` / `CLAUDE.md` と hidden `.claude/**` mirror を同期した。
- `loadTemplates(process.cwd())` で hidden `.claude/**/*.md` を読み、stale full doctor 指示を禁止する regression を追加した。

## 5. DoD

- [x] consumer-facing generated command は `doctor --profile consumer-setup-smoke` を案内する。
- [x] hidden disk template mirror が built-in を古い full doctor 指示で上書きしない。
- [x] full `ut-tdd doctor` は source/governance repository 用として明示される。
- [x] setup template regression が stale 文言を fail-close する。

## 6. Verification

- `bun run test -- tests\setup.test.ts --testNamePattern "U-SETUP-004b|U-SETUP-009|U-SETUP-010" --reporter=dot`
- `bun run test -- tests\model-id-ssot-drift.test.ts --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\setup\templates.ts tests\setup.test.ts docs\templates\adapter\AGENTS.md docs\templates\adapter\CLAUDE.md docs\design\harness\L6-function-design\setup-solo-team.md docs\test-design\harness\L7-unit-test-design.md`
