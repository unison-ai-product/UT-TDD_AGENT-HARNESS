---
plan_id: PLAN-REVERSE-498-pack-publication-manifest-v2-backfill
title: "PLAN-REVERSE-498: Pack publication manifest v2 pure domain backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R2
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-21
updated: 2026-08-21
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-498-pack-publication-manifest-v2-pure-domain.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - manifest v2実装差分のL6 backfill判定"
  - role: qa
    slot_label: "QA - byte framingとUTF-8 canonicalityの独立mutation再検収"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-498-pack-publication-manifest-v2-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-498-pack-publication-manifest-v2-pure-domain.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-498-pack-publication-manifest-v2-pure-domain.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/380
review_evidence:
  - reviewer: codex-sol-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T11:23:00Z"
    tests_green_at: "2026-08-21T11:25:11Z"
    verdict: "R2 PASS blocking 0; R3 Claude Opus review pending"
    scope: "exact implementation HEAD 4a93ee5054d367d7700e81eb20baecd3911c0005のsource/testとPACKPUB-001を再検収。"
    worker_model: "gpt-5.6-luna (Red scaffold) + codex-primary (Green/FLAG closure)"
    reviewer_model: gpt-5.6-sol
    plan_revision: 4a93ee5054d367d7700e81eb20baecd3911c0005
    subject_head: 4a93ee5054d367d7700e81eb20baecd3911c0005
    evidence_path: tests/release-manifest.test.ts
    anchor_commit: 4a93ee5054d367d7700e81eb20baecd3911c0005
    citations:
      - "literal UTF-8 golden inventory/release digest"
      - "coordinated inventory mutation / lone surrogate fail-close"
---

# PLAN-REVERSE-498: manifest v2 pure domain backfill

## R1 / R2

- R1: exact implementation HEAD `4a93ee5054d367d7700e81eb20baecd3911c0005`でsource/testを固定した。
- R2: strict schema、identity各軸、literal byte framing、UTF-8 canonicality、deep freezeを再検収した。
- canonical detached snapshotは5分timeoutで結果を得ていないためGreen件数に使わない。
- workspace-fence diagnosticは14/14 Green、TypeScript、Biome、diff-checkはGreenである。

## Backfill判定

`PLAN-L6-63`はv2 exact shape、artifact ordering、mode禁止、inventory/release framingを既に固定している。
実装で新たに具体化したUTF-8 round-tripは、同PLANのcanonical UTF-8 byte framingを実現する検証であり、
現時点では上位契約の変更ではない。R3でOpusがこの判定を攻撃し、追加の上流差分が実在する場合だけ
R4でL6へ追記する。

## R3 / R4

- R3: Claude Opus 5がclaim-blind/spec-blindでschema、framing、identity、compatibilityを攻撃する。
- R4: blocking 0なら`promotion_strategy: reuse-as-is`としてL6-63へ戻し、L7 test-designの
  `U-PACKPUB-001`とexact revisionをForwardへ合流する。blockingがあればsource/test/L6を同時是正する。

tar生成、remote publication、channel CAS、rollback、Pack-only consumer E2Eは本Reverseの対象外である。
