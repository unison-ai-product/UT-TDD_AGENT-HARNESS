---
plan_id: PLAN-REVERSE-711-rechain-verifier-backfill
title: "PLAN-REVERSE-711: re-chain 検証器 (S2) 実装の逆向き確認"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-10-05
updated: 2026-10-05
owner: Claude control lane (PLAN 起票) · Codex worker (S2 implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L6-711 §2.3 / §2.6 の判定規則と入力形の意味は変えず、 L7-711
  がその実装を所有するだけのため。S2 の実装で確定した事項 (verifierDigest の domain separator v2、
  intermediatePlans の key 集合、legacy bootstrap 経路の拒否) が契約本文と一致するかを R2 で照合し、差は R4
  で gap として routing する。
parent_design: docs/plans/PLAN-L7-711-rechain-verifier.md
agent_slots:
  - role: tl
    slot_label: 非著者 frontier reviewer - L6-711 と L7-711 の境界 (pure
      function・入力形・再導出の源) を逆向き検証する
  - role: qa
    slot_label: Codex worker - U-RECHAIN-016..018 の細分を L6-711 §4 の CANDIDATE と独立に照合する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-711-rechain-verifier-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-711-rechain-verifier.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/711
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/839
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 711
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0e927e07d6e67d5f360d2a5a2bba25c6
  command_id: plan-revise:issue-711:rechain-verifier:reverse:sol-r1-fix:r2:06027f9a1d28
  admitted_at: 2026-10-05T10:20:15.359Z
  source_digest: sha256:213ed9e06386f40dc2d0abdc3648e2f6548fd8290e822a380c02c64338b8cab7
  decision_digest: sha256:f9447e0d376614c79261665609b4cc29fcc518011b961d722cd1f40ec088506d
  receipt_digest: sha256:8991524df4decc6338404e6fc143fb6c918c0809f443d03b71e733b3aed4abae
  binding:
    path: docs/plans/PLAN-REVERSE-711-rechain-verifier-backfill.md
    plan_id: PLAN-REVERSE-711-rechain-verifier-backfill
    asset_id: plan:d33ed5411395d752b093e4ce51180a1e
    revision: 2
    content_digest: sha256:213ed9e06386f40dc2d0abdc3648e2f6548fd8290e822a380c02c64338b8cab7
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 711
    episode_id: E4-711-merge-time-receipt-rechain
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
    revision: 5
    digest: sha256:1fc671f67f150f9b3f19478b370ec781f973c41c9b544c086f6f8a5084d6fb39
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-711-rechain-verifier
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #711: PR #841 Sol r1 FLAG の是正。PLAN-L6-711 rev 5 §2.6 項 5 は
    domain separator v2 を既に明記しているため、R3 の gap G1 と R4 の改訂 routing を除去し、v2 は凍結済みで
    #839 の実装が一致するという照合結果に直す。"
---

# PLAN-REVERSE-711: re-chain 検証器 (S2) 実装の逆向き確認

## R0 対象

PLAN-L7-711 が所有する `verifyRechainDelta` (`src/plan-admission/rechain-verifier.ts`、PR #839) が、
上位契約 PLAN-L6-711 (receipt revision 5) の §2.2 / §2.3 / §2.6 に矛盾しないことを確認する。

## R1 観測 (PR #839 の source)

- `verifierDigest` の preimage は `ut-tdd.rechain-verifier.v2\n` + `stableJson(input)` である (`src/plan-admission/rechain-verifier.ts` の digest 関数)。
- `receipt_digest` は H の値を流用せず、正規 assembler (`src/plan-admission/plan-revision-command-assembler.ts`) の導出関数で再計算する。
- 検証器は Git / file system を読まない。入力は §2.6 の immutable な値だけである。

## R2 照合

| 上位の観点 | L7-711 の扱い | 判定 |
|---|---|---|
| 入力形 (§2.6) | `RechainInput` の形に束縛し、方式を追加しない | R2 で照合 |
| 判定規則 (§2.3-1〜5) | U-RECHAIN-001..007、011、014、015 で正系・負系を固定する | R2 で照合 |
| 再導出 (§2.3-6) | admission・`decision_digest`・`receipt_digest` を全て再導出し、許容項目だけを許す (U-RECHAIN-012 / 017) | R2 で照合 |
| 同一 asset 複数再発行 (§2.3-6) | base の連鎖と `intermediatePlans` の key 集合の完全一致 (U-RECHAIN-018) | R2 で照合 |
| `verifierDigest` (§2.6) | domain separator `ut-tdd.rechain-verifier.v2` を使う (U-RECHAIN-016) | 整合 (v2 は PLAN-L6-711 rev 5 §2.6 項 5 で凍結済みであり、#839 の実装はそれに一致する) |

## R3 gap

- なし。`verifierDigest` の domain separator `ut-tdd.rechain-verifier.v2` は PLAN-L6-711 rev 5 §2.6 項 5 が既に明記して凍結しており (receipt revision 4 で v1 から v2 に改版)、#839 の実装 (`src/plan-admission/rechain-verifier.ts` の digest 関数) はそれに一致する。

## R4 routing

R3 で gap が無いため、L6-711 への改訂 routing は行わない。
