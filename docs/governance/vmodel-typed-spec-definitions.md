---
title: "Vモデル typed spec 定義正本"
status: confirmed
owner: PO / TL
updated: 2026-07-08
---

# Vモデル typed spec 定義正本

## 0. 役割

本書は `Vモデル設計ドキュメント_clean.zip` の `99_型付きスペック・自動検出設計書` と
`schema/spec.schema.json` から HARNESS 向けに抽出した `spec.defines` 正本である。

検出系は本書の宣言を読む。章見出し、ファイル名、正規表現から定義 ID を推測して正本化してはいけない。
既存の見出し由来 `spec_defs` は後方互換の検索補助として残すが、typed spec の対象は本書の宣言を優先する。

本書は U8 の bootstrap 正本である。最終形では、各定義を所有する artifact の本文直下に fenced YAML の
`spec:` block を置く。parser は本書だけでなく任意の governance / design / test-design / PLAN 文書の本文 block を読む。
中央集約 doc は移行の足場であり、所有 artifact への分散配置が進んだ後に縮退できる。

## 1. 型付き宣言

```yaml
spec:
  defines:
    - id: VMS-004
      kind: typed-spec-authoring-source
      traces_from: [VMS-001]
      traces_to: [VMS-006]
      tests: [TVMS-004]
```

## 2. 解釈規則

- `spec.defines[].id` は typed spec の正本 ID である。
- `spec.defines[].kind` は分類であり、空欄を許可しない。
- `traces_from` は上流 ID、`traces_to` は下流 ID、`tests` は対応する検証 ID を指す。
- 参照先が同じ `spec.defines` 宇宙に存在しない場合は finding にする。
- `unit-oracle` / `integration-oracle` / `projection-oracle` などの oracle kind は、上位 spec の `tests` から参照され、oracle 側が `traces_from` を返す検証 leaf である。oracle 自体には追加の `tests` edge を要求しない。
- HARNESS の ID は `FR-L1-*` / `PLAN-*` / `U-*` 等を含むため、ZIP の `^[A-Z]+-[0-9]+[a-z]?$` をそのまま正本にしない。
- typed spec は検出を安定化するための設計正本であり、DB projection から本書を書き換えない。

## 3. 本文・台帳同期

typed spec は `spec.defines` の YAML だけで完結しない。各 ID は本文実体、根拠 artifact、
V-model phase を持つ。これは ZIP 43 の要求・要件台帳、97 の trace、107 の層定義を
HARNESS 向けに落とした bootstrap 台帳である。

```yaml
typed_spec_ledger:
  - spec_id: VMS-001
    ledger_sources: [docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md]
    v_phase: L0
  - spec_id: VMS-002
    ledger_sources:
      - docs/governance/vmodel-upgrade-schedule.md
      - docs/plans/PLAN-L6-40-vmodel-schedule-authoring-source.md
    v_phase: L6
  - spec_id: VMS-003
    ledger_sources:
      - docs/governance/vmodel-activation-profiles.md
      - docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
    v_phase: L6
  - spec_id: VMS-004
    ledger_sources:
      - docs/governance/vmodel-typed-spec-definitions.md
      - docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
    v_phase: L6
  - spec_id: VMS-005
    ledger_sources: [docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md]
    v_phase: L7
  - spec_id: VMS-006
    ledger_sources: [docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md]
    v_phase: L7
  - spec_id: TVMS-001
    ledger_sources: [docs/test-design/harness/L7-unit-test-design.md]
    v_phase: L7
  - spec_id: TVMS-002
    ledger_sources: [docs/test-design/harness/L7-unit-test-design.md]
    v_phase: L7
  - spec_id: TVMS-003
    ledger_sources: [docs/test-design/harness/L7-unit-test-design.md]
    v_phase: L7
  - spec_id: TVMS-004
    ledger_sources: [docs/test-design/harness/L7-unit-test-design.md]
    v_phase: L7
  - spec_id: TVMS-005
    ledger_sources:
      - docs/test-design/harness/L7-unit-test-design.md
      - tests/projection-writer.test.ts
    v_phase: L7
  - spec_id: TVMS-006
    ledger_sources:
      - docs/test-design/harness/L7-unit-test-design.md
      - tests/spec-ir-projections.test.ts
    v_phase: L7
```

### VMS-001 上流憲章

VMS-001 は V-model harness upgrade の上流憲章である。工程表、活性化 profile、
typed spec 宣言元を下流に持ち、対応 oracle は TVMS-001 である。

### VMS-002 工程表宣言元

VMS-002 は工程管理表を宣言元として扱う設計である。VMS-001 を上流に持ち、
活性化と工程の review である VMS-005 へ接続する。対応 oracle は TVMS-002 である。

### VMS-003 活性化 profile

VMS-003 は駆動モデル選択と scope 状態を活性化 profile として宣言する設計である。
VMS-001 を上流に持ち、VMS-005 へ接続する。対応 oracle は TVMS-003 である。

### VMS-004 型付き宣言元

VMS-004 は `spec.defines` を typed spec の宣言元とする設計である。
VMS-001 を上流に持ち、投影実装 VMS-006 へ接続する。対応 oracle は TVMS-004 である。

### VMS-005 活性化工程 review

VMS-005 は活性化 profile と工程管理表を join し、現在地と駆動モデル選択を同時に
review 可能にする read-model である。VMS-002 と VMS-003 を上流に持つ。対応 oracle は TVMS-005 である。

### VMS-006 型付き投影

VMS-006 は typed spec 宣言を `spec_defs` / `spec_relations` / `search_index` / `findings` へ投影する
実装境界である。VMS-004 を上流に持つ。対応 oracle は TVMS-006 である。

### TVMS-001 単体 oracle

TVMS-001 は VMS-001 の上流憲章が typed spec 宇宙の root として検査されることを保証する。

### TVMS-002 単体 oracle

TVMS-002 は VMS-002 の工程表宣言元が projection に優先されることを保証する。

### TVMS-003 単体 oracle

TVMS-003 は VMS-003 の活性化 profile が scope と defer reason を保持することを保証する。

### TVMS-004 単体 oracle

TVMS-004 は VMS-004 の `spec.defines` 宣言が推測ではなく宣言読み取りで扱われることを保証する。

### TVMS-005 結合 oracle

TVMS-005 は VMS-005 の活性化工程 review が profile と工程表を join して検索できることを保証する。

### TVMS-006 投影 oracle

TVMS-006 は VMS-006 の typed spec projection が DB と doctor gate に現れることを保証する。

## 4. 不変条件

- 同一 ID を複数 doc で宣言しない。
- `id` / `kind` / trace 配列以外の ad hoc 属性を検出系の正本にしない。
- typed spec の宣言と既存見出し由来検出が食い違う場合は、typed spec を優先し、差分を後続 U9 の trace closure で扱う。
- typed spec の本文実体、台帳行、V-model phase が欠ける場合は U10 の ledger/body sync で finding にする。
- VMS-004 以外の typed spec 宣言は、各 `ledger_sources` が指す owned artifact に置く。central bootstrap doc が所有外 ID の宣言元として残る場合は U11 の owned artifact dispersal で finding にする。
