---
plan_id: PLAN-L6-67-skill-admission-gate
title: "PLAN-L6-67 (add-design): スキル取り込みゲート機能設計"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T23:20:00+09:00"
    tests_green_at: "2026-07-09T23:20:00+09:00"
    verdict: approve
    scope: "PLAN-L6-67 design freeze。未追跡だった skill-admission L6 設計を正式な add-design として所有し、L7 U-SKILL-ADMIT oracle へ接続した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint docs\\plans\\PLAN-L6-67-skill-admission-gate.md docs\\plans\\PLAN-L4-21-domain-vo-coding-constraints.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T23:20:00+09:00"
        evidence_path: docs/design/harness/L6-function-design/skill-admission.md
        output_digest: "sha256:22ac0b1a0491e25ca965c28f92f40160b7c6aefd079f0db17e951f73607145cb"
        anchor_commit: 0b9e7f6268b007c69b3de05e7e90f8fdb40058e1
agent_slots:
  - role: tl
    slot_label: "TL - skill admission gate の品質3要件、judge権限境界、既存 skill-index との非重複確認"
generates:
  - artifact_path: docs/plans/PLAN-L6-67-skill-admission-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/skill-admission.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L6-37-skill-index-category.md
  references:
    - docs/design/harness/L6-function-design/skill-index.md
    - docs/design/harness/L6-function-design/skill-admission.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L6-67: スキル取り込みゲート機能設計

## Status

confirmed (2026-07-09)。未追跡の L6 設計片だった `skill-admission.md` を、正式な L6 add-design として
owning PLAN、L7 oracle、工程管理表へ接続した。

## 0. 背景

`skill-index.md` は skill をどの軸で検出・推薦・生成するかを確定している。一方で、新規 skill を
HARNESS へ取り込む入口は未設計であり、品質の低い skill が catalog へ混入する経路を閉じられていなかった。

本 PLAN は、ZIP 由来の skill 管理改善と既存 `FR-L1-19` / `FR-L1-12` / `FR-L1-24` の拡張として、
新規 skill 候補を novelty、decision-usefulness、harness-fit の 3 要件で審査する L6 契約を固定する。
新規 FR は起こさず、既存 Learning Engine / skill suggest / Add-feature の降下として扱う。

## 1. 設計スコープ

1. `skill-admission.md` を L6 機能設計として confirmed 化し、`PLAN-L6-67` が所有する。
2. `analyzeSkillFit`、`computeSkillNovelty`、`analyzeDecisionPoints`、`repairSkillCandidate`、
   `resolveAdmission`、`analyzeSkillSupersession`、`renderSkillCatalogIndex`、`analyzeAdmissionCoverage`
   の契約を L7 単体テスト設計へ降下させる。
3. judge は reject / flag / no_objection のみを返し、admit 権を持たないことを設計契約にする。
4. doctor/CI は judge/LLM を呼ばず、台帳・カタログ drift・baseline 外 skill の admission 欠落という
   決定論残渣だけを見る。

## 2. Design Freeze Result

- 正本: `docs/design/harness/L6-function-design/skill-admission.md`
- V-pair: `docs/test-design/harness/L7-unit-test-design.md` §1.24b `U-SKILL-ADMIT-001..009`
- FR 接続: `FR-L1-19` / `FR-L1-12` / `FR-L1-24` の拡張。仮置きされていた新規 FR は起こさない。
- 実装: 後続 L7 add-impl PLAN で行う。本 PLAN は L6 契約と L7 oracle の freeze までを範囲とする。

## 3. DoD

- [x] `skill-admission.md` が `status: confirmed`、`plan: docs/plans/PLAN-L6-67-skill-admission-gate.md` を持つ。
- [x] 仮置き PLAN 番号 / 新規 FR 予告 / 未確定 U-ID 範囲表記を正式な PLAN / 既存 FR 拡張 / U-ID 範囲へ置換した。
- [x] L7 単体テスト設計に `U-SKILL-ADMIT-001..009` を追加した。
- [x] 量閉じ一覧に `skill-admission.md §4-§8 -> U-SKILL-ADMIT-*` を追加した。
- [x] 工程管理表へ `PLAN-L6-67` を登録した。
