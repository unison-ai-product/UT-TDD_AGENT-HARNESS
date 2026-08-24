---
plan_id: PLAN-REVERSE-499-pack-publication-manifest-v2-backfill
title: "PLAN-REVERSE-499: Pack publication manifest v2 pure domain backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R4
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: confirmed
created: 2026-08-21
updated: 2026-08-24
owner: PM / PO / Codex
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_reason: "R3でL6-63の既存byte framing契約が実装を完全に包含すると確認し、新しい上流差分を検出しなかったため。"
parent_design: docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - manifest v2実装差分のL6 backfill判定"
  - role: qa
    slot_label: "QA - byte framingとUTF-8 canonicalityの独立mutation再検収"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-499-pack-publication-manifest-v2-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/380
review_evidence:
  - reviewer: codex-sol-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T11:42:30Z"
    tests_green_at: "2026-08-21T11:41:10Z"
    verdict: "R2 PASS blocking 0; R3 Claude Opus review pending"
    scope: "exact implementation HEAD 28cdb13858d20df26ca881cb8b73afed323c7974のsource/test、U-PACKPUB-001、test-design traceを再検収。"
    worker_model: "gpt-5.6-luna (Red scaffold) + codex-primary (Green/FLAG closure)"
    reviewer_model: gpt-5.6-sol
    plan_revision: 28cdb13858d20df26ca881cb8b73afed323c7974
    subject_head: 28cdb13858d20df26ca881cb8b73afed323c7974
    evidence_path: tests/release-manifest.test.ts
    anchor_commit: 28cdb13858d20df26ca881cb8b73afed323c7974
    citations:
      - "literal UTF-8 golden inventory/release digest"
      - "coordinated inventory mutation / lone surrogate fail-close"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/release-manifest.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T11:41:10Z"
        evidence_path: tests/release-manifest.test.ts
        output_digest: "sha256:9dbad2eeded8f6d237b41c6e84dcbee93d59a92ca2559ff0abc3fab983f7ed59"
        anchor_commit: 28cdb13858d20df26ca881cb8b73afed323c7974
  - reviewer: codex-sol-r3
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-24T01:38:57Z"
    tests_green_at: "2026-08-21T11:41:10Z"
    verdict: "R3 PASS blocking 0; lifecycle R4 correction required before closing"
    scope: "PR #382 exact HEAD 97d31462a3c6a974896bb3d705887dda21f0fd9bのmanifest v2 source/test、U-PACKPUB-001、PLAN/test-design/evidenceをclaim-blind/spec-blindで再検収。実装・oracle・CIはPASS。"
    worker_model: "gpt-5.6-luna (Red scaffold) + codex-primary (Green/FLAG closure)"
    reviewer_model: gpt-5.6-sol
    plan_revision: 97d31462a3c6a974896bb3d705887dda21f0fd9b
    subject_head: 97d31462a3c6a974896bb3d705887dda21f0fd9b
    evidence_path: tests/release-manifest.test.ts
    anchor_commit: 28cdb13858d20df26ca881cb8b73afed323c7974
    citations:
      - "tests/release-manifest.test.ts: U-PACKPUB-001 strict schema / literal UTF-8 golden / identity mutation / deep freeze"
      - "docs/test-design/harness/L7-unit-test-design.md: U-PACKPUB-001 / PLAN-L7-499 / #380"
      - "GitHub Actions run 32478953788 Linux / Windows / aggregate 3/3 Green"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/release-manifest.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T11:41:10Z"
        evidence_path: tests/release-manifest.test.ts
        output_digest: "sha256:9dbad2eeded8f6d237b41c6e84dcbee93d59a92ca2559ff0abc3fab983f7ed59"
        anchor_commit: 28cdb13858d20df26ca881cb8b73afed323c7974
---

# PLAN-REVERSE-499: manifest v2 pure domain backfill

## R1 / R2

- R1: exact implementation HEAD `28cdb13858d20df26ca881cb8b73afed323c7974`でsource/test/test-designを固定した。
- R2: strict schema、identity各軸、literal byte framing、UTF-8 canonicality、deep freezeを再検収した。
- canonical detached snapshotはexact HEADで14/14 Green、TypeScript、Biome、diff-checkもGreenである。

## Backfill判定

`PLAN-L6-63`はv2 exact shape、artifact ordering、mode禁止、inventory/release framingを既に固定している。
実装で新たに具体化したUTF-8 round-tripは、同PLANのcanonical UTF-8 byte framingを実現する検証であり、
上位契約の変更ではない。R3の非著者reviewでも追加のL6差分は検出されなかったため、R4は
`reuse-as-is`で既存L6-63へ合流する。

## R3 / R4

- R3: Codex Solの非著者claim-blind/spec-blind reviewは、schema、framing、identity、compatibilityの
  実装・oracleをPASS、blocking 0と判定した。97d31462で残った指摘はReverse lifecycleだけである。
- R4: `promotion_strategy: reuse-as-is`としてL6-63へ戻し、L7 test-designの`U-PACKPUB-001`と
  tested revision 28cdb138をForwardへ合流した。新しい上流契約やL6 backfillは追加しない。

tar生成、remote publication、channel CAS、rollback、Pack-only consumer E2Eは本Reverseの対象外である。
