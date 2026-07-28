---
plan_id: PLAN-L7-222-doctor-runtime-surface-extraction
title: "PLAN-L7-222 (impl): Doctor runtime surface extraction"
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
    slot_label: "Codex - doctor runtime surface extraction"
  - role: qa
    slot_label: "Codex - doctor regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-222-doctor-runtime-surface-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/runtime-surface.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-runtime-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-220-doctor-plan-governance-extraction.md
  requires:
    - docs/plans/PLAN-L7-81-codex-wrapper-parity-gate.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
references:
  - src/doctor/index.ts
  - src/doctor/runtime-surface.ts
  - tests/doctor.test.ts
  - tests/doctor-runtime-surface.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T12:31:00+09:00"
    tests_green_at: "2026-07-02T12:31:00+09:00"
    verdict: approve
    scope: "Doctor runtime/GitHub surface refactor: project-hook, github-ci-policy, codex-hook-adapter, and codex-wrapper-parity checks move out of src/doctor/index.ts while preserving runDoctor hard gate wiring and exported check functions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T12:31:00+09:00"
        evidence_path: src/doctor/runtime-surface.ts
        output_digest: "sha256:52c7e86d11b7acfffa162d3b055c240d21c20dc23fd39b8a34a9708a5e7a8c7d"
        anchor_commit: b7f4c1ff096f4b910c303395512502b4b0517310
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-runtime-surface.test.ts tests\\doctor.test.ts --testNamePattern \"doctor runtime surface|codex-wrapper-parity|GitHub CI policy|project-hook|missing root\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T12:31:00+09:00"
        evidence_path: tests/doctor-runtime-surface.test.ts
        output_digest: "sha256:1b42e63205e4c1258c1894a562e6d7f1ef139e785a832d2d973d50051c94c698"
        anchor_commit: b7f4c1ff096f4b910c303395512502b4b0517310
---

# PLAN-L7-222: Doctor runtime surface extraction

## 目的

`src/doctor/index.ts` は runDoctor の集約責務に加えて、GitHub / Codex / project hook 連携の個別検査まで抱えている。前回 slice で PLAN governance と setup-smoke を切り出したが、runtime surface 系の hard gate はまだ `index.ts` に残っており、doctor の肥大化と変更時の blast radius を広げている。

この slice では runtime/GitHub surface の check 関数を `src/doctor/runtime-surface.ts` に分離し、`index.ts` は import/re-export と runDoctor wiring の責務に寄せる。

## 変更

- `checkProjectHooks` / `checkGithubCiPolicy` / `checkCodexHookAdapter` / `checkCodexWrapperParity` を `src/doctor/runtime-surface.ts` へ移す。
- `DoctorDeps` への依存を避けるため、runtime surface 側は `RuntimeSurfaceDeps` として必要最小限の `repoRoot` / `readText` だけを受け取る。
- `src/doctor/index.ts` は既存 public export を維持するため、同名関数を re-export する。
- `runDoctor` の hard gate wiring と message order は変更しない。

## デグレ対策

- `tests/doctor-runtime-surface.test.ts` で切り出し先モジュールを直接検証し、`tests/doctor.test.ts` の既存 import 経路も維持する。
- full doctor で `github-ci-policy` / `codex-hook-adapter` / `codex-wrapper-parity` が OK のまま出力されることを確認する。
- `impl-plan-trace` により新規 `src/doctor/runtime-surface.ts` が PLAN generates へ接続されることを確認する。

## 2026-07-22 Issue #123 add-impl 追補

runtime surface doctor は Claude hook を executable+argv の意味論へ正規化して検査する。6 hook の
`command` が executable 1 token でない、`args` が期待 token と一致しない、shell operator/追加 argv
で entrypoint が spoof される、guard/session policy が変わる場合は fail-close とする。

Codex は別 serializer の出力として検査し、Claude の `command+args` shape をそのまま必須化しない。
cross-runtime parity は正規化後の semantic invocation と policy で比較し、config schema 差を
「不一致」にも「暗黙許容」にもしない。setup-smoke でも同じ checker を使い、consumer 生成物だけが
shell form へ戻る drift を防ぐ。
