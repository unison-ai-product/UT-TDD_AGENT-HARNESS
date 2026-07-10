---
plan_id: PLAN-L5-15-feedback-lifecycle-physical-data
title: "PLAN-L5-15 (add-design/physical-data): feedback source generation / lifecycle 物理設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - source projection と durable lifecycle の物理境界"
  - role: se
    slot_label: "SE - generation key / append-only log / SQLite index 設計"
  - role: qa
    slot_label: "QA - rebuild、TTL、再観測、fallback 抑止の結合 oracle"
generates:
  - artifact_path: docs/plans/PLAN-L5-15-feedback-lifecycle-physical-data.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L5-01-physical-data.md
  requires:
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
  blocks:
    - docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
  references:
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
review_evidence:
  - reviewer: codex-subagent-lifecycle-final-gate
    review_kind: intra_runtime_subagent
    reviewer_model: gpt-5
    reviewed_at: "2026-07-10T14:48:10+09:00"
    tests_green_at: "2026-07-10T14:47:21+09:00"
    verdict: approve
    scope: "PLAN-L5-15最終design/pair review。source generation、append-only lifecycle、DB-only遷移禁止、L5↔L8 IT-FLC、ZIP比較evidence、batch初回rebuildを確認し、新規P0/P1なし。"
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint docs\\plans\\PLAN-L5-15-feedback-lifecycle-physical-data.md docs\\plans\\PLAN-L6-68-memory-telemetry-lifecycle-contract.md docs\\plans\\PLAN-L7-392-memory-promotion-handover-digest.md docs\\plans\\PLAN-REVERSE-392-memory-promotion-digest-backfill.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:34:39+09:00"
        evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
        output_digest: "sha256:e3f5d37315e7b90515646ff61c0f20fcdc4d40a6a8bffdcf8223c09259387abc"
        anchor_commit: 4e871bc3bf3dc532e44c674b65f1b39c357138f0
      - kind: integration_test
        command: "bunx vitest run tests/feedback-lifecycle.test.ts tests/session-log.test.ts tests/feedback-surface.test.ts tests/dependency-drift.test.ts tests/rule-drift.test.ts tests/runtime-hook-entrypoints.test.ts tests/codex-hook-adapter.test.ts tests/project-hook.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:40:26+09:00"
        evidence_path: tests/session-log.test.ts
        output_digest: "sha256:c7d9e0c7d3ab16958412ed2d5507dcb67972dee97568e72c3ac9470391e2d359"
        anchor_commit: 58fb20bfe4ccbeacba139e86f60fe4e3aab3dfa5
      - kind: integration_test
        command: "bunx vitest run tests/projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T14:30:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:11d201a3f160069718d7c39cbceffa7cd52be968547b26a1c34b7bcba96a11fd"
        anchor_commit: 4e871bc3bf3dc532e44c674b65f1b39c357138f0
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

# PLAN-L5-15: feedback source generation / lifecycle 物理設計

## §0 役割

`feedback_events` は finding / quality signal / artifact progress / hook event から再構築できる観測値、
`feedback_lifecycle` は人間または時間経過による消化状態を失わない append-only 履歴とする。本PLANは、
projection rebuild が消化済みsignalを再openする問題を、source generationを明示する物理設計で解消する。

## §0.1 ZIP比較根拠

比較入力は `Vモデル設計ドキュメント_checked.zip`（SHA-256
`47b9a900ac99e093a1750f68f34c00e3bbd78c13a070d57dcdaba9ae50a274a8`、624 entries、
設計書109種）である。ZIPの`signals` / `schedule --live` / handover / `agent.done_when`は、
実行結果を次工程へ還流しつつ判断済みsignalを無限再掲しない運用を前提にする。HARNESSではPython
toolchainを移植せず、repo正本のL5物理設計とTypeScript/Bun projectionへgeneration/lifecycle契約を翻訳する。
ZIPは比較evidenceでありauthoring sourceへ昇格しない。

## §1 物理契約

- `feedback_events.source_generation` は source table/id と意味状態から決定論的に生成し、時刻だけの差で変えない。
- `.ut-tdd/logs/feedback-lifecycle.jsonl` は lifecycle authoring sourceであり、DB tableは再構築可能なprojectionとする。
- lifecycle keyは `(feedback_event_id, source_generation)`。同一generationの`ack/closed/superseded`は再openしない。
- source消滅は`closed`、同一event IDの意味変更は旧generationを`superseded`として新generationを`open`にする。
- takeover surfaceはcurrent generationの最新transitionだけを採用し、terminal eventのsourceをfallback再合成しない。
- telemetryだけをTTL ack対象にし、gate/actionableはsource解消まで残す。

## §2 DoD

- [x] physical-dataに両table、generation、index、authoring/projection境界がある。
- [x] L8にrebuild、TTL、generation交代、source解消、fallback抑止の結合oracleがある。
- [x] L6/L7が本物理設計を親として降下し、detector都合でstateを創作しない。
- [x] DB不在/lock/破損時もhookはfail-openだが、正常書込時の遷移欠落はtestでfail-closeする。
