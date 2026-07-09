---
plan_id: PLAN-L7-357-doctor-timing-profile
title: "PLAN-L7-357 (refactor): doctor per-check timing profile"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の出力契約を保ったまま per-check 計時を追加する性能可視化の refactor slice であり、上位要件や業務仕様の意味変更を伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor timing profile"
  - role: qa
    slot_label: "Explorer - doctor scope/timing risk review"
generates:
  - artifact_path: docs/plans/PLAN-L7-357-doctor-timing-profile.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/result.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
  requires: []
  references:
    - docs/plans/PLAN-L7-300-doctor-scoped-execution.md
    - docs/governance/harness-v2-update-strategy.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T17:03:00+09:00"
    tests_green_at: "2026-07-03T17:02:00+09:00"
    verdict: approve
    scope: "PLAN-L7-300 Step1 の per-check timing slice。Source targeted doctor/CLI tests、typecheck、Biome、Pack targeted tests、Pack test:pack を確認。--scope changed / exact check id registry は後続に残す判断。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"timing|hard gates wired\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:00:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:c8ab3b26d10caea10906ab774ab191f29e0c5f53ca59a8bde962400b0338aa82"
        anchor_commit: c31fbe0f42bfb9c148c75df40aebd5bfd68ddaaa
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T16:59:00+09:00"
        evidence_path: src/doctor/check-registry.ts
        output_digest: "sha256:32a24674feae139bae657dd2c40e760eb3bf6b5b1e8fa61bc00905ed6794252f"
        anchor_commit: c31fbe0f42bfb9c148c75df40aebd5bfd68ddaaa
      - kind: lint
        command: "bunx biome check src\\doctor\\check-registry.ts src\\doctor\\index.ts src\\doctor\\result.ts src\\cli.ts tests\\doctor.test.ts tests\\cli-surface.test.ts docs\\plans\\PLAN-L7-357-doctor-timing-profile.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:59:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:fd85ebc140197656ea1cdd74f56409d35a22c8760b1390098d2fc5d5d14f514f"
        anchor_commit: c31fbe0f42bfb9c148c75df40aebd5bfd68ddaaa
---

# PLAN-L7-357: doctor per-check timing profile

## 背景

`PLAN-L7-300-doctor-scoped-execution` は doctor の実行性能改善として、per-check 計時、一括 load、digest cache、`--scope changed` を掲げている。前段の `PLAN-L7-355` で check registry は分離済みだが、どの check が重いかを実測できる surface がまだ無い。

## 変更

- `collectDoctorCheckRun` が各 hard-gate check を順序維持で実行し、`--timing` 時だけ `id / duration_ms / ok / message_count` を収集する。
- `runDoctor` は通常時の `ok/messages` 契約を維持し、timing 指定時だけ optional `timings` を返す。
- `ut-tdd doctor --timing` を追加し、通常 stdout では遅い順の timing summary を出す。`--json` では `timings` 配列を返す。

## 非対象

- `--scope changed` は本 slice では実装しない。check の `watches` 宣言と changed-file routing は後続 slice とする。
- exact check id registry への全面置換は行わない。現時点では dependency drift や green command digest など例外依存があり、過剰リファクタになる。
- 一括 load / digest cache は計時結果を見てから別 slice で判断する。

## 検証

- `bun run vitest run tests\\doctor.test.ts -t "timing|hard gates wired" --reporter=dot`
- `bun run vitest run tests\\cli-surface.test.ts -t "doctor verification flag" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\doctor\\check-registry.ts src\\doctor\\index.ts src\\doctor\\result.ts src\\cli.ts tests\\doctor.test.ts tests\\cli-surface.test.ts docs\\plans\\PLAN-L7-357-doctor-timing-profile.md`
- `bun run src\\cli.ts doctor --timing`

## DoD

- [x] `ut-tdd doctor --timing` が per-check timing summary を出す。
- [x] `ut-tdd doctor --timing --json` が `timings[]` を返す。
- [x] 通常 `ut-tdd doctor` の `ok/messages` 契約が維持される。
- [x] Source と Pack の runtime/test 差分へ反映される。
