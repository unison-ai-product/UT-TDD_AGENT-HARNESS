---
plan_id: PLAN-REVERSE-141-refactor-candidate-detector-backfill
title: "PLAN-REVERSE-141: refactor candidate detector の L6/L7 descent back-fill (IMP-146 forward-convergence 集約)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: be
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: not_impacted
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "refactor candidate detector は既存テーブル (quality_signals / feedback_events) への additive projection で schema 不変。新規要件を生まないため requirements は不変。"
  - layer: L4-basic-design
    decision: not_impacted
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "既存の Harness DB projection 機構 (rebuildHarnessDb / recordProjectionEvent) を再利用する building-block であり、基本設計の構造は不変。"
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
    reason: "物理 schema (harness.db テーブル定義) を変えず、quality_signals.metric=refactor_candidate:<kind> と feedback_events への projection に留まる。"
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "analyzeRefactorCandidates detector (+ 4 candidate kind + projection contract) を Harness DB projection addendum へ L6 function-level contract として descent。"
agent_slots:
  - role: tl
    slot_label: "TL (別 runtime=Codex) — detector の L6/L7 descent back-fill クロスレビュー (forward-convergence 集約妥当性)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-141-refactor-candidate-detector-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/forward-convergence-legacy-debt-audit.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-147-refactor-candidate-detector.md
  references:
    - docs/plans/PLAN-DISCOVERY-08-forward-convergence-invariant.md
    - docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-06-26T16:20:00+09:00"
    tests_green_at: "2026-06-26T16:15:00+09:00"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
    scope: "IMP-146 legacy debt 解消の disposition (L7-147 = Forward 集約 via Reverse back-fill) を別 runtime (Codex gpt-5.5, role=tl) が desk review。verdict=AGREE with minor corrections (証跡 .ut-tdd/review/cross-review-imp146-legacy-convergence.md): detector は L6/L7 descent 欠落の真陽性で local_impl_only でなく Forward 集約が正しい、back-fill 先は function-spec.md + L7-unit-test-design.md が適切、と支持。本 PLAN が L6 function-spec へ analyzeRefactorCandidates contract を descent + L7-147 を requires 参照 = forward-convergence converged。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/projection-writer.test.ts (refactor candidate detector 4 kind projection)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T16:15:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:54a0128ece0ed84a75ca94323c74181c81089262a4ef81d406621640215a82dd"
      - kind: unit_test
        command: "bunx vitest run tests/forward-convergence.test.ts (L7-147 converged + allowlist 空化 + grandfather 機構注入)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T16:15:00+09:00"
        evidence_path: tests/forward-convergence.test.ts
        output_digest: "sha256:f069920038d511eb8f00e6aaa1fa6fa223062f237b21e88085e7ba8f13e8e9d5"
      - kind: doctor
        command: "bun src/cli.ts doctor (forward-convergence/forward-convergence-audit/plan-governance 含む full gate)"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T16:15:00+09:00"
        evidence_path: docs/governance/forward-convergence-legacy-debt-audit.md
        output_digest: "sha256:01b7e1df83a2057d4e873c6f287f923d29b51f9f953e888436de259f0ae61b6f"
---

# PLAN-REVERSE-141: refactor candidate detector の L6/L7 descent back-fill (IMP-146)

## 0. なぜ (IMP-146: legacy debt の Forward 集約)

`PLAN-L7-147-refactor-candidate-detector` (kind=impl/confirmed) は forward-convergence fail-close 化
(PLAN-DISCOVERY-08) 以前から存在した未集約 landed impl で、`FORWARD_CONVERGENCE_LEGACY_DEBT` allowlist で
grandfather されていた (繰延、免除でない)。detector 固有 behavior — `analyzeRefactorCandidates` +
4 candidate kind (split-module / extract-helper / deduplicate-function / externalize-literal) +
`quality_signals` (metric=refactor_candidate:<kind>) / `feedback_events` projection contract — は
L6 function-spec / L7 test-design へ一度も descent していなかった (Refactor mode workflow 自体は
`PLAN-L7-133` 経由で Forward 内だが、detector は別 capability)。

IMP-146 disposition (Codex cross-review AGREE、証跡 `.ut-tdd/review/cross-review-imp146-legacy-convergence.md`):
detector は実 product behavior ゆえ `local_impl_only` は不採用、**Forward 集約 (Reverse back-fill で
L6/L7 descent 付与 + 当該 impl PLAN を参照 = converged)** が正しい。本 PLAN がその合流装置 (IMP-064)。

## 1. back-fill した descent (最小・additive、Codex 反映)

- **L6 `docs/design/harness/L6-function-design/function-spec.md`** (updated): Harness DB projection addendum に
  `analyzeRefactorCandidates` の L6 function-level contract 行を追加 (4 candidate kind + projection 先 +
  schema 不変の不変条件)。既存 projection 関数 (`recordProjectionEvent` / `emitFeedbackEvents` 等) と同型。
- **L7 `docs/test-design/harness/L7-unit-test-design.md`** (updated): detector の単体テスト descent を追記
  (`tests/projection-writer.test.ts` が 4 kind を被覆)。
- **converged 機構**: 本 reverse PLAN が `requires` で `PLAN-L7-147` を参照 → forward-convergence analyzer が
  L7-147 を `converged` (Forward 合流済) と分類 → allowlist + audit doc 表行から除去 (現存 grandfather 債務 0)。

## 2. 不変条件 (壊さない)

- detector は既存テーブルへの additive projection で **schema 不変** (requirements / L4 / L5 not_impacted、上記 backprop_scope)。
- L6 contract 行は既存 projection 関数群と同型で、新規 FR-L1-NN を作らない (projection は U-FR-L1-06/19/20/40/41 の被覆下)。
- base = push 済 HEAD。他ランタイム commit を破壊しない。`PLAN-L7-147` 本体 (impl/test) は不変、descent trace のみ補う。
