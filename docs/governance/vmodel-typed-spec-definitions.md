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
    - id: VMS-001
      kind: upgrade-charter
      traces_to: [VMS-002, VMS-003, VMS-004]
      tests: [TVMS-001]
    - id: VMS-002
      kind: schedule-authoring-source
      traces_from: [VMS-001]
      traces_to: [VMS-005]
      tests: [TVMS-002]
    - id: VMS-003
      kind: activation-profile
      traces_from: [VMS-001]
      traces_to: [VMS-005]
      tests: [TVMS-003]
    - id: VMS-004
      kind: typed-spec-authoring-source
      traces_from: [VMS-001]
      traces_to: [VMS-006]
      tests: [TVMS-004]
    - id: VMS-005
      kind: activation-schedule-review
      traces_from: [VMS-002, VMS-003]
      tests: [TVMS-005]
    - id: VMS-006
      kind: typed-spec-projection
      traces_from: [VMS-004]
      tests: [TVMS-006]
    - id: TVMS-001
      kind: unit-oracle
      traces_from: [VMS-001]
    - id: TVMS-002
      kind: unit-oracle
      traces_from: [VMS-002]
    - id: TVMS-003
      kind: unit-oracle
      traces_from: [VMS-003]
    - id: TVMS-004
      kind: unit-oracle
      traces_from: [VMS-004]
    - id: TVMS-005
      kind: integration-oracle
      traces_from: [VMS-005]
    - id: TVMS-006
      kind: projection-oracle
      traces_from: [VMS-006]
```

## 2. 解釈規則

- `spec.defines[].id` は typed spec の正本 ID である。
- `spec.defines[].kind` は分類であり、空欄を許可しない。
- `traces_from` は上流 ID、`traces_to` は下流 ID、`tests` は対応する検証 ID を指す。
- 参照先が同じ `spec.defines` 宇宙に存在しない場合は finding にする。
- `unit-oracle` / `integration-oracle` / `projection-oracle` などの oracle kind は、上位 spec の `tests` から参照され、oracle 側が `traces_from` を返す検証 leaf である。oracle 自体には追加の `tests` edge を要求しない。
- HARNESS の ID は `FR-L1-*` / `PLAN-*` / `U-*` 等を含むため、ZIP の `^[A-Z]+-[0-9]+[a-z]?$` をそのまま正本にしない。
- typed spec は検出を安定化するための設計正本であり、DB projection から本書を書き換えない。

## 3. 不変条件

- 同一 ID を複数 doc で宣言しない。
- `id` / `kind` / trace 配列以外の ad hoc 属性を検出系の正本にしない。
- typed spec の宣言と既存見出し由来検出が食い違う場合は、typed spec を優先し、差分を後続 U9 の trace closure で扱う。
