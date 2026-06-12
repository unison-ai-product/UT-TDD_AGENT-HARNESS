---
plan_id: PLAN-L6-15-module-drift
title: "PLAN-L6-15 (add-design): module-drift lint の機能設計 — architecture §3.1 設計 module 集合 ⊇ src/ 実在 module の包含 drift 検査 (impl→design back-fill 漏れ surface、IMP-075) + asset-drift defer の carry plan_id 明示 (IMP-074)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — parseListedModules の §3.1 限定切り出し (§3.2 太字非巻き込み) / analyzeModuleDrift の actual⊆listed 方向 / doctor hard/fail-close 配線 / 既存 lint 様式との非重複レビュー (claude-only は code-reviewer/pmo-sonnet 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires: []
  references:
    - docs/adr/ADR-002-dependency-direction-and-auto-map.md
    - docs/plans/PLAN-L4-13-drift-lint.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "module-drift 機能設計 (§0-§7) + architecture §4.1 carry plan_id 明示 (IMP-074) のレビュー。actual⊆listed 方向・§3.1 限定切り出し・doctor hard/fail-close・asset-drift/dependency-drift との別検査明示を確認。pmo-sonnet 確定 (code-reviewer は IMP-009 truncate)。claude-only TL 代替"
---

# PLAN-L6-15 (add-design): module-drift lint の機能設計 (IMP-075) + asset-drift carry plan_id (IMP-074)

## §0 位置づけ

A-103 (L4 見直し) で handover/setup/web/lint が「実装済かつ設計 doc が将来扱い」の back-fill 漏れ (impl→design meta-drift) を **手動監査**で発見した。柱 2 (doc×機械厳格化) / 柱 3 (自動化で state 管理) に照らし、この meta-drift を手動 audit に頼るのは under-design。**「architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module」の包含 drift を doctor で surface する** 純関数 lint を機能設計する (ADR-002/IMP-032 の最小スライス)。あわせて IMP-074 (asset-drift defer の carry plan_id 未確定 = concept §3.1.3.1 正規 defer 様式違反) を architecture §4.1 で解消する。成果物 = module-drift.md (新規 ①) + architecture §4.1 注記 ⇔ L7-unit §1.16 ペア。

## §工程表

### Step 1: [直列] module-drift 機能設計 doc 起草
- 直列理由 = **file_conflict** (module-drift.md を書く)。§0 スコープ (actual⊆listed、asset-drift/dependency-drift と別検査) / §1 入力 / §2 純関数 DbC / §3 loader+messages / §4 doctor hard/fail-close / §5 段階導入 / §6 用語 / §7 carry。
- 情報源: review-evidence.md (機能設計 doc の先例構造) + backfill-pairing.ts (lint 共通様式) + ADR-002 (drift lint 設計根拠)。

### Step 2: [直列] architecture §4.1 の carry plan_id 明示 (IMP-074)
- 直列理由 = **file_conflict** (architecture.md を書く)。asset-drift rule engine defer に carry plan_id (PLAN-L4-13/L5-07) を紐付け + module-drift (IMP-075) が別検査・実装済である注記を追加。
- 情報源: concept §3.1.3.1 (正規 defer 様式) + PLAN-L4-13-drift-lint frontmatter。

### Step 3: [直列] L7-unit §1.16 U-MDRIFT ペア + 量閉じ
- 直列理由 = **downstream_dependency** (Step 1 の関数 DbC からテスト oracle を導出)。U-MDRIFT-001〜005 + 量閉じ一覧へ追記 (孤児0)。

### Step 4: [直列] review Step (intra_runtime_subagent) + G6 freeze
- 直列理由 = **downstream_dependency**。pmo-sonnet で設計レビュー → 通過後 review_evidence 記録 + confirmed flip。

## §実装計画

- **docs/design/harness/L6-function-design/module-drift.md** (情報源: review-evidence.md 構造 + backfill-pairing.ts): 機能設計 ①。
- **docs/design/harness/L4-basic-design/architecture.md §4.1** (情報源: concept §3.1.3.1 defer 様式): carry plan_id 明示 (IMP-074)。
- **docs/test-design/harness/L7-unit-test-design.md §1.16** (情報源: §1.15 U-REVIEW 構造): U-MDRIFT-001〜005 ③。

## §6 用語更新

- **module-drift**: architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module の包含 drift (impl→design back-fill 漏れ)。asset-drift (内容整合、IMP-033) / dependency-drift (import グラフ、IMP-032) と別検査。→ L0 §10 用語集へ back-merge (REVERSE-15)。

## §8 DoD

- [x] module-drift.md 機能設計 (§0-§7) + L7-unit §1.16 U-MDRIFT ペア (孤児0)
- [x] architecture §4.1 に carry plan_id 明示 (IMP-074、正規 defer 様式化)
- [x] review 前置 (pmo-sonnet) → 通過後 review_evidence 記録 + confirmed flip
- [x] L7 add-impl = PLAN-L7-16 / back-fill = PLAN-REVERSE-15 とペア
