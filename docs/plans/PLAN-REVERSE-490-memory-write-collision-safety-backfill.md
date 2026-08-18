---
plan_id: PLAN-REVERSE-490-memory-write-collision-safety-backfill
title: "PLAN-REVERSE-490: shared memory write collision safety の上流合流判定"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-08-18
updated: 2026-08-18
owner: Codex
parent_design: docs/plans/PLAN-L7-490-memory-write-collision-safety.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - memory identity契約を上流設計へbackfillするか判定する"
  - role: qa
    slot_label: "QA - 実装oracleと既存MemoryService契約の重複を検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-490-memory-write-collision-safety-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-490-memory-write-collision-safety.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/325
workflow_phase: R0
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-490: shared memory write collision safety の上流合流判定

## R0 観測証跡

Issue #325では、日本語のみのtitleだけでなく、句読点の正規化と同一titleの再試行も
同じsource pathへ収束し、無条件writeが既存本文を失わせる実測がある。既存の
PLAN-L7-189はMemoryServiceを唯一のwrite入口にしたが、identity collision時の不変条件は
明文化していない。

## 上流合流の問い

1. memory source pathのidentityを、共有memoryの基本設計へ追記する必要があるか。
2. 同一identityの再試行を冪等とし、内容差をfail-closeする契約をMemoryService一般条件へ
   backfillすべきか。
3. 過去memoryのrenameやDB migrationへ波及させず、今後のwriteだけを対象とする境界で十分か。

## Schedule

- R0 [完了]: #325の実測とPLAN-L7-189の未充足境界を記録する。
- R1 [実装後]: U-MEMORY-020/021の実測を既存L7契約と照合し、backfill_requiredまたは
  not_impactedを理由付きで判定する。
- R2 [必要時]: 必要な差分だけPLAN-L7-189と上流設計へ追記し、既存契約を重複させない。
- R3 [実装PR]: test citationと同じcommitでcandidateを正式U-IDへ昇格し、source pathと
  bytes不変の証跡を固定する。
- R4 [closing]: CI、cross-family review、Forward依存の影響を確認してPLAN-L7-490へ合流する。

## AC

- AC-1: 3つの問いを未判定のまま残さない。
- AC-2: 上流追記は必要な差分だけとし、既存MemoryService契約を複製しない。
- AC-3: R3の判定は実装テストのcitationを根拠にし、本文の自己申告をGreen根拠にしない。
