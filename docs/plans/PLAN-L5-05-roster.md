---
plan_id: PLAN-L5-05-roster
title: "PLAN-L5-05 (design/roster): L5 詳細設計 — subagent roster + command の module 結合粒度 back-fill (FR-L1-46/48)"
kind: design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: confirmed
created: 2026-06-01
updated: 2026-06-01
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — roster module 内部分割 / capability resolver / command D-API の結合境界レビュー (別 runtime)"
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
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
  references:
    - docs/plans/PLAN-L4-11-roster.md
    - docs/migration/internal-asset-inventory.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-01"
    verdict: approve
    scope: "self-review (pmo-sonnet) で roster/command module 結合粒度の整合成立、Important 2 是正済 (handover 2026-06-01)。claude-only の TL 代替"
---

# PLAN-L5-05 (design/roster): L5 roster + command module 結合粒度 back-fill

## §0 PLAN

L4-11 (roster+command、FR-L1-46/48) の L5 詳細化。**per-requirement PLAN** (PO 確定 2026-06-01「設計書化が要る要件ごとに 1 PLAN」、[[feedback-plan-per-requirement]])。L4=system 粒度 → 本 PLAN L5=module 結合粒度 (⇔L8) → L6=関数仕様 (⇔L7)。成果物 = module-decomposition + internal-processing 増分 ⇔ L8 結合テスト設計ペア。

## §1 目的

L4 function §1.1 roster building block + §2 CLI を **module 結合粒度**へ詳細化: ① `roster` module 新設 (内部関数群/責務/公開 IF)、② capability class 解決の module 内分割、③ 内部資産 command (`ut-tdd roster`/`ut-tdd asset`) の D-API 操作 + DbC、④ roster↔guard `runtime → roster` 一方向結合 (移行段階含む)。関数 signature は L6 carry。

## §2 背景

- 上流: function §1.1 (roster building block、層1/層2、roster→guard 一方向) / §2 CLI / architecture §3.1 (roster module、依存 schema/fs)
- 境界: ADR-004 (層1 markdown 正本 / 層2 TS)
- data 整合 (A-90): roster = in-memory scan-on-demand、永続 state なし (physical-data 増分不要、fs 正本)
- 既存 L5 (A-88 調査): module-decomposition §1/§5 に roster 未記載 (新設)、agent-guard §2.3 実装済完備

## §3 設計計画 (Step)

1. Step 1: module-decomposition §1 インベントリ + §5 責務境界表に `roster` (path=`src/roster/`、依存=schema/fs、carry=L6/L7) 追加 + §2.N 責務節
2. Step 2: capability class 解決を module 内分割 (load → 分類 → resolve)、FR-L1-37 model 推挙への入力提供 (連携、C12 外)
3. Step 3: internal-processing §1 D-API に `roster list/check` + `ut-tdd asset` 追加、§2 処理フロー (markdown scan → 整合 → 出力)、§3/§4 DbC pre/post (`roster check` post = .md↔guard allowlist 乖離 0 or fail-close)
4. Step 4: roster↔guard `runtime → roster` 一方向結合 (循環なし) + roster 未実装期間の guard ハードコード維持 = 移行段階 (`placeholder_deps:{waiting_layer:L7}`、実装状態解消型)
5. Step 5: 依存方向物理保証 (roster → schema 一方向、fs は loadX 端点隔離)
6. Step 6: L8 IT-ASSET (roster module 結合 / roster↔guard 整合) 追加 + 未確定 placeholder_deps
7. Step 7: carry → L6 (各 subcommand signature / capability resolver = `waiting_layer:L6` spec back-fill) / L7 (実装)
8. Step 8: self-review

## §4 受入条件 / DoD

> **Discovery 確定 (PLAN-DISCOVERY-02、2026-06-01)**: 本 PLAN の設計内容は roster Discovery (PLAN-DISCOVERY-02、kind=poc) で **設計→仮実装→検証→確定** を 1 周し `decision_outcome=confirmed`。確証度「低」だった capability resolver / roster↔guard 整合が spike で実証成立。確定設計 = **ID=filename stem / capability class ⊥ model family / nameMismatch WARN / `roster check` = allowlist 突合 fail-close**。本 PLAN はその確定を Forward で L5 設計書に反映 (redesign: spike 破棄・本実装は L7)。

- [x] module-decomposition に `roster` module 新設 (§1 inventory + §5 責務境界 + 依存方向注記、依存 schema/fs 一方向)
- [x] capability class 解決の module 内分割 = **capability⊥model** で確定 (FR-L1-37 model 推挙への入力は C12 外と明示)
- [x] internal-processing に command D-API (`roster list/check`) + DbC pre/post (§1/§2/§3/§4)
- [x] roster↔guard `runtime → roster` 一方向結合 + 移行段階 placeholder_deps (循環なし、spike で物理確認)
- [x] L8 IT-ASSET-01〜03 (roster) ペア + §2 量閉じ接続
- [x] 関数 signature / resolver アルゴリズム / parse zod 化 / パス解決を L6 carry (waiting_layer:L6)
- [x] L4 function §1.1 / architecture §3.1 との 1:1 整合 (二重定義なし、self-review pmo-sonnet 確認)
- [x] §6 用語更新 / §7 機能要求更新 (FR delta なし、FR-L1-46/48 詳細化)
- [x] self-review (pmo-sonnet) 通過 = 整合成立、Important 2 (`ut-tdd asset` L6 carry 明示 / spike 経緯削除) 是正済
- **carry (self-review Minor)**: `ut-tdd asset` (FR-L1-48) D-API は L6 詳細化 (`waiting_layer:L6`、本 PLAN は roster command を確定、asset は roster パターン後追い) / L8 IT-ASSET-01 は L6 本起票で「scan 全件」と「capability⊥model 解決」に分割

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / L4 = PLAN-L4-11-roster / 兄弟 = PLAN-L5-06-skill / PLAN-L5-07-drift / 後続 = PLAN-L6-NN-roster (関数仕様)
- 関連 ADR: ADR-004 / ADR-002 (依存方向)
- 参照: function §1.1/§2 / architecture §3.1 / internal-asset-inventory

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| roster / capability class | 参照 | 内部資産 subagent registry (層2 TS) と分類。ADR-004 由来の実装用語 | back-merge 不要 |

## §7 機能要求更新 (FR registry delta)

> **機能要求更新なし**。FR-L1-46/48 (L1 起票済) の module 結合詳細化。FR-L1-46/48 → L5 設計要素 → L8 IT-ASSET の trace を接続。
