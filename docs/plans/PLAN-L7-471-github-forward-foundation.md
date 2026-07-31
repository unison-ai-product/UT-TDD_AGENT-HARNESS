---
plan_id: PLAN-L7-471-github-forward-foundation
title: "PLAN-L7-471 (impl): GitHub Forward Project・binding・closure Foundation"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
created: 2026-07-31
updated: 2026-07-31
owner: Codex
parent_design: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: SE - Forward domain・SQLite projection・GitHub adapter
  - role: qa
    slot_label: QA - stale identity・closure custody・Project convergence oracle
review_evidence: []
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
status: draft
admission_receipt:
  schema_version: v2
  receipt_id: certificate:5e3651c92d0e10e531bacfab12ef4c06
  command_id: command:plan-l7-471-github-forward-foundation:2
  admitted_at: 2026-07-31T09:15:00.000Z
  source_digest: sha256:a199533898f537326b94eebe33bb7517522914f4e9d88e7e9a392462cb37802f
  decision_digest: sha256:d20bfeed80d52eb9788aa784be612482a20824ffdf9ba191dace34cc6b1319b4
  receipt_digest: sha256:019de04652fa82df765b2cac4e96f618654ff5198631035e2175c366b59de5d4
  binding:
    path: docs/plans/PLAN-L7-471-github-forward-foundation.md
    plan_id: PLAN-L7-471-github-forward-foundation
    asset_id: plan:5e3651c92d0e10e531bacfab12ef4c06
    revision: 1
    content_digest: sha256:a199533898f537326b94eebe33bb7517522914f4e9d88e7e9a392462cb37802f
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
- `state-db/github-review-lane-provenance.ts`: canonical PLAN frontmatterとDB rowを再照合するprovenance reader。
- `github/project-v2.ts`: Project V2 portと冪等reconciler。4項目以上の操作はinput objectで渡す。
- `github/repository-bindings.ts`: remote観測をtransaction前に完了し、検証済みbindingだけを原子的に保存するadapter。

依存方向は `github -> state-db -> kernel` とし、`state-db -> github`の逆参照を作らない。

## 3. closure契約

- provider object identityのPLAN/revision再割当とstale HEADへの後退を拒否する。
- merge closureはrepository syncだけが生成し、generic手動bindingでは生成しない。
- PR/main双方のrequired `harness-check`、Issue close、Project item、claim/spec-blind receipt digestが同じrevision/HEADへ揃うまで完了しない。
- canonical PLAN path外、DB row直接注入、自己digest不一致、review差替え後の旧receiptを拒否する。
- 完了済みmanaged Project itemもall-active同期に残し、remoteを最終状態へ収束させる。

## 4. TDD対

`docs/test-design/harness/L7-unit-test-design.md`の次を本PLANの対とする。

- `U-GHPROJ-001〜005`: dependency readinessとstatus-only completion拒否。
- `U-GHPROJ-010〜014`: rebuild、stale HEAD、identity custody、revision rollover。
- `U-GHPROJ-019〜025`: Project V2 dry-run、冪等apply、field drift、binding保存。
- `U-GHPROJ-030〜037`: 複数open PR、旧merge、closure receipt、canonical provenance。
- `U-GHBIND-001〜008`: repository lifecycle、transaction前I/O、merge closure条件。

## 5. 完了条件

- [ ] 上記unit oracleとD1回帰がgreen。
- [ ] coding-rules、dependency-drift、test-repository-isolation、impl-plan-traceがgreen。
- [ ] Linux / Windows CIが同一exact HEADでgreen。
- [ ] Codex/Tera高度検証とClaude Opus cross-provider closing reviewがPASS系。
- [ ] Reverse backfillでL5/L6へ実装事実を戻す。
