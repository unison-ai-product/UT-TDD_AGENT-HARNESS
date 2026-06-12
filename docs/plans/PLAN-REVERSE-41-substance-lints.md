---
plan_id: PLAN-REVERSE-41-substance-lints
title: "PLAN-REVERSE-41 (reverse): substance-gate lint 群 — oracle⇔実test (IMP-128) + tracked⊆canonical (IMP-127) を上位設計へ back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: fullstack
status: confirmed
created: 2026-06-10
updated: 2026-06-10
owner: PM (Opus) / PO (人間)
forward_routing: L5
promotion_strategy: reuse-with-hardening
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-10"
    tests_green_at: "2026-06-10"
    verdict: pass
    scope: "塊B oracle-test-trace (IMP-128、forward-citation baseline 89) + tracked-canonical (IMP-127、baseline 0)。code-reviewer APPROVE / Critical 0 / Important 0、Minor 2 は反映済。hybrid だが Codex CLI が壊れ legacy のため intra_runtime_subagent review。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: tl
    slot_label: "TL — substance-gate lint 設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-41-substance-lints.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/oracle-test-trace.ts
    artifact_type: source_module
  - artifact_path: src/lint/oracle-test-trace-baseline.ts
    artifact_type: source_module
  - artifact_path: tests/oracle-test-trace.test.ts
    artifact_type: test_code
  - artifact_path: src/lint/tracked-canonical.ts
    artifact_type: source_module
  - artifact_path: tests/tracked-canonical.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/improvement-backlog.md
---

# PLAN-REVERSE-41 (reverse): substance-gate lint 群

## §0 Position

実装工程表 L7 の **塊B (G-L7.A → G-L7.B)** span。FR-L1-18 (横断検出) の descent として
substance-gate lint を 2 本入れる ([[feedback_coverage_not_substance]]):

- **IMP-128**: oracle 宣言 ⇔ 実テスト実在の突合 (test-design の U-*/IT-* が tests/ に現れるか)。
- **IMP-127**: tracked 集合 ⊆ repository-structure.md canonical ツリーの突合 (asset-drift 拡張)。

Reverse-first 骨格。baseline は known-debt を許容し NEW のみ fail-close (impl-plan-trace と同型)。

## §1 R0-R3

- **R0**: oracle⇔test は l6-fr-coverage が ID 接続のみ・fs 実在を見ない穴 (IMP-083 同型)。tracked⊆canonical は asset-drift が HELIX/legacy 残渣のみで canonical ツリー突合を持たない穴。
- **R0 実測 finding (2026-06-10、IMP-128 の設計困難を実証)**: 素朴な「test-design 宣言 oracle ID ⇔ tests/ 内 ID 文字列一致」で突合すると、宣言 203・tests 参照 134・**未参照 89 件**。だが未参照 89 の大半は **テスト実在だが `it()` 文字列に ID を書いていないだけ** (U-ASSETDRIFT/U-CHGIMPACT/U-CODE/U-DDDTDD 等 = 実装済機能)。→ **素朴 ID マッチは false-positive だらけ**で 89 件 baseline は coverage≠substance を papering する悪い gate になる ([[feedback_coverage_not_substance]] に反する)。**真の substance 検査には ① 既存テストへの ID citation back-fill (約89件) か ② ID 文字列でない test↔oracle マッピング設計が要る** = impl-plan-trace (8件・明確) と質が違い、rush 不可。これが IMP-128 が needs-reverse-first である実証であり、Reverse-first が「noise gate の出荷」を防いだ。**確定方針 (R3)**: 素朴 ID マッチ baseline では出荷しない。citation 規律 (NEW oracle は tests に ID 明記) を forward 導入する案を L6 で設計し、既存 89 は段階 citation back-fill とするか PO 判断。
- **R1 (FR)**: 両者 FR-L1-18 (接続欠損) descent。新 FR 番号要否は確定時判断。
- **R2 (DbC)**: oracle-test-trace = test-design doc の oracle ID 集合 ∖ tests/ 参照集合 ∖ baseline = orphan。tracked-canonical = git tracked path ∖ canonical ツリー prefix ∖ baseline = drift。
- **R3 (baseline)**: 既存の宣言済未実装 oracle (外部ツーリング 44 のうち未 scaffold 分) / canonical 未収載 tracked を baseline 化し NEW のみ fail。

## §工程表

### Step 1: [直列] oracle-test-trace (IMP-128) を TDD Red→Green + doctor 配線

直列理由: downstream_dependency. test-design ⇔ tests の突合ロジック確定が先。

### Step 2: [直列] tracked-canonical (IMP-127) を TDD Red→Green + doctor 配線

直列理由: file_conflict. doctor 同一領域を Step 1 と続けて書く。

### Step 3: [直列] review (固定 review Step)

直列理由: downstream_dependency. green 後に intra_runtime_subagent review。

## §実装計画

- **Step 1**: 情報源 = docs/test-design/harness/L7-unit-test-design.md / L8-integration-test-design.md (oracle ID) + tests/*.ts + src/lint/impl-plan-trace.ts (baseline パターン)。
- **Step 2**: 情報源 = docs/governance/repository-structure.md (canonical ツリー) + git tracked + src/lint/asset-drift.ts。
- **Step 3**: requirements §7.8.7。

## §6 用語更新 (§G.9)

| 語 | 定義 | 確定経路 |
|---|---|---|
| oracle-test-trace | test-design 宣言 oracle ID が tests/ に実在するかの substance 検査 (FR-L1-18 descent) | concept §10 へ |
| tracked-canonical | git tracked path ⊆ repository-structure.md canonical ツリーの drift 検査 | 同上 |

## §8 DoD

- [x] oracle-test-trace + tracked-canonical が green (baseline 適用、NEW orphan/drift fail-close)。**実装済 2026-06-10**: oracle-test-trace (IMP-128、baseline 89、U-OTT-001..005) + tracked-canonical (IMP-127、baseline 0、U-TCAN-001..005)。
- [x] doctor 配線 (hard/fail-close) + 実 repo regression 0 (U-OTT-004 / U-TCAN-004)。
- [ ] review 前置を通す (塊A/B まとめて intra_runtime_subagent review 予定)。
