---
plan_id: PLAN-REVERSE-40-orphan-governance
title: "PLAN-REVERSE-40 (reverse): orphan 統制の土台 — impl→PLAN trace lint (IMP-088) + orphan back-fill (IMP-087) を上位設計へ back-fill"
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
    scope: "塊A impl-plan-trace (IMP-088) + 4 orphan back-fill (IMP-087)。code-reviewer APPROVE / Critical 0。hybrid だが Codex CLI が壊れ legacy のため intra_runtime_subagent review (cross-agent 不在を evidence に記録)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: tl
    slot_label: "TL — impl→PLAN trace lint 設計レビュー (別 runtime)"
  - role: po
    slot_label: "PO — orphan baseline vs full back-fill の方針承認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-40-orphan-governance.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/impl-plan-trace.ts
    artifact_type: source_module
  - artifact_path: tests/impl-plan-trace.test.ts
    artifact_type: test_code
  # IMP-087 orphan 4 件の back-fill (本 PLAN が trace owner、baseline でなく generates 帰属で解消)
  - artifact_path: src/gate/review-tier.ts
    artifact_type: source_module
  - artifact_path: src/lint/rule-drift.ts
    artifact_type: source_module
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: src/runtime/provider-handover.ts
    artifact_type: source_module
dependencies:
  parent: null
  requires: []
  references:
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/improvement-backlog.md
---

# PLAN-REVERSE-40 (reverse): orphan 統制の土台

## §0 Position

L7 工程表 ([[PLAN-DISCOVERY-05-roadmap-registration]] §5) の **塊A (entry → G-L7.A)** を占める span。
ゴール「キャリー潰して L7 の初手まで」の最初のガード = impl→PLAN トレーサビリティ検査 (IMP-088) を
入れ、既存 orphan (IMP-087) を back-fill して以降の span を守る。**この span が以降の L7 family 実装
(塊C) を A-108 再発から守る foundational guard** のため工程表先頭に置く。

本 PLAN は kind=reverse の fullback 骨格 (R0-R4)。impl は本 PLAN 確定後の L6/L7 span で着地する
(Reverse-first を守り、場当たり実装 = A-108 を回避)。

## §1 R0 Evidence (現状の穴)

- **IMP-088**: impl→PLAN トレーサビリティ検査が無い。doctor の既存検査 (module-drift = src⇔architecture §3.1 / pair-freeze = design⇔test-design) はいずれも PLAN を見ない → 「設計 doc に名前が載れば PLAN 無しでも通る」。
- **IMP-087**: A-108 で orphan 実装 4 件検出 (review-tier / rule-drift / team-run / provider-handover)。

**本 PLAN で実測した orphan 実数 (2026-06-10、`find src -name '*.ts'` vs PLAN generates 突合)**: src 41 ファイル中 **12 件が PLAN generates/参照に不在**:

| 区分 | ファイル |
|---|---|
| IMP-087 既知 orphan (4) | `src/gate/review-tier.ts` / `src/lint/rule-drift.ts` / `src/team/run.ts` / `src/runtime/provider-handover.ts` |
| 追加 untraced 既存 lint (8) | `src/lint/asset-drift.ts` / `change-impact.ts` / `doc-consistency.ts` / `entity-coverage.ts` / `g3-trace.ts` / `improvement-backlog.ts` / `readability.ts` / `shared.ts` |

→ **impl-plan-trace を厳格 fail-close で入れると 12 件 flood** する。よって baseline 設計 (既存 12 を known-debt として allowlist、NEW orphan のみ fail) が必要 (ddd-tdd-rules `baseline debt` と同型)。これが「impl 前に Reverse で設計を確定させる」根拠 ([[feedback_impl_must_backfill_to_design]])。

## §2 R1-R3 (是正方向)

- **R1 (FR back-fill)**: impl→PLAN trace を **FR-L1-18 (横断検出・接続欠損) の descent** として L6 機能設計に明文化する (backlog が「FR-L1-18 接続欠損へ畳み込み候補」と既記)。新 FR 番号要否は L6 で判断。
- **R2 (設計)**: impl-plan-trace lint の DbC (src module/CLI/lint/doctor check ⊆ PLAN generates∪scope、baseline allowlist + reason、NEW orphan fail-close) を L6 addendum へ。
- **R3 (orphan back-fill 方針)**: 12 orphan を ① baseline allowlist (reason 付き、back-fill は段階) か ② 各 orphan の所属 PLAN generates へ追記 (IMP-087 の三つ組) か、PO 承認で確定。

## §3 R4 forward 合流

L6 span (impl-plan-trace 設計) → L7 span (impl-plan-trace.ts + doctor 配線 + 12 baseline) で着地。
工程表 G-L7.A exit_criteria = 「impl-plan-trace green + orphan 0 (baseline 除く)」。

## §工程表

### Step 1: [直列] R0-R3 evidence + 是正方向の確定

直列理由: downstream_dependency. orphan 実数 (§1、12 件) と baseline 方針 (§2) が決まらないと L6 設計に降ろせない。

### Step 2: [直列] review (固定 review Step)

直列理由: downstream_dependency. R 方向を PO 確定前に intra_runtime_subagent (pmo-sonnet/code-reviewer) でレビュー。

## §実装計画

- **Step 1**: 情報源 = §1 実測 orphan リスト + FR-L1-18 定義 (functional-requirements.md) + IMP-087/088 (improvement-backlog.md) + ddd-tdd-rules baseline パターン (src/lint/ddd-tdd-rules.ts)。
- **Step 2**: 情報源 = requirements §7.8.7 review 前置。

## §6 用語更新 (§G.9)

| 語 | 定義 | 確定経路 |
|---|---|---|
| impl-plan-trace | src module / 公開 CLI / lint / doctor check が PLAN の generates∪scope に紐づくかの検査 (FR-L1-18 descent) | L6 span で concept §10 へ |
| orphan baseline | 既存 untraced 資産を known-debt として allowlist し NEW orphan のみ fail-close する段階導入 | 同上 |

## §8 DoD (R0-R3、impl は後続 span)

- [ ] §1 orphan 実数 + baseline 必要性が記録済 (12 件)。
- [ ] R1-R3 是正方向 (FR-L1-18 descent / DbC / back-fill 方針) が確定。
- [ ] review 前置を通す。
- [ ] L6/L7 span へ降ろす (impl は本 PLAN 範囲外)。
