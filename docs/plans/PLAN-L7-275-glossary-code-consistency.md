---
plan_id: PLAN-L7-275-glossary-code-consistency
title: "PLAN-L7-275 (impl): コード識別子 ↔ L0 glossary 突合 + 旧称 alias sweep (ubiquitous language の機械化)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-03
owner: PM / PO
parent_design: docs/governance/ddd-tdd-rules.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 突合対象 (どの識別子層を照合するか) と誤検知境界レビュー"
  - role: se
    slot_label: "SE - glossary↔識別子 突合 lint (advisory 開始)"
generates:
  - artifact_path: docs/plans/PLAN-L7-275-glossary-code-consistency.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - .ut-tdd/audit/A-175-architecture-audit-registry-2026-07-02.md
    - src/lint/backfill-pairing.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-275 (impl): コード識別子 ↔ L0 glossary 突合 + 旧称 alias sweep

## Status

draft 起票 (A-179 T-4、A-175 未監査領域「glossary/terminology 一貫性」と同根)。誠実な設計祖先 PLAN が無いため kind=impl で起票し **PLAN-L7-263 debt 台帳へ登載 (着手時昇格)**。back-fill 意図は PLAN-REVERSE-275 で保持。

2026-07-03 スコープ拡張 (PO 承認): 名称変更 (rename) の一括置換を仕組み化するため、**旧称 alias 台帳 + 旧称 sweep** を本 PLAN に統合。突合 lint (用語 drift 検出) と alias sweep (置換漏れ検出) は同じ glossary parse 基盤に乗るため、別 PLAN に割らない。

## 背景

ubiquitous language の機械化は PLAN frontmatter `glossary_terms` の自己申告突合のみ。コード側の主要識別子 (export 名 / テーブル名 / mode・kind enum 値) が L0 glossary と一致するかの照合が無く、用語 drift が silent に進む。

また名称変更の記録は glossary 定義文中の prose (例: §10.3「旧称『GATE-A (L0-L6) / GATE-B (L0-L7)』を置換」) のみで機械可読でなく、置換の実行は grep/エディタ頼み。旧称の残存 (コード識別子・docs 本文) を検出する仕組みが無く、置換漏れが silent に残る。

## スコープ

1. **突合対象の限定 (TL)**: 全識別子は誤検知の海になるため、ドメイン語彙が乗る層に限定 — schema enum 値 (kind/mode/drive/status)、harness.db テーブル名、CLI コマンド名 — を glossary と照合。
2. **advisory 開始**: 不一致は warn surface。fail-close 化は誤検知実測後に PO 判断。
3. glossary 側の未登録語は「登録候補」として別 surface (glossary の成長経路)。
4. **旧称 alias 台帳 (TL)**: concept §10 glossary に旧称 alias の機械可読宣言形式を導入する (案: 用語 entry に `旧称:` フィールド、または §10 末尾に alias 表 `| 旧称 | 正式名 | 状態 (active/retired) |`)。既存 prose 記録 (GATE-A/GATE-B 等) を初期移行する。宣言形式の確定は TL レビュー。
5. **旧称 sweep lint (advisory)**: active な alias の旧称が `src/` 識別子・`docs/` 本文に残存していないかを検出して surface。置換完了した alias は `retired` へ遷移させ sweep 対象から外す (履歴は台帳に残す)。置換の**実行**は本 PLAN の範囲外 (lint は置換漏れの検出まで、実置換は grep/エディタ + 本 lint での確認)。
6. sweep の除外境界: `docs/archive/`・`legacy local state/`・migration snapshot・audit evidence は歴史的記録のため sweep 対象外 (旧称が残ることが正)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 突合対象確定 (TL) | 直列 |
| 2 | 突合 lint (advisory) + 初回実測 | 並列 (Step 4-5 と独立) |
| 3 | 旧称 alias 宣言形式確定 + 既存旧称の初期移行 (TL) | 直列 |
| 4 | 旧称 sweep lint (advisory) + 初回実測 (棚卸し) | 並列 (Step 2 と独立) |

## DoD

- [ ] enum/テーブル/コマンド名の glossary 突合が doctor で surface される (test 固定)
- [ ] 初回実測の不一致が棚卸しされる
- [ ] 旧称 alias 宣言形式が concept §10 に定義され、parse が test 固定される
- [ ] 既存の prose 旧称記録 (GATE-A/GATE-B 等) が alias 台帳へ初期移行される
- [ ] 旧称 sweep が doctor で surface される (advisory、除外境界込みで test 固定)
- [ ] 旧称残存の初回実測が棚卸しされる
