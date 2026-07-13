---
plan_id: PLAN-L7-428-stage-bound-elicitation-context
title: "PLAN-L7-428 (add-impl): ステージ紐付きエリシテーション文脈 — ut-tdd elicit context/record"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-13
updated: 2026-07-13
owner: PM / PO
parent_design: docs/plans/PLAN-L3-07-design-decision-elicitation-format.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "SE — elicitation context/record 実装 (schedule/skill/spec 結合)"
  - role: qa
    slot_label: "QA — U-ELICIT oracle (stage 解決 / defaults / coverage / append-only)"
generates:
  - artifact_path: docs/plans/PLAN-L7-428-stage-bound-elicitation-context.md
    artifact_type: markdown_doc
  - artifact_path: src/elicitation/context.ts
    artifact_type: source_module
  - artifact_path: src/elicitation/record.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/elicitation-context.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L3-07-design-decision-elicitation-format.md
  requires: []
  blocks: []
  references:
    - docs/governance/design-decision-elicitation.md
    - docs/plans/PLAN-REVERSE-428-stage-bound-elicitation-backfill.md
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
review_evidence: []
---

# PLAN-L7-428 (add-impl): ステージ紐付きエリシテーション文脈

## 背景

PO 要望 (2026-07-13、PLAN-L3-07 の後続本格化指示):

1. 工程表からの自己ステージ認識と設計判断依頼を結合する — 質問が「どの PLAN の
   どのステージで発生したか」を機械で持つ。
2. skill を紐付け、**何を聞き、何を聞かずに進められるか** を明確化する — skill
   frontmatter の decision_points は「既定で採ってよい判断」の正本なので、これを
   聞かない側のリストとして提示する。
3. checked ZIP 由来で移植した設計カバレッジ (typed-spec 投影 = spec_defs /
   spec_relations) を紐付け、判断の設計文脈 (対象 layer の spec 件数・relation
   件数・lifecycle 分布) を同じ packet に載せる。

## 変更

- `src/elicitation/context.ts`: `selectElicitationContext` /
  `renderElicitationContext`。schedule_entries live state (PLAN 粒度の自己
  ステージ認識、`selectScheduleLiveState` 再利用) + skill 推薦
  (`recommendSkillsForPlan` → decision_points 抽出、fail-open) + spec_defs /
  spec_relations カバレッジ集計を 1 packet に結合し、末尾に `## 設計判断依頼`
  テンプレート (plan_id + current_location 埋め込み済み) を描画する。
- `src/elicitation/record.ts`: `appendDesignDecision`。採択結果を
  `.ut-tdd/logs/design-decisions.jsonl` へ append-only で記録 (stage 付き)。
  正本は PLAN 設計判断節 / ADR で、log は episodic 記録面 (feedback lifecycle
  と同じ分離方針)。
- `src/cli.ts`: `ut-tdd elicit context [--plan] [--json]` / `ut-tdd elicit
  record --plan --topic --chosen --reason [--options]`。record は正本転記の
  リマインダを出す。
- `tests/elicitation-context.test.ts`: U-ELICIT-001..006。

## 工程表

### Step 1: [直列] context 結合実装
- schedule / plan_registry / skill decision_points / spec_defs 結合と描画。

### Step 2: [並列] record 実装
- append-only JSONL 記録 + 入力バリデーション (fail-close)。

### Step 3: [並列] CLI 配線
- `elicit context` / `elicit record` サブコマンド。

### Step 4: [直列] 検証
- 直列理由 = **verification_gate**。U-ELICIT green + typecheck + lint +
  実 repo での `elicit context` 実走確認。

## 設計判断

1. **新規 DB テーブルは作らない**: 採択記録は append-only JSONL を episodic
   正本とし、DB projection 化は消費側 (digest / doctor) の需要が出た後続で行う
   (db-projection-coverage への影響を持ち込まない最小差分)。
2. **step 粒度のステージは扱わない**: 自己ステージ認識は schedule_entries の
   PLAN 粒度。step 粒度は PLAN-L7-419 (Forward FSM) の実装後に結合する。
3. **skill 読取は fail-open**: 読めない skill asset は `unreadable_skills` で
   可視化し、packet 全体は返す (エリシテーションを塞がない)。

## DoD

- [ ] `ut-tdd elicit context` が stage / design-coverage / defaults / 依頼
      テンプレートの 4 段 packet を返す (`--plan` 指定と工程表 current 解決の両方)。
- [ ] skill decision_points が「聞かずに既定で進められる判断」として列挙される。
- [ ] spec_defs / spec_relations 由来の設計カバレッジ集計が載る。
- [ ] `ut-tdd elicit record` が stage 付き JSONL を append し、必須項目欠落で
      fail-close する。
- [ ] U-ELICIT-001..006 green、typecheck / lint green。
