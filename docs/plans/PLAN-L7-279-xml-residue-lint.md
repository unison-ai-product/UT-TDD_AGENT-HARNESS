---
plan_id: PLAN-L7-279-xml-residue-lint
title: "PLAN-L7-279 (impl): XML 擬似ツール呼び出し残渣の検出 lint + 既存残渣の除去"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/ddd-tdd-rules.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 検出パターン設計 (self-trigger 回避 + 誤検知境界) レビュー"
  - role: se
    slot_label: "SE - 残渣検出 lint + 既存残渣の棚卸し・除去"
generates:
  - artifact_path: docs/plans/PLAN-L7-279-xml-residue-lint.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - docs/plans/PLAN-L6-37-skill-index-category.md
    - src/lint/readability.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-279 (impl): XML 擬似ツール呼び出し残渣の検出 lint

## Status

draft 起票 (A-180 S-1)。誠実な設計祖先 PLAN が無いため kind=impl で起票し **PLAN-L7-263 debt 台帳へ登載 (着手時昇格)**。back-fill 意図は PLAN-REVERSE-279 で保持。

## 背景 — 禁止規約の実害第 1 号が confirmed PLAN に landed

- `docs/plans/PLAN-L6-37-skill-index-category.md:212-213` に XML 擬似ツール呼び出しの残渣が付着したまま commit 済み (orchestrator 実読で確定)。confirmed PLAN の末尾が破損状態。
- `.claude/CLAUDE.md` Native Tool Invocation は「corrupted transcript residue を書くな/続けるな」と明示するが、**検出 lint が存在せず** (A-178 §1 #15 で prose のみと判定済み)、readability/freeze gate を素通りした。

## スコープ

1. **検出 lint (fail-close)**: docs/ + .ut-tdd/audit/ の tracked markdown に対し、XML 擬似ツール呼び出しの残渣パターン (invoke/parameter 系の閉じタグ等) を検出。**self-trigger 回避**: 検出パターンの literal を lint 自身の doc/テストに素書きしない設計を最初に確定 ([[project_docexport_redaction_self_trigger]] の教訓)。code fence 内の正当な引用は除外する誤検知境界。
2. **既存残渣の棚卸し・除去**: 全 tracked docs を初回スキャンし、L6-37 の残渣 (2 行) を含む既存ヒットを是正 (confirmed PLAN の本文修復は「破損の除去」として correction note を残す)。
3. doctor 配線 + regression test。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 検出パターン + self-trigger 回避設計 (TL) | 直列 |
| 2 | lint 実装 + doctor 配線 | 直列 |
| 3 | 初回棚卸し + L6-37 修復 (correction note) + test | 直列 |

## DoD

- [ ] 残渣を含む doc が doctor で fail する (test 固定、fixture は literal 素書き回避形)
- [ ] L6-37 の残渣が除去され correction note が残る
- [ ] lint 自身が self-trigger しない (実走確認)
