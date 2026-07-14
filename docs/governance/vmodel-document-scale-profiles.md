---
title: "Vモデル document scale profile 正本"
status: confirmed
owner: PO / TL
updated: 2026-07-10
typed_spec_phase_owner: L4
---

# Vモデル document scale profile 正本

## 0. 役割

本書は `Vモデル設計ドキュメント_checked.zip` の `profiles.yaml` 相当を HARNESS 側で追跡する authoring source である。
`vmodel-document-catalog.md` は文書種別の master catalog、本書は規模プロファイルごとの採用・skip・粒度判定を
機械が読める行として固定する。

`harness.db` は正本ではない。本書を `document_scale_profile_entries` へ投影し、`document_catalog_entries` と
join した `document_scale_profile_reviews` を検索・検出用 read-model として使う。検出系は本書の採用判定を読む側であり、
profile や skip reason を暗黙生成してはいけない。

### 0.1 profile manifest宣言

| `field` | `value` |
|---|---:|
| `size_profile_count` | `3` |
| `product_profile_count` | `5` |
| `profile_count` | `8` |
| `decision_count` | `26` |

## 1. profile 定義

| `profile_id` | `profile_axis` | `profile_rank` | `description` | `default_status` | `default_detail` | `scope_policy` |
|---|---|---:|---|---|---|---|
| `poc` | `size` | `10` | PoC / 技術検証。core 文書を簡易粒度で維持し、skipも理由付きで記録する。 | `minimal` | `lite` | `core-required` |
| `standard` | `size` | `20` | 標準開発。core 文書は標準粒度、product-select 文書は適用可否を明示する。 | `standard` | `standard` | `core-plus-selected` |
| `enterprise` | `size` | `30` | 監査・保守・拡張前提。core と選択product文書を詳細化し、deferをPLANへ接続する。 | `required` | `detailed` | `audit-ready` |
| `web` | `product` | `110` | Webクライアント/公開面の設計slotを有効化する。 | `profile_controlled` | `standard` | `product-web` |
| `mobile` | `product` | `120` | Mobile/offline/device/distribution/securityの設計slotを有効化する。 | `profile_controlled` | `standard` | `product-mobile` |
| `desktop` | `product` | `130` | Desktop/package/update/signing/OS integrationの設計slotを有効化する。 | `profile_controlled` | `standard` | `product-desktop` |
| `cli` | `product` | `140` | CLI command/config/auth/output/distribution/completionの設計slotを有効化する。 | `profile_controlled` | `standard` | `product-cli` |
| `api-service` | `product` | `150` | API governance/SDK/webhook/event deliveryの設計slotを有効化する。 | `profile_controlled` | `standard` | `product-api-service` |

## 2. 文書別採用判定

| `profile_id` | `doc_type_id` | `decision` | `detail_override` | `status_override` | `reason` | `required_plan_id` |
|---|---|---|---|---|---|---|
| `poc` | `DOC-L4-DATA` | `adopt` | `standard` | `required` | core data contract は PoC でも DB projection の上流正本になる。 |  |
| `poc` | `DOC-L4-UI-STANDARD` | `adopt` | `lite` | `minimal` | UI 標準は画面事故防止に必要だが PoC では最小粒度に抑える。 |  |
| `poc` | `DOC-L4-REPORT` | `skip` | `lite` | `skipped` | 帳票機能が未選択のため product-select 文書として明示 skip する。 |  |
| `poc` | `DOC-L4-BATCH` | `skip` | `lite` | `skipped` | バッチ機能が未選択のため product-select 文書として明示 skip する。 |  |
| `poc` | `DOC-L4-NOTIFICATION` | `skip` | `lite` | `skipped` | 通知機能が未選択のため product-select 文書として明示 skip する。 |  |
| `poc` | `DOC-L4-CODE-VALUE` | `skip` | `lite` | `skipped` | コード値一覧は domain breadth が確定するまで明示 skip する。 |  |
| `poc` | `DOC-L4-SECURITY` | `adopt` | `lite` | `required` | PoC でも秘密情報混入と配布前検査の境界は未定義にしない。 |  |
| `standard` | `DOC-L4-DATA` | `adopt` | `standard` | `required` | 標準開発では data contract を標準粒度で維持する。 |  |
| `standard` | `DOC-L4-UI-STANDARD` | `adopt` | `standard` | `required` | UI 標準は L10 UX validation の上流正本になる。 |  |
| `standard` | `DOC-L4-REPORT` | `conditional` | `standard` | `profile_controlled` | 帳票機能選択時のみ採用し、未選択時は reason 付き skip にする。 |  |
| `standard` | `DOC-L4-BATCH` | `conditional` | `standard` | `profile_controlled` | バッチ機能選択時のみ採用し、未選択時は reason 付き skip にする。 |  |
| `standard` | `DOC-L4-NOTIFICATION` | `conditional` | `standard` | `profile_controlled` | 通知機能選択時のみ採用し、未選択時は reason 付き skip にする。 |  |
| `standard` | `DOC-L4-CODE-VALUE` | `adopt` | `standard` | `required` | コード値・表示名はデータ辞書/i18n slot の基礎になる。 |  |
| `standard` | `DOC-L4-SECURITY` | `adopt` | `standard` | `required` | 標準開発では認証境界、秘密情報、監査証跡、配布前検査方針を L4 で維持する。 |  |
| `enterprise` | `DOC-L4-DATA` | `adopt` | `detailed` | `required` | 監査可能な data contract と DB projection trace を要求する。 |  |
| `enterprise` | `DOC-L4-UI-STANDARD` | `adopt` | `detailed` | `required` | UX/アクセシビリティ/運用保守を含めた詳細粒度を要求する。 |  |
| `enterprise` | `DOC-L4-REPORT` | `adopt` | `detailed` | `required` | 帳票・監査出力は enterprise profile では標準採用する。 |  |
| `enterprise` | `DOC-L4-BATCH` | `adopt` | `detailed` | `required` | 運用処理・再実行・監査証跡を含む batch 設計を採用する。 |  |
| `enterprise` | `DOC-L4-NOTIFICATION` | `adopt` | `detailed` | `required` | 通知・監視・運用連絡の設計を採用する。 |  |
| `enterprise` | `DOC-L4-CODE-VALUE` | `adopt` | `detailed` | `required` | データ辞書・表示名・エラーメッセージ・i18n slot を詳細化する。 |  |
| `enterprise` | `DOC-L4-SECURITY` | `adopt` | `detailed` | `required` | 監査可能な security boundary と secret-scan / rotation 方針を詳細粒度で要求する。 |  |
| `web` | `DOC-L4-UI-STANDARD` | `adopt` | `detailed` | `required` | Web clientとL10 browser/visual/a11y検証を有効化する。 |  |
| `mobile` | `DOC-L4-UI-STANDARD` | `adopt` | `detailed` | `required` | Mobile clientとdevice/offline/distribution設計を有効化する。 | PLAN-L4-22-vmodel-source-disposition-profile-ssot |
| `desktop` | `DOC-L4-UI-STANDARD` | `adopt` | `detailed` | `required` | Desktop clientとpackage/update/signing設計を有効化する。 | PLAN-L4-22-vmodel-source-disposition-profile-ssot |
| `cli` | `DOC-L4-UI-STANDARD` | `skip` | `lite` | `skipped` | CLI productはGUI UX slotを採用せず、external-if/CLI slotを使用する。 | PLAN-L4-22-vmodel-source-disposition-profile-ssot |
| `api-service` | `DOC-L4-UI-STANDARD` | `skip` | `lite` | `skipped` | APIService productはGUI UX slotを採用せず、external-if/API slotを使用する。 | PLAN-L4-22-vmodel-source-disposition-profile-ssot |

## 3. 解釈規則

- `decision=adopt` は当該 profile で文書を採用する。
- `decision=conditional` は capability / product selection の判定で採用または skip を決める。
- `decision=skip` は未採用ではなく、理由付きの意図的 skip である。
- `decision=defer` は該当文書を silent omission にせず、`required_plan_id` へ設計責任を接続する。
- `decision=skip|defer|conditional` は `reason` を必須にする。
- `required_plan_id` が入る行は、対応する PLAN が存在しない場合に検出対象にする。
- `status_override` と `detail_override` は profile 判定の結果であり、catalog の `default_status` を上書きする正本ではない。
- size profileとproduct profileは直交合成する。単一`profile_rank`で相互排他にせず、resolverがaxis別default+overrideを決定論的に適用する。
- 8 profile definition自体もDB projection対象とし、decision rowだけをprofile masterの代用にしない。
- resolverはsize baselineを先に適用し、product overlayを後から適用する。同じslotで競合した場合、明示product decisionがsize defaultを上書きする。
- security/privacy/trace/evidenceのcore requirementはproduct overlayで弱めない。detailは`lite < standard < detailed`の強い側を採用する。
- product固有source itemはcategory (`web|mobile|desktop|cli|apisvc`) とproduct profileを一致させ、別productのitemを暗黙採用しない。
- product overlayの`skip|conditional|defer`にも理由を必須とし、未定義overlayを自動`adopt`しない。

## 4. 不変条件

- 本書は DocumentCatalog 集約の profile 判定正本であり、version-up wave の対象PLANを制御する
  `vmodel-activation-profiles.md` とは混同しない。
- `document_scale_profile_reviews` は read-model であり、正本ではない。
- 検出系は catalog/profile/review の join 結果を読む。検出都合で採用判定、skip reason、詳細度を創作しない。
- product-select 文書は、採用・条件付き・skip・延期のどれであっても理由を DB から検索できる状態にする。
