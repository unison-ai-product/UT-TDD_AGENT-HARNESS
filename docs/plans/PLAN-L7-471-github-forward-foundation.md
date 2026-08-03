---
plan_id: PLAN-L7-471-github-forward-foundation
title: "PLAN-L7-471 (impl): GitHub Forward Project・binding・closure Foundation"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
created: 2026-07-31
updated: 2026-08-03
owner: Codex
parent_design: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: SE - Forward domain・SQLite projection・GitHub adapter
  - role: qa
    slot_label: QA - stale identity・closure custody・Project convergence oracle
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-08-03T02:48:00.000Z
    tests_green_at: 2026-08-03T02:46:55.000Z
    verdict: approve
    scope: claim-blind intra-runtime closing review。admission/outbox/base
      custodyの4攻撃を再導出しPASS。closing authorityはOpus cross-provider laneが担う。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-terra
    lane: claim-blind
    plan_revision: "2"
    subject_head: 5cacb2c5
    attack_trials: 4
    citations:
      - src/state-db/spec-ir-projections.ts:337
      - src/state-db/github-forward-projection.ts:86
      - src/github/repository-bindings.ts:101
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts <PR #210 changed test files>
          --reporter=dot"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: 2026-08-03T02:46:55.000Z
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: sha256:a603f560c0df9558cb5a333bfd81865c3396d04e6416038731f96b98c0e08236
        anchor_commit: 5cacb2c5
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: 2026-08-03T03:01:41.959Z
    tests_green_at: 2026-08-03T02:46:55.000Z
    verdict: approve
    scope: spec-blind closing review。未着手PLANの空HEAD field clearを含むProject
      apply契約を再確認しPASS。
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    lane: spec-blind
    plan_revision: "2"
    subject_head: 5cacb2c5
    attack_trials: 3
    citations:
      - src/state-db/github-forward-projection.ts:438
      - tests/github-forward-store.test.ts:320
      - src/github/project-v2.ts:369
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts <PR #210 changed test files>
          --reporter=dot"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: 2026-08-03T02:46:55.000Z
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: sha256:a603f560c0df9558cb5a333bfd81865c3396d04e6416038731f96b98c0e08236
        anchor_commit: 5cacb2c5
generates:
  - artifact_path: src/kernel/forward-readiness.ts
    artifact_type: source_module
  - artifact_path: src/kernel/github-closure-receipt.ts
    artifact_type: source_module
  - artifact_path: src/state-db/github-forward-projection.ts
    artifact_type: source_module
  - artifact_path: src/state-db/github-review-lane-provenance.ts
    artifact_type: source_module
  - artifact_path: src/github/project-v2.ts
    artifact_type: source_module
  - artifact_path: src/github/repository-bindings.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-github.ts
    artifact_type: source_module
  - artifact_path: tests/github-forward-readiness.test.ts
    artifact_type: test_code
  - artifact_path: tests/github-forward-store.test.ts
    artifact_type: test_code
  - artifact_path: tests/github-project-v2.test.ts
    artifact_type: test_code
  - artifact_path: tests/github-repository-bindings.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
  requires:
    - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
    - docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
  references:
    - docs/test-design/harness/L7-unit-test-design.md
  blocks: []
status: confirmed
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0018148d33b2f73ccdab25b5e2ffb96d
  command_id: command:pr210-status-confirmed-revision5:1785729317332
  admitted_at: 2026-08-03T03:55:17.333Z
  source_digest: sha256:0672c808e2c0fd91f07c3eead43b7684a3c4fe881f992f8ccc4359ad7342754c
  decision_digest: sha256:1ea1ca059209fbe6fcde0b72335c1ffa29beaec9a276abc7c26a9edbedc4cc0c
  receipt_digest: sha256:32aae123cdd9d3f69247060df4f8535c7dc41b9553b55a89cfdd74ee26a7bb3f
  binding:
    path: docs/plans/PLAN-L7-471-github-forward-foundation.md
    plan_id: PLAN-L7-471-github-forward-foundation
    asset_id: plan:5e3651c92d0e10e531bacfab12ef4c06
    revision: 5
    content_digest: sha256:0672c808e2c0fd91f07c3eead43b7684a3c4fe881f992f8ccc4359ad7342754c
  route:
    signal: forward
    mode: forward
---

# PLAN-L7-471: GitHub Forward Project・binding・closure Foundation

## 1. 目的と境界

既存のForward依存グラフを新しい正本へ複製せず、`harness.db`のschedule・dependency・review evidenceをGitHub Project V2へ再構築可能に投影する。Issue、branch、PR、check、review、mergeを同じPLAN revisionとexact HEADへ束縛し、statusだけで完了や後続解放を行わない。

本PLANはFoundationを所有する。D3 structured receipt producer、D2 SLA surface、D4再割当は後続であり、本PLANでは通知・hard merge gate・自動mergeを有効化しない。

## 2. オブジェクト・module設計

- `kernel/forward-readiness.ts`: 副作用を持たないForward readiness reducer。
- `kernel/github-closure-receipt.ts`: typed closure receiptとreview digestのcodec。
- `state-db/github-forward-projection.ts`: schedule、binding、Project、receiptを一つのDB snapshotで読むprojection repository。
- `state-db/github-review-lane-provenance.ts`: embedded admission receipt、tracked receipt hash chain、canonical content digestを共有照合し、legacyだけcanonical tokenを返すprovenance reader。
- `github/project-v2.ts`: Project V2 portと冪等reconciler。4項目以上の操作はinput objectで渡す。
- `github/repository-bindings.ts`: remote観測をtransaction前に完了し、検証済みbindingだけを原子的に保存するadapter。

依存方向は `github -> state-db -> kernel` とし、`state-db -> github`の逆参照を作らない。

## 3. closure契約

- provider object identityのPLAN/revision再割当とstale HEADへの後退を拒否し、repository-scoped compareでtrace base SHAがPR HEADの祖先または同一であることを確認する。
- merge closureはrepository syncだけが生成し、generic手動bindingでは生成しない。
- PR/main双方のrequired `harness-check`、Issue close、Project item、claim/spec-blind receipt digestが同じrevision/HEADへ揃うまで完了しない。
- canonical PLAN path外、DB row直接注入、partial/未追跡admission receipt、content digest不一致、review差替え後の旧receiptを拒否し、source hashをrevisionへ代用しない。
- 完了済みmanaged Project itemもall-active同期に残す。outboxはremote前にapplyingへatomic claimし、projection/binding保存とapplied化を同一transactionで行う。未着手PLANの空HEADはProject field clearとして許容する。

## 4. TDD対

`docs/test-design/harness/L7-unit-test-design.md`の次を本PLANの対とする。

- `U-GHPROJ-001〜005`: dependency readinessとstatus-only completion拒否。
- `U-GHPROJ-010〜015`: rebuild、stale HEAD、identity custody、revision rollover。
- `U-GHPROJ-019〜026`: Project V2 dry-run、冪等apply、field drift、binding保存。
- `U-GHPROJ-030〜038`: 複数open PR、旧merge、closure receipt、canonical provenance。
- `U-GHPROJ-039〜052`: revision、outbox CAS、admission custody、未着手HEAD clear。
- `U-GHBIND-001〜020`: repository lifecycle、transaction前I/O、base ancestry、merge closure条件。

## 5. 完了条件

- [x] 上記unit oracleとD1回帰がgreen。
- [x] coding-rules、dependency-drift、test-repository-isolation、impl-plan-traceがgreen。
- [x] Linux / Windows CIが同一exact HEADでgreen。
- [x] Codex/Tera高度検証とClaude Opus cross-provider closing reviewがPASS系。
- [x] Reverse backfillでL5/L6へ実装事実を戻す。
