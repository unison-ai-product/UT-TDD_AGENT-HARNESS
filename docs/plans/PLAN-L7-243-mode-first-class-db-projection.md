---
plan_id: PLAN-L7-243-mode-first-class-db-projection
title: "PLAN-L7-243 (add-impl): mode の第一級化と drive_runs.mode 投影損失の解消"
kind: add-impl
layer: L7
drive: db
status: confirmed
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
  - artifact_path: src/schema/mode-catalog.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/state-db/drive-registration.ts
    artifact_type: source_module
  - artifact_path: src/lint/drive-db-registration.ts
    artifact_type: source_module
  - artifact_path: src/skill-engine/recommend.ts
    artifact_type: source_module
  - artifact_path: tests/mode-catalog.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - src/state-db/projection-writer.ts
    - src/lint/drive-db-registration.ts
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T21:27:00+09:00"
    tests_green_at: "2026-07-02T21:16:03+09:00"
    verdict: approve
    scope: "mode 第一級化: route_mode frontmatter を宣言正本に採用 (案A 変形、AI 推奨・PO 追認は残タスクとして明示)。plan_registry.route_mode 列 + mode-catalog 導出で drive_runs.mode / skill drive_model を置換、REQUIRED_CURRENT_MODES 5 値を expectedModes 突合 + mode_catalog_unmapped fail-close へ変更。再投影実測 9 mode 分散・refactor/troubleshoot の Forward 誤投影 0。TL が導出優先順位/置換完全性/フォールバック/下流影響/テスト固定を確認し approve。codex provider 不能につき intra_runtime_subagent fallback。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/mode-catalog.test.ts tests/drive-db-registration.test.ts tests/projection-writer.test.ts tests/skill-recommend.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T21:16:03+09:00"
        evidence_path: tests/mode-catalog.test.ts
        output_digest: "sha256:dd3a7a9e3e5d0c4a65cb31c4d55be2391ab1d74d5247e8387359649dc08e29b2"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T21:16:03+09:00"
        evidence_path: src/schema/mode-catalog.ts
        output_digest: "sha256:6eebf2218afee38df1b5c9c8eb1bb849b42bd9aecc8440dad246bc7a82cc2976"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T21:16:03+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:d3fbe43294b7768bf68c29ca7bc4df7ea4386734aabf32beff1f825e89a99504"
---

# PLAN-L7-243 (add-impl): mode の第一級化と drive_runs.mode 投影損失の解消

## Status

2026-07-02 実装完了 (PO /goal 指示、A-173 F-9 latent-defect [critical])。route_mode↔kind 台帳
(PLAN-L7-263) の draft debt から add-impl + PLAN-REVERSE-243 pairing へ昇格 (昇格実例第 3 号)。

## 方式決定 (2026-07-02、AI 推奨採用 — PO gate 明示)

**採用 = 案A 変形: 既存 `route_mode` frontmatter を mode 宣言の正本とする。**

- 根拠: route certificate lint (PLAN-L7-212) により created>=2026-07-01 の全 PLAN で
  `route_mode` は既に fail-close 必須であり、route_signal との整合も機械検査済み。
  新 field (`mode:`) の追加は二重宣言、案B (plan_id token 拡張) は plan_id token 規則
  (L0-L14/DISCOVERY/REVERSE/RECOVERY/M のみ、A-175 で PLAN-REFACTOR- prefix 却下済) と
  衝突、案C (routing イベント永続化) は rebuild 決定論と相性が悪い。
- legacy PLAN (route_mode 無し) は plan_id prefix → kind の順でフォールバック
  (`src/schema/mode-catalog.ts`)。
- **PO gate**: 本決定は AI 推奨のまま実装した。方式の追認 (または 案B/C への差し戻し) と、
  plan_id への駆動可読性要求 ([[feedback_drive_model_first_class_in_plan_id]]) を
  route_mode 正本で満たすとみなすかは PO 確認事項として残る。

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

## 実装 (2026-07-02)

- `src/schema/mode-catalog.ts` (新規): route_mode → 表示 mode 写像 + legacy フォールバック +
  mode doc カタログ写像 (`MODE_CATALOG_DOC_FILES`)。route-map の全 mode token 被覆は test 固定。
- `plan_registry` に `route_mode` 列を追加し projection で永続化 (`harness-db-tables-core.ts` /
  `projection-writer.ts`)。`drive_runs.mode` / skill 系 `drive_model` 導出を catalog へ置換
  (旧 plan_id prefix 4 分岐は廃止)。
- `REQUIRED_CURRENT_MODES` ハードコード 5 値を廃止: stats 収集が plan_registry から
  `expectedModes` を導出して突合、`docs/process/modes/` の未写像 doc は
  `mode_catalog_unmapped` で fail-close (`drive-db-registration.ts` / `drive-registration.ts`)。
- 再投影実測 (db rebuild 後): drive_runs は 9 mode へ分散
  (Add-feature=187 / Forward=114 / Reverse=103 / Incident=91 / Refactor=56 / Discovery=29 /
  Recovery=10 / Version-up=5 / Verification=2)、kind=refactor/troubleshoot の Forward 誤投影 0 件。
- 下流影響: skill 発火条件 (applies_drive_models 照合) は Refactor/Add-feature 等の実 mode で
  一致可能になった (tests/skill-recommend.test.ts で route_mode 宣言による選択を固定)。

## DoD

- [x] kind=refactor / troubleshoot の drive_runs が正しい mode を持つ (再投影後実測: 該当 Forward 誤投影 0、上記分布)
- [x] 新 mode 追加時に DB 登録 lint がカタログ差分を fail-close 検出 (tests/mode-catalog.test.ts で固定)
