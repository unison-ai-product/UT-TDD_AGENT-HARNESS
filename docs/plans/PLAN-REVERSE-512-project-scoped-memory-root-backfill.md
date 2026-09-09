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
updated: 2026-09-09
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
github_issue_id: 544
admission_receipt:
  schema_version: v2
  receipt_id: certificate:062663a095941622b9d8025a1d16a8e2
  command_id: command:issue544-PLAN-REVERSE-512-memory-inventory-r5
  admitted_at: 2026-09-09T01:57:46.189Z
  source_digest: sha256:de2b706d6f3ac767969ec671e478c664a241dff33b24d24f13d28df62b7abf28
  decision_digest: sha256:57e57483326830add5b6441bb19d696790a7ee92237f7554eecfb6cce239b979
  receipt_digest: sha256:897d6c69bb08df0bf7c81c03a7ec67fb49fd5fc48374551b9ee360aedddb0025
  binding:
    path: docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    plan_id: PLAN-REVERSE-512-project-scoped-memory-root-backfill
    asset_id: plan:legacy:186048a954aa8dae7b4f8b1f968f6c5d64d758850fa695ed59a11edcdcf63153
    revision: 5
    content_digest: sha256:de2b706d6f3ac767969ec671e478c664a241dff33b24d24f13d28df62b7abf28
  route:
    signal: design_gap
    mode: reverse
  issue:
    provider: github
    issue_id: 544
    episode_id: E4-544-project-memory-inventory-reverse
    projection_digest: sha256:bea56244b34bd74d709278dcab8fb5fd50024b05be6edc9d61b6ec5123d3f450
  origin:
    plan_id: PLAN-L7-512-project-scoped-memory-root
    revision: 5
    digest: sha256:2fa93de53589a582491a7f22e72020c99a73cbe9120f303b3e85d7a67ba3f91a
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-512-project-scoped-memory-root
    target_revision: 5
    phase: forward_merge
  escape_reason: "Issue #544 Slice 4a inventory R1 evidence; R2 through R4 remain pending"
---

# PLAN-REVERSE-512

## Prior R0

## R1: Issue #544 Slice 4a observed implementation

Forward trace: `PLAN-L7-512 §3 Slice 4a → Issue #544 → efbdff94bddac6f058b58a5c61fec2e0750ac283
→ src/memory/project-memory-migration.ts → tests/project-memory-migration.test.ts`。

linked worktreeを含むMemory corpusをread-onlyでinventoryし、同一memory IDのvariantを
content digestで束縛して、unique / dedupe / conflictへ決定論的に分類する実装candidateを観測した。
実装前Redから、primary・linked worktree、順序非依存、同一内容重複、異内容conflict、
root外escape拒否を含む8件がGreenへ遷移した。

本R1はinventoryと分類だけを対象とする。canonical apply、quarantine transaction、
crash recovery、completion marker、clean Pack parity、R2の独立mutation、R3 aggregate、
R4の上位再合流、非著者closing reviewは未完了であり、本改訂はそれらを完了扱いしない。

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
