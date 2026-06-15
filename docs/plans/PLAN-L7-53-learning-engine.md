---
plan_id: PLAN-L7-53-learning-engine
title: "PLAN-L7-53: skill learning engine — evaluation, trend, and recommendation feedback"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-15
updated: 2026-06-15
agent_slots:
  - role: tl
    slot_label: 'TL - skill evaluation + learning engine review'
  - role: qa
    slot_label: 'QA - evaluation oracle and acceptance criteria'
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "Learning Engine FR-L1-36/38/43 (projectSkillEvaluations/projectPocEvaluations/projectModelEvaluations + harness-db schema v12 + 3 evaluation test suites)。cold-start 不変条件 (0 telemetry/opt-in 無効で 0 行・throw しない) を 3 projection で確認、FR-38 cost-efficiency の explicit_l7_defer (token telemetry 未存在・捏造なし) 正当性、値の正しさ (skill rating=adoption×success / PoC=confirmed/(confirmed+rejected+pivot) pivot 非成功 / model=success_count/run_count、join=plan_registry.status IN PLAN_SUCCESS_STATUSES) を検証。Critical=0、APPROVE。Important I-1 (poc PK single-row 制約 doc note) は対応、I-2 (unused cutoff 30d 境界テスト) + Minor M-1..3 (asOf 対称性/PLAN_SUCCESS_STATUSES export/index コメント) は §Carry に test-hardening follow-up として記録 (非ブロッカー、green コードへの増分)。V-model closure 用の後追い review (実装は 2026-06-15 同日 merge 済 green、status=draft + review_evidence 空のまま放置されていたのを本クローズで confirmed 化)。"
generates:
  # FR-L1-36 (foundation slice — implemented in this PLAN)
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/skill-evaluation.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-L7-53-learning-engine.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L1-requirements/functional-requirements.md
    artifact_type: design_doc
  # FR-L1-38 (model evaluation — implemented in this PLAN)
  - artifact_path: tests/model-evaluation.test.ts
    artifact_type: test_code
  # FR-L1-43 (PoC success measurement — implemented in this PLAN)
  - artifact_path: tests/poc-evaluation.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/plans/PLAN-L7-47-search-metrics-feedback.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L6-function-design/fr-unit-coverage.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L3-functional/business-detail.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-53: skill learning engine

## Objective

Implement the skill learning engine foundation (FR-L1-36), model evaluation opt-in
(FR-L1-38), and PoC success measurement (FR-L1-43).

All three BR-21 FR slices are implemented in this PLAN.

## Scope

### FR-L1-36 (implemented — foundation slice)

- `skill_evaluations` table added to harness-db schema (SCHEMA_VERSION bumped to 10).
- `projectSkillEvaluations(db, opts?)` added to projection-writer.ts and wired into
  `rebuildHarnessDb` after `projectSkillMetrics`.
- Per-skill: skill_rating (0.0-1.0) = success_count / adoption_count, adoption_count,
  success_count, unused_flag (1 if no invocation in last 30 days), evaluated_at.
- Success states: "confirmed" and "completed" (documented in source with rationale).
- Cold-start (0 invocations) → 0 rows, no throw.
- Deletion of unused skills is human-only; flag surfaces the signal.

### FR-L1-38 (implemented — model evaluation, opt-in)

- `model_evaluations` table added to harness-db schema (SCHEMA_VERSION 11→12).
- `projectModelEvaluations(db, repoRoot)` added to projection-writer.ts and wired
  into `rebuildHarnessDb` after `projectPocEvaluations`.
- Opt-in: reads `.ut-tdd/config/model-opt-in.yaml` under repoRoot; runs only if
  `enabled: true`. Default (no file) = disabled → 0 rows.
- Per-model: success_rate = success_count / run_count (join model_runs.plan_id →
  plan_registry.status IN PLAN_SUCCESS_STATUSES).
- Cold-start (enabled but 0 model_runs) → 0 rows, no throw.
- Cost-efficiency (cost_per_success) is an `explicit_l7_defer` follow-up pending
  token/cost telemetry — no fabricated cost data is stored (see §Carry for the
  formal owner + discharge condition).

### FR-L1-43 (implemented — PoC success measurement)

- `poc_evaluations` table added to harness-db schema (SCHEMA_VERSION bumped to 11).
- `projectPocEvaluations(db, opts?)` added to projection-writer.ts and wired into
  `rebuildHarnessDb` after `projectSkillEvaluations`.
- One summary row (id="poc-evaluation:summary"); poc_success_rate = confirmed /
  (confirmed + rejected + pivot). Pivot is non-success.
- Cold-start (0 decided PoC PLANs) → 0 rows, no throw.

## Acceptance Criteria

### FR-L1-36

- AC-FR-BR21-36-01: skill adopted by 5 plans, all 5 "confirmed" → rating 1.0, unused_flag 0.
- AC-FR-BR21-36-02: skill with last invocation > 30 days ago → unused_flag 1; row preserved.
- Cold-start: 0 invocations → 0 evaluation rows, no exception.

### FR-L1-38

- AC-38-01 (enabled): model-A (2 runs both success) → rate 1.0; model-B (2 runs, 1 success) → rate 0.5.
- AC-38-02 (disabled): no opt-in file → 0 model_evaluations rows.
- Cold-start (enabled, 0 model_runs) → 0 rows, no throw.

### FR-L1-43

- AC-FR-BR21-43-01: 10 PoC (6 confirmed / 3 rejected / 1 pivot) → rate 0.60.
- AC-FR-BR21-43-02 cold-start: 0 PoC PLANs → 0 rows.

## Completion Evidence

- `src/schema/harness-db.ts` has `skill_evaluations`, `poc_evaluations`, `model_evaluations` tables; SCHEMA_VERSION=12.
- `src/state-db/projection-writer.ts` exports `projectSkillEvaluations`, `projectPocEvaluations`, `projectModelEvaluations` and calls them in `rebuildHarnessDb`.
- `tests/skill-evaluation.test.ts` passes (6 tests, U-FR-L1-36 cited).
- `tests/poc-evaluation.test.ts` passes (U-FR-L1-43 cited).
- `tests/model-evaluation.test.ts` passes (U-FR-L1-38 cited).
- `npx tsc --noEmit` clean.
- `npx vitest run` fully green.
- `npx biome check src tests` clean.
- `bun run src/cli.ts doctor` exits 0 with no learning-engine FR in thin-coverage advisory.

## DoD

- [x] FR-L1-36 acceptance criteria green.
- [x] FR-L1-38 acceptance criteria green.
- [x] FR-L1-43 acceptance criteria green.
- [x] tsc + vitest + biome + doctor all pass.
- [x] function-spec.md, fr-unit-coverage.md, L7-unit-test-design.md updated.
- [x] FR-L1-38 follow-up (cost-efficiency) declared in PLAN body and function-spec.md invariant.
- [x] FR-L1-38 cost-efficiency formalized as a named defer with explicit owner + discharge condition (§Carry).

## Carry (deferred follow-up — owner + discharge condition 明示)

> 正規 defer 手続き (CLAUDE.md G.13 / concept §3.1.3.1: 明示宣言した defer は under-design ではない)。
> doc-only に留めず discharge condition を機械追跡可能な形で残す。

- **FR-L1-38 cost-efficiency (`cost_per_success`)** — `explicit_l7_defer`
  - **deferred because**: token/cost telemetry が現状 harness のどこにも存在しない (`model_runs` に
    cost/token 列がなく、cost を計算する原資データがゼロ)。捏造した cost を投影しない方針 (= 0 行 cold-start
    と同じ honest-absence 原則)。FR-L1-38 本体 (model 別 success_rate) は実装済・substance-verified
    (U-FR-L1-38 oracle / `tests/model-evaluation.test.ts`) であり、**deferred なのは cost 効率の sub-aspect のみ**
    (FR 全体を defer しているのではない)。
  - **owner**: PO (telemetry 配線の優先度判断) + telemetry 実装担当。
  - **discharge condition**: token/cost telemetry が `model_runs` (または同等の run-level metrics) に配線され
    実 cost データが入った時点で → ① `model_evaluations` に cost 列 (例 `total_cost` / `cost_per_success`) 追加、
    ② `projectModelEvaluations` で `cost_per_success = total_cost / success_count` を計算、③ U-FR-L1-38 oracle に
    cost-efficiency ケースを追加して substance-verify。
  - **non-fabrication invariant**: discharge までは cost 列を投影しない / ダミー値を入れない (壊さない事項)。

- **test-hardening follow-up (review 2026-06-15 I-2 / M-1..3、非ブロッカー)** — green コードへの増分:
  - I-2: `unused_flag` cutoff の **ちょうど 30 日前 (境界、`fired_at === cutoff`)** ケースを `tests/skill-evaluation.test.ts` に追加し inclusive (`>=`) を回帰固定。
  - M-1: `projectModelEvaluations` に `opts?: { asOf?: string }` を足し skill/poc と対称化 (値固定テスト可能化)。
  - M-3: `idx_poc_evaluations_rate` は単一行テーブルでは実質無効 = 「multi-row 拡張を見越した前倒し」コメント (I-1 の PK 注記とセット)。
