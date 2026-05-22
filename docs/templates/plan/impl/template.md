---
plan_id: PLAN-NNN-impl-slug
title: "PLAN-NNN: (実装タイトル placeholder)"
kind: impl
layer: L4
drive: be
status: draft
created: 2026-MM-DD
owner: PM (Opus)
agent_slots:
  - role: po
    slot_label: "PO — スコープ判断・受入承認"
  - role: tl
    slot_label: "TL — 設計レビュー・契約凍結"
  - role: se
    slot_label: "SE — 機能実装"
  - role: qa
    slot_label: "QA — テスト戦略・品質判定"
generates:
  - artifact_path: src/ut_tdd/<module>.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/tests/test_<module>.py
    artifact_type: test_code
  - artifact_path: docs/v2/L4-test-design/PLAN-NNN-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires: []
  blocks: []
related_adr: []
related_docs:
  - docs/governance/ut-tdd-agent-harness-requirements_v1.1.md
---

## §0 PLAN

実装対象タスクを最小差分で起票し、機械チェック・テスト・レビューまでを Plan テンプレート単位で再現可能な流れに定着させる。

## §1 目的

(本 PLAN で何を実装するかを 1-2 段落で記述)

## §2 背景

- (なぜこの実装が必要か、関連する requirement / ADR / 設計 PLAN へのリンク)

## §3 実装計画 (Sprint 標準 8 ステップ)

### Step 1: Entry

- 直前 PLAN / 依存条件の完了確認、ロール整合の再確認、scope 明示。

### Step 2: 着手前調査

- 既存実装の流用候補確認、重複シンボル検出、既存テストの確認。

### Step 3: 機能設計 + テスト設計 pair freeze

- design (D-API / D-DB) と test-design の対応先固定、変更対象 scope の明確化。

### Step 4: 実装

- 対象 artifact を最小単位で更新、既存仕様を崩さないよう差分を抑える。

### Step 5: 機械チェック

- `python3 -m py_compile`、shellcheck / markdownlint / yamllint、関連 lint・静的検査を実行し結果を記録。

### Step 6: テスト

- 対象範囲単体テスト、関連結合テスト、必要なら全回帰を実行。failure は再現手順を記載。

### Step 7: レビュー

- セルフレビュー + 1 段階の高信頼レビュー観点 (安全性、V-model trace、既存契約) を実施。code-reviewer subagent 推奨。

### Step 8: DoD

- 受入条件を checklist 化、関連 PLAN / ADR / docs 参照整合まで完了したら実装 DoD。

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが該当 section に存在
- [ ] `generates` に対応する実装ファイルとテストファイルが存在
- [ ] py_compile + pytest 全 PASS
- [ ] 関連設計 PLAN への双方向 trace が明示済み
- [ ] frontmatter `kind == impl`、§0〜§5 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: (依存 / 後続 PLAN を列挙)
- 関連 ADR: (採用判断 ADR があれば列挙)
- 参照 docs: `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md`、`docs/migration/helix-to-ut-tdd-cutover-strategy.md`
