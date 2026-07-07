---
plan_id: PLAN-L7-368-design-lint-db-projection
title: "PLAN-L7-368 (impl): 設計層 lint の DB 投影 + DB-driven 検出 gate"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 設計 lint の DB 投影 schema と gate severity の設計レビュー"
  - role: se
    slot_label: "SE - pair-freeze/design-quality lint の findings/coverage 投影 + DB-driven check"
generates:
  - artifact_path: docs/plans/PLAN-L7-368-design-lint-db-projection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-330-test-design-l6-crosswalk.md
    - docs/plans/PLAN-L7-353-design-doc-ir-gate.md
    - src/vmodel/lint.ts
    - src/state-db/projection-writer.ts
    - src/doctor/doc-registry.ts
    - src/doctor/process-quality.ts
---

# PLAN-L7-368 (impl): 設計層 lint の DB 投影 + DB-driven 検出

## Status

draft 起票 (2026-07-07 DB三ループ監査 + PO 追加指示「設計部分のデータベース検出機構も強化」)。
着手時は add-impl + Reverse pairing へ昇格 (route_mode=add-feature debt)。

## 背景

設計層 (docs/design/) の検出はほぼ全て **file-driven** で、DB-driven gate は
`checkDriveDbRegistration` のみ。設計 fact が DB に投影されず drift/coverage が queryable でない:

- **pair-freeze 孤児が finding 化されない**: `analyzePairFreeze` (`src/vmodel/lint.ts`) の
  pair-missing / ref-unresolved / trace-orphan 判定は `checkVerificationGroupsResult` が消費するだけで
  `findings` 行を書かない。relation graph は同じ source から `pairs` edge を作るが孤児 verdict を持たず、
  DB は「pair 未作成 (実 gap)」と他ノードを区別できない。
- **設計品質 lint が prose only**: `checkDocConsistency` / `checkEntityCoverage` / `checkFrRegistryAudit`
  (`src/doctor/doc-registry.ts`)、`checkSubDocCatalogDrift` / `checkSubDocSectionStructure` /
  `checkL6FrCoverage` / `checkFrRoadmapCoverage` (`src/doctor/process-quality.ts`)、`checkModuleDrift` は
  すべて `analyze*(load*Docs())` を直接呼び、`coverage`/`findings`/`quality_signals` 行を残さない。
  ダッシュボード不可視で時系列追跡もできず、pillar 3 に反する。

## スコープ

1. **pair-freeze 孤児の finding 投影**: `analyzePairFreeze(loadPairDocs())` を rebuild で走らせ、
   `findings` 行 (kind=`design-pair-orphan:<pair-missing|ref-unresolved|trace-orphan>`,
   subject_id=設計 doc path, source=`vmodel-pair-freeze`) を投影する。
2. **設計品質 lint の DB 投影**: doc-consistency / entity-coverage / fr-registry-audit /
   sub-doc-catalog-drift / sub-doc-section-structure / l6-fr-coverage / fr-roadmap-coverage /
   module-drift の違反件数を rebuild ごとに `coverage` (scope=`design-quality`, subject_id=check 名,
   metric=違反数, threshold=0, status=pass/blocked) へ 1 行/check 投影する。
3. **DB-driven gate**: 投影された design finding/coverage を読む doctor check を追加し、既存 file-driven
   check と二重化せず DB を正本にする経路を用意する (gate severity=hard/advisory は設計判断)。

## 非対象

- design→test-design→test の `verifies` edge 追加は **PLAN-L7-330** (v2 parked) が近接。本 PLAN は
  pair-freeze/設計品質 lint の投影に絞り、L7-330 promote を推奨参照とする。
- design-doc-IR grade の投影は **PLAN-L7-353** (v2 parked) の延長。本 PLAN scope 外。

## §3 工程表

### Step 1: 設計 lint 投影 schema + gate severity 設計 (TL) [直列]

findings/coverage 列と、どの設計 lint を DB 正本化するか、gate を hard/advisory どちらにするかを確定する。
後続実装がこの契約に依存 (downstream_dependency)。

### Step 2: pair-freeze 孤児 + 設計品質 lint の投影実装 [直列]

`projection-writer.ts` rebuild の共有パイプラインを編集するため直列 (shared_state)。

### Step 3: DB-driven design-detection doctor check [並列]

投影 finding/coverage を読む gate。独立 module のため並列可。

### Step 4: 投影 + gate regression test [並列]

孤児/違反が findings/coverage に現れ、gate が検出することを固定。別 test file のため並列可。

### Step 5: cross-runtime レビュー (pmo-sonnet / codex) [直列]

file-driven check との二重化回避、gate severity、L7-330/353 との scope 分離を別ランタイムでレビュー
(downstream_dependency)。

## §3.1 実装計画

`src/state-db/projection-writer.ts` に `projectDesignPairFreezeFindings` / `projectDesignQualityCoverage`
を追加し rebuild へ配線 (`src/vmodel/lint.ts` の `analyzePairFreeze` / `loadPairDocs` を再利用) →
`src/doctor/` に DB-driven な `checkDesignDetection` を追加し check-registry へ登録 → `tests/` に投影 +
gate regression を追加。既存 file-driven check は当面併存させ二重報告しない。

## DoD / 受入基準

- [ ] `ut-tdd db rebuild` 後に pair-freeze 孤児が `findings` に、設計品質 lint 違反が `coverage` に
      現れる (`bun run src/cli.ts db rebuild`、test 固定)。
- [ ] `ut-tdd doctor` の DB-driven design-detection check が投影 fact から drift/coverage を検出する。
- [ ] 既存 file-driven check と二重報告しない (test 固定)。
- [ ] L7-330 / L7-353 との scope 分離が references に明記されている。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
