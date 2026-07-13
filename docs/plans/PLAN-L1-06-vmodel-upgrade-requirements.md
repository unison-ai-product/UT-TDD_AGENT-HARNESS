---
plan_id: PLAN-L1-06-vmodel-upgrade-requirements
title: "PLAN-L1-06: Vモデル刷新 要件差分 調査・凍結工程"
kind: research
layer: L1
drive: fullstack
status: confirmed
owner: PO / TL
pair_artifact: docs/test-design/harness/L14-operational-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L4
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T11:36:22+09:00"
    tests_green_at: "2026-07-08T11:36:22+09:00"
    verdict: approve
    scope: "U1 Vモデル刷新 要件差分の TL self review。clean ZIP を直接 runtime 移植せず、工程管理表、駆動モデル選択、宣言型 spec IR、DB-backed detection、両肺 quality loop、DDD/OOP、PLAN 資産化、activation/profile を L1 要件差分へ分離。既存 L1 technical sub_doc の正本起票と重複しないよう kind=research に寄せ、既存正本置換・DB schema・CLI 実装は後続 U2-U7 に分割。targeted plan lint、db rebuild、confirmed 化後の full doctor が green。"
agent_slots:
  - role: po
    slot_label: "PO - Vモデル刷新の要求境界と段階導入判断"
  - role: tl
    slot_label: "TL - clean ZIP と現行 harness の差分を L1 要件へ翻訳"
  - role: qa
    slot_label: "QA - 右肺 quality loop と L14 検証要求の確認"
  - role: se
    slot_label: "SE - 後続 L4-L7 設計・DB・workflow 影響の分割"
generates:
  - artifact_path: docs/plans/PLAN-L1-06-vmodel-upgrade-requirements.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    artifact_type: design_doc
dependencies:
  parent: PLAN-L0-01-vmodel-harness-upgrade-charter
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
    - docs/process/forward/overview.md
    - docs/process/modes/version-up.md
    - docs/design/harness/L1-requirements/technical-requirements.md
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
---

# PLAN-L1-06: Vモデル刷新 要件差分 調査・凍結工程

## 0. 役割

本 PLAN は `PLAN-L0-01-vmodel-harness-upgrade-charter` の U1 として、clean Vモデル設計素材を現行
UT-TDD Agent Harness の L1 要件粒度へ翻訳する。既存正本の即時置換ではなく、後続 U2-U7 が改訂する要求境界を
先に固定するための design PLAN である。

## 1. 入力

- L0 charter: `docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md`
- 現行比較入力: checked ZIP SHA-256 `47b9a900ac99e093a1750f68f34c00e3bbd78c13a070d57dcdaba9ae50a274a8`、624 entries、番号付き設計書109件、semantic item 163件、category 21件、profile 8件。旧clean ZIPの件数はsupersededであり現行判断へ使用しない
- 現行 L1 技術要求: `docs/design/harness/L1-requirements/technical-requirements.md`
- 駆動モデル設計: `docs/design/harness/L4-basic-design/function.md` §3、`PLAN-L5-10`
- 右肺導入中 PLAN: `PLAN-RECOVERY-10-right-lung-quality-assurance`
- version-up mode: `docs/process/modes/version-up.md`

## 2. 出力

- 正本候補 doc: `docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md`
- VUP-REQ-01〜08: 工程管理表、駆動モデル選択、宣言型 spec IR、DB-backed detection、両肺 quality loop、
  DDD/OOP、PLAN 資産化、activation/profile 段階導入
- U2-U7 の後続 PLAN 分割入力

## 3. 工程表

### Step 1: 前提整理と粒度固定 [直列]

clean ZIP の中核を、UT-TDD の TypeScript/Bun / PLAN / design docs / harness.db projection 境界へ翻訳する。
機能設計には落とさず、L1 要件差分の粒度に留める。

直列理由: downstream_dependency。後続差分表と要件 ID は、この粒度判断を前提にする。

進捗: 完了。本 PLAN と `vmodel-upgrade-requirements.md` に反映。

### Step 2: 現状との差分表作成 [直列]

現行 harness の資産 (Forward spine、roadmap、harness.db、right lung、DDD/TDD strictness、version-up) と
ZIP 由来の改善軸 (schedule、spec.defines、trace、activation/profile、DDD/OOP) を対比する。

直列理由: downstream_dependency。差分表が VUP-REQ-01〜08 の分割根拠になる。

進捗: 完了。正本候補 doc §2 に反映。

### Step 3: VUP 要件 ID の定義 [直列]

U2-U7 へ渡せる要件 ID と受入条件を定義する。

直列理由: shared_state。要件 ID は後続 PLAN、DB projection、検出設計が共有する識別子になる。

進捗: 完了。VUP-REQ-01〜08 として定義。

### Step 4: L14 pair / 後続 wave への引き継ぎ [並列]

本 PLAN では L14 operational test design を直接更新しない。後続 U7 で VUP-REQ-01〜08 の運用検証方針を
right-lung quality loop として追加する。

進捗: 未着手。U7 に引き継ぐ。

### Step 5: review (TL self / cross-runtime ready) [直列]

L1 要件差分が L4-L7 詳細へ踏み込みすぎていないか、既存正本を置換していないか、ADR-001 境界を守っているかを
レビューする。hybrid では後続 confirmed 化前に別 runtime/model family の judgement gate へ渡す。

直列理由: downstream_dependency。review 結果が lint / doctor 実行前の最終 PLAN 形状を固定する。

進捗: 完了。TL self review で L1 要件差分としての粒度、既存正本非置換、ADR-001 境界を確認済み。

### Step 6: lint / doctor 検証 [直列]

`ut-tdd plan lint`、`db rebuild`、`doctor` で frontmatter、工程表、DB projection、governance gate を確認する。

直列理由: downstream_dependency。検証は review 後の artifact を対象にする。

進捗: 完了。targeted plan lint、DB 再投影、full doctor が green。

## 3.1 実装計画

本 PLAN の実装は doc-only であり、`docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md` を
新規追加して U1 要件差分を凍結する。既存 L1 正本や L4-L7 設計・実装は変更しない。検証は targeted
`plan lint`、DB projection rebuild、`doctor` の順で行い、green 後に後続 U2-U7 の起票へ進む。

## 4. 非対象

- ZIP 内 Python tooling の product runtime 移植。
- 既存 L1-L6 正本 doc の一括置換。
- DB schema / CLI / lint 実装。
- L4-L6 の詳細設計、L7 実装、L8-L14 検証 doc の確定。

## 5. DoD

- [ ] `vmodel-upgrade-requirements.md` に VUP-REQ-01〜08 が定義されている。
- [ ] 既存正本を置換せず、後続 U2-U7 へ分割されている。
- [ ] clean ZIP は設計素材として扱い、ADR-001 の TypeScript/Bun 境界を守っている。
- [ ] 工程管理表、駆動モデル、DB-backed detection、DDD/OOP、PLAN 資産化が要件として分離されている。
- [ ] `ut-tdd plan lint` / `db rebuild` / `doctor` が green。

## 6. 後続

次は U2 として `PLAN-L4-18-roadmap-drive-selection-hardening` を起票し、工程管理表と filing target を
`docs/process/forward/overview.md`、L4 §3、L5/L6 router design、status/doctor 出力へ接続する。
