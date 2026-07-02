---
plan_id: PLAN-L7-243-mode-first-class-db-projection
title: "PLAN-L7-243 (impl): mode の第一級化と drive_runs.mode 投影損失の解消"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - mode 宣言正本の方式決定 (案A frontmatter / 案B plan_id 埋め込み / 案C 起票時イベント)"
  - role: se
    slot_label: "SE - 投影置換 + REQUIRED_CURRENT_MODES カタログ突合 + 再投影"
generates:
  - artifact_path: docs/plans/PLAN-L7-243-mode-first-class-db-projection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - src/state-db/projection-writer.ts
    - src/lint/drive-db-registration.ts
---

# PLAN-L7-243 (impl): mode の第一級化と drive_runs.mode 投影損失の解消

## Status

draft 起票 (PO /goal 2026-07-02、A-173 F-9 latent-defect [critical])。方式決定は規範変更 (§1.10.A トレードオフの見直し) を含むため PO gate 先行。

## 背景 (A-173 F-9)

`drive_runs.mode` が `workflowModeForPlan(planId)` の plan_id 接頭辞 4 分岐のみで導出され、残り全部 Forward 落ち。実測: DB の mode は 5 種のみ、kind=refactor 29 行 + troubleshoot 91 行 (計 120 行) が Forward へ誤投影、6+ mode が表現不能。`REQUIRED_CURRENT_MODES` は損失関数が出せる 5 値そのもので、lint が定義上この取りこぼしを検出できない。根本は「mode が第一級データとしてどこにも宣言されない」こと (既知 PO 指摘 [[feedback_drive_model_first_class_in_plan_id]] の DB 側帰結)。

## スコープ

1. mode 宣言正本の方式決定 (PO gate): 案A `mode:` frontmatter / 案B plan_id 駆動トークン拡張 / 案C 起票時 routing イベント永続化。
2. 決定方式で `workflowModeForPlan` / `skillDriveModelForPlan` を置換。
3. `REQUIRED_CURRENT_MODES` を mode カタログ (modes README 台帳) との突合に変更 (ハードコード 5 値の廃止)。
4. 誤投影 120 行の再投影 (db rebuild) + 中央 UI / skill 発火条件への下流影響確認。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 方式決定 (PO gate、concept/requirements 先行) | 直列 |
| 2 | 投影置換 + カタログ突合 | 直列 |
| 3 | 再投影 + 下流 (UI/skill) 影響検証 | 直列 |

## DoD

- [ ] kind=refactor / troubleshoot の drive_runs が正しい mode を持つ (再投影後実測)
- [ ] 新 mode 追加時に DB 登録 lint がカタログ差分を fail-close 検出 (test 固定)
