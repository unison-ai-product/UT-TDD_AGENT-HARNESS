---
plan_id: PLAN-L7-363-routine-gate-run-projection
title: "PLAN-L7-363 (impl): routine gate G1-G8 の gate_runs 永続化 + projection 貫通"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-09
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - gate 証跡 schema と projection 契約のレビュー"
  - role: se
    slot_label: "SE - gate コマンド永続化 + gate_runs projection + doctor coverage"
review_evidence:
  - reviewer: codex-explorer-plato
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T20:26:36+09:00"
    tests_green_at: "2026-07-09T20:26:36+09:00"
    verdict: approve
    scope: "PLAN-L7-363 gate CLI 証跡 writer / projection / doctor coverage の設計・実装レビュー。再現情報不足リスクを指摘し command/checks/provenance を JSON 証跡へ追加。"
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T20:26:36+09:00"
        evidence_path: src/gate/run-evidence.ts
        output_digest: "sha256:a5729d0bb6c57db79035be81b563a3457a6c7bef776006e5134c27a9cc799c68"
        anchor_commit: b78a57b6881a7ed7a61c357593851b50447725c1
      - kind: unit_test
        command: "bunx vitest run tests/cli-surface.test.ts tests/projection-writer.test.ts tests/doctor.test.ts -t \"gate run|gate-run|persisted gate\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T20:26:36+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:821ad23f59635b35e123343305d93b169a80a28458403868a4155b160c933ac3"
        anchor_commit: b78a57b6881a7ed7a61c357593851b50447725c1
generates:
  - artifact_path: docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/gate/run-evidence.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/lint/gate-run-coverage.ts
    artifact_type: source_module
  - artifact_path: src/doctor/process-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: PLAN-L6-01-function-spec
  requires: []
  references:
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/design/harness/L6-function-design/function-spec.md
    - src/cli.ts
    - src/gate/static.ts
    - src/gate/run-evidence.ts
    - src/state-db/projection-writer.ts
    - src/state-db/feedback-projections.ts
    - src/lint/gate-run-coverage.ts
---

# PLAN-L7-363 (impl): routine gate G1-G8 の gate_runs 永続化

## Status

confirmed (2026-07-09)。DB三ループ監査の Critical 所見 (gate 観測ループが沈黙して壊れている /
false-confidence) に対し、`ut-tdd gate` 証跡 writer、`.ut-tdd/gate_runs` projection、`gate-run-coverage`
doctor check、retry regression を実装した。

## 背景

- `ut-tdd gate <id>` (`src/cli.ts` gate action) は `evaluateGateReview` + `evaluateStaticGate` を評価し
  pass/fail を stdout/exit code に出すのみで、**harness.db へ一切書かない**。gate_runs / workflow_runs の
  net-new 行は `projectVerificationBandExecution` (`src/state-db/projection-writer.ts`) が
  PLAN-M-00-verify-cutover の L8-L14 帯に **ハードコード**した合成 `G-VERIFY.<layer>` 行のみ。
- 帰結: 通常業務の G1-G8 gate pass/fail は永続化されず後監査不能。`projectRetryEvents`
  (`src/state-db/feedback-projections.ts`) が読む workflow_runs には合成帯行しか無いため、
  **retry / blocked テレメトリが全業務で「clean」と誤報**し、gate-pass-rate 指標 (D-02) も算出不能。
- gating 自体は同期 exit で機能するが、pillar 3「自動状態と DB projection で gap/drift を可視化」に対し
  観測次元が完全欠落 (静かに clean を報告する false-confidence loop)。設計 (function-spec / functional
  -requirements §gate 永続化) は `.ut-tdd/gate_runs` 証跡を要求しており実装が乖離している。

## スコープ

1. **gate 証跡書式**: `ut-tdd gate <id>` 実行時に `(plan_id, gate_id, verdict, tier, checked_at,
   session_id)` を `.ut-tdd/gate_runs/*.json` へ durable 追記する (gate 判定ロジックは変更しない。
   記録失敗は握って gate exit code に影響させない)。
2. **projection 貫通**: rebuild パイプラインが `.ut-tdd/gate_runs/*.json` を読み、per-PLAN の
   gate_runs 行 (と対応 workflow_runs phase 行) を投影する。合成 L8-L14 帯 (`projectVerification
   BandExecution`) と共存し、双方 source を明示する。
3. **doctor 検出**: `gate-run-coverage` doctor check を追加。workflow row に対応する gate_runs 行の欠落、
   orphan gate row、plan_id 空の gate row、壊れた evidence JSON を検出する (drive-db-registration と
   同型の DB-driven gate)。歴史的 confirmed PLAN 全件への gate backfill は別 backfill scope とし、本
   slice は「実行証跡が存在する workflow を沈黙させない」一貫性 gate とする。
4. **retry テレメトリ整合**: `projectRetryEvents` が実 gate 履歴を読むことを regression test で固定する。

## 非対象

- gate 判定基準 (tier / 静的閾値) の変更は行わない (別 PLAN)。本 PLAN は観測・永続のみ。
- L8-L14 合成帯の廃止は行わない (PLAN-M-00 scope)。

## §3 工程表

### Step 1: gate 証跡 event schema 設計 (TL) [直列]

gate_runs / workflow_runs の列と `.ut-tdd/gate_runs/*.json` 書式を確定する。後続 projection がこの
schema に依存する (downstream_dependency)。

### Step 2: gate コマンド永続化 [直列]

`src/cli.ts` gate action に証跡書込を追加。gate action ハンドラの共有状態を編集するため直列
(shared_state)。判定ロジックは不変、記録は try/catch で握る。

### Step 3: gate_runs projection 貫通 [直列]

Step 1 の schema に依存する projection 実装 (downstream_dependency)。合成帯と source 区別。

### Step 4: doctor gate-run-coverage check [並列]

DB-driven な per-PLAN gate 網羅検出。projection とは別 module のため並列可。

### Step 5: retry テレメトリ regression test [並列]

実 gate 履歴で retry_events が算出されることを固定。別 test file のため並列可。

### Step 6: cross-runtime レビュー (pmo-sonnet / codex) [直列]

証跡書式・fail-close 境界・projection 契約を別ランタイムでレビュー。全 Step 完了に依存
(downstream_dependency)。

実施記録: subagent `Plato` が CLI gate flow / test placement / 再現情報の欠落リスクを read-only
レビューし、JSON 証跡に `command` / `checks[]` / review・coverage provenance を保持する修正へ反映した。

## §3.1 実装計画

`src/cli.ts` gate action → `.ut-tdd/gate_runs/` writer (新規 helper) → `projection-writer.ts` に
`projectGateRuns` を追加し rebuild へ配線 → `src/doctor/` に `checkGateRunCoverage` を追加し
check-registry へ登録 → `tests/` に projection + doctor + retry の regression を追加。source と Pack の
runtime/test 差分へ反映する。

## DoD / 受入基準

- [x] `ut-tdd gate <id>` 実行後に `.ut-tdd/gate_runs/*.json` 証跡が生成される (test 固定)。
- [x] `ut-tdd db rebuild` 後に per-PLAN gate_runs 行が projection される (`bun run src/cli.ts db rebuild`)。
- [x] `ut-tdd doctor` の `gate-run-coverage` が gate_runs 欠落/orphan を fail-close 検出する。
- [x] `projectRetryEvents` が実 gate 履歴を反映する (retry regression test green)。
- [x] 記録系例外が gate 判定 (exit code) を変えない (test 固定)。

## 検証記録

- `bun run typecheck`
- `bunx vitest run tests/cli-surface.test.ts tests/projection-writer.test.ts tests/doctor.test.ts --reporter=dot`
- `bun run src\cli.ts db rebuild`
- `bun run src\cli.ts doctor --json`
