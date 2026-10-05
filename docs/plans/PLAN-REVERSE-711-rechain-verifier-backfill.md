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
  receipt_id: certificate:d33ed5411395d752b093e4ce51180a1e
  command_id: plan-draft:issue-711:rechain-verifier:reverse:1
  admitted_at: 2026-10-05T09:49:09.830Z
  source_digest: sha256:770579f31d7a1bf9575c1b1c1744d9726a897f47479a071ed87b30cfd7df1b15
  decision_digest: sha256:b85321f68626c44d62612c1381e6ddbda01e63f2c21a2d0c697b13539675ad79
  receipt_digest: sha256:f5315309026b33b6f583b78163def5b9d0088311eb23ca8146b7dcb262247b39
  binding:
    path: docs/plans/PLAN-REVERSE-711-rechain-verifier-backfill.md
    plan_id: PLAN-REVERSE-711-rechain-verifier-backfill
    asset_id: plan:d33ed5411395d752b093e4ce51180a1e
    revision: 1
    content_digest: sha256:770579f31d7a1bf9575c1b1c1744d9726a897f47479a071ed87b30cfd7df1b15
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
  escape_reason: "Issue #711: PLAN-L7-711 の re-chain 検証器 (S2) 実装を PLAN-L6-711 §2.3
    / §2.6 へ逆向き照合する Reverse 対の R0 起票。"
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
| `verifierDigest` (§2.6) | domain separator を版付きで固定し、v2 を使う (U-RECHAIN-016) | R2 で照合 |

## R3 gap

- G1: §2.6 は domain separator を「版付き」と定めるが、現行の版番号を本文に書いていない。v2 の採用が意味変更でないことを R4 で判断する。

## R4 routing

G1 は gap-only とし、L6-711 の意味を変えない。版番号の明記が必要と判定した場合は、L6-711 の add-design 改訂として別に起票する。
