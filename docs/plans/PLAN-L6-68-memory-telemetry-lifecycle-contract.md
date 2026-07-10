---
plan_id: PLAN-L6-68-memory-telemetry-lifecycle-contract
title: "PLAN-L6-68 (add-design): memory 昇格 nudge と telemetry lifecycle 契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L5-15-feedback-lifecycle-physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - durable memory / telemetry 消化境界の設計"
  - role: se
    slot_label: "SE - session summary と feedback projection のread/write分離"
  - role: qa
    slot_label: "QA - TTL、source解消、memory書込み有無のoracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/memory.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/forced-stop-feedback.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-15-feedback-lifecycle-physical-data.md
  requires:
    - docs/plans/PLAN-L5-15-feedback-lifecycle-physical-data.md
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  references:
    - docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    - docs/plans/PLAN-REVERSE-392-memory-promotion-digest-backfill.md
review_evidence:
  - reviewer: codex-subagent-lifecycle-final-gate
    review_kind: intra_runtime_subagent
    reviewer_model: gpt-5
    reviewed_at: "2026-07-10T14:48:10+09:00"
    tests_green_at: "2026-07-10T14:47:21+09:00"
    verdict: approve
    scope: "PLAN-L6-68最終contract review。memory nudge、Codex/Claude PostToolUse、TTL、source解消、recurrence generation、fail-open境界をL7 oracleと照合し、新規P0/P1なし。"
    green_commands:
      - kind: typecheck
        command: "bunx tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T14:34:26+09:00"
        evidence_path: src/runtime/memory-promotion.ts
        output_digest: "sha256:29d9ad53a8723fc5208e71dea855880d38d10e79178678a189976d5bb50e891e"
        anchor_commit: 4e871bc3bf3dc532e44c674b65f1b39c357138f0
      - kind: unit_test
        command: "bunx vitest run tests/feedback-lifecycle.test.ts tests/session-log.test.ts tests/feedback-surface.test.ts tests/dependency-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:40:26+09:00"
        evidence_path: tests/session-log.test.ts
        output_digest: "sha256:c7d9e0c7d3ab16958412ed2d5507dcb67972dee97568e72c3ac9470391e2d359"
        anchor_commit: 58fb20bfe4ccbeacba139e86f60fe4e3aab3dfa5
      - kind: unit_test
        command: "bunx vitest run tests/feedback-lifecycle.test.ts tests/coding-rules.test.ts tests/plan-completion-drift.test.ts tests/review-evidence.test.ts tests/backfill-pairing.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:47:21+09:00"
        evidence_path: tests/feedback-lifecycle.test.ts
        output_digest: "sha256:b8d956203873d0efee1d8a26584c1c62debdc4b790535de97db8d94a96c61f69"
        anchor_commit: 45da3df21e7b7cf69c44b2569dc5ca31685eee26
---

# PLAN-L6-68: memory 昇格 nudge と telemetry lifecycle 契約

> ZIP比較根拠: `Vモデル設計ドキュメント_checked.zip`（SHA-256
> `47b9a900ac99e093a1750f68f34c00e3bbd78c13a070d57dcdaba9ae50a274a8`）の
> `signals` / handover / `agent.done_when`を、HARNESS正本のStop/session/feedback契約へ翻訳する。
> ZIP側のPython実装やL1-L12番号は移植しない。

## Gap

memory は durable knowledge のauthoring/projectionを持つが、sessionにcommitまたはPLAN遷移が
あったのにmemoryが書かれなかったことを検出する契約を持たない。feedback_eventsも投影ごとに
openを再生成するため、telemetryを直接削除/更新すると投影正本と監査履歴が衝突する。

## 設計方針

1. Stop summaryはsession内のcommit/plan_switchとmemory writeだけを照合し、前者あり・後者なしの時に
   `memory_promotion_missed` telemetry candidateをbest-effortで記録する。memory本文やgit差分は読まない。
2. feedback eventのsource projectionと消化状態を分離する。telemetryはTTL後にack可能だが、gate/actionableは
   TTLで消さず、source解消時だけclosed/supersededにする。全遷移はtimestamp/reasonを監査可能に残す。
3. 消化済みtelemetryをprojectionが勝手にopenへ戻さず、同一sourceの新観測だけが新generationを作る。
4. DB不在・lock・破損はStop/SessionStartを止めない。nudgeはwarnのみでmemory書込みを強制しない。

## 降下

PLAN-L7-392はnudge、TTL/auto-ack、feedback surfaceの流量表示を実装する。PLAN-L7-246はsource解消と
世代交代のclose、actionable routingを実装する。両者は同じlifecycle recordを共有し、固定4段digestを再実装しない。
