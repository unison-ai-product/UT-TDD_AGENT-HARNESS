---
plan_id: PLAN-L7-358-doctor-toolchain-scope
title: "PLAN-L7-358 (refactor): doctor toolchain scope"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の既定 full 実行を維持したまま、Pack 利用者にも使える軽量 toolchain gate 経路を追加する実行経路 refactor であり、上位仕様変更を伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor scoped execution slice"
  - role: qa
    slot_label: "Explorer - doctor ROI and generalization review"
generates:
  - artifact_path: docs/plans/PLAN-L7-358-doctor-toolchain-scope.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-300-doctor-scoped-execution.md
  requires:
    - docs/plans/PLAN-L7-357-doctor-timing-profile.md
  references:
    - docs/plans/PLAN-L7-300-doctor-scoped-execution.md
    - docs/plans/PLAN-L7-357-doctor-timing-profile.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T17:40:00+09:00"
    tests_green_at: "2026-07-03T17:39:00+09:00"
    verdict: approve
    scope: "PLAN-L7-300 の scoped execution を一気に changed/watches へ広げず、独立 check の toolchain-pin だけを先に land する低リスク slice。Singer は db-projection 高速化より先に toolchain scope を固める判断を支持、Newton は setup 生成 CI の fresh consumer 汎用化を後続候補として提示。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"toolchain|hard gates wired\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:36:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:cb40e06e5b456372eb82e7f7c08c7a400cd348e1e54baca864663f21dab455fe"
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"doctor scope|doctor verification flag\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:33:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:0cd35030fe95624693da9cce000663dedc7cfd0d6762c613a96e57fcbff99ca5"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T17:39:00+09:00"
        evidence_path: src/doctor/check-registry.ts
        output_digest: "sha256:8be9f74c223b54c090eb2062b1f1ae6d808385398e83ec8fc192c0146c3e34d2"
      - kind: lint
        command: "bunx biome check src\\doctor\\check-registry.ts src\\cli.ts tests\\doctor.test.ts tests\\cli-surface.test.ts docs\\plans\\PLAN-L7-358-doctor-toolchain-scope.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:39:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:0db505155c0899574237bbce7592661714f1dd48017e7c842ad5543ade963599"
---

# PLAN-L7-358: doctor toolchain scope

## 背景

`PLAN-L7-357` で `ut-tdd doctor --timing` を追加し、full doctor の最遅 check が `db-projection-ingestion` 約 22 秒であることが分かった。一方で、Pack 利用者や CI 初期切り分けでは、formatter / lockfile drift のような toolchain 前提だけを高速に確認したい場面がある。

`PLAN-L7-300` の最終像は `--scope changed` と watches 宣言だが、そこへ一気に進むと全 check の依存関係定義を巻き込む。まず独立 check である `toolchain-pin` だけを scoped execution の第一歩にする。

## 変更

- `DoctorScope = "full" | "toolchain"` を導入し、既定は従来どおり `full` とする。
- `collectDoctorCheckRun(..., { scope: "toolchain" })` は `toolchain-pin` のみを実行し、`--timing` 併用時も `toolchain-pin` の timing だけを返す。
- `ut-tdd doctor --scope toolchain` を追加する。不明 scope は fail-close し、`--json` 併用時は機械可読な失敗 payload を返す。

## 非対象

- `--scope changed` と watches 宣言は本 slice では実装しない。
- `db-projection-ingestion` の高速化は timing evidence をもとに後続 slice とする。
- full doctor の check 順序と hard-gate 集約は変えない。

## 検証

- `bun run vitest run tests\\doctor.test.ts -t "toolchain|hard gates wired" --reporter=dot`
- `bun run vitest run tests\\cli-surface.test.ts -t "doctor scope|doctor verification flag" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\doctor\\check-registry.ts src\\cli.ts tests\\doctor.test.ts tests\\cli-surface.test.ts docs\\plans\\PLAN-L7-358-doctor-toolchain-scope.md`
- `bun run src\\cli.ts doctor --scope toolchain --timing --json`

## DoD

- [x] `ut-tdd doctor --scope toolchain` が `toolchain-pin` だけを hard-gate check として実行する。
- [x] `ut-tdd doctor --scope toolchain --timing --json` が `timings[]` を `toolchain-pin` に限定する。
- [x] 不明 `--scope` が fail-close し、JSON 利用者には機械可読に返る。
- [x] 既定 `ut-tdd doctor` の full 実行 contract を維持する。
- [x] Source と Pack の runtime/test 差分へ反映される。
