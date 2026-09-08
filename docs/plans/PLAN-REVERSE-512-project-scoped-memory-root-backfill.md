---
plan_id: PLAN-REVERSE-512-project-scoped-memory-root-backfill
title: "PLAN-REVERSE-512: project-scoped Memory root backfill"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
confirmed_reverse_type: design
created: 2026-08-26
updated: 2026-09-08
owner: PO / TL
parent_design: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
pair_artifact: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
agent_slots:
  - role: qa
    slot_label: QA - exact HEADでisolationとmigration mutationを再検証する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
review_evidence:
  - reviewer: codex-tl-integration
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-09-08T06:57:32.141Z
    tests_green_at: 2026-09-08T06:55:46.693Z
    verdict: R1 observed implementation; PASS blocking 0; Claude Opus non-author
      closing review pending
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: codex
    plan_revision: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
    subject_head: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
    anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
    evidence_path: tests/claude-memory-wake.test.ts
    scope: "Issue #528 / PLAN-L7-512 Slice 3 のR1観測。publisher-owned binding sidecarを
      production consumer guardへ接続し、Memory/review compositionとU-PMEMROOT-007を
      exact implementation commitで確認した。Slice 4/5、#439、Bun laneは未実装のため
      R2以降へ繰り越す。Opus non-author closing reviewとcanonical merge receiptは未取得。
      rootは24126d45のsnapshot終了コード0を確認済み。本改訂の時刻は証跡再確認時刻であり、実行終了時刻の再構成ではない。
      CI指摘のmax-source-paramsをオブジェクト引数化で是正。HEAD 6ce594c2でsnapshot 3 files/9
      passed/37 skipped、reference検証・cleanupを含むexit
      0を06:54:47.721Zに確認。旧時刻欠落entryは本実測で置換し、過去履歴はarchive refに保存。closing未実施。"
    citations:
      - "docs/test-design/harness/L7-project-scoped-memory-root-test-design.md:
        U-PMEMROOT-007"
      - src/runtime/claude-provider-envelope.ts
      - src/runtime/claude-memory-wake.ts
      - 89de38593e0a5264480ed5b305c1718bdc3b89b6
    green_commands:
      - kind: integration_test
        command: 'node scripts/run-vitest-snapshot.ts tests/claude-memory-wake.test.ts
          tests/claude-memory-terminal-gc.test.ts
          tests/runtime-hook-entrypoints.test.ts -t
          "PMEMROOT-007|U-RVATT-025|U-MEMTERM-001|U-MEMTERM-003|U-MEMWAKE-001補遺|U-MEMWAKE-007:
          CLI hook delivers" --pool=forks --reporter=dot'
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-08T06:54:47.721Z
        evidence_path: tests/claude-memory-wake.test.ts
        output_digest: sha256:38c98a6ff2f2983a5e1725fd928369f6e7d780dfa7db2d2d547482a287f9de4e
        anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
      - kind: typecheck
        command: node node_modules/typescript/bin/tsc --noEmit --pretty false
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-08T06:55:46.693Z
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: sha256:357a451c5b7c3db96ef728aed9a202762618476b23a63b338365ed72bece9cf4
        anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
      - kind: lint
        command: node node_modules/@biomejs/biome/bin/biome check
          src/runtime/claude-provider-envelope.ts
          src/runtime/claude-memory-wake.ts tests/claude-memory-wake.test.ts
          tests/runtime-hook-entrypoints.test.ts
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-08T06:55:43.328Z
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: sha256:357a451c5b7c3db96ef728aed9a202762618476b23a63b338365ed72bece9cf4
        anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
workflow_phase: R1
status: draft
github_issue_id: 528
admission_receipt:
  schema_version: v2
  receipt_id: certificate:b144dbc4071397e7a08e6c3d2890df13
  command_id: command:issue528-PLAN-REVERSE-512-project-scoped-memory-root-backfill-measured-evidence-r4
  admitted_at: 2026-09-08T06:57:32.337Z
  source_digest: sha256:26af6d2a049206593f61fe4cc118a663ddf6d5a3bb73331101400c68b11aaefb
  decision_digest: sha256:c19d176832c0590480ff8dbd004653dd6bd9d9e3acb78c2a21b33a725ce88a1c
  receipt_digest: sha256:235d05611522f192059eb3cdc878cce26f107d3e08d139d9a71b979373a5748c
  binding:
    path: docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    plan_id: PLAN-REVERSE-512-project-scoped-memory-root-backfill
    asset_id: plan:legacy:186048a954aa8dae7b4f8b1f968f6c5d64d758850fa695ed59a11edcdcf63153
    revision: 4
    content_digest: sha256:26af6d2a049206593f61fe4cc118a663ddf6d5a3bb73331101400c68b11aaefb
  route:
    signal: design_gap
    mode: reverse
  issue:
    provider: github
    issue_id: 528
    episode_id: E4-528-project-memory-envelope-reverse
    projection_digest: sha256:218a5a56c4c720bac923f795c4b973f7d592159f75305a8ee1e39121403e10bf
  origin:
    plan_id: PLAN-L7-512-project-scoped-memory-root
    revision: 4
    digest: sha256:01416a9390b1c135ada280e088d68acaa668c5ca75a3a77a9a9ec93557a42d26
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-512-project-scoped-memory-root
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #528 current implementation snapshot evidence and
    completion timestamp repair"
---

# PLAN-REVERSE-512

## Prior R0

## R1: Issue #528 Slice 3 observed implementation

Forward trace: `PLAN-L7-512 §3 Slice 3 → Issue #528 → 89de38593e0a5264480ed5b305c1718bdc3b89b6
→ provider envelope / wake publisher-consumer guard / review-live + hook composition`。

実装前の旧状態では、v4 consumerへhook引数から期待値を注入しない限り配送を成立させられず、
publisherとconsumerの独立したbinding authorityも存在しなかった。R1では、publisherが
entry IDに対してcreate-exclusiveなbinding sidecarを保存し、consumerがそのsidecarを読み、
project・memory・operation・producer・target・digestを再検証する実装へ変更した。
U-PMEMROOT-007はsemantic axisごとの変異、coherent envelope/id/filename spoof、
production compositionを対象に、typed deny、claim/write 0、entryとsidecar保持を確認した。
review-liveも同じguardを通り、terminal claim後だけsidecarをcleanupする。

R1の観測結果は実装candidateであり、Opus non-author closing review、R2の独立mutation全体、
R3のclean Pack・二worktree・二provider・別project検収、R4の上位契約再合流は未完了である。
legacy v2/v3 entryの移行・旧root inventoryはSlice 4境界としてtyped pending/denyに残し、
Pack parityはSlice 5へ繰り越す。

旧計画: Forward契約のpair-freeze中。freeze後の実装PRでR1へ移りcandidateを正式oracleへ昇格し、
R2でproject/root/envelope/migrationを独立変異、R3でclean Pack・二worktree・二provider・別projectを
aggregate検収し、R4で上位契約へ再合流する。
