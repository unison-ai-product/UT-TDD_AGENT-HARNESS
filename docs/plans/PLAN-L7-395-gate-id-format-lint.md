---
plan_id: PLAN-L7-395-gate-id-format-lint
title: "PLAN-L7-395 (add-impl): GateId 形式 lint hard gate"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: PO / TL
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T10:50:00+09:00"
    tests_green_at: "2026-07-09T10:50:00+09:00"
    verdict: approve
    scope: "IMP-072 GateId 形式 lint。Forward/right-arm GateId を G0.5/G1-G14 に限定し、doctor hard gate と unit oracle へ配線。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/gate-id-format.test.ts tests/doctor-rule-quality.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T10:50:00+09:00"
        evidence_path: tests/gate-id-format.test.ts
        output_digest: "sha256:7e484e36a3f7f6534e4ff8076a7f7d42425f9a6f52f7cbe69061d4e44167f5e9"
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T10:50:00+09:00"
        evidence_path: src/lint/gate-id-format.ts
        output_digest: "sha256:987bddd156fc77562b771b5b2d8c343276c94044c9a668ade69e8be02f5012b5"
agent_slots:
  - role: tl
    slot_label: "TL - GateId 形式契約と doctor hard gate レビュー"
  - role: se
    slot_label: "SE - lint 実装と doctor 配線"
  - role: qa
    slot_label: "QA - fail-close oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-395-gate-id-format-lint.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/gate-id-format.ts
    artifact_type: source_module
  - artifact_path: src/doctor/rule-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: tests/gate-id-format.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor-rule-quality.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires:
    - docs/plans/PLAN-L6-01-function-spec.md
    - docs/plans/PLAN-REVERSE-395-gate-id-format-lint-backfill.md
  references:
    - docs/design/harness/L4-basic-design/data.md
    - docs/governance/gate-design.md
    - docs/process/gates.md
    - docs/improvement-backlog.md
---

# PLAN-L7-395: GateId 形式 lint hard gate

## 0. 目的

IMP-072 の carry を閉じる。Forward/right-arm の GateId は `G0.5` または `G1`〜`G14`
だけを正規形とし、`G15` / `G01` / `gate-3` のような不正値を doctor hard gate で止める。

## 1. 実装内容

- `src/lint/gate-id-format.ts` を追加し、gate 設計表と evidence manifest の `gate` field を検査する。
- `src/doctor/rule-quality.ts` / `check-definition-groups.ts` / `profiles.ts` に `gate-id-format` を配線する。
- `tests/gate-id-format.test.ts` で shorthand 分解、invalid fixture、real repo green を固定する。
- `tests/doctor-rule-quality.test.ts` / `tests/doctor.test.ts` で doctor 配線と fail-close を固定する。
- `function-spec.md` / `L7-unit-test-design.md` / `data.md` / `improvement-backlog.md` に実装済み範囲を back-fill する。

## 2. 非対象

- roadmap 固有 gate (`G-L7.A` など) は `roadmap-registry` の別スキーマ対象であり、本 lint では扱わない。
- gate 状態遷移や PASS 台帳の整合は既存 `gate-confirm` の責務とする。

## §3 工程表

### Step 1: [直列] GateId 正本範囲の確定

直列理由: downstream_dependency。data.md §4 / gate-design.md / gates.md を読み、Forward/right-arm gate と
roadmap gate のスキーマ境界を分ける。

### Step 2: [並列] lint 実装と fixture 作成

`analyzeGateIdFormat` と invalid fixture / real repo green oracle を追加する。

### Step 3: [直列] doctor 配線

直列理由: downstream_dependency。lint 実装後に `checkGateIdFormat` と full profile 出力へ登録する。

### Step 4: [直列] review / verification

直列理由: downstream_dependency。targeted unit、typecheck、plan lint、doctor で確認する。

## §3.1 実装計画

`gate-id-format` を standalone lint として追加し、IMP-072 の under-design を解消する。汎用 cross-check
engine への吸収は将来可能だが、本 slice では doctor hard gate として即時に実行経路へ載せる。

## DoD

- [x] `G0.5` / `G1`〜`G14` 以外の Forward/right-arm GateId が fail-close する。
- [x] `G8/G9` のような shorthand は個別 gate に分解して検査される。
- [x] `gate-id-format` が doctor full profile に出る。
- [x] IMP-072 が implemented へ更新される。
- [x] 設計・テスト設計・PLAN が source/test 変更を所有する。
