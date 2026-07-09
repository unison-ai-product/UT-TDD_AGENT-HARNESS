---
plan_id: PLAN-L7-366-takeover-surface-warn-actionable
title: "PLAN-L7-366 (impl): takeover surface の warn 昇格と feedback_events 読み取り"
kind: refactor
layer: L7
drive: db
status: confirmed
route_signal: code_smell
route_mode: refactor
created: 2026-07-07
updated: 2026-07-07
owner: PM / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "既存の takeover feedback surface と feedback taxonomy の実装補正であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: tl
    slot_label: "TL - severity mapping と surface data source 設計レビュー"
  - role: se
    slot_label: "SE - feedback_events 読み取りと surface regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/surface.ts
    artifact_type: source_module
  - artifact_path: src/feedback/engine.ts
    artifact_type: source_module
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/search-feedback.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  requires:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
    - docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
  references:
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T12:01:00+09:00"
    tests_green_at: "2026-07-07T12:00:00+09:00"
    verdict: approve
    scope: "takeover feedback_events 読み取り、warn severity 保持、source dedup、surface 回帰、projection/emit severity 回帰。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\feedback-surface.test.ts tests\\search-feedback.test.ts tests\\projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T12:00:00+09:00"
        evidence_path: tests/feedback-surface.test.ts
        output_digest: "sha256:0eeb8d02d1e1ff81077121922b59f196b5782dee03795c1d10cbe1c4639a4967"
        anchor_commit: 374d4ee130e0d53da441dd1a1c6d140ab8041c50
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T11:59:00+09:00"
        evidence_path: src/feedback/surface.ts
        output_digest: "sha256:f2bfee5b2185cfc63e1aa5be3ebfdfd02b754b0eb3fbe3bc0c317fa78aec66d4"
        anchor_commit: 374d4ee130e0d53da441dd1a1c6d140ab8041c50
---

# PLAN-L7-366 (impl): takeover surface の warn 昇格と feedback_events 読み取り

## 0. 目的

SessionStart の takeover surface が `harness.db` の open feedback を正しく届けるようにする。
前段の projection が作る `feedback_events` を読み取り、close 済み行を出さず、warn を telemetry に
落としすぎないことで、次のエージェントが実際に閉じるべき作業を見逃さない状態にする。

## 1. 背景

`selectTakeoverFeedback` は `findings` と `quality_signals` を直接読んでいたが、
`feedback_events` 自体は読んでいなかった。そのため downstream の feedback queue は
`ut-tdd feedback list` でしか見えず、SessionStart では write-only に近い状態だった。

また、`quality_signals.status='warn'` が `severity='info'` に降格され、`refactor_candidate:*`
のような high-confidence warn まで telemetry summary に落ちる問題があった。これは
PLAN-L7-137 の taxonomy でいう `actionable` として扱うべき信号を見えにくくしていた。

## 2. Scope

- `selectTakeoverFeedback` が `feedback_events WHERE status='open'` を第一ソースとして読む。
- `feedback_events` が既に表す `findings` / `quality_signals` は二重表示しない。
- `feedback_events` が未生成の環境では、従来どおり `findings` / `quality_signals` の read-only fallback を残す。
- `quality_signals.status='warn'` は severity `warn` のまま扱う。
- telemetry 判定は severity 降格ではなく、PLAN-L7-137 の signal type taxonomy で行う。
- takeover overflow breadcrumb は raw 確認用の `ut-tdd feedback list --json` を案内する。

## 3. Non-Scope

- `feedback_events` の close / supersede lifecycle 完結は PLAN-L7-246 の scope。
- refactor candidate detector の scan root / extension 汎用化は別 refactor-driving slice に延期する。
- doctor consumer profile の再設計は別 doctor profile slice に延期する。

## 4. 実装結果

- `src/feedback/surface.ts`
  - open `feedback_events` の read path を追加。
  - `source_table/source_id` と event id による dedup を追加。
  - warn severity を保持し、bucket は `classifyFeedbackBucket` に集約。
- `src/state-db/feedback-projections.ts`
  - projection される `feedback_events` で warn/fail severity を保持。
- `src/feedback/engine.ts`
  - `ut-tdd feedback list --emit` 経路でも warn/fail severity を保持。
- `tests/feedback-surface.test.ts`
  - open event 表示、closed 非表示、dedup、refactor warn actionable、limit を固定。
- `tests/search-feedback.test.ts` / `tests/projection-writer.test.ts`
  - emit / projection の severity 保持を固定。

## 5. DoD

- [x] takeover surface が open な `feedback_events` の actionable 行を出す。
- [x] closed `feedback_events` は takeover surface に出ない。
- [x] high-confidence warn (`refactor_candidate:*`) は telemetry の count だけでなく actionable として出る。
- [x] `feedback_events` と source table の二重表示を避ける。
- [x] display limit / dedup による過剰 surfacing 抑制が維持される。
- [x] `ut-tdd session start` の bucket 分類は PLAN-L7-137 taxonomy と整合する。

## 6. Verification

- `bun run vitest run tests\feedback-surface.test.ts tests\search-feedback.test.ts tests\projection-writer.test.ts --reporter=dot`
- `bun run typecheck`
