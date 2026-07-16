---
plan_id: PLAN-REVERSE-442-doctor-singleton-backfill
title: "PLAN-REVERSE-442: doctor singleton guard の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor 実行モデル (singleton/並列) の設計 back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-442-doctor-singleton-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-442-doctor-singleton-guard.md
  requires: []
  references:
    - docs/plans/PLAN-L7-442-doctor-singleton-guard.md
---

# PLAN-REVERSE-442: doctor singleton guard の設計 back-fill

## 状態

draft 起票 (PLAN-L7-442 の Reverse pairing、R0 メモ)。incident 由来の実装先行 (2026-07-16 メモリ枯渇) を
設計へ back-fill する。

## Back-Fill 候補

- doctor の実行モデル (singleton 前提、lock の advisory 位置づけ、stale 回収境界 45 分) を
  L6 function design (doctor 系 doc) へ 1 節追記する。
- agent 運用規約 (AGENTS.md / .claude/CLAUDE.md) へ「doctor が blocked (exit 2) の場合は完了を待つ、
  再試行嵐を起こさない」を追記する — **実施済み (2026-07-16)**: 両ファイルへ
  「Doctor Invocation Discipline (PLAN-L7-442)」節を追加 (exit 2 = 待つ / 起動形変更の再実行禁止 /
  scoped 実行優先)。

## DoD

- [ ] doctor 実行モデル (singleton + stale 回収) が設計 doc に記録される。
- [x] agent 運用規約 (AGENTS.md / .claude/CLAUDE.md) に doctor 再試行禁止規律が記録される (2026-07-16)。
