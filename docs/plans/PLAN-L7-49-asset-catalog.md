---
plan_id: PLAN-L7-49-asset-catalog
title: "PLAN-L7-49: harness.db automation asset catalog"
kind: impl
layer: L7
drive: db
status: draft
created: 2026-06-11
updated: 2026-06-11
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — asset catalog / prompt body 非格納 invariant のレビュー (別 runtime)"
  - role: qa
    slot_label: "QA — IT-ASSET-DB-01 の観点レビュー"
generates:
  - artifact_path: src/assets/catalog.ts
    artifact_type: source
  - artifact_path: tests/asset-catalog.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - docs/test-design/harness/L8-integration-test-design.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-49: harness.db automation asset catalog

## §0 PLAN

工程表 PLAN-L7-44 の span ⑤ (G-L7DB.B → G-L7DB.C、③④と並列)。projection (span ②) の上に
skill / roster / command doc の自動化資産カタログを実装する。prompt body は markdown source の
まま保持し DB には格納しない (メタデータ + drift status のみ)。

## §1 Objective

- `catalogAutomationAssets()` → skill / roster / command docs scan → `automation_assets`
  (asset_type / path / trigger / role / capability / drift_status / indexed_at) + search index 更新。
- CLI: `ut-tdd asset catalog` (asset rows 出力)。

## §2 不変条件 (DbC)

- source path は docs / .claude の承認 roots 配下に限定。
- **prompt body / secret を格納しない** (メタデータ + drift status のみ)。
- drift / empty は finding として可視化。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] IT-ASSET-DB-01 を TDD Red 先行
直列理由: downstream_dependency
`tests/asset-catalog.test.ts` に IT-ASSET-DB-01 (prompt body 非格納 / drift・empty=finding) の
失敗テストを置く。

### Step 2: [直列] asset-catalog 実装
直列理由: downstream_dependency (span ② projection) + file_conflict (src/assets/catalog.ts)
catalogAutomationAssets + `asset catalog` CLI を実装し Green。

### Step 3: [直列] review 前置
直列理由: downstream_dependency
承認 roots 限定 / prompt body 非格納 / drift=finding を review し evidence 記録。

## §3.1 実装計画

- 情報源: `internal-processing.md` (catalogAutomationAssets DbC)、`if-detail.md` (`asset catalog`
  出力契約)、`physical-data.md` (automation_assets table)、`L8` IT-ASSET-DB-01。
- 既存 asset-drift lint (`src/lint` の asset-drift) と responsibility が重複しないよう、catalog は
  projection / search、drift 判定は既存 rule を参照する形にする。

## §4 DoD

- [ ] IT-ASSET-DB-01 green。
- [ ] `asset catalog` runnable、prompt body 非格納。
- [ ] 全回帰 + doctor green、review 前置 evidence。

## §6 用語更新

| term | type | definition / delta | L0 back-merge |
|---|---|---|---|
| automation asset catalog | clarified | skill/roster/command doc メタデータ + drift status の検索可能 projection。prompt body は markdown source のまま。 | not required; L7 scoped |
