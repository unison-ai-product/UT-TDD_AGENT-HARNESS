---
plan_id: PLAN-L7-369-db-currency-doctor-gate
title: "PLAN-L7-369 (refactor): db-currency doctor gate"
kind: refactor
layer: L7
drive: db
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Internal doctor / harness.db gate responsibility split. This separates stale on-disk DB currency from registration integrity without changing product requirements, external setup behavior, or persisted schema."
created: 2026-07-07
updated: 2026-07-07
owner: Codex
parent_design: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - db-currency gate slice"
  - role: qa
    slot_label: "Explorer - stale DB responsibility split"
generates:
  - artifact_path: docs/plans/PLAN-L7-369-db-currency-doctor-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/db-currency.ts
    artifact_type: source_module
  - artifact_path: src/doctor/process-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/state-db/drive-registration.ts
    artifact_type: source_module
  - artifact_path: tests/db-currency.test.ts
    artifact_type: test_code
  - artifact_path: tests/drive-db-registration.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor-process-quality.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  requires: []
  references:
    - src/state-db/drive-registration.ts
    - src/lint/drive-db-registration.ts
    - src/doctor/check-registry.ts
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T11:38:00+09:00"
    tests_green_at: "2026-07-07T11:37:00+09:00"
    verdict: approve
    scope: "永続 harness.db の plan_registry 件数/fingerprint stale を db-currency doctor gate として分離し、drive-db-registration は stale persisted DB を memory rebuild へ fallback する責務分離 slice。Stop hook 自動 rebuild と token ingest 統合は PLAN-L7-365 umbrella に残す。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\db-currency.test.ts tests\\drive-db-registration.test.ts tests\\doctor-process-quality.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T11:33:00+09:00"
        evidence_path: tests/db-currency.test.ts
        output_digest: "sha256:a77aad990773fab9b813c07859eacb090b9d44972e2a32b4757e9ed1e050e6bf"
        anchor_commit: 0d8c635f1bb91483055d5f9e7c1fafb7d767e034
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T11:35:00+09:00"
        evidence_path: src/doctor/check-registry.ts
        output_digest: "sha256:d51002e385230c1c10f4b1d7bba27b241fd858746db55ad63757bdbdeda8e642"
        anchor_commit: 0d8c635f1bb91483055d5f9e7c1fafb7d767e034
      - kind: lint
        command: "bunx biome check docs\\plans\\PLAN-L7-365-harness-db-currency-hook.md docs\\plans\\PLAN-L7-369-db-currency-doctor-gate.md src\\lint\\db-currency.ts src\\state-db\\drive-registration.ts src\\doctor\\process-quality.ts src\\doctor\\check-registry.ts src\\doctor\\index.ts tests\\db-currency.test.ts tests\\drive-db-registration.test.ts tests\\doctor-process-quality.test.ts tests\\doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T11:35:00+09:00"
        evidence_path: src/state-db/drive-registration.ts
        output_digest: "sha256:00e90f0deefaa9497c6b6e80234f7d0c6ab96e4912ab5d28b7f423d494d3446d"
        anchor_commit: 0d8c635f1bb91483055d5f9e7c1fafb7d767e034
---

# PLAN-L7-369 (refactor): db-currency doctor gate

## 背景

`drive-db-registration` は既存の永続 `.ut-tdd/harness.db` を読むため、PLAN 文書変更後に DB が stale
だと登録整合の問題と DB 鮮度の問題が同じ gate に混ざって見えていた。

## 実装

- `src/lint/db-currency.ts` を追加し、on-disk DB の missing / stale plan count / stale fingerprint を
  独立した `db-currency` result として表現する。
- `doctor` の full profile に `db-currency` を登録し、`drive-db-registration` の直後に表示する。
- `loadOrBuildDriveDbRegistrationStats()` は persisted DB が stale な場合に `:memory:` rebuild 結果へ
  fallback する。これにより registration 整合と on-disk currency の責務を分離する。

## DoD

- [x] `db-currency` が missing DB / stale count / stale fingerprint を fail-close する。
- [x] `doctor` full profile に `db-currency` が含まれる。
- [x] `drive-db-registration` は stale persisted plan registry に引きずられず memory rebuild で登録整合を評価する。
- [x] 局所テスト、Biome、typecheck が green。
