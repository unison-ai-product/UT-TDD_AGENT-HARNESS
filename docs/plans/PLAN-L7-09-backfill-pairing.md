---
plan_id: PLAN-L7-09-backfill-pairing
title: "PLAN-L7-09 (add-impl): back-fill pairing lint の実装 — src/lint/backfill-pairing.ts + doctor checkBackfill (IMP-051)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — analyzeBackfill 純関数 / parseRequires・parseGlossaryTerms の regex (/m と $ の罠) / normalizeTerm 表記ゆれ吸収 / doctor hard/fail-close 配線 / 実 repo 回帰ガードのレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-BACKFILL-001〜006 がパース・マトリクス・孤児検出・glossary gap・実 repo 完全性を被覆 / archived 除外 / conditional は ok を落とさない oracle"
generates:
  - artifact_path: src/lint/backfill-pairing.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-08-backfill-pairing.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve
    scope: "code-reviewer 事後 review APPROVE (Critical 0)。analyze 純関数 + loader 分離 / 実 repo 回帰ガード U-BACKFILL-006。Important は carry"
---

# PLAN-L7-09 (add-impl): back-fill pairing lint の実装 (IMP-051)

## §0 位置づけ

`PLAN-L6-08-backfill-pairing` (add-design ①③) の実装。U-BACKFILL を ④ 先行 (Red) → `src/lint/backfill-pairing.ts` (②) Green → doctor 配線 (hard/fail-close)。**本機構自身が「Reverse 無き impl」を検知するため、本 PLAN は `PLAN-REVERSE-07` から requires され back-fill 完全性を満たす (ドグフード)**。

- 親: `PLAN-L6-08-backfill-pairing` (drive=fullstack 一致)。

## §1 実装する契約

- `src/lint/backfill-pairing.ts`: `KIND_BACKFILL` / `parseRequires` / `parseGlossaryTerms` / `normalizeTerm` / `parsePlan` / `analyzeBackfill` / `loadBackfillDocs` / `backfillMessages` (純関数 + loader 分離、fr-registry-audit 同方針)。
- `src/doctor/index.ts`: `checkBackfillResult(repoRoot)` を runDoctor に hard/fail-close 配線 (I/O 失敗は violation)。

## §工程表

### Step 1: [直列] U-BACKFILL を ④ テスト先行 (Red)
純関数 + 実 repo 回帰ガード。**直列理由: downstream_dependency** (Step 2 の oracle)。

### Step 2: [直列] src/lint/backfill-pairing.ts を ② 実装 (Green)
**直列理由: file_conflict + downstream_dependency** (新規モジュール、Step 1 を green 化)。

### Step 3: [直列] doctor 配線 + 実 repo 孤児解消
checkBackfill を runDoctor へ。実 repo で検出された孤児 (REVERSE-02 が L7-01 未 requires) と glossary gap を解消。**直列理由: downstream_dependency + shared_state** (analyze API 依存 + 既存 PLAN/glossary を修正)。

### Step 4: [並列] review Step (self / code-reviewer)
regex の罠 (/m と $)・表記ゆれ吸収・hard/fail-close・実 repo 完全性を review (claude-only = code-reviewer 代替)。

### Step 5: [直列] 回帰 + 用語更新
typecheck 0 / biome CLEAN / `npx vitest run` 全 pass / §6 用語更新。**直列理由: downstream_dependency**。

## §実装計画

| 項目 | 情報源 |
|---|---|
| analyze/parse 関数 | 設計 doc backfill-pairing.md (L6-08) |
| /m と $ の罠 (section が空になる) | 実装時に発見・修正 (parseGlossaryTerms) |
| 実 repo 孤児 (REVERSE-02 未 requires L7-01) | 実 repo 回帰ガードが検出 → 構造修正 |
| doctor hard/fail-close 配線 | 既存資料 (checkBackfillResult / runDoctor.ok パターン) |

## §6 用語更新

- **reverseOrphans / glossaryGaps / conditionalPending**: back-fill 検査の 3 出力。Reverse 無き impl / glossary 未 merge / 契約変更時 Reverse 要候補。
- **normalizeTerm**: 複合ラベルの先頭コア語で glossary 照合する表記ゆれ吸収。
- (用語集本体 = L0 §10 back-merge は `PLAN-REVERSE-07`)
