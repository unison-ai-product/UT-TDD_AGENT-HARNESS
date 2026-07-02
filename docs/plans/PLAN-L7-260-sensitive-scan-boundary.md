---
plan_id: PLAN-L7-260-sensitive-scan-boundary
title: "PLAN-L7-260 (impl): 機密スキャン境界の拡張 (.ut-tdd/audit・logs・docs 全域)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - 検出パターン設計 (self-trigger 回避 + 誤検知境界) レビュー"
  - role: se
    slot_label: "SE - スキャン lint 実装 + pre-push 対象見直し"
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-260-sensitive-scan-boundary.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/export/document-export.ts
---

# PLAN-L7-260 (impl): 機密スキャン境界の拡張

## Status

draft 起票 (A-178 G-6)。

## 背景 — 監査証跡ディレクトリが検査の空白地帯

- pre-push の PII 検査対象は `*CLAUDE.md` / `*SKILL.md` / `*/references/*.md` の 3 パターンのみ。
- docexport redaction は docs/ の 6 正本 family のみ走査。
- **`.ut-tdd/audit/` と `.ut-tdd/logs/` (追跡・commit される監査証跡) はフリーテキスト機密 (氏名/住所/内部 URL/個人パス) の検査がゼロ** — 防波堤は pre-commit の API key regex のみ。A-1xx 監査レポートを量産する現運用と整合しない。

## スコープ

1. **スキャン lint (doctor 配下)**: `.ut-tdd/audit/`・`.ut-tdd/logs/` (追跡分)・docs/ 全域を対象に secret + フリーテキスト機密パターン (個人絶対パス含む) を検査。fail-close は secret 系、warn は PII 疑い系の二段階。
2. **self-trigger 回避設計**: 検出器を説明する doc がパターン素書きで自己発火した前例 ([[project_docexport_redaction_self_trigger]]) を踏まえ、trigger literal を持たない実装/テスト書式を最初に確定。
3. **pre-push 対象見直し**: protected markdown 3 パターン限定を lint と重複しない範囲で再定義 (push 側は最終防波堤、日常検査は doctor 側)。
4. 既存 tree の初回スキャン結果は棚卸しして例外台帳化 (grandfather を silent にしない)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | パターン設計 + self-trigger 回避書式の確定 (TL) | 直列 |
| 2 | スキャン lint 実装 + 初回棚卸し | 直列 |
| 3 | pre-push 見直し + regression test | 直列 |

## DoD

- [ ] `.ut-tdd/audit/` への機密混入が doctor で検出される (test 固定)
- [ ] 検出器自身の doc/テストが self-trigger しない (実走確認)
- [ ] 初回スキャンの既存ヒットが例外台帳で追跡される
