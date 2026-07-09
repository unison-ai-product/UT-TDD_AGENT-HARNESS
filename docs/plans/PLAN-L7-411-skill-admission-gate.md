---
plan_id: PLAN-L7-411-skill-admission-gate
title: "PLAN-L7-411 (add-impl): skill admission gate の実装 — 判定関数群 + ut-tdd skill admit CLI + ledger/quarantine + doctor skill-admission-coverage + 外部化カタログ生成 + supersede lint + tests"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: PM (Opus) / PO (人間)
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL — 判定関数群の決定論性 / resolveAdmission の default-closed 不変条件 / 既存 gate/advisor/supersession/scoring 非破壊のレビュー"
  - role: qa
    slot_label: "QA — U-SKILL-ADMIT (admit-new 3点合致 / judge no_objection 単独では admit しない / quarantine 非再浮上 / NEW-only coverage / カタログ drift) のカバレッジ"
generates:
  - artifact_path: docs/plans/PLAN-L7-411-skill-admission-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-411-skill-admission-backfill.md
    artifact_type: markdown_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-67-skill-admission-gate.md
  requires: []
---

# PLAN-L7-411 (add-impl): skill admission gate の実装

## §0 位置づけ

PLAN-L6-67 の機能設計 ([skill-admission.md](../design/harness/L6-function-design/skill-admission.md)) を実装する add-impl。back-fill pairing (add-impl → Reverse 合流) は **PLAN-REVERSE-411**。判定は ingest 時 (`ut-tdd skill admit`) に実行し、doctor は決定論残渣のみ検証する (judge/LLM を CI に入れない、設計 §8)。

## §工程表

### Step 1: [直列] 判定関数群 (純関数・決定論)
- 直列理由 = **file_conflict** (src/skill-engine/admission.ts)。`analyzeSkillFit` (analyzeSkillAssignments へ委譲 + readability + trigger 衝突) / `computeSkillNovelty` (metadataOverlap へ委譲、凍結 snapshot) / `analyzeDecisionPoints` (構造 + 一般語 denylist) / `repairSkillCandidate` (冪等) / `resolveAdmission` (default-closed 判定表) / `renderSkillCatalogIndex` (frontmatter SSoT 生成)。

### Step 2: [直列] supersede lint + doctor 配線
- 直列理由 = **downstream_dependency**。`src/lint/skill-supersession.ts` (analyzePlanSupersession と同型、双方向強制) + doctor `skill-admission-coverage` (NEW-only fail-close: baseline 外 skill の台帳欠落 + カタログ drift)。

### Step 3: [直列] CLI ut-tdd skill admit + ledger/quarantine
- 直列理由 = **downstream_dependency**。candidate → 機械判定 → (repair) → cross_agent judge dispatch (buildAdvisorDecision / evaluateGateReview、単一 runtime は reject/flag 限定) → resolveAdmission → 適用 (admit=skills/へ + カタログ再生成 / merge=supersede 必須 / reject=quarantine)。台帳 `.ut-tdd/skill_admissions/*.json` → harness.db projection。policy 閾値は `.ut-tdd/skill-admission-policy.json` (外部化)。

### Step 4: [直列] tests + 全回帰
- 直列理由 = **downstream_dependency**。U-SKILL-ADMIT (AC-1〜9) + 実 repo ガード (baseline 54 件 fail-close しない / 新規のみ) + typecheck 0 / vitest green / doctor exit 0。

### Step 5: [直列] review Step (cross_agent / hybrid)
- 直列理由 = **downstream_dependency**。判定関数の決定論性 + 既存非破壊をレビュー。通過後 review_evidence 記録 + confirmed flip + PLAN-REVERSE-411 で back-fill。

## §実装計画

詳細は [skill-admission.md](../design/harness/L6-function-design/skill-admission.md) §4-§8 を正本とする。

- **src/skill-engine/admission.ts**: 判定関数群 (設計 §4-§5)。novelty/fit は既存へ委譲、新規類似度実装を書かない。
- **src/lint/skill-supersession.ts**: supersede 双方向強制 (設計 §7.6)。
- **src/doctor/index.ts**: `analyzeAdmissionCoverage` 配線 (設計 §8、NEW-only、決定論残渣のみ)。
- **src/cli.ts**: `ut-tdd skill admit` (設計 §4.5 / §7)。judge dispatch は既存 advisor/gate 再利用。
- **tests/skill-admission.test.ts**: U-SKILL-ADMIT-001〜009。

## §6 用語更新

> skill admission gate 用語群は `skill-admission.md` §10 を踏襲。新規語追加なし。L0 back-merge は PLAN-REVERSE-411。

## §8 DoD

- [ ] 判定関数群 + supersede lint + doctor 配線 + CLI + ledger/quarantine 実装
- [ ] U-SKILL-ADMIT 全緑、baseline 54 件を fail-close しない (NEW-only)、typecheck 0 / vitest green / doctor exit 0
- [ ] judge/LLM が CI・doctor 合否に現れない (設計 AC-9)
- [ ] review 前置 (cross_agent) → review_evidence 記録 + confirmed flip
- [ ] PLAN-REVERSE-411 で back-fill pairing (add-impl → Reverse 合流)
