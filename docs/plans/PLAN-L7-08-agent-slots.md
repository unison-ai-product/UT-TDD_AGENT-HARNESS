---
plan_id: PLAN-L7-08-agent-slots
title: "PLAN-L7-08 (add-impl): agent-slots 機構の実装 — src/runtime/agent-slots.ts + src/schema/team.ts + doctor/agent-guard 配線 (IMP-050 + IMP-049 機械支援)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — fail-open 全関数 / fireSlot-releaseSlot lifecycle / recordGuardFire 単一 load-save (lost-update 窓) / agent-guard fail-close を壊さない助言追加 / peakParallel 境界 / team zod schema のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-SLOT-001〜006 / U-TEAM-001〜002 / doctor checkAgentSlots がテストコードで漏れなく被覆 / never-throw・idempotent・>=境界・read-only の oracle 実装"
generates:
  - artifact_path: src/runtime/agent-slots.ts
    artifact_type: source_module
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/agent-slots.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-schema.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-07-agent-slots.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 2周 APPROVE (cluster2 commit 1acda2e で L6-07/L7-08/REVERSE-06 一括 review) (handover 2026-06-04)"
---

# PLAN-L7-08 (add-impl): agent-slots 機構の実装 (IMP-050 + IMP-049 機械支援)

## §0 位置づけ

`PLAN-L6-07-agent-slots` (add-design ①③) が確定した設計を実装する add-impl。先行 add-impl と同型 — U-SLOT/U-TEAM を ④ テストコード化 (Red) → `src/runtime/agent-slots.ts` + `src/schema/team.ts` (②) を Green → doctor surface + agent-guard 並列 warn を配線。IMP-049 (直列/並列) の機械支援 (`mustSerialize` + 並列超過 warn) も本 PLAN で実装する。

- 親: `PLAN-L6-07-agent-slots` (drive=fullstack 一致)。

## §1 実装する契約

- `src/runtime/agent-slots.ts`: Slot 型 + loadSlots/fireSlot/releaseSlot/listActiveSlots/listStaleSlots/peakParallel/exceedsParallelLimit/recordGuardFire/nodeAgentSlotsDeps (設計 §2 DbC 準拠、全 fail-open)。state = `.ut-tdd/state/agent-slots.json` (gitignored)。
- `src/schema/team.ts`: teamDefinitionSchema (zod) + mustSerialize + 3 条件。
- `src/doctor/index.ts`: checkAgentSlots (stale/peak surface、warning-only、read-only deps) を runDoctor に配線。
- `.claude/hooks/agent-guard.ts`: pass (code 0) 時のみ recordGuardFire で fire 記録 + 並列超過 stderr warn (block 判定 fail-close に不干渉、slot I/O は try/catch 隔離)。
- `.ut-tdd/teams/example-review-team.yaml`: team 定義の参照例 (tracked)。

## §工程表

### Step 1: [直列] U-SLOT / U-TEAM を ④ テスト先行 (Red)
tests/agent-slots.test.ts + tests/team-schema.test.ts。**直列理由: downstream_dependency** (Step 2 実装の oracle)。

### Step 2: [直列] src/runtime/agent-slots.ts + src/schema/team.ts を ② 実装 (Green)
**直列理由: file_conflict + downstream_dependency** (同一新規モジュールを書き、Step 1 テストを green 化)。

### Step 3: [直列] doctor + agent-guard 配線
checkAgentSlots を runDoctor へ / recordGuardFire を guard hook へ。**直列理由: downstream_dependency** (Step 2 の agent-slots API に依存)。

### Step 4: [並列] review Step (self / code-reviewer)
fail-close 不変 / never-throw / lost-update / read-only を review (claude-only = code-reviewer 代替)。findings は同 cycle で反映。

### Step 5: [直列] 回帰 + 用語更新
typecheck 0 / biome CLEAN / `npx vitest run` 全 pass / §6 用語更新。**直列理由: downstream_dependency** (全 Step 完了が前提)。

## §実装計画

| 項目 | 情報源 |
|---|---|
| Slot lifecycle / peakParallel / recordGuardFire | 設計 doc agent-slots.md (L6-07) |
| team zod schema | 設計 doc + 既存 src/schema/frontmatter.ts パターン |
| doctor read-only deps (writeText no-op) | PM 判断 (doctor 副作用ゼロ契約) |
| review findings 反映 (I-1 閾値統一 / I-2 単一load-save / I-3 doctor test) | code-reviewer (2 周 APPROVE) |

## §6 用語更新

- **agent-slots.json / slot_source**: agent_guard / team_runner / manual の 3 由来で fire を記録する runtime state (gitignored)。
- **recordGuardFire**: agent-guard が pass 時に呼ぶ助言 API。stale 自動失効で release hook 不在を補完し並列超過を warn。
- (用語集本体は `PLAN-REVERSE-06` で back-fill)
