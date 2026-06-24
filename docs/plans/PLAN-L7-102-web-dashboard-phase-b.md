---
plan_id: PLAN-L7-102-web-dashboard-phase-b
title: "PLAN-L7-102 (impl): src/web 中央 UI Phase B — 15 画面 read-only ダッシュボード (L2 screen-list 実装)"
kind: impl
layer: L7
drive: fe
status: archived
created: 2026-06-22
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: se
    slot_label: "SE — src/web ダッシュボード実装 (render/db/screens/router/app/server)"
  - role: tl
    slot_label: "TL — web 実装レビュー (intra_runtime_subagent)"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
parent_design: docs/design/harness/L2-screen/screen-list.md
generates:
  - artifact_path: docs/plans/PLAN-L7-102-web-dashboard-phase-b.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L2-screen/screen-list.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/web/app.ts
    artifact_type: source_module
  - artifact_path: tests/web.test.ts
    artifact_type: test_code
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-L2-01-screen-list
    - PLAN-L7-96-screen-db-projection
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "src/web dashboard, ut-tdd web CLI bootstrap, screen implemented projection, and targeted Vitest evidence"
    worker_model: codex
    reviewer_model: codex-intra-runtime
  - reviewer: code-reviewer (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "src/web 15画面 read-only ダッシュボード (render/db/screens/router/app/server) + ut-tdd web CLI + implemented flip の Opus 実装に対する code-reviewer (sonnet) 確認。VERDICT=pass / Critical 0。Important I-1 = 404 ページの url.pathname が escapeHtml 未適用 (reflected XSS、local 限定・低severity) を検出し app.ts を escapeHtml(url.pathname) で修正 + 回帰テスト U-WEB-014 追加。実証 = vitest 901 green (web 14、SQL injection は isSafeTableName + parameterized、read-only 不変) + 実 server smoke 7経路 200/404。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L7-102 (impl): src/web 中央 UI Phase B — 15 画面 read-only ダッシュボード

> **訂正 / archived・supersede (PLAN-L7-141、2026-06-24)**: 本 PLAN が生んだ `src/web` は L2
> ui-element §2 の設計部品から降ろさず harness.db を汎用テーブル描画する **table-dumper prototype**
> であり、かつ画面 V-model 鎖の **L10 (UX refinement) を飛ばして** 実装宣言していた (中央UI mission を
> 測れない、使い物にならない)。PO 判断 (2026-06-24「画面のほうは一度破棄。要件を正して再起票」) により
> prototype コード (`src/web/*.ts`)・`tests/web.test.ts`・`cli web` command を破棄し、本 PLAN を
> `status: archived` とする。component-derived な再実装は後継 **PLAN-L7-141-web-dashboard-component-derived**
> が `supersedes` で引き継ぐ。`screen` projection (PLAN-L7-96、doc 正本→harness.db) は基盤として保持。

## 0. Objective (PO 指示「src/web 画面 UI / implemented flip の Phase B 完遂」2026-06-22)

L2 screen-list.md は G2 freeze 済 (15 画面 PM/HM/GD、ID↔URL 1:1)、harness.db には screen projection
(PLAN-L7-96) まで入ったが、`src/web` は空 (.gitkeep のみ) で**画面表示 UI が未実装** = carry「Phase B」。
ADR-005 D2 の中央 UI を、まず **Phase A = local read-only ダッシュボード** (Bun HTTP + harness.db) として
実装する。screen-list §3 S5=b に従い全画面 read-only + CLI コマンドのコピーのみ (UI 直接実行なし)。

## 1. Scope (実装)

- **`src/web/render.ts`**: 純 HTML 生成 (layout/table/cards/cliBlock/statusBadge/escapeHtml)。XSS escape。
- **`src/web/db.ts`**: harness.db を read で開く薄い helper (openWebDb/queryAll/listTables/tableCount、識別子検証)。
- **`src/web/screens.ts`**: L2 screen-list §1 の 15 画面 (PM 6 / HM 8 / GD 1) を harness.db read model に接続。
- **`src/web/router.ts`**: URL↔画面 ID 1:1 解決 (`:param` 抽出、純関数、screen-list §2)。
- **`src/web/app.ts`**: request→response 変換 (server 非依存・test 可能)。未知 path=404。
- **`src/web/server.ts`**: Bun.serve アダプタ (per-request open、@types/bun 不使用で globalThis 経由型付け)。
- **test** (`tests/web.test.ts`): render 純関数 / router 15 画面 1:1 + 404 / app (in-memory db) U-WEB-001..014。

## 2. Acceptance Criteria

- [x] 15 画面すべてが URL 解決し 200 描画、ID↔URL 1:1 (router test + 実 server smoke 7 経路)。
- [x] 全画面 read-only (副作用 API なし、action=CLI コピーのみ、screen-list §3 S5=b)。
- [x] 実 harness.db に対し end-to-end 描画確認 (smoke: /projects 5KB, L7 工程 18KB, doctor 24KB, HM-04 browse, 404)。
- [x] typecheck (tsc) / biome EXIT=0 / vitest web 14 passed (real-repo + in-memory fixture = substance, PLAN-L7-89)。
- [x] intra_runtime_subagent review approve (codex-intra-runtime + code-reviewer sonnet、VERDICT=pass、Important I-1 404 XSS 修正済)。
- [x] doctor EXIT=0 (impl-plan-trace / coding-rules / module-drift 含む)。

## 3. Out of scope (carry / 後続)

- **`ut-tdd web` CLI 配線** (src/cli.ts) と **screens.implemented flip** (projection-writer.ts) = 別 hot file が
  並行ランタイム作業中ゆえ最終統合フェーズで実施 (本 PLAN は src/web/ 新規ファイルに限定)。
- **中央 server 同期** (VPS / GitHub webhook / cron) = ADR-005 D2 で direction-only・auth-gated、Phase B server-sync。
- **L10 High-Fi UX refinement** (wireframe → 本実装の visual 洗練) = 後続。本 PLAN は機能する read-only 表示まで。

## 4. Trace

- 上流: L2 [screen-list.md](../design/harness/L2-screen/screen-list.md) §1-§4 (15 画面・URL・read-only・state)。
- impl: `src/web/render.ts` / `db.ts` / `screens.ts` / `router.ts` / `app.ts` / `server.ts`。
- data: harness.db (plan_registry / screens / trace_edges / findings / dependency_edges / model_runs ほか)。

## 5. 用語更新

用語更新なし (L2 screen-list で確定済の画面群の実装、新規用語の導入なし)。
