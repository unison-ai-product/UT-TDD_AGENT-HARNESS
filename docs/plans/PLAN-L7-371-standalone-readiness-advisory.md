---
plan_id: PLAN-L7-371-standalone-readiness-advisory
title: "PLAN-L7-371 (refactor): standalone consumer readiness を advisory 化する"
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
backprop_decision_reason: "consumer setup readiness の blocking/advisory 境界を既存 standalone mode contract に合わせる修正であり、上位要求の追加変更は不要。"
agent_slots:
  - role: tl
    slot_label: "TL - standalone readiness boundary review"
  - role: se
    slot_label: "SE - setup readiness regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-371-standalone-readiness-advisory.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
  requires:
    - docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T12:45:00+09:00"
    tests_green_at: "2026-07-07T12:45:00+09:00"
    verdict: approve
    scope: "consumer readiness の runtime CLI advisory 化。Bun/git/project-local ut-tdd は blocking 維持。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\setup.test.ts --testNamePattern \"U-SETUP-012\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T12:45:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:5419475a9fda8949fa4295c90dc7c36a2fe6dc0ad89bb5fc8b268d31c02fb627"
        anchor_commit: f54f9cacdb2d20c20e32d98081c9d948a494c2e5
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T12:45:00+09:00"
        evidence_path: src/setup/distribution.ts
        output_digest: "sha256:4b34d29f25dc395cd0cb7316422504cd4160ea8d29d5a09926dfe0d49ec7bc0d"
        anchor_commit: f54f9cacdb2d20c20e32d98081c9d948a494c2e5
---

# PLAN-L7-371 (refactor): standalone consumer readiness を advisory 化する

## 0. 目的

consumer project の初期導入で Claude/Codex runtime CLI が未ログインまたは未導入でも、`setup --solo`、`status`、Pack CI、project-local wrapper の確認を進められるようにする。

`standalone` mode は既に runtime detection の正規 mode であるため、AI runtime 不在を setup readiness 全体の blocked として扱わず、judgment gate で人間レビュー必須になることを明示する。

## 1. 背景

`buildConsumerReadinessPlan` は `mode=standalone` を返せる一方で、`hasClaude || hasCodex` を全体 `ok` に含めていた。そのため、Bun/git/project-local `ut-tdd` が整っていても、Claude/Codex がないだけで consumer readiness が blocked になっていた。

これは汎用的なシステム開発で UT-TDD Pack を導入する場面では過剰に自己開発環境へ寄った判定である。

## 2. Scope

- `runtime-cli` check は mode 表示として残し、standalone でも `ok=true` とする。
- Claude/Codex 不在時の message は `mode=standalone` と human review required を示す。
- 全体 `ready.ok` は Bun/git/project-local `ut-tdd` の blocking preflight に限定する。
- `gh` は従来どおり GitHub setup 用 warning とする。

## 3. Non-Scope

- setup-smoke の Claude/Codex 両 adapter 必須契約は変更しない。
- runtime ごとの partial adapter projection は行わない。
- `ConsumerReadinessPlan.checks` の schema 分割は行わない。runtime CLI 不在は `ok=true` の standalone message として表現する。

## 4. 実装結果

- `src/setup/distribution.ts` の `ready.ok` から runtime CLI 必須条件を外した。
- runtime CLI 不在時の check を `ok=true` の standalone/human-review-required message に変更した。
- `tests/setup.test.ts` に、Claude/Codex が両方ない consumer でも readiness が `ok=true` / `mode=standalone` になる regression を追加した。
- L6 設計と L7 テスト設計の U-SETUP-012 記述を、project-local wrapper と runtime advisory 境界へ更新した。

## 5. DoD

- [x] Claude/Codex runtime CLI がなくても consumer readiness は standalone mode で OK になる。
- [x] runtime CLI 不在は画面上の standalone advisory message として残る。
- [x] Bun/git/project-local `ut-tdd` 不在は blocking のまま残る。
- [x] 設計・テスト設計が実装 contract と一致する。

## 6. Verification

- `bun run test -- tests\setup.test.ts --testNamePattern "U-SETUP-012" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\setup\distribution.ts tests\setup.test.ts docs\design\harness\L6-function-design\setup-solo-team.md docs\test-design\harness\L7-unit-test-design.md`
