---
plan_id: PLAN-L7-359-consumer-setup-profile-wiring
title: "PLAN-L7-359 (recovery/refactor): consumer setup profile wiring"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: regression_dev
route_mode: recovery
backprop_decision: not_required
backprop_decision_reason: "PLAN-RECOVERY-06 のうち consumer setup 生成物の実行経路だけを是正する小スライス。full doctor の source dogfood gate は維持し、fresh consumer には setup-smoke を使う境界修正であり、上位要求の意味変更ではない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - consumer setup profile boundary"
  - role: qa
    slot_label: "Explorer - generic Pack/fresh-consumer audit"
generates:
  - artifact_path: docs/plans/PLAN-L7-359-consumer-setup-profile-wiring.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    artifact_type: markdown_doc
  - artifact_path: docs/templates/github/common/harness-check.yml
    artifact_type: markdown_doc
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
  - artifact_path: src/lint/project-hook.ts
    artifact_type: source_module
  - artifact_path: src/lint/codex-hook-adapter-policy.ts
    artifact_type: source_module
  - artifact_path: src/lint/codex-hook-adapter.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/project-hook.test.ts
    artifact_type: test_code
  - artifact_path: tests/codex-hook-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
  requires: []
  references:
    - docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T18:01:00+09:00"
    tests_green_at: "2026-07-03T18:00:00+09:00"
    verdict: approve
    scope: "Newton が fresh consumer の生成 CI full doctor 問題を最優先候補として指摘。実装は generated harness-check を doctor --setup-smoke へ変更し、setup 生成 hook wrapper と doctor hook lint の単一定義源を共有。Source relevant setup/github/runtime hook tests と typecheck を確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\github-ci-policy.test.ts tests\\runtime-hook-entrypoints.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:46:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:4121d49ed1039d974920df387938350f67d11755f669baff35d62929ea232e1c"
        anchor_commit: 9eed81bb65bf768b9e9a6a74b373e700ff047fbe
      - kind: unit_test
        command: "bun run vitest run tests\\project-hook.test.ts tests\\codex-hook-adapter.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:59:00+09:00"
        evidence_path: tests/project-hook.test.ts
        output_digest: "sha256:4511c45a4669d52bc3e81e6e98089e5c99367a02b1429abfbb09ffc53c233e88"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T17:39:00+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:e4720ac55b9b542d18f0a9f5d54b6258a17f556cb9622576a63558ec5be435b4"
        anchor_commit: 9eed81bb65bf768b9e9a6a74b373e700ff047fbe
      - kind: lint
        command: "bunx biome check docs\\templates\\github\\common\\harness-check.yml src\\lint\\codex-hook-adapter-policy.ts src\\lint\\codex-hook-adapter.ts src\\lint\\project-hook.ts src\\setup\\distribution.ts src\\setup\\templates.ts tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:46:00+09:00"
        evidence_path: src/lint/project-hook.ts
        output_digest: "sha256:40185d1c975350a5d60ce08efea439a3987f452beccb19ffef54986cfd022259"
---

# PLAN-L7-359: consumer setup profile wiring

## 背景

`PLAN-RECOVERY-06` は Pack consumer 実動線に source self-application 前提が混入した問題を扱う。今回の実走確認でも、生成される consumer CI が full `doctor` を実行する経路と、setup 生成 hook wrapper を doctor lint が source 形式としてしか受理しない経路が、高 ROI の汎用化候補として残っていた。

## 変更

- setup 生成 `common/harness-check.yml` の doctor step を `doctor --setup-smoke` にする。source repo の full doctor は維持し、fresh consumer CI では source-only PLAN/design corpus を要求しない。
- setup 生成 wrapper は Pack checkout topology では repo-local `src/cli.ts` を優先し、setup 実行マシンの絶対パスに依存しない。
- setup 生成 `.claude/settings.json` / `.codex/hooks.json` の hook command を `project-hook` lint の wrapper 正規形から生成し、gate 要求と生成物の定義源を共有する。
- `project-hook` / `codex-hook-adapter` lint は source 配線と wrapper 配線の両方を受理する。
- clean Pack allowlist から旧 ai-dev-team governance doc を外し、Pack の source-only 混入を減らす。

## 非対象

- `PLAN-RECOVERY-06` 全体の完了宣言はしない。A-172 correction note や A-171 UAT 境界再評価は後続で扱う。
- GitHub branch / remote の `main` 既定汎用化は本 slice では扱わない。

## 検証

- `bun run vitest run tests\\setup.test.ts tests\\github-ci-policy.test.ts tests\\runtime-hook-entrypoints.test.ts --reporter=dot`
- `bun run vitest run tests\\project-hook.test.ts tests\\codex-hook-adapter.test.ts tests\\distribution-acceptance.test.ts --reporter=dot`
- `bun run typecheck`
- `bunx biome check docs\\templates\\github\\common\\harness-check.yml src\\lint\\codex-hook-adapter-policy.ts src\\lint\\codex-hook-adapter.ts src\\lint\\project-hook.ts src\\setup\\distribution.ts src\\setup\\templates.ts tests\\setup.test.ts`

## DoD

- [x] generated consumer `harness-check.yml` が `doctor --setup-smoke` を実行する。
- [x] generated wrapper が Pack checkout の repo-local harness CLI を優先できる。
- [x] generated hook wrapper command が project-hook / codex-hook-adapter lint に受理される。
- [x] setup / GitHub CI policy / runtime hook regression tests が通る。
- [x] Source と Pack の runtime/test/template 差分へ反映される。
