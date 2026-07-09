---
plan_id: PLAN-L7-283-doctor-process-quality-extraction
title: "PLAN-L7-283 (refactor): doctor process quality adapter extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の巨大化を抑える責務分離であり、検査意味・gate 判定・公開 API を変えないため design back-fill は不要。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor process quality extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-283-doctor-process-quality-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/process-quality.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-process-quality.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-276-doctor-check-collection.md
  requires: []
  references:
    - src/doctor/index.ts
    - src/doctor/process-quality.ts
    - tests/doctor-process-quality.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T22:45:00+09:00"
    tests_green_at: "2026-07-02T22:45:00+09:00"
    verdict: approve
    scope: "process/doc/lifecycle 系 doctor adapter を process-quality module へ抽出し、index re-export と hard gate membership を維持する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T22:45:00+09:00"
        evidence_path: src/doctor/process-quality.ts
        output_digest: "sha256:936429debb42b7a5aaa5f425b9f64b3923ebab969717fb5519eaec1b4eed6341"
        anchor_commit: eedfc3e60f5007952778c312b799bea2d6fbf23a
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-process-quality.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:45:00+09:00"
        evidence_path: tests/doctor-process-quality.test.ts
        output_digest: "sha256:a8ddf39af873881d6dbef395d3131bbe604d6c7a43a948e5d5289d00f5ba57a8"
        anchor_commit: eedfc3e60f5007952778c312b799bea2d6fbf23a
---

# PLAN-L7-283: doctor process quality adapter extraction

## 背景

`src/doctor/index.ts` は `runDoctor` orchestration と多数の thin adapter 実装を同居させており、変更時の認知負荷が高い。
PLAN-L7-276 で check collection は分離済みだが、process / doc / lifecycle 系 adapter がまだ index に残っている。

## 変更

- `src/doctor/process-quality.ts` を追加し、process quality 系の thin doctor adapter を移す。
- `src/doctor/index.ts` は既存公開 API を維持するため、移動した check を import / re-export する。
- `tests/doctor-process-quality.test.ts` で missing-root fail-close と index re-export を固定する。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\doctor-process-quality.test.ts --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] hard gate membership が変わらない。
- [x] 移動した check の fail-close 文言・判定が変わらない。
- [x] `src/doctor/index.ts` 経由の既存 import が維持される。
