---
plan_id: PLAN-L7-304-plan-pending-decision-gate
title: "PLAN-L7-304 (impl): pending_decision gate — 未決分岐を残した PLAN の着手を fail-close で止める"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (新規起票への強制開始日) の判断"
  - role: tl
    slot_label: "TL - 未決分岐の宣言書式と遷移条件のレビュー"
  - role: se
    slot_label: "SE - lint 実装 + 既存 draft への宣言 back-fill"
generates:
  - artifact_path: docs/plans/PLAN-L7-304-plan-pending-decision-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
    - docs/plans/PLAN-L4-16-security-design-slot.md
---

# PLAN-L7-304 (impl): pending_decision gate

## Status

**version-up parked (v2)**。A-181 GR-1。

## 背景 (2026-07-03 粒度監査)

draft PLAN 精読 16 本のうち 5 本 (L4-15 / L4-16 / L7-245 / L7-253 / L7-269) が、スコープの核心 (実装方式 A/B、閾値数値、発火条件セット) を「TL/PO 判断」という slot 記述だけで未確定のまま起票されている。後続の実装エージェントがこれを拾うと、**仕様を恣意的に「発明」して実装する**か、無限に停止するかの二択になる。特に L7-253 の advisor 発火条件は製品仕様の根幹で、発明された条件が本番に入ると PO 意図と乖離する。

現行機械層にこれを検出する gate は無い (plan-governance は frontmatter 構造、plan-body-substance は本文の有無のみ)。

## スコープ (1 要件: 未決分岐を機械可読に宣言させ、未解消のまま実装フェーズへ進めない)

1. **frontmatter フィールド新設**: `pending_decisions:` (list)。各要素 = `{ id, question, options, decided: null | <決定内容>, decided_by, decided_at }`。起票時に未決事項があれば必ずここへ書く (本文の「TL 判断」prose を機械化)。
2. **lint 検査** (`src/plan/lint.ts` に checkPendingDecisions 追加):
   - `status: draft` → pending_decisions 存在 OK (未決は draft の正当な状態)。
   - `status` が draft 以外へ遷移 (= 着手/確定) する時、`decided: null` の要素が 1 つでも残っていれば **fail-close** (`pending_decision_unresolved`)。
   - 決定の書き戻し先は PLAN 本文 (スコープ節へ反映) + `decided` フィールドの両方。lint は `decided` non-null のみ機械検査し、本文反映は review で担保。
3. **enforcement cutoff**: 既存 confirmed PLAN を遡及 red にしないため `PENDING_DECISION_ENFORCEMENT_DATE` (活性化日) を `src/plan/lint-policy.ts` に置き、`created >= cutoff` の PLAN のみ検査 (既存 `KIND_LAYER_ENFORCEMENT_DATE` と同型)。
4. **既存 5 本への back-fill**: L4-15 / L4-16 / L7-245 / L7-253 / L7-269 の未決事項を pending_decisions へ転記 (内容は本文から機械的に転記、新たな判断はしない)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 宣言書式 + 遷移条件の設計レビュー (TL) | 直列 |
| 2 | lint 実装 + enforcement cutoff | 直列 |
| 3 | 既存 5 本への back-fill | Step 2 と並列 |
| 4 | regression test (未解消で遷移 fail / 解消で pass / cutoff 前 PLAN 非対象) | 直列 |

## DoD

- [ ] pending_decisions に `decided: null` が残る PLAN の status 遷移 (draft 以外) が plan lint で fail する (test 固定)
- [ ] 全要素 decided の PLAN は pass する (test 固定)
- [ ] cutoff 以前の既存 PLAN が red にならない (real-repo で `ut-tdd plan lint` exit 0 を確認)
- [ ] GR-1 該当 5 本に pending_decisions が back-fill されている

## 実装ノート (後続モデル向け)

- 触るファイル: `src/plan/lint.ts`、`src/plan/lint-types.ts` (violation reason 追加)、`src/plan/lint-policy.ts` (cutoff 定数)、`src/schema/frontmatter.ts` (フィールド型)。テストは `tests/plan-lint.test.ts` の既存パターン (route certificate 系のテストが最も近い雛形)。
- 「未決分岐があるか」の自動検出 (本文の prose 解析) はスコープ外 — 宣言は起票者の義務とし、宣言漏れは review で拾う。機械層は「宣言されたものの解消」だけを fail-close で守る (検出の完全性より判定の確実性を優先)。
