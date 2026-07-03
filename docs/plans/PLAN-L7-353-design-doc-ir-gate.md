---
plan_id: PLAN-L7-353-design-doc-ir-gate
title: "PLAN-L7-353 (impl): 設計 doc 実装即応性 gate — L6 の S 粒度 7 要素 lint + grade surface + ratchet"
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
    slot_label: "PO - v2 活性化時期 + 新規 doc の hard 化タイミング"
  - role: tl
    slot_label: "TL - 7 要素の検出ヒューリスティクスのレビュー (偽陰性/偽陽性)"
  - role: se
    slot_label: "SE - design-ir lint + doctor surface + ratchet"
generates:
  - artifact_path: docs/plans/PLAN-L7-353-design-doc-ir-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/design-doc-implementation-readiness.md
    - docs/templates/design/L6-function-spec-template.md
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/plans/PLAN-L7-329-module-l6-design-backfill.md
---

# PLAN-L7-353 (impl): 設計 doc 実装即応性 gate

## Status

**version-up parked (v2)**。PO 指示 2026-07-03「Sonnet クラスでも余裕で実装できる設計粒度を保つために設計ドキュメントの定義系を見直す」の機械強制スライス。定義の正本 = `design-doc-implementation-readiness.md` (着地済み、テンプレも同時着地) — **規約とテンプレは本 PLAN の活性化前から手動運用で有効**。

## 背景 (実測 2026-07-03、規約 §1)

- 設計 doc の粒度保証は 3 層のうち prose (document-system-map §0) のみで、本文構造 lint は L4 外部設計 4 種限定。L6 実物 21 本は h2 数 0〜20 のばらつき (`fr-unit-coverage.md` は h2 ゼロ)。
- Sonnet 級の実装失敗は「発明の強要」(配置/契約/異常系/期待値の欠落) で起きる — 7 要素はその発明余地を塞ぐ (規約 §2/§3)。

## スコープ (1 要件: L6 機能設計 doc の S 粒度 7 要素を機械判定し、劣化を ratchet で防ぐ)

1. lint `design-ir`: `docs/design/harness/L6-function-design/*.md` を 7 要素 (規約 §2 の機械検出列: src/ パス literal / ts fence + export / 事前・事後見出し / fail-open・close literal / 例示 fence / エッジ表 ≥3 行 / oracle 参照) で走査し、doc ごとに grade (S/A/B/C) を算出。**要素存在検出であり見出し文言一致ではない** (偽陰性回避、規約 §4.4)。
2. doctor surface: `design-ir — L6 <N> docs: S=<n> A=<n> B=<n> C=<n>` + C 級の doc 名列挙 (warn-first)。
3. baseline + ratchet: 既存 21 本の grade を台帳固定し、**C 級の本数増加で red** (ratchet test)。新規 doc (baseline 外) の C 級を hard fail にする時期は PO slot。
4. L5/L4 への拡張は本 PLAN のスコープ外 (規約 §5 — L5 は L7-328 の stale 是正後に別 PLAN)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 検出ヒューリスティクスの TL レビュー (優良例 handover-mechanism.md と最薄例で較正) | 直列 (先行) |
| 2 | design-ir lint + fixture tests (S/C 両 fixture) | 直列 |
| 3 | 実 repo 走査 → baseline 台帳 + ratchet test | 直列 |
| 4 | doctor surface + docs (規約 §4 へ発火実績を追記) | 直列 |

## DoD

- [ ] 7 要素を満たすテンプレ準拠 fixture が S 判定 (test 固定)
- [ ] 要素欠落 fixture が C 判定 + doctor warn (test 固定)
- [ ] 実 repo baseline に対し ratchet test green (C 級増加で red になることを fixture で確認)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 検出は正規表現の複合で足りる (AST 不要)。表の行数カウントは `|` 行の連続で判定。
- PLAN-L7-329 (L6 back-fill 6 本) はテンプレ準拠で書かれる前提 — 本 gate が先に活性化していれば back-fill の受入が機械化される (両 PLAN はどちらが先でも成立)。
- 活性化時 kind は add-design + add-impl 対へ昇格 (gate 新設、Reverse pairing 必須)。
