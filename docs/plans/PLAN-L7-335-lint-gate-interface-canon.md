---
plan_id: PLAN-L7-335-lint-gate-interface-canon
title: "PLAN-L7-335 (impl): lint gate カノニカル様式の宣言と warn-first lint (load/analyze/Messages 3 世代混在の収束)"
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
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (QU-5/6 の共通 util 化が前提)"
  - role: tl
    slot_label: "TL - カノニカル様式の確定 (Messages なし 4 gate の扱い含む)"
  - role: se
    slot_label: "SE - 様式 doc + 共通型 + warn-first lint"
generates:
  - artifact_path: docs/plans/PLAN-L7-335-lint-gate-interface-canon.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-332-lint-walk-util-consolidation.md
    - docs/plans/PLAN-L7-333-frontmatter-parse-ssot.md
---

# PLAN-L7-335 (impl): lint gate カノニカル様式

## Status

**version-up parked (v2)**。A-182 所見 AQ-5 (QU-8)。PO 指示 2026-07-03「アップデートでプラン化」。**依存: L7-332/333 (共通 util) の後** — 様式宣言は util 集約後の形を正とするため。

## 背景 (実測 2026-07-03、A-182 §2)

- lint gate の export 様式が 3 世代混在: analyze 69 / load 78 / *Messages 65 で不揃い、Messages なし gate 4 本。architecture.md §3.2 は「lint 共通様式 = loadX → analyzeX (pure) → result」を宣言するが、Messages 層と型の共通定義が無く、新規 gate のカノニカル参照が存在しない (AQ-5)。
- 影響: 新 gate 追加のたびに参照元がばらけ、doctor 集計漏れ (Messages なし) の温床。**底上げの本体 = 規範の機械化** (quality-uplift-strategy §1) の代表項目。

## スコープ (1 要件: 新規 lint gate が従うべき様式を宣言し、逸脱を warn-first で検出する)

1. 様式宣言: `docs/design/` に lint gate interface 規約を 1 節追加 (L5 module-decomposition の §6 更新 = L7-328 と整合させる) + `src/lint/types.ts` (新設) に共通型 (`LintGateResult` 等) を定義。
2. 既存 gate の一括改修は**しない** (78 本の書き換えは高リスク) — Messages なし 4 gate のみ追補し、残りは新規実装時に漸進適用。
3. warn-first lint: 新規追加された lint gate ファイルが様式 (load/analyze/Messages export) を満たさない場合に doctor で warn (既存はベースライン免除 + ratchet: 免除 Set は縮小のみ許可、update 戦略 §4.4 の原則)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | TL と様式確定 (Messages 必須か / 型シグネチャ) | 直列 (先行) |
| 2 | 規約 doc + types.ts + Messages なし 4 gate 追補 | 直列 |
| 3 | warn-first lint + ベースライン ratchet test | 直列 |

## DoD

- [ ] 新規 gate 様式が doc と型の両方で宣言されている
- [ ] 様式逸脱の新規 gate fixture が doctor warn になる (test 固定)
- [ ] ベースライン免除 Set に size assertion (ratchet test) が付く
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 免除ベースラインは「出口条件と ratchet を同時定義」(update 戦略 §4.4) — 恒久免除を作らない。
- 活性化時 kind は add-design + add-impl 対へ昇格 (gate 新設のため Reverse pairing 必須)。
