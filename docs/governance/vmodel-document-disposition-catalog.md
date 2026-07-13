---
title: "checked Vモデル source document disposition catalog"
status: draft
owner: PO / TL
updated: 2026-07-10
typed_spec_phase_owner: L4
---

# checked Vモデル source document disposition catalog

## 1. 役割

本書はchecked ZIPの番号付きsource document 109件をexactly once評価し、HARNESSへの統合先と判断理由を残す。
`merge`は既存正本へ意味を統合、`adopt`は独立slot/contractを採用、`reference`はprofile/案件条件付きの設計入力、
`defer`は必ず後続PLANへ接続、`not_applicable`はHARNESS製品境界外、`reject`は設計上採用しないことを表す。

source document、semantic item、HARNESS target slotは別集約である。本表の`target`はtarget slotまたは正本pathを示し、
163 semantic itemとのitem-level joinはPLAN-L4-22のprojection contractで追加する。21 categoryは分類軸として別管理する。

## 2. 採否判断

| source_id | source_title | disposition | target | profile / 判断理由 |
|---|---|---|---|---|
| ZIP-DOC-001 | 企画書 | merge | `PLAN-L0-01` | engine-swap charterへ統合 |
| ZIP-DOC-002 | 要求定義書 | merge | `docs/design/harness/L1-requirements/` | L1要求群へ分解統合 |
| ZIP-DOC-003 | 要件定義書 | merge | `docs/design/harness/L3-functional/` | FR/AC正本へ統合 |
| ZIP-DOC-004 | 基本設計書 | merge | `docs/design/harness/L4-basic-design/` | L4 sub-doc群へ分解統合 |
| ZIP-DOC-005 | 詳細設計書 | merge | `docs/design/harness/L5-detailed-design/` | L5 sub-doc群へ分解統合 |
| ZIP-DOC-006 | 単体テスト設計書 | merge | `docs/test-design/harness/L7-unit-test-design.md` | 谷のRed/UT契約へ統合 |
| ZIP-DOC-007 | 結合テスト設計書 | merge | `docs/test-design/harness/L8-integration-test-design.md` | G8契約へ統合 |
| ZIP-DOC-008 | 総合テスト設計書 | merge | `docs/test-design/harness/L9-system-test-design.md` | G9契約へ統合 |
| ZIP-DOC-009 | 受入テスト設計書 | merge | `docs/test-design/harness/L12-acceptance-test-design.md` | G12契約へ統合 |
| ZIP-DOC-010 | セキュリティ設計書 | merge | `docs/design/harness/L4-basic-design/security.md` | security slotへ統合。脅威モデル(STRIDE)実体はsecurity.md §5 (PLAN-L4-29) |
| ZIP-DOC-011 | 運用設計書 | merge | `docs/test-design/harness/L14-operational-test-design.md` | L13/L14運用証拠へ統合 |
| ZIP-DOC-012 | テスト計画書 | adopt | `docs/process/vmodel-contract.yaml` | G7-G14共通evidence policyとして採用 |
| ZIP-DOC-013 | 移行設計・計画書 | merge | `docs/process/gates.md` | G12 deploy/rollbackへ統合 |
| ZIP-DOC-014 | 課題・リスク・意思決定管理 | merge | `docs/adr/` | ADR/feedback/route decisionへ統合 |
| ZIP-DOC-015 | 開発標準・規約書 | merge | `docs/governance/coding-rules.md` | coding/readability gateへ統合 |
| ZIP-DOC-016 | バッチ設計書 | reference | `DOC-L4-BATCH` | product capability選択時に採用 |
| ZIP-DOC-017 | 設計一覧・定義集 | merge | `docs/governance/vmodel-document-catalog.md` | typed catalog/spec IRへ統合 |
| ZIP-DOC-018 | アプリケーション方式仕様書 | merge | `docs/design/harness/L4-basic-design/architecture.md` | runtime adapter方式へ統合 |
| ZIP-DOC-019 | ワークフロー定義 | merge | `docs/process/forward/overview.md` | Forward FSM/mode接続へ統合 |
| ZIP-DOC-020 | 計測・KPI設計書 | merge | `docs/design/harness/L1-requirements/business-requirements.md` | L0価値/G14評価へ統合 |
| ZIP-DOC-021 | ログ・トレース設計書 | merge | `docs/design/harness/L5-detailed-design/` | evidence/telemetry物理設計へ統合 |
| ZIP-DOC-022 | データベース設計書 | merge | `docs/design/harness/L5-detailed-design/physical-data.md` | harness.db physical designへ統合 |
| ZIP-DOC-023 | 入出力設計書 | merge | `docs/design/harness/L4-basic-design/external-if.md` | CLI/provider I/Oへ統合 |
| ZIP-DOC-024 | ロジック設計書 | merge | `docs/design/harness/L6-function-design/function-spec.md` | guard/resolver契約へ統合 |
| ZIP-DOC-025 | ネットワーク設計書 | reference | `docs/governance/vmodel-document-catalog.md` | governed repoがnetworkを持つ場合のみprofile採用 |
| ZIP-DOC-026 | サーバー・インフラ設計書 | reference | `docs/governance/vmodel-document-catalog.md` | production infrastructure変更時のみprofile採用 |
| ZIP-DOC-027 | ドメインモデル設計書 | merge | `docs/design/harness/L4-basic-design/data.md` | aggregate/VO/invariantへ統合 |
| ZIP-DOC-028 | 検証設計書 | merge | `docs/process/vmodel-contract.yaml` | V-pair/gate/case familyへ統合 |
| ZIP-DOC-029 | 受入基準・BDDシナリオ | merge | `docs/design/harness/L3-functional/` | AC/AT traceへ統合 |
| ZIP-DOC-030 | 用語集・データディクショナリ | adopt | `docs/governance/document-system-map.md` | shared terminology/data slotとして採用 |
| ZIP-DOC-031 | 共通部品・クラス設計書 | merge | `docs/design/harness/L5-detailed-design/module-decomposition.md` | module/class boundaryへ統合 |
| ZIP-DOC-032 | 外部化・差し替え設計書 | merge | `docs/design/harness/L4-basic-design/architecture.md` | provider/adapter portへ統合 |
| ZIP-DOC-033 | トレーサビリティ・ID体系・紐づけ規約 | merge | `docs/process/plan-asset-v2.md` | immutable identity/traceへ統合 |
| ZIP-DOC-034 | 保守・メンテナンス設計書 | merge | `docs/test-design/harness/L14-operational-test-design.md` | operation/upgrade evidenceへ統合 |
| ZIP-DOC-035 | 信頼性・DR・BCP設計書 | reference | `docs/governance/vmodel-document-catalog.md` | governed productのresilience profileで採用 |
| ZIP-DOC-036 | プライバシー設計書 | reference | `docs/design/harness/L4-basic-design/security.md` | PII取扱いがある案件のみ高影響承認付き採用。デフォルト値はnot_applicable、判断理由はsecurity.md §9 (PLAN-L4-29) |
| ZIP-DOC-037 | 国際化・アクセシビリティ設計書 | merge | `docs/design/harness/L4-basic-design/ui-standard.md` | UI/a11y/i18n slotへ統合 |
| ZIP-DOC-038 | CI・CDパイプライン設計書 | merge | `docs/process/gates.md` | CI/merge evidenceへ統合 |
| ZIP-DOC-039 | イベント・メッセージスキーマ設計書 | merge | `docs/design/harness/L5-detailed-design/physical-data.md` | append-only event schemaへ統合 |
| ZIP-DOC-040 | AIエージェント設計書 | merge | `docs/design/harness/L4-basic-design/architecture.md` | runtime/agent guard/memoryへ統合 |
| ZIP-DOC-041 | 表示名・翻訳カタログ | merge | `docs/design/harness/L4-basic-design/ui-standard.md` | UI表示/i18n catalogへ統合 |
| ZIP-DOC-042 | 外部連携設計書 | merge | `docs/design/harness/L4-basic-design/external-if.md` | provider/plugin/app contractへ統合 |
| ZIP-DOC-043 | 要求・要件一覧(管理台帳) | merge | `docs/design/harness/L3-functional/functional-requirements.md` | spec IR/trace ledgerへ統合 |
| ZIP-DOC-044 | 成果物インデックス・マップ | merge | `docs/governance/document-system-map.md` | source/item/target mapへ統合 |
| ZIP-DOC-045 | ディレクトリ構成・プロジェクト構造設計 | merge | `AGENTS.md` | repository architecture/rulesへ統合 |
| ZIP-DOC-046 | SEO・公開ページ設計 | reference | `DOC-L4-UI-STANDARD` | Web profileで公開面がある場合のみ採用 |
| ZIP-DOC-047 | サポート・問い合わせ・エスカレーション設計 | merge | `docs/process/gates.md` | blocked/escalation/PO authorityへ統合 |
| ZIP-DOC-048 | ユーザードキュメント設計 | merge | `docs/governance/document-system-map.md` | distribution/user docs slotへ統合 |
| ZIP-DOC-049 | AI成果物検証設計 | merge | `docs/process/vmodel-contract.yaml` | AI review/eval evidenceへ統合 |
| ZIP-DOC-050 | 停止・再開・実行記録設計 | merge | `docs/design/harness/L6-function-design/` | session/handover/event lifecycleへ統合 |
| ZIP-DOC-051 | 画面検証(UIテスト)設計 | merge | `docs/test-design/harness/L10-ux-validation-test-design.md` | G10 browser/visual/a11yへ統合 |
| ZIP-DOC-052 | 文書化方針・テーラリング設計 | merge | `docs/governance/vmodel-document-scale-profiles.md` | 8 profile resolverへ統合 |
| ZIP-DOC-053 | PoC検証設計書 | merge | `docs/process/modes/` | Scrum/PoC S0-S4へ統合 |
| ZIP-DOC-054 | 課金・メータリング設計書 | reference | `vmodel-document-scale-profiles.md` | billing capability案件のみprofile採用 |
| ZIP-DOC-055 | テナントライフサイクル設計書 | reference | `vmodel-document-scale-profiles.md` | multi-tenant案件のみprofile採用 |
| ZIP-DOC-056 | 供給網セキュリティ設計書 | merge | `docs/design/harness/L4-basic-design/security.md` | dependency/distribution gateへ統合。実体はsecurity.md §6 (PLAN-L4-29) |
| ZIP-DOC-057 | シークレット鍵管理設計書 | merge | `docs/design/harness/L4-basic-design/security.md` | secret scan/rotation policyへ統合。実体はsecurity.md §7、KEK-DEK部分はnot_applicable (§9、PLAN-L4-29) |
| ZIP-DOC-058 | 非機能要件グリッド設計書 | merge | `docs/design/harness/L1-requirements/nfr.md` | NFR/verification traceへ統合 |
| ZIP-DOC-059 | リージョン戦略・データレジデンシー設計書 | reference | `vmodel-document-scale-profiles.md` | regulated/multi-region案件のみ採用 |
| ZIP-DOC-060 | レート制限・クォータ設計書 | merge | `docs/design/harness/L4-basic-design/architecture.md` | provider/token concurrency policyへ統合 |
| ZIP-DOC-061 | リリース・デプロイ戦略設計書 | merge | `docs/process/gates.md` | G12/G13 rollout/rollbackへ統合 |
| ZIP-DOC-062 | インシデント管理・ポストモーテム設計書 | merge | `docs/test-design/harness/L14-operational-test-design.md` | operational feedbackへ統合 |
| ZIP-DOC-063 | キャパシティ計画・オートスケール設計書 | reference | `vmodel-document-scale-profiles.md` | runtime capacityを持つ案件のみ採用 |
| ZIP-DOC-064 | コスト設計・FinOps設計書 | merge | `docs/design/harness/L1-requirements/nfr.md` | token/cost budgetへ統合 |
| ZIP-DOC-065 | 運用手順書・保守マニュアル・教育計画 | merge | `docs/test-design/harness/L14-operational-test-design.md` | Pack/user operationsへ統合 |
| ZIP-DOC-066 | 顧客SLA・サービスカタログ設計書 | reference | `vmodel-document-scale-profiles.md` | external SLAを持つ案件のみ採用 |
| ZIP-DOC-067 | アイデンティティ・プロビジョニング設計書 | reference | `docs/design/harness/L4-basic-design/security.md` | auth/identity変更時のみ高影響承認付き採用。デフォルト値はnot_applicable、判断理由はsecurity.md §9 (PLAN-L4-29) |
| ZIP-DOC-068 | コンプライアンス対応・統制マッピング設計書 | reference | `vmodel-document-scale-profiles.md` | regulated profileで採用 |
| ZIP-DOC-069 | 性能設計書 | merge | `docs/design/harness/L1-requirements/nfr.md` | performance NFRへ統合 |
| ZIP-DOC-070 | モデルガバナンス・ML-BOM設計書 | merge | `docs/design/harness/L4-basic-design/architecture.md` | model routing/advisor evidenceへ統合 |
| ZIP-DOC-071 | ビジネス分析・システム化計画書 | merge | `PLAN-L0-01` | L0 value/engine-swap programへ統合 |
| ZIP-DOC-072 | フロントエンド設計書 | merge | `docs/design/harness/L4-basic-design/ui-standard.md` | UI architecture slotへ統合 |
| ZIP-DOC-073 | ブラウザ対応・レスポンシブ設計書 | reference | `DOC-L4-UI-STANDARD` | Web profileで採用 |
| ZIP-DOC-074 | Web性能設計書 | reference | `DOC-L4-UI-STANDARD` | Web profileで採用 |
| ZIP-DOC-075 | Webセッション・CSRF・CORS設計書 | reference | `DOC-L4-SECURITY` | Web profileで採用 |
| ZIP-DOC-076 | モバイルアプリアーキ設計書 | reference | `vmodel-document-scale-profiles.md` | Mobile profileで採用 |
| ZIP-DOC-077 | オフライン・同期・ローカル永続化設計書 | reference | `vmodel-document-scale-profiles.md` | Mobile profileで採用 |
| ZIP-DOC-078 | プッシュ通知・デバイス権限設計書 | reference | `vmodel-document-scale-profiles.md` | Mobile profileで採用 |
| ZIP-DOC-079 | アプリ配布・署名・ストア審査設計書 | reference | `vmodel-document-scale-profiles.md` | Mobile profileで採用 |
| ZIP-DOC-080 | モバイルセキュリティ設計書 | reference | `vmodel-document-scale-profiles.md` | Mobile profileで採用 |
| ZIP-DOC-081 | 端末互換・バージョニング・省電力設計書 | reference | `vmodel-document-scale-profiles.md` | Mobile profileで採用 |
| ZIP-DOC-082 | デスクトップアプリアーキ設計書 | reference | `vmodel-document-scale-profiles.md` | Desktop profileで採用 |
| ZIP-DOC-083 | パッケージング・インストーラ設計書 | reference | `vmodel-document-scale-profiles.md` | Desktop profileで採用 |
| ZIP-DOC-084 | 自動更新設計書 | reference | `vmodel-document-scale-profiles.md` | Desktop profileで採用 |
| ZIP-DOC-085 | コード署名・公証設計書 | reference | `vmodel-document-scale-profiles.md` | Desktop profileで採用 |
| ZIP-DOC-086 | OS統合設計書 | reference | `vmodel-document-scale-profiles.md` | Desktop profileで採用 |
| ZIP-DOC-087 | デスクトップセキュリティ・ローカルデータ設計書 | reference | `vmodel-document-scale-profiles.md` | Desktop profileで採用 |
| ZIP-DOC-088 | CLIアーキ・コマンド体系設計書 | merge | `docs/design/harness/L4-basic-design/external-if.md` | CLI surfaceへ統合 |
| ZIP-DOC-089 | CLI設定・認証・出力設計書 | merge | `docs/design/harness/L4-basic-design/external-if.md` | CLI config/output契約へ統合、auth変更は別承認 |
| ZIP-DOC-090 | CLI配布・シェル補完設計書 | merge | `docs/design/harness/L4-basic-design/external-if.md` | Pack/completionへ統合 |
| ZIP-DOC-091 | APIガバナンス・バージョニング設計書 | merge | `docs/design/harness/L4-basic-design/external-if.md` | provider/API contractへ統合 |
| ZIP-DOC-092 | APIポータル・SDK設計書 | reference | `vmodel-document-scale-profiles.md` | APIService profileで公開SDKがある場合に採用 |
| ZIP-DOC-093 | Webhook・イベント配信設計書 | reference | `vmodel-document-scale-profiles.md` | APIService profileでevent deliveryがある場合に採用 |
| ZIP-DOC-094 | ドメイン実装方針・値オブジェクト設計書 | merge | `docs/design/harness/L4-basic-design/data.md` | VO/invariantへ統合 |
| ZIP-DOC-095 | クラス・メソッド設計規約書 | merge | `docs/governance/coding-rules.md` | coding ruleへ統合 |
| ZIP-DOC-096 | 設計原則(7つの柱)設計書 | merge | `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` | vNext原則差分へ統合 |
| ZIP-DOC-097 | スペック駆動開発・トレース閉包設計書 | merge | `docs/design/harness/L4-basic-design/data.md` | spec IR/closureへ統合 |
| ZIP-DOC-098 | 編み目式Vモデル設計術 | merge | `docs/process/vmodel-contract.yaml` | V-pair/impact/RAGへ統合 |
| ZIP-DOC-099 | 型付きスペック・自動検出設計書 | merge | `docs/design/harness/L4-basic-design/data.md` | authored spec→detectorへ統合 |
| ZIP-DOC-100 | 環境定義書 | reference | `vmodel-document-scale-profiles.md` | governed repoのenvironment profileで採用 |
| ZIP-DOC-101 | 性能試験計画書 | merge | `docs/test-design/harness/L9-system-test-design.md` | G9 performance evidenceへ統合 |
| ZIP-DOC-102 | セキュリティテスト計画・脆弱性診断書 | merge | `docs/test-design/harness/L9-system-test-design.md` | security verificationへ統合。実体はL9 §1.4 ST-EXT-06 (PLAN-L4-29) |
| ZIP-DOC-103 | プロジェクト計画書 | merge | `docs/governance/vmodel-upgrade-schedule.md` | program/schedule/FSM projectionへ統合 |
| ZIP-DOC-104 | JSON型・スキーマ設計書 | merge | `docs/design/harness/L5-detailed-design/physical-data.md` | schema boundaryへ統合 |
| ZIP-DOC-105 | 永続化マッピング設計書 | merge | `docs/design/harness/L5-detailed-design/physical-data.md` | projection/rebuild mappingへ統合 |
| ZIP-DOC-106 | TS・Pythonコード生成付録 | reference | `docs/governance/coding-rules.md` | HARNESS runtimeはTS/Bunのみ、他言語はgoverned repo向け参照 |
| ZIP-DOC-107 | Vモデル・レベル定義 | merge | `docs/process/vmodel-contract.yaml` | HARNESS L0-L14へ翻訳統合 |
| ZIP-DOC-108 | リファクタリング設計書 | merge | `docs/process/modes/refactor.md` | behavior-preserving route/gateへ統合 |
| ZIP-DOC-109 | QA診断・品質チェックリスト | merge | `docs/process/gates.md` | release Go/No-Goとdoctor evidenceへ統合 |

## 3. 機械不変条件

- `ZIP-DOC-001..109` は欠番・重複なく1回だけ現れる。
- disposition語彙外の値を許さない。
- `reference|not_applicable|reject|merge` はrationaleを必須、`defer`は存在するPLANを必須にする。
- source 109件の完了はsemantic item 163件のjoin完了を代替しない。
- detectorは本表に無いdisposition/target/profileを推測生成しない。
