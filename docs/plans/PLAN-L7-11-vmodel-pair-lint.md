---
plan_id: PLAN-L7-11-vmodel-pair-lint
title: "PLAN-L7-11 (add-impl): vmodel pair-freeze lint 実装 — src/vmodel/lint.ts 本実装 + doctor checkPairFreeze 配線 (rule pair-exists/ref-resolves/trace-bidir、IMP-067)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-12
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-12"
    tests_green_at: "2026-06-12"
    verdict: approve_after_fixes
    scope: "L7 completion audit A-135: U-VPAIR artifacts exist, target tests and full npm test green, G4/G7 codex-only checklist review passed with .ut-tdd/audit/A-135-l7-completion-review-checklist.yaml."
agent_slots:
  - role: tl
    slot_label: "TL — pair-freeze 純関数の正しさ / dir 集合参照の境界 (trailing slash) / README・roadmap 除外規約 / inline コメント除去 / doctor hard/fail-close 配線のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-VPAIR-001〜006 oracle 被覆 + 実 repo 完全性ガード (孤児0、CI vitest fail-close) の妥当性"
generates:
  - artifact_path: src/vmodel/lint.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-pair.test.ts
    artifact_type: test_code
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-10-vmodel-pair-lint.md
  requires:
    - docs/plans/PLAN-L6-10-vmodel-pair-lint.md
---

# PLAN-L7-11 (add-impl): vmodel pair-freeze lint 実装

## §0 位置づけ

PLAN-L6-10 (vmodel-pair-freeze.md) の機能設計を実装する。`src/vmodel/lint.ts` stub を **設計層 pair freeze 検査** (`loadPairDocs` / `analyzePairFreeze` / `pairFreezeMessages` / `lintVmodel` 本実装) に置換し、`runDoctor` に `checkPairFreeze` を **hard/fail-close** で配線。実 repo に当てて検出される孤児 (L3-functional/README 等の pair 欠落) は本 PLAN 内で doc 改善 (PO「チェック機構も改修」授権)。③ ペア = L7-unit §1.13 U-VPAIR。

## §工程表

### Step 1: [直列] src/vmodel/lint.ts 本実装
- 直列理由 = **file_conflict** (vmodel/lint.ts を書く)。`loadPairDocs`/`analyzePairFreeze`/`pairFreezeMessages`/`lintVmodel` を vmodel-pair-freeze.md §1-§3 の純関数仕様どおり実装。`backfill-pairing.ts` の frontmatter parse パターンを踏襲 (inline コメント除去 / path 境界固定)。

### Step 2: [直列] doctor checkPairFreeze 配線 (hard/fail-close)
- 直列理由 = **downstream_dependency** (Step 1 の関数に依存)。`src/doctor/index.ts` に `checkPairFreeze` を hard/fail-close で追加 (I/O 失敗は violation)。

### Step 3: [直列] tests/vmodel-pair.test.ts
- 直列理由 = **downstream_dependency** (Step 1 の関数を test)。U-VPAIR-001〜006 + 実 repo 完全性回帰ガード (孤児0)。

### Step 4: [直列] 実 repo 孤児改修 (doc カバレッジ改善)
- 直列理由 = **downstream_dependency** (Step 3 のガードが赤になる孤児を Step 1 lint で検出してから改修)。検出された pair-missing (README 等) を除外規約 or pair 付与で解消し、実 repo 孤児0 を達成。

### Step 5: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で実装⇔設計⇔テスト設計の同粒度 / 除外規約の妥当性 / doctor 非干渉をレビュー。

## §実装計画

- **src/vmodel/lint.ts** (情報源: vmodel-pair-freeze.md §1-§3 + backfill-pairing.ts 既存パターン): 4 純関数 + `LintResult` 返却。
- **src/doctor/index.ts** (情報源: 既存 checkBackfill/checkScrumReverse 配線): `checkPairFreeze` hard/fail-close。
- **tests/vmodel-pair.test.ts** (情報源: L7-unit §1.13): U-VPAIR oracle を vitest 化 + 実 repo ガード。
- 設計粒度 = L7 単体テスト設計粒度 (各検査軸 1 U-ID)。

## §6 用語更新

- **pair-freeze lint (設計層)** / **self-pair**: PLAN-L6-10 §6 で宣言済。L0 §10 への back-merge は REVERSE-10 で実施。

## §7 DoD
- [x] src/vmodel/lint.ts 本実装 (4 純関数) + doctor checkPairFreeze (hard/fail-close)
- [x] tests/vmodel-pair.test.ts (U-VPAIR-001〜006 + 実 repo 孤児0 ガード) green
- [x] 実 repo 孤児改修で orphans=0 達成 (doc カバレッジ改善)
- [x] typecheck 0 / vitest 全 pass / biome CLEAN
- [x] review 前置 (code-reviewer)
- [x] Reverse (REVERSE-10) で上位整合 + glossary back-merge
