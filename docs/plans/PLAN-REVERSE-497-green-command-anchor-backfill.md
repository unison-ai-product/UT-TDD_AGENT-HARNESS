---
plan_id: PLAN-REVERSE-497-green-command-anchor-backfill
title: "PLAN-REVERSE-497: anchor 必須化契約の上流合流"
kind: reverse
layer: cross
drive: db
workflow_phase: R4
confirmed_reverse_type: design
forward_routing: gap-only
promotion_strategy: reuse-as-is
route_signal: reverse
route_mode: reverse
status: confirmed
created: 2026-08-21
updated: 2026-08-21
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-497-green-command-anchor-required.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - anchor 必須化を L6 review-evidence 契約へ backfill するかの判定"
  - role: qa
    slot_label: "QA - 既存 entry 全件通過と、2 つの violation reason の判別性を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-497-green-command-anchor-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/test-before-review.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-497-green-command-anchor-required.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-303-digest-commit-anchor.md
    - docs/plans/PLAN-L7-497-green-command-anchor-required.md
    - docs/design/harness/L6-function-design/test-before-review.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/191
review_evidence: []
---

# PLAN-REVERSE-497: anchor 必須化契約の上流合流

## 1. R1〜R2 対象

- `green_commands[].anchor_commit` が **記入必須項目**になったこと。L6 の review-evidence 契約は
  現在 anchor を任意項目として記述しており、実装との差が残る。
- 「発効時刻による段階導入」を採らない理由 (`completed_at` は自己申告値であり fail-close の判定入力に
  できない) を契約側へ残すこと。同型の段階導入が別 gate で再発するのを防ぐ。
- anchor の形式契約 (`^[0-9a-f]{7,40}$`、可変参照を認めない) の帰属先。
- anchor の**実在検査は含まない**という境界 (squash merge 運用では判定不能、実測 29 件の false
  positive で撤回)。実在検査は issue #367 の守備範囲であることを明示する。

## 1a. R2: 実装と上流契約の差分 (実測)

上流 L6 (`docs/design/harness/L6-function-design/test-before-review.md` §8) の
`GreenCommandEvidence` 型に **`anchor_commit` フィールドが存在しなかった**。一方 L7 実装
(`src/lint/review-evidence.ts`) は全 entry で anchor を必須とする。**上流設計が任意ですらなく
無記載、下流実装が必須**という差分であり、Reverse backfill の対象はこの 1 点である。

| 面 | backfill 前 | backfill 後 |
|---|---|---|
| L6 型 | `anchor_commit` 無し | `anchor_commit: string` (必須) |
| L6 invariant | anchor への言及なし | 全 entry 必須 + 段階導入不採用の理由 + 実在検査を含まない境界 |

## 1b. R3: 非著者判定

exact HEAD `47697062` に対する非著者 closing review が **FLAG (blocking 2)** を返し、
B1 として本差分 (「L6 は anchor 任意・実装は全 entry 必須で上流設計と矛盾」) を指摘した。
本 backfill はその是正である。R3 の指摘を受けて R4 を実施した順序であり、自己判定で
R4 へ進んでいない。

## 1c. R4: 戻した差分と、戻さなかったもの

**戻した**: `anchor_commit` の必須化、形式契約 (`^[0-9a-f]{7,40}$`、可変参照を認めない)、
段階導入を採らない理由 (`completed_at` は自己申告値で迂回可能)、実在検査を含まない境界。

**戻していない (意図的)**: L6 の `runner` union は `"bun" | "powershell" | "bash" | "ci"` で、
実装の `GREEN_COMMAND_RUNNERS` が持つ `"node"` を欠く。これは anchor とは独立した既存 drift で
あり、本 Reverse の scope 外とした (scope 拡張禁止)。**別途 backfill が必要**であり、ここに
記録して見失わないようにする。

## 2. R3〜R4

R3 では非著者 reviewer が、(a) 自己申告値を判定入力にしていないか、(b) 既存 entry を壊していないか、
(c) 実在検査を含まないという境界が文書と実装で一致しているか、を攻撃する。

R4 では実測で必要と判明した差分だけを `docs/design/harness/L6-function-design/test-before-review.md` へ
戻す (green_command の契約は同 §8 が所有する)。`green-command-digest` の二層照合契約 (`PLAN-L7-303`) は変更しない。
