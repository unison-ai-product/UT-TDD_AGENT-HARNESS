---
plan_id: PLAN-L5-06-skill
title: "PLAN-L5-06 (design/skill): L5 詳細設計 — skill catalog/recommender/injector の module 結合粒度 back-fill (FR-L1-47)"
kind: design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: draft
created: 2026-06-01
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — skills module 内部分割 (catalog/recommender/injector) の結合境界レビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
  references:
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/migration/internal-asset-inventory.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-06 (design/skill): L5 skill module 結合粒度 back-fill

## §0 PLAN

L4-12 (skill-pack、FR-L1-47) の L5 詳細化。**per-requirement PLAN** ([[feedback-plan-per-requirement]])。L4=system → 本 PLAN L5=module 結合粒度 (⇔L8) → L6=関数仕様 (⇔L7)。成果物 = module-decomposition (+ skill 注入操作は internal-processing) 増分 ⇔ L8 ペア。

## §1 目的

L4 architecture §3.1 skills building block を **module 結合粒度**へ詳細化: ① `skills` module の内部分割 (catalog 構築 / recommender / injector の 3 内部責務)、② `docs/skills/**/*.md` (層1) → 注入セット (層2) の結合 IF、③ skill 注入/推挙の D-API 操作 (internal-processing)。recommender スコア・injector の L 別注入セットは L6 carry。

## §2 背景

- 上流: architecture §3.1 skills building block (`loadCatalog()`/`recommendSkill()`/`injectByLayer()`、依存 schema/fs)
- 境界: ADR-004 (層1 skill 本文 markdown 正本 / 層2 catalog-injector TS)
- data 整合 (A-90): skill catalog = in-memory scan-on-demand、永続 state なし (physical-data 増分不要)
- 既存 L5 (A-88 調査): module-decomposition §1/§5 に skill stub 既出 → 内部分割を具体化
- 連携: FR-L1-12 (L 単位 skill 注入) / FR-L1-37 (model 推挙)

## §3 設計計画 (Step)

1. Step 1: module-decomposition の skill stub (§1/§5) を内部分割へ具体化 (catalog / recommender / injector の 3 内部責務 + 公開 IF)
2. Step 2: 層1 (`docs/skills/**/*.md`) ↔ 層2 (catalog-injector TS) の結合境界 (ADR-004)、curate 区分方針 (core-optional-drop) は方針記述のみ (アルゴリズムは L6)
3. Step 3: internal-processing に skill 推挙/注入の D-API 操作 + DbC (例: injectByLayer post = L 別注入セットが catalog 部分集合)
4. Step 4: 依存方向物理保証 (skills → schema 一方向、循環なし、fs は loadX 端点隔離)
5. Step 5: L8 IT-ASSET (skill catalog load 結合 / 依存方向) 追加 + 未確定 placeholder_deps
6. Step 6: carry → L6 (recommender スコアリング / injector の L 別注入セット定義 = `waiting_layer:L6` spec back-fill) / L7 (実装、curate 着手は porting-map W10 = 実装状態解消型)
7. Step 7: self-review

## §4 受入条件 / DoD

- [x] module-decomposition の skill stub を内部分割具体化 (catalog/recommender/injector、依存 schema/fs 一方向)
- [x] 層1/層2 結合境界 (ADR-004) + curate 区分方針 (アルゴリズムは L6 carry)
- [x] internal-processing に skill 推挙/注入 D-API + DbC
- [x] L8 IT-ASSET (skill) ペア + 未確定 placeholder_deps + 依存明示
- [x] recommender/injector の関数仕様を L6 carry (waiting_layer:L6) / curate 完了は L7 (実装状態解消型)
- [x] L4 architecture §3.1 との 1:1 整合 (二重定義なし)
- [x] §6 用語更新 / §7 機能要求更新
- [x] self-review 通過

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / L4 = PLAN-L4-12-skill-pack / 兄弟 = PLAN-L5-05-roster / PLAN-L5-07-drift / 後続 = PLAN-L6-NN-skill (関数仕様)
- 関連 ADR: ADR-004 / ADR-002 (依存方向)
- 参照: architecture §3.1 / internal-asset-inventory §2 / FR-L1-12/37

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| skill catalog / injector | 参照 | 内部資産 skill の registry/注入機構 (層2 TS)。ADR-004 由来の実装用語 | back-merge 不要 |

## §7 機能要求更新 (FR registry delta)

> **機能要求更新なし**。FR-L1-47 (L1 起票済) の module 結合詳細化。FR-L1-47 → L5 設計要素 → L8 IT-ASSET の trace を接続。
