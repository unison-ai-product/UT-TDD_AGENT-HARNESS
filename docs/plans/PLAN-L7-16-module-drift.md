---
plan_id: PLAN-L7-16-module-drift
title: "PLAN-L7-16 (add-impl): module-drift lint の実装 — src/lint/module-drift.ts (parse/scan/analyze/loader/messages) + doctor checkModuleDrift (hard/fail-close) + tests/module-drift.test.ts (U-MDRIFT-001〜005、IMP-075)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — parseListedModules の §3.1 限定 regex 境界 / scanActualModules の dir+top-level ts 正規化 / analyzeModuleDrift の actual⊆listed / doctor hard/fail-close 配線 (claude-only は code-reviewer/pmo-sonnet 代替)"
  - role: qa
    slot_label: "QA — U-MDRIFT-001〜005 が §3.1 限定切り出し・将来 module 非 drift・実 repo 孤児0 ガードを被覆 / 実 repo 完全性回帰 (U-MDRIFT-005)"
generates:
  - artifact_path: src/lint/module-drift.ts
    artifact_type: source_module
  - artifact_path: tests/module-drift.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-15-module-drift.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "module-drift 実装 (src/lint/module-drift.ts + doctor checkModuleDrift hard/fail-close + tests/module-drift.test.ts) のレビュー。純関数/loader 分離・§3.1 限定 regex・actual⊆listed・doctor hard gate・既存 lint 非重複を確認。typecheck 0 / vitest green 後に review。pmo-sonnet 確定 (code-reviewer は IMP-009 truncate)。claude-only TL/QA 代替"
---

# PLAN-L7-16 (add-impl): module-drift lint の実装 (IMP-075)

## §0 位置づけ

PLAN-L6-15 の機能設計を実装する add-impl。`src/lint/module-drift.ts` (parseListedModules/scanActualModules/analyzeModuleDrift/loadModuleDocs/moduleDriftMessages) + `src/doctor/index.ts` `checkModuleDrift` (hard/fail-close 配線) + `tests/module-drift.test.ts` (U-MDRIFT-001〜005)。back-fill pairing (add-impl → Reverse 合流) は PLAN-REVERSE-15。

## §工程表

### Step 1: [直列] lint module 実装
- 直列理由 = **file_conflict** (module-drift.ts を書く)。純関数 (parse/scan/analyze) + loader + messages を backfill-pairing.ts 様式で。

### Step 2: [直列] doctor 配線 (hard/fail-close)
- 直列理由 = **downstream_dependency + file_conflict** (Step 1 の関数を使い doctor/index.ts を書く)。checkModuleDrift を runDoctor に hard/fail-close で配線。

### Step 3: [直列] tests + 全回帰
- 直列理由 = **downstream_dependency**。U-MDRIFT-001〜005 + 全回帰 green + doctor exit 0。

### Step 4: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。pmo-sonnet で純関数/loader 分離・§3.1 regex 境界・hard/fail-close 配線・既存 lint 非重複をレビュー。通過後 review_evidence 記録 + confirmed flip + REVERSE-15 で back-fill。

## §実装計画

- **src/lint/module-drift.ts** (情報源: backfill-pairing.ts pattern + L6-15 機能設計 §2-§3): parse/scan/analyze/loader/messages。
- **src/doctor/index.ts** (情報源: checkPairFreeze hard/fail-close pattern): checkModuleDrift。
- **tests/module-drift.test.ts** (情報源: vmodel-pair.test.ts pattern): U-MDRIFT-001〜005。

## §6 用語更新

> L6-15 §6 (module-drift) を踏襲。新規語の追加なし (impl は L6-15 の語を実装)。

## §8 DoD

- [x] src/lint/module-drift.ts + doctor checkModuleDrift (hard/fail-close) + tests 実装
- [x] typecheck 0 / vitest 全回帰 green / doctor exit 0 / module-drift 孤児0 surface
- [x] review 前置 (pmo-sonnet) → 通過後 review_evidence 記録 + confirmed flip
- [x] PLAN-REVERSE-15 で back-fill pairing (add-impl → Reverse 合流)
