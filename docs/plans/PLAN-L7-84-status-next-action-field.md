---
plan_id: PLAN-L7-84-status-next-action-field
title: "PLAN-L7-84 (impl): ut-tdd status --json に nextAction フィールドを additive 付加 — A-138 ITEM-1 carry discharge (taxonomy=current、camelCase 公開契約)"
kind: impl
layer: L7
drive: agent
status: confirmed
parent_design: docs/design/harness/L6-function-design/function-spec.md
created: 2026-06-19
updated: 2026-06-19
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-code-reviewer (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "A-138 ITEM-1 の carry (next_action status field) を discharge。正式フィールド名は既存 6 フィールドの camelCase 公開契約に揃え nextAction で確定 (status --json は currentRuntime/availableRuntimes/missingRuntimes と全て camelCase ゆえ規約上一意に決まる、snake_case 別名なし)。値域は mode→judgment-gate guidance の安定機械契約文字列 (standalone=human-review-required / 単一 runtime=single-runtime intra_runtime_subagent / hybrid=cross-review-ready)、先頭 token で機械 switch でき後続が人間可読、公開 JSON ゆえ ASCII のみ (machine-surface-language と整合)。純関数 nextActionForMode + SSoT NEXT_ACTION_BY_MODE を detect.ts に追加し、status action が 6 検出フィールドへ additive に付加 (既存契約不変・後方互換)。U-DETECT-001..005 が 4 mode 値・接頭契約・value-domain を被覆。requirements §6 を carry→current へ、function-spec §1.2 に nextActionForMode 行を back-fill。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: se
    slot_label: "SE - status nextAction field additive implementation"
generates:
  - artifact_path: docs/plans/PLAN-L7-84-status-next-action-field.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/detect.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/runtime.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-84 (impl): status --json nextAction field

## 0. Objective

A-138 ITEM-1 (cross_agent TL/Codex 裏取り済) が `ut-tdd status --json` の
`next_action` を **carry** (能動 defer + 追跡 PLAN/gate) に区分し、PO 残課題として
「carry を PLAN 化する優先度」+「正式フィールド名 (`next_action` / `nextAction`) の
確定」を残していた。PO 指示 (2026-06-19「両方修正を」) を受け本 PLAN で carry を
discharge する。

正式フィールド名は **PO 判断を要しない**: 既存 `status --json` の 6 フィールドは全て
camelCase (`currentRuntime` / `availableRuntimes` / `missingRuntimes`) ゆえ、公開契約規約上
`nextAction` に一意に決まる (snake_case 別名は付さない)。

## 1. Scope

In scope:

- **`src/runtime/detect.ts`** — `NEXT_ACTION_BY_MODE: Record<ExecutionMode, string>`
  (値域 SSoT) + 純関数 `nextActionForMode(mode): string` を追加。値は mode→判断ゲート
  guidance の安定機械契約文字列。`RuntimeDetection` 型は不変 (detection は純粋に保つ)。
- **`src/cli.ts`** — `status` action が `{ ...detectMode(), nextAction }` を JSON 出力
  (additive)。plain 出力にも `next:` 行を付加。

Out of scope:

- `optional_adapters` / `enabled_commands` / `disabled_commands` (taxonomy=`future`、
  adapter/command surface 設計が固まるまで実装しない)。
- handover CURRENT.json の `next_action` (別概念=session-level next action、本 PLAN 対象外)。
- snake_case 別名 / 値域の i18n。

## 2. Acceptance Criteria

- `ut-tdd status --json` が 7 フィールド目 `nextAction` を含み、既存 6 フィールドは不変
  (後方互換・additive)。
- `nextActionForMode` は 4 mode 全てに `NEXT_ACTION_BY_MODE` の値を返す純関数。
- 値は先頭 token (`:` 手前) で機械 switch でき、ASCII のみ (公開 JSON 契約 /
  machine-surface-language 整合)。standalone=human-review-required / 単一 runtime=
  single-runtime (intra_runtime_subagent) / hybrid=cross-review-ready。
- requirements §6 が `next_action`=current へ更新、function-spec §1.2 に
  `nextActionForMode` 行が存在 (descent / change-impact 整合)。
- typecheck / Biome / 全 Vitest / `ut-tdd doctor` green。

## 3. Test Design Pairing

Unit test design: `docs/test-design/harness/L7-unit-test-design.md`
(U-DETECT-001..005、PLAN-L7-84 Status nextAction Field Addendum)。
`tests/runtime.test.ts` の `nextActionForMode` describe が 4 mode 値・接頭契約・
value-domain を被覆。

## 4. Status

Confirmed. Implemented and verified 2026-06-19.
