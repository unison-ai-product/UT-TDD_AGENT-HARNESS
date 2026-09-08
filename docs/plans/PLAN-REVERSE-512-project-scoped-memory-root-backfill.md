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
    reviewed_at: 2026-09-08T06:08:47.784Z
    tests_green_at: 2026-09-08T06:08:47.784Z
    verdict: R1 observed implementation; PASS blocking 0; Claude Opus non-author
      closing review pending
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: codex
    plan_revision: 24126d45e38451cd4df1a7481b37945678b403ea
    subject_head: 24126d45e38451cd4df1a7481b37945678b403ea
    anchor_commit: 24126d45e38451cd4df1a7481b37945678b403ea
    evidence_path: tests/claude-memory-wake.test.ts
    scope: "Issue #528 / PLAN-L7-512 Slice 3 のR1観測。publisher-owned binding sidecarを
      production consumer guardへ接続し、Memory/review compositionとU-PMEMROOT-007を
      exact implementation commitで確認した。Slice 4/5、#439、Bun laneは未実装のため
      R2以降へ繰り越す。Opus non-author closing reviewとcanonical merge receiptは未取得。
      rootは24126d45のsnapshot終了コード0を確認済み。本改訂の時刻は証跡再確認時刻であり、実行終了時刻の再構成ではない。"
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
        evidence_path: tests/claude-memory-wake.test.ts
        output_digest: sha256:ce28eaf0acf0040c129302d7395d3f8412f86da7ff2aae73d04de6e10b89eee8
        anchor_commit: 24126d45e38451cd4df1a7481b37945678b403ea
      - kind: typecheck
        command: npm exec -- tsc --noEmit
        runner: node
        scope: targeted
        exit_code: 0
        evidence_path: src/runtime/claude-provider-envelope.ts
        output_digest: sha256:2f5336275d1d08fbdf5120854901c27138540d44fb00a06aba3a269a2962cdd8
        anchor_commit: 24126d45e38451cd4df1a7481b37945678b403ea
      - kind: lint
        command: npm exec -- biome check src/runtime/claude-provider-envelope.ts
          src/runtime/claude-memory-wake.ts tests/claude-memory-wake.test.ts
          tests/runtime-hook-entrypoints.test.ts
        runner: node
        scope: targeted
        exit_code: 0
        evidence_path: src/runtime/claude-provider-envelope.ts
        output_digest: sha256:2f5336275d1d08fbdf5120854901c27138540d44fb00a06aba3a269a2962cdd8
        anchor_commit: 24126d45e38451cd4df1a7481b37945678b403ea
workflow_phase: R1
status: draft
github_issue_id: 528
admission_receipt:
  schema_version: v2
  receipt_id: certificate:e2ec6823bd7b2e1821077b8c3e49dbaf
  command_id: command:issue528-PLAN-REVERSE-512-project-scoped-memory-root-backfill-verified-evidence-r3
  admitted_at: 2026-09-08T06:08:47.993Z
  source_digest: sha256:acdb552b2c1bffd50ebd7cac99fe37200ba11ac8b1075451964844fafa11b7ef
  decision_digest: sha256:1d20c32ec9c1cbf4b5742b2bd3657b78354ccdc716730b2f5cceaeed4043a4e5
  receipt_digest: sha256:de30a162e85580fe79555db5b28244fb4a3cb42562b0fc4a6aa3259a547d2737
  binding:
    path: docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    plan_id: PLAN-REVERSE-512-project-scoped-memory-root-backfill
    asset_id: plan:legacy:186048a954aa8dae7b4f8b1f968f6c5d64d758850fa695ed59a11edcdcf63153
    revision: 3
    content_digest: sha256:acdb552b2c1bffd50ebd7cac99fe37200ba11ac8b1075451964844fafa11b7ef
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
    revision: 3
    digest: sha256:ed94d33b6879c4eded974aea8a22f537ef2dfda948d19c1172f68de4c1058674
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-512-project-scoped-memory-root
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #528 verified snapshot evidence and canonical oracle citation binding"
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
