---
plan_id: PLAN-REVERSE-505-pack-staged-release-rollback-backfill
title: "PLAN-REVERSE-505: Pack段階公開・rollback契約のL7 oracle backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: confirmed
created: 2026-08-25
updated: 2026-08-25
owner: PO / Codex
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_reason: "B-1〜B-4はPack公開のL6境界で完結し、requirements/L4/L5の既存契約を変更しないため。"
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - B-1〜B-4のL6契約と後続publication oracleの境界を確認する"
  - role: qa
    slot_label: "QA - inventory、receipt、FSM、supersede-forward rollbackの独立mutationを固定する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - PLAN-L7-494-release-promotion-rollback-gate
    - PLAN-L7-496-pack-independent-consumer-runtime
    - PLAN-L7-499-pack-publication-manifest-v2-pure-domain
    - PLAN-L7-500-pack-publication-assets-pure-domain
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/402
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
github_issue_id: 402
review_evidence:
  - reviewer: codex-tl-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-25T06:39:16Z"
    tests_green_at: "2026-08-25T06:39:16Z"
    verdict: "PRECHECK_ONLY; Claude Opus non-author closing review pending"
    scope: >-
      PLAN-L6-63のB-1〜B-4 closure、backprop_scope、CANDIDATE-PACKPUB-001〜004の1:1 trace、
      source/CLI/Pack remote mutation 非スコープを確認した。
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: gpt-5.6-sol
    plan_revision: 92df02a6da7be284699513c4d6c13c543e4ef282
    subject_head: 92df02a6da7be284699513c4d6c13c543e4ef282
    evidence_path: docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    citations:
      - "docs/test-design/harness/L7-unit-test-design.md: CANDIDATE-PACKPUB-001〜004"
      - "Issue #402: completion criteria and non-scope"
---

# PLAN-REVERSE-505: Pack段階公開・rollback契約のL7 oracle backfill

## R0 / R1: B-1〜B-4の逆向き確認

Issue #402 の pre-gateで観測されたB-1〜B-4を、`PLAN-L6-63`の既存契約を後続実装へ渡す
独立oracleへ分解した。L6の公開object、explicit artifact inventory、channel pointer、
append-only publication FSM、supersede-forward rollback、typed fail-close、consumer boundaryを
再定義しない。L7のmanifest v2/asset bytes、promotion gate、consumer runtimeの既存所有権も
再実装しない。

`CANDIDATE-PACKPUB-001`〜`004`はpublication aggregate/auditorの将来実装へ渡すRED候補である。
`U-PACKPUB-001`（manifest v2）と`U-PACKASSET-001`〜`006`（deterministic asset bytes）は既存の
L7所有であり、このReverseでは再採番・再所有しない。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | 既存のPack配布・consumer隔離要求を変更せず、公開時の操作境界をL6で具体化した。 |
| L4-basic-design | not_impacted | component責務、local staging、remote適用の境界を変更しない。 |
| L5-detailed-design | not_impacted | source/CLI/adapterの実行方式を追加せず、将来実装の入力契約だけを固定した。 |
| L6-function-design | not_impacted | L6 function-specの新規契約はPLAN-L6-63に閉じ、既存設計文書を直接変更しない。 |
| L7-unit-test-design | updated | B-1〜B-4をCANDIDATE-PACKPUB-001〜004へ1:1で降下し、将来U昇格の所有と非所有を明記した。 |

## Candidate crosswalk

| candidate | 対応 gap | 独立oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-001` | B-1 | 公開object、channel順序、FSM、receipt、rollback、scope boundaryが全て宣言され、欠落契約を成功へ丸めない。 |
| `CANDIDATE-PACKPUB-002` | B-2 | manifestの`artifacts[]`とdigestだけを入力にし、tree/walk/allowlist/worktree/Pack checkoutの追加・欠落・digest driftをfail-closeする。 |
| `CANDIDATE-PACKPUB-003` | B-3 | tag/Release/assets/pointer/promotion/rollbackの各操作にapproval receipt、before-state CAS、nonce/expiry、execution receipt、auditor観測を要求し、未承認remote writeを0にする。 |
| `CANDIDATE-PACKPUB-004` | B-4 | 公開済みobjectを削除・付替えせず、supersede-forward pointer CASだけを許可し、partial/indeterminate/rollback_failedを成功へ丸めない。 |

## R2〜R4の出口

後続publication aggregate/auditor実装では、各candidateを対応する`U-PACKPUB-*`へ1:1で昇格し、
独立したsource/test/CI citationを同じexact revisionへ束縛する。実装PRが行うのはpure decision、
injected remote port、auditorの検証だけであり、Pack remoteへの実操作、source/CLI変更、consumer E2Eは
このReverseの出口に含めない。

本PR時点ではR1 pair evidenceを記録し、Claude Opus non-author closing reviewとCIの最終receiptを
placeholderとして残す。review完了・実装Green・Pack公開完了・merge完了を先取りして主張しない。
