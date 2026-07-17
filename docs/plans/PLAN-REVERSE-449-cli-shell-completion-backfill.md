---
plan_id: PLAN-REVERSE-449-cli-shell-completion-backfill
title: "PLAN-REVERSE-449: CLI シェルコンプリーション実装の backfill"
kind: reverse
layer: cross
drive: agent
status: draft
route_signal: drift
route_mode: reverse
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-07-17
updated: 2026-07-17
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-449-cli-shell-completion-impl.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 実装観測と L6-64 §4 freeze の gap-only backfill"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-449-cli-shell-completion-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-449-cli-shell-completion-impl.md
  requires: []
  references:
    - docs/plans/PLAN-L6-64-cli-shell-completion.md
    - docs/plans/PLAN-REVERSE-395-cli-command-design-backfill.md
  blocks: []
---

# PLAN-REVERSE-449: CLI シェルコンプリーション backfill

R0 で L7-449 実装 (extractor / completion command / PowerShell loader / 軽量分岐) を観測する。
R1-R3 で実装事実と PLAN-L6-64 §4 freeze・L7 unit test design の差分だけを記録し (gap-only)、
R4 で Forward 再合流条件を固定する。実装結果で設計を自動承認せず、freeze 外の新しい contract
(候補 metadata の追加・exit code 挙動の変更・対象 shell の拡張) は PLAN/ADR へ戻す。
REVERSE-395 の CLI 終了コード規約に対する `--list` carve-out (exit 0 + 空候補) が実装で正しく
維持されているかを R2 の照合点に含める。
