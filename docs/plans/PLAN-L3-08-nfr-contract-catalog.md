---
plan_id: PLAN-L3-08-nfr-contract-catalog
title: "PLAN-L3-08 (add-design): NFR Contract catalog — prose 閾値の機械可読契約化 (12 category × stage × environment)"
kind: add-design
layer: L3
sub_doc: nfr
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / TL
parent_design: docs/plans/PLAN-L3-03-nfr-grade.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L12-acceptance-test-design.md
next_pair_freeze: L12
agent_slots:
  - role: tl
    slot_label: "TL - NFR category 語彙 (12 種) と契約 schema 必須 field の設計判断"
  - role: qa
    slot_label: "QA - 契約 fail-close 条件 (未知 category / 閾値欠落 / stage 未定義) の oracle 設計"
generates:
  - artifact_path: docs/design/harness/L3-functional/nfr-grade.md
    artifact_type: design_doc
  - artifact_path: docs/plans/PLAN-L3-08-nfr-contract-catalog.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L3-03-nfr-grade.md
  requires:
    - docs/plans/PLAN-L3-03-nfr-grade.md
    - docs/plans/PLAN-L1-05-nfr.md
  blocks: []
  references:
    - docs/design/harness/L1-requirements/nfr.md
    - docs/design/harness/L3-functional/nfr-grade.md
    - docs/improvement-backlog.md
review_evidence: []
---

# PLAN-L3-08 (add-design): NFR Contract catalog

## 1. 問題 (非機能検証基盤 改善指示書 2026-07-16 / IMP-168)

L1 NFR (NFR-01〜17) と L3 `nfr-grade.md` は IPA グレード値 + 受入閾値を **prose 表**として確定済みだが、
機械検証の入力になる **NFR Contract** (id / category / stage / environment / metrics min-max) が存在しない。
このため:

- 閾値は doctor / gate から参照不可能で、「宣言 = 検証済」の誤読を機械的に防げない (`coding ≠ substance`)。
- 対象 category の語彙 (performance / scalability / reliability / recovery / security / data_integrity /
  compatibility / accessibility / maintainability / observability / cost / usability の 12 種) が未定義。
- 未知 category・単位欠落・閾値欠落・対象 stage 未定義を fail-close する契約規則が無い。

## 2. 設計範囲

1. NFR Contract schema を L3 成果物として定義する: `id` (NFR-<CAT>-NNN)、`category` (12 種 enum)、
   `stage` (L7-L14)、`environment`、`metrics` (metric 名 × min/max × 単位)。既存 NFR-01〜17 /
   nfr-grade 閾値との trace 列を必須にする (孤児契約 0 / 孤児 NFR 0)。
2. fail-close 規則の宣言: 未知 category / metric 単位欠落 / min・max 両欠落 / stage 未定義 /
   environment 未定義は契約 lint で reject。
3. `nfr-grade.md` へ契約 catalog 節 (§8) を追加し、prose 閾値 (§1〜§6) と契約行の双方向対応を固定する。
4. manual evidence 必須項目 (L10 ユーザビリティ等、人間承認が必要な contract) の宣言方法を定義する。
5. **契約対象の二重性 (2026-07-16 抜け監査 #1)**: 契約 schema に `subject` (harness 自身 /
   downstream-product) の束縛先 field を必須化する。既存 NFR-01〜17 は HARNESS 自身の NFR であり、
   対象プロダクト契約との混線 (harness evidence によるプロダクト契約の充足) を型で禁止する。
6. **契約ライフサイクル (同 #3)**: 契約の version と閾値変更の supersession 規律 (PLAN claim
   discipline と同型: 緩和は successor 契約 + 双方向参照 + 理由必須、silent 上書き禁止) を定義する。
7. **統計的判定属性 (同 #4)**: 性能系 metrics に percentile に加え測定回数・warmup・分散上限・
   ベースライン較正の宣言 field を必須化し、単発測定 pass を契約レベルで不可能にする。

## 3. 受入条件

- 12 category 全てが「契約対象」または「対象外 (理由付き)」へ排他分類され、宙吊り category 0 件。
  12 category 外の候補 (privacy/compliance / AI 固有品質 / i18n / データ移行 RPO・RTO) も
  「category 追加」または「理由付き除外」へ分類する (IMP-174/176/177)。
- 全契約が `subject` を持ち、harness 契約とプロダクト契約が catalog 上で分離されている。
- 既存 NFR-01〜17 のうち定量閾値を持つ全件が最低 1 contract へ trace される (孤児 0)。
- 契約 schema の fail-close 条件 5 種 (§2-2) が負系 fixture として列挙されている。
- `ut-tdd plan lint` / doctor green。

## 4. 降下先

- L4 方式設計 (5 層構造への統合) は PLAN-L4-31 が受ける。
- schema の zod 化・契約 lint 実装 (L7 add-impl + Reverse pairing) は L6 契約 (PLAN-L6-87) freeze 後に
  後続起票する。本 PLAN では実装しない。
