---
plan_id: PLAN-L2-NN-design-slug   # §1.10 A: PLAN-<layer>-<NN>-<slug>。layer は frontmatter layer と一致 (L2-L6 設計)
title: "PLAN-L2-NN: (設計タイトル placeholder)"
kind: design
layer: L2
drive: be
status: draft
created: 2026-MM-DD
owner: PM (Opus)
agent_slots:
  - role: po
    slot_label: "PO — スコープ判断・要件レビュー"
  - role: tl
    slot_label: "TL — 設計判断・契約凍結"
  - role: docs
    slot_label: "Docs — 設計 doc 起草"
generates:
  - artifact_path: docs/design/<feature>/D-API.md
    artifact_type: design_doc
  - artifact_path: docs/design/<feature>/D-DB.md
    artifact_type: design_doc
  - artifact_path: docs/adr/ADR-NNN-<topic>.md
    artifact_type: adr_snapshot
  - artifact_path: docs/v2/L2-test-design/PLAN-NNN-overall-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires: []
  blocks: []
related_adr: []
related_docs:
  - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
---

## §0 PLAN

設計対象の方針 / アーキテクチャ / 契約を凍結し、後続の impl PLAN が参照できる形にする。

## §1 目的

(本 PLAN でどの範囲の設計を凍結するかを 1-2 段落で記述)

## §2 背景

- (なぜこの設計判断が必要か、関連する requirement / 既存設計 / 痛点を整理)

## §3 設計計画

### Step 1: Entry

- 関連 requirement / 既存設計 / 制約条件の整理。

### Step 2: 事前調査 (必要時)

- 外部技術調査、競合手法精読、tech-fork 候補列挙。

### Step 3: 方針提示

- 主要選択肢の比較、推奨案、リスク、tradeoff。

### Step 4: 契約凍結

- D-API / D-DB / D-CONTRACT の確定、V-model 4 artifact trace 明示。

### Step 5: 総合テスト設計

- L2 設計 ↔ 総合テスト設計の双方向 reference。

### Step 6: ADR snapshot 起票 (大局判断ある場合)

- ADR-NNN として L2 凍結。

### Step 7: レビュー

- pmo-sonnet review (構造化チェック)、tl-advisor adversarial check (必要時)。

### Step 8: DoD

- 受入条件 checklist 完了、後続 impl PLAN への引継ぎ準備完了。

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが該当 section に存在
- [ ] `generates` に対応する設計 doc / ADR / 総合テスト設計が存在
- [ ] V-model 4 artifact 双方向 trace 明示
- [ ] §6 用語更新 が存在 (当該工程の新規 / 精緻化用語を L0 §10 用語集へ back-merge する delta、無ければ「用語更新なし」明記、要件 §1.10.G.9)
- [ ] frontmatter `kind == design`、§0〜§6 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: (依存 / 後続 PLAN を列挙)
- 関連 ADR: (採用判断 ADR があれば列挙)
- 参照 docs: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`

## §6 用語更新 (living glossary delta)

当該工程で新規導入 / 精緻化したユビキタス言語を記録し、L0 §10 用語集 (`docs/governance/ut-tdd-agent-harness-concept_v3.1.md`) へ back-merge する (独自定義禁止、anti-corruption layer / 要件 §1.10.G.9)。

| 用語 | 種別 (新規 / 精緻化) | 定義 / 変更点 | L0 §10 back-merge (導入層 / 更新層) |
|---|---|---|---|
| (例) ... | 新規 | ... | 導入層 = 当該 layer |

> 当該工程で用語の新規導入・意味変更が無い場合は本文に `用語更新なし` と明記する。
