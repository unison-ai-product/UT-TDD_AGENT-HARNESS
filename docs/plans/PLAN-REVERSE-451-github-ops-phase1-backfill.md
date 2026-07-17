---
plan_id: PLAN-REVERSE-451-github-ops-phase1-backfill
title: "PLAN-REVERSE-451: GitHub 運用 Phase-1 (aggregate check / summary / PR trace / Issue Forms / policy 監査) の backfill"
kind: reverse
layer: cross
drive: be
status: draft
route_signal: drift
route_mode: reverse
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-451-github-ops-phase1-visibility-and-policy.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - GitHub ops phase-1 実装観測と L6-83/L6-85 契約への gap-only backfill"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-451-github-ops-phase1-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-451-github-ops-phase1-visibility-and-policy.md
  requires: []
  references:
    - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
  blocks: []
---

# PLAN-REVERSE-451: GitHub 運用 Phase-1 backfill

R0 で W1-W6 実装 (workflow aggregate 化 / ci-policy DAG 検査 / Job Summary /
typed PR trace contract / Issue Forms / repository policy 監査 CLI) を観測する。
R1-R3 で実装事実と上位契約の想定の差分だけを記録する (gap-only):

- PR trace block の項目語彙が PLAN-L6-85 の PR body 規定と一致しているか
  (先行実装が契約を狭めた/広げた箇所の照合)。
- Issue Forms の必須項目が PLAN-L6-83 の Issue 本文規定と一致しているか。
- policy.yaml の記述範囲が PO 採択 (段階適用: required harness-check /
  force-push 禁止 / bypass=PO、approval 系除外) を過不足なく表現しているか。
- L7-437 (issue projection inbound) 実装時に Issue Forms 経由の人間起票と
  Ledger 起点の自動起票が衝突しない導線になっているか (drift/command candidate
  扱いの原則維持)。

R4 で Forward 再合流条件を固定する。実装結果で L6 契約を自動改訂せず、
語彙の拡張・severity 変更は PLAN/ADR へ戻す。
