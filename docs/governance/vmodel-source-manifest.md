---
title: "checked Vモデル source provenance manifest"
status: confirmed
owner: PO / TL
updated: 2026-07-10
typed_spec_phase_owner: L4
---

# checked Vモデル source provenance manifest

## 1. 役割

本書は `Vモデル設計ドキュメント_checked.zip` の比較入力を再現可能に識別するauthoring sourceである。ZIPは
TeamFlow sampleであり、UT-TDD HARNESSの正本・runtime・検出結果ではない。採用判断は
`vmodel-document-disposition-catalog.md`、HARNESS target slotは`vmodel-document-catalog.md`で管理する。

## 2. Provenance

| field | value |
|---|---|
| logical_name | `Vモデル設計ドキュメント_checked.zip` |
| audited_on | `2026-07-10` |
| sha256 | `47b9a900ac99e093a1750f68f34c00e3bbd78c13a070d57dcdaba9ae50a274a8` |
| file_entries | `624` |
| directories_on_extract | `29` |
| markdown_entries | `139` |
| yaml_or_yml_entries | `183` (`.yaml=182`, `.yml=1`) |
| python_entries | `27` |
| xlsx_entries | `237` |
| unsafe_paths | `0` |
| duplicate_entries | `0` |
| symlinks | `0` |
| encrypted_entries | `0` |
| numbered_source_documents | `109` |
| semantic_catalog_categories | `21` |
| semantic_catalog_items | `163` |
| semantic_catalog_records | `184` |
| profiles | `8` |

## 3. source document の識別

番号付き source document は `vmodel-docgen-clean/docs/01_*.yaml` から `109_*.yaml` までの連番である。
HARNESSでは `ZIP-DOC-001` から `ZIP-DOC-109` をstable source IDとして使用し、ZIP内path/titleの変更を
別のsnapshot revisionとして扱う。source IDをHARNESS target document IDやPLAN IDとして再利用しない。

## 4. プロファイルの識別

| `profile_id` | `axis` | `source_name` |
|---|---|---|
| `poc` | `size` | `PoC` |
| `standard` | `size` | `Standard` |
| `enterprise` | `size` | `Enterprise` |
| `web` | `product` | `Web` |
| `mobile` | `product` | `Mobile` |
| `desktop` | `product` | `Desktop` |
| `cli` | `product` | `CLI` |
| `api-service` | `product` | `APIService` |

sizeとproductは排他的な単一rankではない。たとえば`enterprise + cli`のように直交合成し、競合時の優先順位は
profile resolver contractで明示する。

## 5. 不変条件

- hashまたはentry countが変わるZIPは同じsnapshotとして扱わない。
- 109 source、163 item、21 category、8 profileを混同せず、各projectionで件数を個別検証する。
- ZIP内Python toolingはproduct runtimeへ移植しない。設計概念をTypeScript/Bun contractへ翻訳する。
- ZIPがローカルに無い環境でも、本manifestとtracked dispositionからHARNESSの設計判断を再構築できる。
