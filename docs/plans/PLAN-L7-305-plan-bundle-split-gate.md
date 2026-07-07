---
plan_id: PLAN-L7-305-plan-bundle-split-gate
title: "PLAN-L7-305 (impl): bundle split gate — 隠れ束 PLAN の宣言強制と着手時分割"
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
    slot_label: "PO - 束閾値 (既定 DoD 4 項目) の承認と v2 活性化時期"
  - role: tl
    slot_label: "TL - 束判定基準と分割手順書式のレビュー"
  - role: se
    slot_label: "SE - lint 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-305-plan-bundle-split-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-242-mode-exit-enforcement-batch.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-305 (impl): bundle split gate

## Status

**version-up parked (v2)**。A-181 GR-2。「PLAN per requirement」原則 (既存 PO ルール) の機械強制。

## 背景 (2026-07-03 粒度監査)

- 自己申告束: PLAN-L7-242 は「起票束、着手時分割」と明言するが、分割手順が 1 行しかなく分割の粒度基準が読めない。
- **隠れ束**: L7-239/240/244/246/253/256/277 など B 評価群の多くが 3〜4 要件を 1 つの DoD にまとめている。束宣言が無いため、後続モデルは「部分実装で一旦 commit してよいか」「どれから着手すべきか」を判断できず、全部やるか止まるかになる。
- 現行 lint に束を検出・管理する機構は無い。

## スコープ (1 要件: 束 PLAN を機械可読に宣言させ、宣言なき束と分割なき着手を止める)

1. **束宣言**: frontmatter `bundle: true` + `bundle_items:` (list、各要素 = 分割候補の 1 行要約と依存)。束 PLAN は「分割の親」であり自身は実装しない (L7-242 の運用を書式化)。
2. **束ヒューリスティック lint** (`src/plan/lint.ts` に checkBundleDeclaration 追加): kind が impl/add-impl で **DoD checkbox が閾値 (既定 4) 超**の PLAN は `bundle: true` 宣言を要求 (`bundle_undeclared`)。閾値は `src/plan/lint-policy.ts` の定数。DoD が多くても単一要件だと PO/TL が判断する場合は `bundle_exempt_reason:` で免除 (理由必須、空文字は不可 — 免除の silent 化を防ぐ)。
3. **着手時分割の強制**: `bundle: true` の PLAN が draft 以外へ遷移することを fail-close (`bundle_must_split`)。出口は分割起票 (子 PLAN が `dependencies.parent` で束を指す) → 束本体は全子起票後に archived。L7-263 の draft-debt 昇格ゲートと同型のパターン。
4. **enforcement cutoff**: `BUNDLE_ENFORCEMENT_DATE` で新規起票のみ対象 (既存 confirmed を遡及 red にしない)。既存 draft の隠れ束 (上記 7 本) は活性化時に bundle 宣言を back-fill する (分割はしない — 分割自体は各 PLAN の着手時)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 束判定基準 + 分割書式の設計レビュー (TL、閾値は PO 承認) | 直列 |
| 2 | lint 実装 (宣言要求 + 遷移 fail-close + 免除理由) | 直列 |
| 3 | 既存 draft 隠れ束 7 本への bundle 宣言 back-fill | Step 2 と並列 |
| 4 | regression test | 直列 |

## DoD

- [ ] DoD 項目が閾値超の新規 impl PLAN が bundle 宣言無しで plan lint fail する (test 固定)
- [ ] `bundle: true` の PLAN の draft 離脱が fail し、分割子 PLAN + archived 遷移は pass する (test 固定)
- [ ] `bundle_exempt_reason` が空/欠落の免除は無効 (test 固定)
- [ ] cutoff 以前の既存 PLAN が red にならない (real-repo で `ut-tdd plan lint` exit 0)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/plan/lint.ts`、`src/plan/lint-types.ts`、`src/plan/lint-policy.ts`、`src/schema/frontmatter.ts`。テスト雛形は `tests/plan-lint.test.ts` の route_mode_kind 系。
- DoD checkbox の数え方は `- [ ]` / `- [x]` の行数 (plan-dod lint と同じ抽出関数を再利用 — 二重実装しない)。
- PLAN-L7-304 (pending_decision) と同じファイル群を触るため、両方活性化する場合は直列で (file_conflict)。
