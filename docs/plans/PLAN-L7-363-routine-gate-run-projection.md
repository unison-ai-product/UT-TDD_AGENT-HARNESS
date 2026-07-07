---
plan_id: PLAN-L7-363-routine-gate-run-projection
title: "PLAN-L7-363 (impl): routine gate G1-G8 の gate_runs 永続化 + projection 貫通"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - gate 証跡 schema と projection 契約のレビュー"
  - role: se
    slot_label: "SE - gate コマンド永続化 + gate_runs projection + doctor coverage"
generates:
  - artifact_path: docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/design/harness/L6-function-design/function-spec.md
    - src/cli.ts
    - src/gate/static.ts
    - src/state-db/projection-writer.ts
    - src/state-db/feedback-projections.ts
---

# PLAN-L7-363 (impl): routine gate G1-G8 の gate_runs 永続化

## Status

draft 起票 (2026-07-07 DB三ループ監査。Critical 所見: gate 観測ループが沈黙して壊れている / false-confidence)。
着手時 (draft→confirmed) は add-impl + Reverse pairing へ昇格する (route_mode=add-feature debt)。

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
3. **doctor 検出**: `gate-run-coverage` doctor check を追加。plan_registry の confirmed PLAN に対応する
   gate_runs 行の欠落 / orphan を検出する (drive-db-registration と同型の DB-driven gate)。
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

## §3.1 実装計画

`src/cli.ts` gate action → `.ut-tdd/gate_runs/` writer (新規 helper) → `projection-writer.ts` に
`projectGateRuns` を追加し rebuild へ配線 → `src/doctor/` に `checkGateRunCoverage` を追加し
check-registry へ登録 → `tests/` に projection + doctor + retry の regression を追加。source と Pack の
runtime/test 差分へ反映する。

## DoD / 受入基準

- [ ] `ut-tdd gate <id>` 実行後に `.ut-tdd/gate_runs/*.json` 証跡が生成される (test 固定)。
- [ ] `ut-tdd db rebuild` 後に per-PLAN gate_runs 行が projection される (`bun run src/cli.ts db rebuild`)。
- [ ] `ut-tdd doctor` の `gate-run-coverage` が gate_runs 欠落/orphan を fail-close 検出する。
- [ ] `projectRetryEvents` が実 gate 履歴を反映する (retry regression test green)。
- [ ] 記録系例外が gate 判定 (exit code) を変えない (test 固定)。
