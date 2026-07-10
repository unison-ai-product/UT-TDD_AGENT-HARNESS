---
title: "checked Vモデル semantic item catalog"
status: draft
owner: PO / TL
updated: 2026-07-10
typed_spec_phase_owner: L4
---

# checked Vモデル semantic item catalog

## 1. 役割

本書はchecked ZIPの `docs/catalog.yaml.items` をtracked authoring sourceとして正規化する。category 21件は分類軸、
item 163件はsemantic itemであり、両者を同じ件数として数えない。`source_ref` は番号付きsource documentへ接続し、
番号付き文書外の補助artifactは明示的なmeta mappingを持つ。

## 2. category

| category_id | category_name |
|---|---|
| `plan` | 企画・要求 |
| `req` | 要件定義 |
| `basic` | 基本設計 |
| `detail` | 詳細設計 |
| `data` | データ設計 |
| `std` | 標準・方式 |
| `sec` | セキュリティ |
| `ops` | 運用・可観測性 |
| `infra` | インフラ・基盤 |
| `saas` | SaaS事業・課金 |
| `web` | Webクライアント |
| `mobile` | モバイルアプリ |
| `desktop` | デスクトップアプリ |
| `cli` | CLI・管理ツール |
| `apisvc` | API・ヘッドレスサービス |
| `domain` | ドメイン(DDD) |
| `common` | 共通・拡張・規約 |
| `agent` | AIエージェント |
| `test` | テスト・検証 |
| `mgmt` | 管理 |
| `diagram` | 図面 |

## 3. 意味項目

| `item_id` | `item_name` | `category_id` | `source_status` | `source_ref` | `source_file` |
|---|---|---|---|---|---|
| `qa_checklist` | QA診断・品質チェックリスト | `test` | `done` | `ZIP-DOC-109` | `109_QA診断・品質チェックリスト` |
| `refactoring` | リファクタリング設計書 | `common` | `done` | `ZIP-DOC-108` | `108_リファクタリング設計書` |
| `kikaku` | 企画書 | `plan` | `done` | `ZIP-DOC-001` | `01_企画書` |
| `youkyu` | 要求定義書 | `plan` | `done` | `ZIP-DOC-002` | `02_要求定義書` |
| `poc` | PoC検証設計 | `plan` | `done` | `ZIP-DOC-053` | `53_PoC検証設計書` |
| `youken` | 要件定義書 | `req` | `done` | `ZIP-DOC-003` | `03_要件定義書` |
| `usecase_list` | ユースケース/ユーザーストーリー | `req` | `done` | `ZIP-DOC-002` | `02_要求定義書` |
| `screen_req` | 画面要求(区分) | `req` | `done` | `ZIP-DOC-002` | `02_要求定義書` |
| `req_register` | 要求・要件一覧(管理台帳) | `req` | `done` | `ZIP-DOC-043` | `43_要求・要件一覧(管理台帳)` |
| `sysconf` | システム構成設計 | `basic` | `done` | `ZIP-DOC-004` | `04_基本設計書` |
| `tenant` | テナント分離設計 | `basic` | `done` | `ZIP-DOC-004` | `04_基本設計書` |
| `func_list` | 機能一覧 | `basic` | `done` | `ZIP-DOC-004` | `04_基本設計書` |
| `screen_list` | 画面一覧 | `basic` | `done` | `ZIP-DOC-004` | `04_基本設計書` |
| `api_list` | API設計一覧 | `basic` | `done` | `ZIP-DOC-004` | `04_基本設計書` |
| `crud` | CRUDマトリクス | `basic` | `done` | `ZIP-DOC-004` | `04_基本設計書` |
| `func_detail` | 機能詳細/処理機能記述 | `detail` | `done` | `ZIP-DOC-005` | `05_詳細設計書` |
| `screen_spec` | 画面仕様書 | `detail` | `done` | `ZIP-DOC-005` | `05_詳細設計書` |
| `label_list` | 項目ラベル名一覧 | `detail` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `msg_list` | エラーメッセージ一覧 | `detail` | `done` | `ZIP-DOC-005` | `05_詳細設計書` |
| `code_list` | コード一覧(区分値) | `detail` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `mail` | システムメール一覧/定義 | `detail` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `file_spec` | ファイル一覧/仕様 | `detail` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `report_spec` | 帳票一覧/仕様 | `detail` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `extif_spec` | 外部インターフェース仕様 | `detail` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `integration` | 外部連携設計(方式/マッピング/監視) | `basic` | `done` | `ZIP-DOC-042` | `42_外部連携設計書` |
| `batch_spec` | バッチ設計/仕様 | `detail` | `done` | `ZIP-DOC-016` | `16_バッチ設計書` |
| `workflow` | ワークフロー一覧/定義 | `detail` | `done` | `ZIP-DOC-019` | `19_ワークフロー定義` |
| `data_item` | データ項目定義 | `data` | `done` | `ZIP-DOC-003` | `03_要件定義書` |
| `db_table` | DBテーブル一覧/定義 | `data` | `done` | `ZIP-DOC-005` | `05_詳細設計書` |
| `db_view` | DBビュー一覧/定義 | `data` | `done` | `ZIP-DOC-017` | `17_設計一覧・定義集` |
| `db` | データベース設計(論理/物理/索引) | `data` | `done` | `ZIP-DOC-022` | `22_データベース設計書` |
| `io` | 入出力設計 | `detail` | `done` | `ZIP-DOC-023` | `23_入出力設計書` |
| `display_catalog` | 表示名・翻訳カタログ(i18n) | `detail` | `done` | `ZIP-DOC-041` | `41_表示名・翻訳カタログ` |
| `i18n_resource` | i18nリソース(ja/en) | `std` | `done` | `ZIP-DOC-041` | `docs/i18n/` |
| `logic` | ロジック設計(判定表/擬似コード) | `detail` | `done` | `ZIP-DOC-024` | `24_ロジック設計書` |
| `network` | ネットワーク設計(通信要件/FW) | `infra` | `done` | `ZIP-DOC-025` | `25_ネットワーク設計書` |
| `server` | サーバー・インフラ設計(冗長/サイジング) | `infra` | `done` | `ZIP-DOC-026` | `26_サーバー・インフラ設計書` |
| `directory` | ディレクトリ構成・プロジェクト構造 | `infra` | `done` | `ZIP-DOC-045` | `45_ディレクトリ構成・プロジェクト構造設計` |
| `seo` | SEO・公開ページ設計 | `ops` | `done` | `ZIP-DOC-046` | `46_SEO・公開ページ設計` |
| `support` | サポート・問い合わせ・エスカレーション設計 | `ops` | `done` | `ZIP-DOC-047` | `47_サポート・問い合わせ・エスカレーション設計` |
| `user_docs` | ユーザードキュメント設計(ガイド/ヘルプ) | `common` | `done` | `ZIP-DOC-048` | `48_ユーザードキュメント設計` |
| `ai_verification` | AI成果物検証設計(幻覚/根拠/HITL) | `test` | `done` | `ZIP-DOC-049` | `49_AI成果物検証設計` |
| `restart` | 停止・再開・実行記録(リスタート/ジャーナル) | `detail` | `done` | `ZIP-DOC-050` | `50_停止・再開・実行記録設計` |
| `ui_test` | 画面検証(UIテスト/ビジュアル/a11y) | `test` | `done` | `ZIP-DOC-051` | `51_画面検証(UIテスト)設計` |
| `d_escalation` | エスカレーションフロー図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `domain` | ドメインモデル設計(DDD) | `domain` | `done` | `ZIP-DOC-027` | `27_ドメインモデル設計書` |
| `bounded_ctx` | 境界づけられたコンテキスト/マップ | `domain` | `done` | `ZIP-DOC-027` | `27_ドメインモデル設計書` |
| `aggregate` | 集約/エンティティ/値オブジェクト | `domain` | `done` | `ZIP-DOC-027` | `27_ドメインモデル設計書` |
| `domain_event` | ドメインイベント | `domain` | `done` | `ZIP-DOC-027` | `27_ドメインモデル設計書` |
| `glossary` | 用語集・データディクショナリ | `data` | `done` | `ZIP-DOC-030` | `30_用語集・データディクショナリ` |
| `components` | 共通部品・クラス/メソッド設計 | `common` | `done` | `ZIP-DOC-031` | `31_共通部品・クラス設計書` |
| `externalization` | 外部化・差し替え設計 | `common` | `done` | `ZIP-DOC-032` | `32_外部化・差し替え設計書` |
| `linkage` | トレーサビリティ・ID体系・紐づけ規約 | `common` | `done` | `ZIP-DOC-033` | `33_トレーサビリティ・ID体系・紐づけ規約` |
| `verification` | 検証設計(検証マトリクス) | `test` | `done` | `ZIP-DOC-028` | `28_検証設計書` |
| `test_tech` | テスト設計技法カタログ(ISTQB) | `test` | `done` | `ZIP-DOC-028` | `28_検証設計書` |
| `test_data` | テストデータ設計 | `test` | `done` | `ZIP-DOC-028` | `28_検証設計書` |
| `coverage_crit` | カバレッジ基準 | `test` | `done` | `ZIP-DOC-028` | `28_検証設計書` |
| `contract_test` | 契約テスト(CDC) | `test` | `done` | `ZIP-DOC-028` | `28_検証設計書` |
| `bdd` | 受入基準・BDDシナリオ | `test` | `done` | `ZIP-DOC-029` | `29_受入基準・BDDシナリオ` |
| `features` | 実行可能仕様(.feature) | `test` | `done` | `ZIP-DOC-029` | `specs/` |
| `naming` | 命名規則 | `std` | `done` | `ZIP-DOC-015` | `15_開発標準・規約書` |
| `coding` | コーディング規約 | `std` | `done` | `ZIP-DOC-015` | `15_開発標準・規約書` |
| `app_spec` | アプリケーション方式仕様 | `std` | `done` | `ZIP-DOC-018` | `18_アプリケーション方式仕様書` |
| `security` | セキュリティ設計/STRIDE | `sec` | `done` | `ZIP-DOC-010` | `10_セキュリティ設計書` |
| `authz` | 権限マトリクス | `sec` | `done` | `ZIP-DOC-010` | `10_セキュリティ設計書` |
| `appsec` | アプリセキュリティ対策(XSS等) | `sec` | `done` | `ZIP-DOC-010` | `10_セキュリティ設計書` |
| `ops` | 運用設計(監視/SLO/BK/ランブック) | `ops` | `done` | `ZIP-DOC-011` | `11_運用設計書` |
| `measurement` | 計測・KPI設計 | `ops` | `done` | `ZIP-DOC-020` | `20_計測・KPI設計書` |
| `logging` | ログ・トレース設計 | `ops` | `done` | `ZIP-DOC-021` | `21_ログ・トレース設計書` |
| `migration` | 移行設計・計画 | `ops` | `done` | `ZIP-DOC-013` | `13_移行設計・計画書` |
| `maintenance` | 保守・メンテナンス設計(保守区分/EOL/データLC) | `ops` | `done` | `ZIP-DOC-034` | `34_保守・メンテナンス設計書` |
| `dr_bcp` | 信頼性・DR/BCP設計(レジリエンス) | `ops` | `done` | `ZIP-DOC-035` | `35_信頼性・DR・BCP設計書` |
| `cicd` | CI/CDパイプライン設計 | `ops` | `done` | `ZIP-DOC-038` | `38_CI・CDパイプライン設計書` |
| `privacy` | プライバシー設計(DPIA/ROPA) | `sec` | `done` | `ZIP-DOC-036` | `36_プライバシー設計書` |
| `i18n_a11y` | 国際化・アクセシビリティ設計 | `std` | `done` | `ZIP-DOC-037` | `37_国際化・アクセシビリティ設計書` |
| `event_schema` | イベント・メッセージスキーマ設計 | `data` | `done` | `ZIP-DOC-039` | `39_イベント・メッセージスキーマ設計書` |
| `agent` | AIエージェント設計(ツール/メモリ/ガードレール/Eval) | `agent` | `done` | `ZIP-DOC-040` | `40_AIエージェント設計書` |
| `agent_guard` | エージェント・ガードレール/HITL | `agent` | `done` | `ZIP-DOC-040` | `40_AIエージェント設計書` |
| `env` | 環境定義書(dev/stg/prod) | `ops` | `done` | `ZIP-DOC-100` | `100_環境定義書` |
| `iac` | IaC/構成コード | `ops` | `na` | `NO-SOURCE` | `` |
| `test_plan` | テスト計画 | `test` | `done` | `ZIP-DOC-012` | `12_テスト計画書` |
| `ut` | 単体テスト設計 | `test` | `done` | `ZIP-DOC-006` | `06_単体テスト設計書` |
| `it` | 結合テスト設計 | `test` | `done` | `ZIP-DOC-007` | `07_結合テスト設計書` |
| `st` | 総合テスト設計 | `test` | `done` | `ZIP-DOC-008` | `08_総合テスト設計書` |
| `at` | 受入テスト設計 | `test` | `done` | `ZIP-DOC-009` | `09_受入テスト設計書` |
| `perf` | 性能試験計画(詳細) | `test` | `done` | `ZIP-DOC-101` | `101_性能試験計画書` |
| `sectest` | セキュリティテスト計画/脆弱性診断 | `test` | `done` | `ZIP-DOC-102` | `102_セキュリティテスト計画・脆弱性診断書` |
| `mgmt` | 課題・リスク・意思決定(ADR) | `mgmt` | `done` | `ZIP-DOC-014` | `14_課題・リスク・意思決定管理` |
| `change` | 変更管理 | `mgmt` | `done` | `ZIP-DOC-014` | `14_課題・リスク・意思決定管理` |
| `wbs` | 実装工程管理(L単位・WBS/ガント) | `mgmt` | `done` | `ZIP-DOC-103` | `(wbs.yaml)` |
| `trace` | トレーサビリティ俯瞰図 | `mgmt` | `done` | `ZIP-DOC-033` | `(traceability.yaml)` |
| `index_map` | 成果物インデックス・マップ | `mgmt` | `done` | `ZIP-DOC-044` | `44_成果物インデックス・マップ` |
| `tailoring` | 文書化方針・テーラリング(粒度) | `mgmt` | `done` | `ZIP-DOC-052` | `52_文書化方針・テーラリング設計` |
| `proj_plan` | プロジェクト計画書 | `mgmt` | `done` | `ZIP-DOC-103` | `103_プロジェクト計画書` |
| `d_sysconf` | システム構成図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_screen` | 画面遷移図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_state` | 状態遷移図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_er` | ER図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_seq` | シーケンス図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_comp` | コンポーネント図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_dfd` | DFD | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_job` | ジョブネット図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_wire` | 画面ワイヤーフレーム | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_usecase` | ユースケース図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_activity` | アクティビティ図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_class` | クラス図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_deploy` | デプロイ・ネットワーク構成図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_context` | コンテキストマップ(DDD) | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_aggregate` | 集約図(DDD) | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_ext` | 差し替え・拡張ポイント図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_agent` | AIエージェント・アーキ図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_cicd` | CI/CDパイプライン図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `d_artifactmap` | 成果物マップ図 | `diagram` | `done` | `ZIP-DOC-044` | `diagrams.yaml` |
| `billing` | 課金・メータリング・エンタイトルメント設計 | `saas` | `done` | `ZIP-DOC-054` | `54_課金・メータリング設計書` |
| `tenant_lifecycle` | テナント・ライフサイクル/プロビジョニング設計 | `saas` | `done` | `ZIP-DOC-055` | `55_テナントライフサイクル設計書` |
| `quota` | レート制限・クォータ・スロットリング設計 | `saas` | `done` | `ZIP-DOC-060` | `60_レート制限・クォータ設計書` |
| `residency` | リージョン戦略・データレジデンシー設計 | `saas` | `done` | `ZIP-DOC-059` | `59_リージョン戦略・データレジデンシー設計書` |
| `release_strategy` | リリース・デプロイ戦略設計 | `ops` | `done` | `ZIP-DOC-061` | `61_リリース・デプロイ戦略設計書` |
| `incident` | インシデント管理・オンコール・ポストモーテム設計 | `ops` | `done` | `ZIP-DOC-062` | `62_インシデント管理・ポストモーテム設計書` |
| `capacity` | キャパシティ計画・オートスケール設計 | `ops` | `done` | `ZIP-DOC-063` | `63_キャパシティ計画・オートスケール設計書` |
| `finops` | コスト設計・FinOps・ユニットエコノミクス | `ops` | `done` | `ZIP-DOC-064` | `64_コスト設計・FinOps設計書` |
| `ops_manual` | 運用手順書・保守マニュアル・教育/訓練計画 | `ops` | `done` | `ZIP-DOC-065` | `65_運用手順書・保守マニュアル・教育計画` |
| `sla_catalog` | 顧客SLA・サービスカタログ | `ops` | `done` | `ZIP-DOC-066` | `66_顧客SLA・サービスカタログ設計書` |
| `supplychain` | ソフトウェア供給網セキュリティ設計(SBOM/SCA/SLSA) | `sec` | `done` | `ZIP-DOC-056` | `56_供給網セキュリティ設計書` |
| `keymgmt` | シークレット・鍵管理設計(KMS/ローテーション) | `sec` | `done` | `ZIP-DOC-057` | `57_シークレット鍵管理設計書` |
| `identity_prov` | アイデンティティ・プロビジョニング設計(SCIM/JIT) | `sec` | `done` | `ZIP-DOC-067` | `67_アイデンティティ・プロビジョニング設計書` |
| `compliance_map` | コンプライアンス対応・統制マッピング・監査証跡 | `sec` | `done` | `ZIP-DOC-068` | `68_コンプライアンス対応・統制マッピング設計書` |
| `nfr_grid` | 非機能要件グリッド(ISO/IEC 25010品質特性網羅) | `req` | `done` | `ZIP-DOC-058` | `58_非機能要件グリッド設計書` |
| `perf_design` | 性能設計(キャッシュ/索引/N+1/ページング) | `basic` | `done` | `ZIP-DOC-069` | `69_性能設計書` |
| `model_gov` | モデルガバナンス・ML-BOM・モデルカード | `agent` | `done` | `ZIP-DOC-070` | `70_モデルガバナンス・ML-BOM設計書` |
| `sys_plan` | ビジネス/ミッション分析・システム化計画 | `plan` | `done` | `ZIP-DOC-071` | `71_ビジネス分析・システム化計画書` |
| `fe_design` | フロントエンド設計(SPA/SSR・状態管理) | `web` | `done` | `ZIP-DOC-072` | `72_フロントエンド設計書` |
| `browser_responsive` | ブラウザ対応・レスポンシブ設計 | `web` | `done` | `ZIP-DOC-073` | `73_ブラウザ対応・レスポンシブ設計書` |
| `web_perf` | Web性能設計(Core Web Vitals) | `web` | `done` | `ZIP-DOC-074` | `74_Web性能設計書` |
| `web_session` | Webセッション・CSRF/CORS設計 | `web` | `done` | `ZIP-DOC-075` | `75_Webセッション・CSRF・CORS設計書` |
| `mobile_arch` | モバイルアプリアーキ設計(MVVM/ナビ) | `mobile` | `done` | `ZIP-DOC-076` | `76_モバイルアプリアーキ設計書` |
| `offline_sync` | オフライン・同期・ローカル永続化設計 | `mobile` | `done` | `ZIP-DOC-077` | `77_オフライン・同期・ローカル永続化設計書` |
| `push_perms` | プッシュ通知・デバイス権限設計 | `mobile` | `done` | `ZIP-DOC-078` | `78_プッシュ通知・デバイス権限設計書` |
| `app_dist` | アプリ配布・署名・ストア審査設計 | `mobile` | `done` | `ZIP-DOC-079` | `79_アプリ配布・署名・ストア審査設計書` |
| `mobile_sec` | モバイルセキュリティ設計 | `mobile` | `done` | `ZIP-DOC-080` | `80_モバイルセキュリティ設計書` |
| `device_compat` | 端末互換・バージョニング・省電力設計 | `mobile` | `done` | `ZIP-DOC-081` | `81_端末互換・バージョニング・省電力設計書` |
| `desk_arch` | デスクトップアプリアーキ設計 | `desktop` | `done` | `ZIP-DOC-082` | `82_デスクトップアプリアーキ設計書` |
| `desk_pkg` | パッケージング・インストーラ設計 | `desktop` | `done` | `ZIP-DOC-083` | `83_パッケージング・インストーラ設計書` |
| `desk_update` | デスクトップ自動更新設計 | `desktop` | `done` | `ZIP-DOC-084` | `84_自動更新設計書` |
| `desk_sign` | コード署名・公証設計 | `desktop` | `done` | `ZIP-DOC-085` | `85_コード署名・公証設計書` |
| `desk_os` | OS統合設計 | `desktop` | `done` | `ZIP-DOC-086` | `86_OS統合設計書` |
| `desk_sec` | デスクトップセキュリティ・ローカルデータ設計 | `desktop` | `done` | `ZIP-DOC-087` | `87_デスクトップセキュリティ・ローカルデータ設計書` |
| `cli_arch` | CLIアーキ・コマンド体系設計 | `cli` | `done` | `ZIP-DOC-088` | `88_CLIアーキ・コマンド体系設計書` |
| `cli_cfg` | CLI設定・認証・出力設計 | `cli` | `done` | `ZIP-DOC-089` | `89_CLI設定・認証・出力設計書` |
| `cli_dist` | CLI配布・シェル補完設計 | `cli` | `done` | `ZIP-DOC-090` | `90_CLI配布・シェル補完設計書` |
| `api_gov` | APIガバナンス・バージョニング設計 | `apisvc` | `done` | `ZIP-DOC-091` | `91_APIガバナンス・バージョニング設計書` |
| `api_portal` | APIポータル・SDK設計 | `apisvc` | `done` | `ZIP-DOC-092` | `92_APIポータル・SDK設計書` |
| `api_webhook` | Webhook・イベント配信設計 | `apisvc` | `done` | `ZIP-DOC-093` | `93_Webhook・イベント配信設計書` |
| `domain_impl` | ドメイン実装方針・値オブジェクト設計(完全コンストラクタ) | `domain` | `done` | `ZIP-DOC-094` | `94_ドメイン実装方針・値オブジェクト設計書` |
| `method_rules` | クラス・メソッド設計規約(AI生成準拠) | `std` | `done` | `ZIP-DOC-095` | `95_クラス・メソッド設計規約書` |
| `design_principles` | 設計原則(7つの柱) | `std` | `done` | `ZIP-DOC-096` | `96_設計原則(7つの柱)設計書` |
| `spec_driven` | スペック駆動開発・トレース閉包(漏れない仕組み) | `std` | `done` | `ZIP-DOC-097` | `97_スペック駆動開発・トレース閉包設計書` |
| `mesh_vmodel` | 編み目式Vモデル設計術(トレースメッシュ/RAG/インパクト) | `std` | `done` | `ZIP-DOC-098` | `98_編み目式Vモデル設計術` |
| `typed_spec` | 型付きスペック・自動検出設計 | `std` | `done` | `ZIP-DOC-099` | `99_型付きスペック・自動検出設計書` |
| `json_schema` | JSON型・スキーマ設計(契約・境界検証・生成) | `data` | `done` | `ZIP-DOC-104` | `104_JSON型・スキーマ設計書` |
| `persistence` | 永続化マッピング設計(リポジトリ・VO⇔カラム・制約) | `data` | `done` | `ZIP-DOC-105` | `105_永続化マッピング設計書` |
| `codegen` | 規約→TS/Python実装対応付録 | `std` | `done` | `ZIP-DOC-106` | `106_TS・Pythonコード生成付録` |
| `vmodel_levels` | Vモデル・レベル定義(L1〜L12)と駆動原則 | `std` | `done` | `ZIP-DOC-107` | `107_Vモデル・レベル定義` |

## 4. 補助source対応

- `diagrams.yaml` のitemは成果物indexを所有する `ZIP-DOC-044` へ接続する。
- `docs/i18n/` は表示名・翻訳catalogを所有する `ZIP-DOC-041` へ接続する。
- `specs/` は受入基準・BDDを所有する `ZIP-DOC-029` へ接続する。
- `wbs.yaml` はproject planを所有する `ZIP-DOC-103` へ接続する。
- `traceability.yaml` はtrace/ID規約を所有する `ZIP-DOC-033` へ接続する。
- `iac` はsource catalog自体が `status=na` / file空を宣言するため、`NO-SOURCE` を理由付き状態として保持する。

## 5. 不変条件

- itemは163件exactly、item_id重複0、unknown category 0である。
- `NO-SOURCE` はsource側が `status=na` のitemに限る。
- source_refは109 source dispositionまたは承認済meta mappingへ解決する。
- item→source→target edgeに理由なしorphanを許さない。
