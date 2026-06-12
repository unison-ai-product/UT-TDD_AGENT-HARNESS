---
plan_id: PLAN-L7-10-governance-enforcement
title: "PLAN-L7-10 (add-impl): governance enforcement lints 実装 — src/lint/scrum-reverse + propagation + doctor.ok hard-fail 連動 (A/B/C、IMP-064/065/051)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 純関数 lint の正しさ / path 末尾一致の境界固定 / extractSignals のテーブルスコープ / doctor.ok 連動が handover/agent-slots の warn-only を壊さないかのレビュー"
  - role: qa
    slot_label: "QA — U-SCRUMREV / U-PROP の oracle 被覆 + 実 repo 回帰ガード (CI vitest で fail-close) の妥当性"
generates:
  - artifact_path: src/lint/scrum-reverse.ts
    artifact_type: source_module
  - artifact_path: src/lint/propagation.ts
    artifact_type: source_module
  - artifact_path: tests/scrum-reverse.test.ts
    artifact_type: test_code
  - artifact_path: tests/propagation.test.ts
    artifact_type: test_code
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-09-governance-enforcement.md
  requires:
    - docs/plans/PLAN-L6-09-governance-enforcement.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 2回 cut-off (diff 規模で truncate、完全 verdict 未取得) → PM 直接検証で補完、実 repo ガード (U-SCRUMREV-005 / U-PROP-004) CI green (handover 2026-06-04 session8 §6)"
---

# PLAN-L7-10 (add-impl): governance enforcement lints 実装

## §0 位置づけ

PLAN-L6-09 設計の TS 実装。A=scrum-reverse / B=backfill hard-fail の doctor.ok 連動 / C=propagation。**add-impl = Reverse 合流が必須** (KIND_BACKFILL required) → `PLAN-REVERSE-09-governance-enforcement` が本 PLAN を requires し、§7.8.1/§1.2/§1.10 へ back-fill する (本 PLAN 自身の新 lint がこの pairing を検証する dogfood)。

## §工程表

### Step 1: [直列] A scrum-reverse.ts + test
- 直列理由 = **file_conflict** (新規ファイル)。`analyzeScrumReverse` + 実 repo ガード U-SCRUMREV-005。

### Step 2: [並列] C propagation.ts + test
- A と異なるファイルで独立 → [並列] 可 (file_conflict/downstream/shared_state いずれも該当せず)。`analyzePropagation` + U-PROP-004。

### Step 3: [直列] B doctor.ok 連動
- 直列理由 = **file_conflict** (src/doctor/index.ts に A/C を配線、shared_state=runDoctor.ok)。`checkBackfillResult`/`checkScrumReverse`/`checkPropagation` を hard-fail 連動 (handover/agent-slots は warn-only 維持)。

### Step 4: [直列] review Step + 回帰
- 直列理由 = **downstream_dependency**。code-reviewer + typecheck/vitest/biome 全 green。

## §実装計画

- **scrum-reverse.ts** (情報源: requirements §1.2 line 139/156/809、backfill-pairing.ts pattern): pocOrphans (confirmed poc redesign 除く × reverse 無) + badReverseRefs (reverse→非 confirmed poc)。path 末尾 `/id.md` 境界固定。
- **propagation.ts** (情報源: concept §2.6 / requirements §7.8.1 の `\| signal \| mode \|` テーブル): `extractSignals` でテーブルスコープ限定抽出、集合一致。
- **doctor wiring** (情報源: 既存 analyzeBackfill.ok): `runDoctor.ok = backfill.ok ∧ scrumRev.ok ∧ propagation.ok`。
- 実 repo finding (本実装で検出): DISCOVERY-02 frontmatter `promotion_strategy` 欠落 (IMP-066) / forced_stop・design_uncertain 非対称 (IMP-065 token 完成) を解消。

## §6 用語更新

- **scrum-reverse lint** / **propagation lint**: §10.3 へ back-merge 済 (L6-09 と同語、living glossary)。

## §7 DoD
- [x] A/B/C 実装 + U-SCRUMREV/U-PROP/doctor test (vitest 177 pass)
- [x] doctor exit 0 / scrum-reverse・propagation OK / 実 repo ガード green
- [x] 対応 Reverse (REVERSE-09) とペア (KIND_BACKFILL required)
- [x] review 前置 (code-reviewer) / typecheck 0 / biome CLEAN
