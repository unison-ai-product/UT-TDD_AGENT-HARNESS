---
plan_id: PLAN-L7-261-escalation-boundary-detector
title: "PLAN-L7-261 (impl): escalation boundary 変更検出器 (auth/payments/PII/destructive/infra、warn-first)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: po
    slot_label: "PO - escalation 対象領域 map の承認 (hard-gate 化は誤検知評価後に別途判断)"
  - role: tl
    slot_label: "TL - 対象 map 設計 (path/識別子/依存の宣言) と誤検知境界レビュー"
  - role: se
    slot_label: "SE - diff 照合検出器の実装"
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-261-escalation-boundary-detector.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/state-db/guardrail-invariants.ts
---

# PLAN-L7-261 (impl): escalation boundary 変更検出器

## Status

draft 起票 (A-178 G-4)。

## 背景

CLAUDE.md / .claude/CLAUDE.md / AGENTS.md の MUST 中核「auth / authorization / payments / PII / licenses / destructive data operations / production infrastructure / 外部 API 前提の変更前に escalate」に **検出器が一切無い** (src/lint 76 本・hook 全数を突合済み)。該当変更かどうかの判断が完全にエージェント自己判断で、判断ミスをどの機構も拾えない。柱 2 (document-first + 機械強制) の最大の例外領域。

guardrail 系の先行資産: `recordGuardrailDecision` (advisory ledger、PLAN-L7-239 で配線予定) / guardrail-invariants (option C = advisory、hard-gate は PO 留保)。本検出器はこの advisory 路線の入力源になる。

## スコープ

1. **対象領域 map (宣言的正本)**: escalation 対象を path パターン + 識別子 (関数/テーブル/設定キー) + 依存 (外部 API adapter) で宣言。ハーネス自身は決済等を持たないため、**consumer repo でも使える汎用 map 形式**にする (Pack 配布価値)。
2. **diff 照合検出器**: PostToolUse / doctor / review 時に changed paths を map と照合し、該当時「escalation 対象領域に触れている」と warn + guardrail ledger へ記録 (PLAN-L7-239 の `recordGuardrailDecision` と接続)。
3. **warn-first**: 自動 block はしない。誤検知率の実測後、hard-gate 化 (option A) は PO 判断 (guardrail-invariants の既存留保と整合)。
4. 検出器の発火実績を DB へ投影し、A-178 系の「発火しているが記録されない」を再生産しない。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 対象領域 map 設計 + PO 承認 | 直列 |
| 2 | diff 照合検出器 + ledger 接続 | 直列 |
| 3 | regression test + 誤検知率の初期実測 | 直列 |

## DoD

- [ ] map 該当 path の変更で warn + ledger 記録される (test 固定)
- [ ] 非該当変更で warn が出ない誤検知境界 (test 固定)
- [ ] hard-gate 化の判断材料 (誤検知実測) が記録される
