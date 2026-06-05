---
plan_id: PLAN-L6-07-agent-slots
title: "PLAN-L6-07 (add-design): agent-slots Layer-2 オーケストレーション機構の機能設計 — slot lifecycle + team strategy schema + 直列化3条件 (IMP-050)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — Slot 型 / fire→release lifecycle の DbC / peakParallel sweep-line の境界 / SQLite なし JSON state の選択 (ADR-001) / recordGuardFire の stale 自動失効 (release hook 不在の補完) / team schema 3条件のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-05-setup-solo-team.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 2周 APPROVE (Important 全件反映: 閾値統一 / 単一 load-save) (handover 2026-06-04)"
---

# PLAN-L6-07 (add-design): agent-slots Layer-2 オーケストレーション機構の機能設計 (IMP-050)

## §0 位置づけ

UT-TDD は `agent_slots` frontmatter (role+slot_label) のみ移植し、HELIX の **Layer-2 実行オーケストレーション機構が全欠落** していた (improvement-backlog IMP-050)。HELIX `cli/lib/agent_slots.py` (SQLite) / `team_runner.py` (ThreadPoolExecutor) を **ADR-001 準拠で TS-native 再実装** する機能設計。SQLite は持ち込まず `.ut-tdd/state/agent-slots.json` (Slot[]) を単一 state とする (Windows ネイティブ + bun 単独、bash/python3 不要)。IMP-049 (直列/並列判定の強制・記録) の機械支援本体でもある。

- 駆動モデル: **Add-feature** (大規模単独 PLAN、IMP-050 backlog の指示通り)。
- 親: `PLAN-L6-05-setup-solo-team` (team / solo orchestration の系譜、drive=fullstack 一致)。

## §1 設計する責務

設計 doc 正本 = `docs/design/harness/L6-function-design/agent-slots.md`。要約:
- **slot lifecycle**: fireSlot / releaseSlot (idempotent) / listActiveSlots / listStaleSlots (5分閾値) / peakParallel (sweep-line) / exceedsParallelLimit / recordGuardFire (agent-guard 助言、stale 自動失効で release hook 不在を補完)。全 fail-open。
- **team strategy schema** (`src/schema/team.ts`): strategy=sequential|parallel + max_parallel + serialization 3 条件 (file_conflict / downstream_dependency / shared_state) + members[].serialize_after。`mustSerialize` が 3 条件 OR で直列要否を機械判定。
- **doctor surface**: stale slot + peak_parallel を warning-only で surface。

テスト設計 (③) = L7-unit-test-design.md §1.9 U-SLOT / §1.10 U-TEAM。

## §工程表

### Step 1: [直列] 設計 doc 起草 (agent-slots.md)
HELIX 移植元の API を ADR-001 TS-native へ翻案し §0-§4 で記述。**直列理由: downstream_dependency** (Step 2 テスト設計が本 doc の関数 signature に依存)。

### Step 2: [直列] テスト設計 back-fill (U-SLOT / U-TEAM)
L7-unit-test-design.md に §1.9/§1.10 を追記し V-pair 量閉じ。**直列理由: downstream_dependency** (Step 1 の関数 signature に依存)。

### Step 3: [並列] review Step (self / code-reviewer)
設計 doc と test 設計の整合 (孤児 0) を review (claude-only = code-reviewer 代替、evidence 記録)。

### Step 4: [直列] 用語更新
§6 用語更新。**直列理由: shared_state** (用語集の共有 doc を更新)。

## §実装計画

| 項目 | 情報源 |
|---|---|
| slot lifecycle API | 既存資料 (vendor/helix-source agent_slots.py) + ADR-001 TS-native 翻案 |
| team strategy + 3 条件 | 既存資料 (team_runner.py strategy) + IMP-049/050 backlog |
| SQLite なし JSON state の選択 | PM 判断 (Windows ネイティブ + bun 単独、ADR-001) |
| recordGuardFire stale 自動失効 | PM 判断 (Claude subagent に release hook が無い補完) |

## §6 用語更新

- **agent-slot / slot lifecycle**: subagent / team member の fire→release を機械記録する Layer-2 オーケストレーション単位。
- **直列化 3 条件**: file_conflict / downstream_dependency / shared_state。いずれか true で直列化必須 (IMP-049)。
- **peak_parallel**: 与えた slot 群の同時実行ピーク数 (sweep-line)。
- (用語集本体への追記は `PLAN-REVERSE-06` で back-fill)
