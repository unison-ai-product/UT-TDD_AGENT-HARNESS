---
plan_id: PLAN-L7-354-toolchain-biome-exact-pin
title: "PLAN-L7-354 (refactor): toolchain biome exact pin gate"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Biome の semver range を exact pin にし、doctor で静的検査する非破壊の toolchain drift 対策であり、上位要求や実行モデルの変更は伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-345-toolchain-pin-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - toolchain pin gate"
  - role: qa
    slot_label: "Explorer - toolchain pin scope review"
generates:
  - artifact_path: docs/plans/PLAN-L7-354-toolchain-biome-exact-pin.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/toolchain-pin.ts
    artifact_type: source_module
  - artifact_path: src/doctor/toolchain.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/toolchain-pin.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: package.json
    artifact_type: config
  - artifact_path: bun.lock
    artifact_type: config
dependencies:
  parent: docs/plans/PLAN-L7-345-toolchain-pin-gate.md
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
    - docs/plans/PLAN-L7-345-toolchain-pin-gate.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T16:21:00+09:00"
    tests_green_at: "2026-07-03T16:20:00+09:00"
    verdict: approve
    scope: "Biome exact pin と toolchain-pin doctor wiring。外部 bunx/biome 実行 probe は fail-open 設計が必要なため非対象とし、package.json / bun.lock の静的突合に限定。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\toolchain-pin.test.ts tests\\doctor.test.ts -t \"toolchain|hard gates\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:20:00+09:00"
        evidence_path: tests/toolchain-pin.test.ts
        output_digest: "sha256:5105744a4d1293502402a913fe1a4d7a554807e4986524b6e6d166c65ca0a363"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T16:20:00+09:00"
        evidence_path: src/lint/toolchain-pin.ts
        output_digest: "sha256:4cb3b5f3ec327e2fbea9d95630ea7de9d6380dc8c441d3d2379e6bc18e20b8ef"
      - kind: lint
        command: "bunx biome check src\\doctor\\index.ts src\\doctor\\toolchain.ts src\\lint\\toolchain-pin.ts tests\\toolchain-pin.test.ts tests\\doctor.test.ts package.json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:20:00+09:00"
        evidence_path: src/doctor/toolchain.ts
        output_digest: "sha256:edd7dcdd81af9c91cdb785163e2a40d350cd2ab35e905453f461ae322d26e0c9"
---

# PLAN-L7-354: toolchain biome exact pin gate

## 背景

A-183 / PLAN-L7-345 は、Biome の semver range が環境ごとの formatter drift を再発させる入口になっている点を指摘した。現在の lock は `2.4.15` を解決しているが、`package.json` と workspace lock spec は `^2.4.15` のため、新規 install や lock 更新時に差分が動き得る。

## 変更

- `package.json` の `@biomejs/biome` を `2.4.15` に exact pin する。
- `bun.lock` の workspace devDependency spec も `2.4.15` に揃える。
- `src/lint/toolchain-pin.ts` に package/lock の静的突合を追加する。
- `src/doctor/toolchain.ts` から doctor check `toolchain-pin` として配線する。
- `tests/toolchain-pin.test.ts` と `tests/doctor.test.ts` で caret 検出、exact OK、package/lock mismatch、doctor aggregation を固定する。
- `test:pack` に `tests/toolchain-pin.test.ts` を追加し、Pack CI でも同じ drift を検出する。

## 非対象

- `bunx biome --version` の実行 probe。外部コマンド依存のため、入れる場合は fail-open/advisory 設計を別 slice で行う。
- Bun 本体や Vitest の exact pin。利用者環境への影響が大きいため、実害が出ている Biome に限定する。

## 検証

- `bun run vitest run tests\\toolchain-pin.test.ts tests\\doctor.test.ts -t "toolchain|hard gates" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\doctor\\index.ts src\\doctor\\toolchain.ts src\\lint\\toolchain-pin.ts tests\\toolchain-pin.test.ts tests\\doctor.test.ts package.json`
- Pack: `bun run vitest run tests\\toolchain-pin.test.ts tests\\doctor.test.ts -t "toolchain|hard gates" --reporter=dot`
- Pack: `bun run typecheck`
- Pack: `bunx biome check src\\doctor\\index.ts src\\doctor\\toolchain.ts src\\lint\\toolchain-pin.ts tests\\toolchain-pin.test.ts tests\\doctor.test.ts package.json`
- Pack: `bun run test:pack`

## DoD

- [x] Biome の package / lock spec が exact pin になる。
- [x] caret spec fixture が doctor/lint で検出される。
- [x] package / lock mismatch fixture が検出される。
- [x] Source / Pack の該当 runtime/test/package/lock へ反映する。
