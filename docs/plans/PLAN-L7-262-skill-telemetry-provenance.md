---
plan_id: PLAN-L7-262-skill-telemetry-provenance
title: "PLAN-L7-262 (add-impl): skill telemetry の provenance 分離 + session_id 貫通 + 注入実績記録"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - provenance 分離設計 (auto-projection の扱い: 除外 or 別系列) レビュー"
  - role: se
    slot_label: "SE - projection 改修 + session_id 貫通 + 注入実績記録"
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/skill-projections.ts
    artifact_type: source_module
  - artifact_path: src/feedback/engine.ts
    artifact_type: source_module
  - artifact_path: src/skill-engine/recommend.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/skill-telemetry-provenance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-201-runtime-skill-telemetry-provenance.md
  requires: []
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/state-db/skill-projections.ts
    - src/state-db/runtime-projections.ts
    - src/cli.ts
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T20:27:00+09:00"
    tests_green_at: "2026-07-02T20:26:18+09:00"
    verdict: approve
    scope: "skill telemetry provenance 分離: metrics (projectSkillMetrics/computeSkillMetrics) は source LIKE 'runtime-hook:%' の実発火のみを数え、quality_signals source=skill-metrics:runtime で算出元を明示。session_id 空文字を全経路で廃止 (rebuild:indirect / UT_TDD_SESSION_ID / cli:unknown-session)。注入 injected/skipped を session jsonl skill_injection event へ記録。TL 初回 request-changes (正常系 skip の failures 混入) は同 slice で是正し追認 approve。skill_rating 系 (projectSkillEvaluations) はスコープ外として残存範囲を本文へ明記。codex provider 不能につき intra_runtime_subagent fallback。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/skill-telemetry-provenance.test.ts tests/projection-writer.test.ts tests/search-feedback.test.ts tests/session-log.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T20:26:18+09:00"
        evidence_path: tests/skill-telemetry-provenance.test.ts
        output_digest: "sha256:ed9153691945aae71ca89885584b471fd07546867a6d6f46c68d3e803a1f4692"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T20:26:18+09:00"
        evidence_path: src/state-db/skill-projections.ts
        output_digest: "sha256:d4dc1f06b71833491065fb7a7f0fdc8275186b4d4c3c73e0e38a7939d1541e52"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T20:26:18+09:00"
        evidence_path: src/runtime/session-log.ts
        output_digest: "sha256:be6bbbd9de16f2a037c25b05a0ce2f281dc524104e5af6951c85c2f2f364f667"
  - reviewer: codex-cli
    review_kind: cross_agent
    reviewed_at: "2026-07-02T23:08:00+09:00"
    tests_green_at: "2026-07-02T23:01:50+09:00"
    verdict: approve
    scope: "gpt-5.5 cross-runtime 監査 (session 019f2323)。初回 request-changes 所見 =「session_id 空文字を全経路で廃止」claim が projectSkillTelemetry / recommendSkillsForPlan の出力行を test oracle で覆っていない。是正: tests/skill-telemetry-provenance.test.ts へ両関数の出力行 session_id 非空 assert を追加 (7/7 green)。再レビューで approve、findings なし。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/skill-telemetry-provenance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T23:01:50+09:00"
        evidence_path: tests/skill-telemetry-provenance.test.ts
        output_digest: "sha256:ed9153691945aae71ca89885584b471fd07546867a6d6f46c68d3e803a1f4692"
---

# PLAN-L7-262 (impl): skill telemetry の provenance 分離

## Status

draft 起票 (A-178 G-8/G-9/G-11。PO 確定所見 2026-06-29「skill_invocations 全部 auto-projection・実発火 0」の構造是正)。

## 背景 — 偽装構造が未是正のまま増加

2026-07-02 実測:

- skill_invocations 1,850 件中 **1,840 件 (99.5%) が `auto-projection:review-evidence`** (rebuild 時の単一バースト間接推定、実発火でない)。実 runtime 発火 (`runtime-hook:skill-suggest`、PLAN-L7-201 経路) は 10 件のみ。
- `skill_firing_rate` / `skill_acceptance_rate` の feedback 355 件×2 は偽データから算出 — metrics が実使用を反映していない ([[feedback_coverage_not_substance]] の DB 実例)。
- skill_recommendations (2,195 件) / auto-projection invocations は全件 `session_id=""` (`skill-projections.ts:93,109`) で lifecycle と切断。
- `resolveSkillContextInjection` (`src/cli.ts:238-262`) は rebuild 失敗時に **silent undefined** — 注入されなかった事実が無記録のまま委譲続行 (柱 4 の実効性が検証不能)。

## スコープ

1. **provenance 分離**: auto-projection 行を実発火系列から分離 (provenance 列の必須化 + metrics 算出から除外、または別テーブル化)。firing/acceptance rate は runtime 発火のみから算出し、算出元 provenance を feedback payload に明示。
2. **session_id 貫通**: skill suggest/注入の実行時に現 session_id を記録 (hook_events と同じ貫通水準へ)。rebuild 由来の間接推定行は session 不明として明示 (空文字での偽装をやめる)。
3. **注入実績/失敗の記録**: `resolveSkillContextInjection` の注入成功 (required/optional 件数)・注入 skip (rebuild 失敗等) を session jsonl へ記録し projection で追跡可能に。silent fail-open は「握った事実の記録付き fail-open」へ。
4. 既存 1,840 件の扱い (削除 or provenance 再ラベル) は移行手順として明記し、監査値の改ざんにならない形 (再ラベル優先) を取る。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | provenance 分離設計 (TL、metrics 定義の変更含む) | 直列 |
| 2 | projection 改修 + session_id 貫通 | 直列 |
| 3 | 注入実績記録 + 既存行移行 | 直列 |
| 4 | regression test (metrics が runtime 発火のみを数える / 注入 skip が記録される) | 直列 |

## 実装 (2026-07-02)

- provenance 分離: `projectSkillMetrics` / `computeSkillMetrics` は `source LIKE 'runtime-hook:%'`
  の実発火のみを inv/acc に数える (`RUNTIME_SKILL_SOURCE_PREFIX`)。quality_signals の source は
  `skill-metrics:runtime` で算出元 provenance を明示。auto-projection 行は監査参照用に残す
  (別テーブル化でなく provenance 列 + metrics 除外方式、TL レビューで承認)。
- session_id 貫通: rebuild 由来行は `rebuild:indirect` を明示 (`REBUILD_INDIRECT_SESSION_ID`)。
  CLI/注入経路は `UT_TDD_SESSION_ID` env → 無ければ `cli:unknown-session` (`resolveRuntimeSessionId`)。
  空文字での偽装を全経路で廃止。全経路 claim のテスト裏付け (gpt-5.5 監査所見の是正、2026-07-02):
  `projectSkillTelemetry` の recommendations/invocations 出力行と `recommendSkillsForPlan` の
  出力行も `tests/skill-telemetry-provenance.test.ts` で非空 session_id を直接 assert
  (metrics/resolver/logging 経路のみだった oracle を出力行まで拡張)。
- 注入実績記録: `resolveSkillContextInjection` は injected (required/optional 件数) /
  skipped (rebuild-failed / no-matching-skills) を `recordSkillInjectionAttempt` で session jsonl
  へ記録 (event_type=skill_injection、silent fail-open を「記録付き fail-open」へ)。
- 注入 skip の failures 混入防止 (TL レビュー所見1): outcome=error は真の障害系 skip
  (reason が `*-failed`) のみ。`no-matching-skills` 等の正常系 skip は記録するが
  PlanDigest failures へ混入させない (test 固定)。
- 残存範囲の明示 (TL レビュー所見2): `projectSkillEvaluations` の adoption/success 集計は
  本 slice のスコープ外で、auto-projection 行が引き続き混入する。skill_rating 系の
  provenance 分離は後続 PLAN で扱う (本 PLAN の DoD は firing/acceptance のみ)。
- 既存 auto-projection 行の移行: skill 系テーブルは `db rebuild` の deterministic projection で
  全行再生成されるため、投影コードの provenance 是正 + 再投影が再ラベルそのもの
  (行削除なし、監査値の改ざんなし)。昇格: 本 PLAN は route_mode↔kind 台帳 (PLAN-L7-263) の
  draft debt から add-impl + PLAN-REVERSE-262 pairing へ昇格 (昇格実例第 2 号)。

## DoD

- [x] firing/acceptance rate が auto-projection を含まない (tests/skill-telemetry-provenance.test.ts で固定)
- [x] 新規 skill 推奨/注入に session_id が乗る (同上 + rankSkills session_id 実装)
- [x] 注入 skip (rebuild 失敗) が記録される (recordSkillInjectionAttempt test 固定)
