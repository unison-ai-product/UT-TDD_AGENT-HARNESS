---
plan_id: PLAN-L5-07-drift
title: "PLAN-L5-07 (design/drift): L5 詳細設計 — 内部資産 drift lint (asset-drift rule) の module 結合粒度 back-fill (FR-L1-49)"
kind: design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L5 asset-drift freeze. Rule registration, fail-close, and placeholder dependency contracts are paired to L8 IT-ASSET-06..07 with GWT-level coverage."
created: 2026-06-01
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — asset-drift rule の IMP-033 rule engine 結合 (module 登録方式) のレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
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
    - docs/governance/gate-design.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
  references:
    - docs/plans/PLAN-L4-13-drift-lint.md
    - docs/adr/ADR-002-dependency-direction-and-auto-map.md
    - docs/migration/internal-asset-inventory.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-07 (design/drift): L5 内部資産 drift lint module 結合粒度 back-fill

## §0 PLAN

L4-13 (drift-lint、FR-L1-49) の L5 詳細化。**per-requirement PLAN** ([[feedback-plan-per-requirement]])。L4=system → 本 PLAN L5=module 結合粒度 (⇔L8) → L6=判定関数仕様 (⇔L7)。**新規 lint module を手書きせず IMP-033 cross-check rule engine の rule 型 `asset-drift` インスタンス**として実現 (architecture §4.1)。成果物 = module-decomposition 増分 ⇔ L8 ペア。

## §1 目的

L4 architecture §4.1 の `asset-drift` rule を **module 結合粒度**へ詳細化: ① rule engine (gate-design §5 rule registry) への `asset-drift` 登録方式 (module 結合)、② doc registry が `.claude/agents/*.md` / `docs/skills/` を scan し auto-enroll する結合、③ fail-close 経路 (doctor/gate exit) の結合、④ DB 未充足検知 (placeholder_deps) との統合。各検査項目の判定関数 (HELIX パス検出 / allowlist 照合 / regex) は L6 carry。

## §2 背景

- 上流: architecture §4.1 (asset-drift = IMP-033 rule 型) / gate-design §5 rule registry (`asset-drift` 登録済、A-86) / §7 L7 carry
- 既存 dependency-drift (ADR-002/IMP-032) と並置 (両方 IMP-033 rule)
- 検査項目 (inventory §1): HELIX 絶対パス残存 / `helix codex` 直叩き / `docs/skills/` 空 / roster↔guard allowlist 整合
- 境界: ADR-004 (drift lint = 層2 番人、markdown 正本に HELIX 前提が残らないか fail-close)

## §3 工程表 (Step + 進捗)

### Step 1: [直列] asset-drift rule 結合定義
直列理由: downstream_dependency
module-decomposition §4 (rule engine) に `asset-drift` rule の module 結合を記述し、新規 module を起こさず gate-design §5 rule registry と整合させる。

### Step 2: [直列] doc registry auto-enroll 定義
直列理由: downstream_dependency
Step 1 の rule 境界を前提に、`.claude/agents/*.md` / `docs/skills/` の scan → auto-enroll 結合を定義する。

### Step 3: [直列] fail-close / placeholder_deps 統合
直列理由: downstream_dependency
Step 1/2 の検査対象を doctor / gate exit と DB 未充足検知 placeholder_deps (physical-data §7) に接続する。

### Step 4: [直列] 検査項目 trace の確定
直列理由: downstream_dependency
Step 1〜3 の rule 実行経路に、HELIX path residue、command residue、docs/skills vacancy、roster↔guard allowlist 整合の検査項目を割り当てる。

### Step 5: [直列] 依存方向の物理保証
直列理由: downstream_dependency
Step 1〜4 の rule / registry / fail-close 境界を import graph へ反映し、rule が engine に従属する構造を確認する。

### Step 6: [直列] L8 IT-ASSET pair 接続
直列理由: downstream_dependency
Step 1〜5 の結合粒度を L8 IT-ASSET-06〜07 に接続し、asset-drift rule 実行 / fail-close の検証粒度を閉じる。

### Step 7: [直列] L6/L7 carry の確定
直列理由: downstream_dependency
Step 1〜6 の module 契約を各検査の判定関数 signature / HELIX パス regex / allowlist 照合の L6 back-fill と L7 engine 実装 carry へ接続する。

### Step 8: [直列] review
直列理由: downstream_dependency
Step 1〜7 と L8 IT-ASSET-06〜07 の粒度を self / pmo-sonnet / TL reviewer のいずれかで確認する。

## §3.1 実装計画

- L5 では `module-decomposition.md` の asset-drift rule 結合設計を更新し、runtime 実装は行わない。
- L6 で各検査の判定関数 signature / regex / allowlist 照合、L7 で TypeScript 実装と vitest に落とす。
- 情報源は L4 architecture §4.1、gate-design §5、ADR-004、ADR-002、internal-asset-inventory §1 とする。

## §4 受入条件 / DoD

- [x] module-decomposition §4 に `asset-drift` rule を IMP-033 rule 型として結合記述 (新規 lint 手書きせず)
- [x] auto-enroll (doc registry scan) + fail-close 経路 (doctor/gate) の結合
- [x] 検査項目 4 種を inventory §1 / ADR-004 と trace
- [x] DB 未充足検知 (placeholder_deps) 統合
- [x] dependency-drift (ADR-002) と並置 (両方 IMP-033、二重定義なし)
- [x] L8 IT-ASSET (drift) ペア + 未確定 placeholder_deps + 依存明示
- [x] 判定関数 signature/regex を L6 carry (waiting_layer:L6) / engine 実装は L7
- [x] §6 用語更新 / §7 機能要求更新
- [x] self-review 通過

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / L4 = PLAN-L4-13-drift-lint / 兄弟 = PLAN-L5-05-roster / PLAN-L5-06-skill / 後続 = PLAN-L6-NN-drift (判定関数仕様)
- 関連 ADR: ADR-004 (境界番人) / ADR-002 (dependency-drift 並置)
- 参照: architecture §4.1 / gate-design §5 / inventory §1

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| asset-drift | 参照 | IMP-033 rule 型 (内部資産 .md の HELIX 前提・roster↔guard 乖離検出)。dependency-drift と並置 | back-merge 不要 |

## §7 機能要求更新 (FR registry delta)

> **機能要求更新なし**。FR-L1-49 (L1 起票済) の module 結合詳細化。FR-L1-49 → L5 設計要素 → L8 IT-ASSET の trace を接続。
