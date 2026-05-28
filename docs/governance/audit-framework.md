# UT-TDD GitHub / GHA Audit Framework (PO declared)

> **status**: PO declared 2026-05-28。L1 業務要求の入力として `../plans/PLAN-L1-01-business-requirements.md §3.7` で扱う。下流で BR-13〜19 + NFR-11 等として L1 正本に分解する。
> **役割**: PR/merge 時点の CI 検問 (7-Gate pipeline) の運用要件。W-model のフェーズ進捗ゲート (G0.5〜G14) とは別軸 (PR ごとに発火) で、両者は補完関係。
> **正本性**: 本 doc は PO 提示の operational vision の faithful record。「HELIX」naming は本 framework 内の方法論名として保持する (vendor `vendor/helix-source/` 由来素材とは別概念)。
> **既知の整合課題 (L1 確定前に PO 確認)**:
> - 既存 `docs/` 構造 (governance/design/test-design/plans/adr/migration) vs framework の `docs/` (product.md/requirements.md/architecture.md/coding-rules.md/risk-policy.yaml/features/) — migration timing
> - feature ID `F-NNN` と既存 BR-NN の関係
> - `.helix/reports/` (framework) vs `.ut-tdd/` (現行 runtime state) のパス名前空間
> - 「HELIX」naming を UT-TDD context に normalize するか

---

## 1. 基本思想

HELIXは、AI時代の開発を安全に進めるための開発統治フレームワークである。

基本構造は以下とする。

```txt
全体方針：ドキュメント駆動
ドキュメント監査：ドメイン駆動
実装：テスト駆動
コード品質：コーディングルール駆動
マージ判断：GitHub Actionsによる検問
```

HELIXでは、AIにコードを書かせること自体を目的にしない。

目的は、以下を統制することである。

* 何を作るか
* なぜ作るか
* どの機能に属するか
* 業務概念として正しいか
* テストで保証されているか
* コーディングルールに従っているか
* mainに入れてよい変更か

## 2. 全体構造

HELIXの開発・監査・マージ判断は、以下の流れで行う。

```txt
要求
↓
Document Gate
↓
Domain Gate
↓
Test Gate
↓
Implementation Gate
↓
Coding Rule Gate
↓
PR Gate
↓
Merge Gate
```

各Gateの役割は以下。

| Gate                | 役割                                      |
| ------------------- | --------------------------------------- |
| Document Gate       | 必要なドキュメントが揃っているか確認する                    |
| Domain Gate         | 業務概念・責務・用語・境界が正しいか監査する                  |
| Test Gate           | 仕様に対応するテストが存在するか確認する                    |
| Implementation Gate | 実装がテストと仕様を満たしているか確認する                   |
| Coding Rule Gate    | コードがプロジェクトの規約に従っているか確認する                |
| PR Gate             | docs / code / tests の三点一致を確認する          |
| Merge Gate          | safe / caution / danger / unknown を判定する |

## 3. ドキュメント駆動

HELIXでは、開発対象をドキュメントで定義する。

Issueは補助的に使うが、開発の正本はドキュメントとする。

基本ドキュメント構成は以下。

```txt
docs/
├─ product.md
├─ requirements.md
├─ architecture.md
├─ coding-rules.md
├─ risk-policy.yaml
└─ features/
   ├─ F-001-auth.md
   ├─ F-002-applicants.md
   └─ F-003-csv-export.md
```

各機能は `docs/features/` 配下に1機能1ファイルで管理する。

機能ドキュメントは、frontmatterと本文で構成する。

```md
---
feature_id: F-003
name: 応募者CSV出力
version: 1.2.0
status: active
risk: caution
auto_merge: false

layers:
  frontend:
    risk: safe
    related_paths:
      - app/applicants/**
      - src/features/applicants/components/**

  service:
    risk: caution
    related_paths:
      - src/features/applicants/export/**
      - app/api/applicants/export/**

  database:
    risk: danger
    related_paths:
      - prisma/schema.prisma
      - migrations/**
    related_tables:
      - applicants
      - applications
      - export_logs

required_tests:
  frontend:
    - CSV出力ボタンが表示される
    - 出力中ローディングが表示される

  service:
    - フィルター条件通りにCSVが生成される
    - 権限がない場合は出力できない

  database:
    - export_logs に出力履歴が保存される
---

# F-003 応募者CSV出力

(本文: 概要 / 目的 / フロント仕様 / サービス仕様 / データ仕様 / 非対象 / 更新履歴)
```

## 4. Document Gate

Document Gateでは、必要なドキュメントが存在するかを確認する。

主な確認項目:

* `product.md` 存在
* `requirements.md` 存在
* `architecture.md` 存在
* 該当機能の `docs/features/*.md` 存在
* 機能ID 付与
* 機能バージョン 付与
* 関連パス定義
* 必須テスト定義
* risk / auto_merge 定義

機能変更PRで該当 feature md が更新されていない場合はブロック。

```txt
機能変更あり → 該当feature md更新なし → PRブロック
```

## 5. ドメイン駆動監査

Domain Gateでは、ドキュメントの中身を業務概念・責務・境界の観点から監査する (存在チェックだけでは通さない)。

### 5.1 用語監査

* 同じ概念に複数の名前を使っていないか
* 別概念を同じ名前で扱っていないか
* 業務上の呼称とシステム上の名称がズレていないか
* 機能名が曖昧すぎないか

例: 「応募者 / 求職者 / 候補者 / ユーザー」が同じか別意味かを定義する。

### 5.2 責務監査

* 1 機能に複数責務が混ざっていないか
* UI都合で業務責務を歪めていないか
* サービス層に置くべき処理がフロントに漏れていないか
* DB都合で業務概念を壊していないか

### 5.3 境界監査

* 機能の境界が明確か
* 他機能との依存関係が定義されているか
* 外部連携との境界が明確か
* 認証・権限との境界が明確か

### 5.4 データ監査

* エンティティが業務実態に合っているか
* テーブルと機能の関係が明確か
* 保存すべき状態と表示だけの状態が混ざっていないか
* 履歴・ログ・現在値の扱いが明確か

### 5.5 出力

`.helix/reports/domain-audit.md` を出力。例:

```md
# Domain Audit Report
## Result: caution
## Matched Features: F-003 応募者CSV出力
## Findings
### 用語: 「応募者」と「候補者」が混在
### 責務: CSV整形処理がフロントに漏れている可能性
### 境界: 権限管理機能 F-005 への依存を明記する必要あり
## Decision: TLレビュー必須
```

## 6. テスト駆動実装

機能ドキュメントの `required_tests` に基づいてテスト観点を定義してから実装する (テストファースト)。

```txt
機能仕様確認 → required_tests確認 → テスト作成 → 失敗確認 → 実装 → テスト通過 → リファクタ
```

テストは機能IDに紐づける:

```txt
tests/
└─ features/
   └─ F-003-csv-export/
      ├─ frontend.test.ts
      ├─ service.test.ts
      └─ database.test.ts
```

テストファイルに `feature_id` / `target` を明記:

```ts
/**
 * feature_id: F-003
 * target: service
 */
```

Test Gate 確認項目:
* 該当機能の必須テストが存在
* テストが feature_id に紐づく
* required_tests とテスト内容が対応
* テスト pass
* 失敗テスト無視なし

## 7. Implementation Gate

実装が仕様とテストを満たしているかを確認。

* 実装ファイルが該当機能の `related_paths` 内に収まっているか
* 想定外のファイルを変更していないか
* 実装がテストを満たしているか
* 仕様外の挙動を追加していないか
* フロント / サービス / DB の責務分離
* 一時的な実装・仮実装の残存なし
* TODO/FIXME に理由明記

出力: `.helix/reports/implementation-audit.md`

## 8. コーディングルール駆動

`docs/coding-rules.md` で以下を定義:

* ディレクトリ構成
* 命名規則
* importルール
* 関数分割ルール
* エラーハンドリング
* ログ出力
* 型定義
* UIコンポーネント分割
* API設計
* DBアクセス方針
* テスト配置
* 禁止事項

## 9. coding-rules.md (例)

```md
# Coding Rules

## 1. 基本方針
- 読みやすさ優先 / 暗黙知非依存 / 責務分離 / 仕様外実装禁止 / 一時対応は理由をコメント

## 2. ディレクトリ構成
src/{features, components, services, lib, types, utils}/

## 3. 命名規則
- 関数名は動詞から / boolean は is/has/can/should / DB由来型とUI表示型を混ぜない / 汎用すぎる名前 (data/item/value/handle/process/manager) を避ける

## 4. importルール
- 深すぎる相対パス避ける / feature間直接依存禁止 / shared層への依存OK / circular dependency禁止

## 5. フロントルール
- UI に業務ロジック置かない / API は専用 hook/service 経由 / 表示状態と保存状態を混ぜない / エラー表示省略禁止

## 6. サービスルール
- 業務ロジックは service 層 / 権限チェック省略禁止 / 外部 API は adapter 経由 / 例外を握りつぶさない

## 7. データベースルール
- schema 変更は docs 更新を伴う / migration 自動マージ不可 / 削除系は人間レビュー必須 / 履歴必要データはログ設計明記

## 8. テストルール
- 機能変更にテスト追加 / feature_id に紐づける / 重要機能は正常系異常系両方 / テストを通すためだけの実装禁止

## 9. 禁止事項
- main直接push / 仕様外のついで修正 / .env コミット / secrets/credentials 変更 / 認証・権限の無断変更 / DB migration の自動マージ / GHA 設定の無断変更
```

## 10. Coding Rule Gate

Coding Rule Gate で `docs/coding-rules.md` 遵守を確認:
- 命名規則 / レイヤー責務 / import / エラーハンドリング / 型定義 / テスト配置 / 禁止事項

機械的検査は Lint/Typecheck/静的解析、AI 判断は HELIX 監査レポートで。

出力: `.helix/reports/coding-rule-audit.md`

## 11. docs / code / tests 三点一致

| 状態                  | 判定              |
| ------------------- | --------------- |
| codeだけ変更            | ブロック            |
| code + tests        | docs不足でブロック     |
| code + docs         | tests不足でブロック    |
| docs + tests        | 実装不足として確認       |
| docs + code + tests | 通過候補            |
| docsのみ              | ドキュメント更新として通過候補 |
| testsのみ             | テスト追加として通過候補    |

機能変更PRは原則三点セット必須。

## 12. PR Gate

PRに以下のレポートを含める:

```txt
.helix/reports/
├─ document-audit.md
├─ domain-audit.md
├─ test-result.json
├─ implementation-audit.md
├─ coding-rule-audit.md
├─ changed-files.json
├─ feature-risk.json
├─ review-summary.md
├─ execution-log.md
└─ rollback-plan.md
```

PR Gate 確認:
- 各 Gate が pass (Domain は許容範囲含む)
- docs / code / tests が揃う
- rollback-plan 存在
- 未解決リスクなし

## 13. Merge Gate

| 判定      | 処理           |
| ------- | ------------ |
| safe    | Auto-merge候補 |
| caution | TLレビュー       |
| danger  | 人間レビュー       |
| unknown | 自動マージ禁止      |

### safe 条件
- Document/Domain/Test/Implementation/Coding-Rule Gate 全 pass
- docs/code/tests の必要条件
- 該当機能 safe
- database 変更なし
- auth/permissions 変更なし
- deploy 設定変更なし
- unknown ファイルなし
- rollback-plan 存在
- PR サイズ基準内

### ブロック条件
- 上記 Gate のいずれか fail
- Domain Gate danger
- 機能変更なのに docs / tests 更新なし
- database / auth / permissions / deploy / GHA / secrets 変更あり
- unknown ファイルあり
- rollback-plan なし

## 14. GitHub Actions の役割

GHA は HELIX の監査結果を読み、マージ可否を判定する**検問装置**。

GHA が行うこと:
- PR の変更ファイル取得
- `docs/features/*.md` の frontmatter 読み込み
- `related_paths` と変更ファイルの照合
- `risk` / `auto_merge` 取得
- `.helix/reports/` の監査結果確認
- safe/caution/danger/unknown 判定
- safe のみ Auto-merge 候補

役割分離: **HELIX = 開発・監査 / GitHub Actions = 検問・執行**

## 15. Revert方針

基本: revert ではなく **PR ブロックを優先**。

```txt
PR段階の不一致 → ブロックして修正
main混入後の不一致 → revert候補
```

revert 検討条件 (main 混入後):
- docs と実装が矛盾
- tests 不足
- danger 変更が自動マージされていた
- unknown 変更が main 混入
- 権限・認証・DB に想定外変更
- コーディングルール違反が重大

## 16. 最終定義

```txt
ドキュメント駆動 → ドメイン駆動監査 → テスト駆動実装 → コーディングルール監査 → GitHub Actions検問
```

思想:
- 何を作るかは**ドキュメント**で決める
- ドキュメントの正しさは**ドメイン**で監査する
- 実装の正しさは**テスト**で保証する
- コード品質は**ルール**で監査する
- main 投入は **GitHub Actions** で検問する

これにより AI 開発でも以下を実現:
- 仕様にない実装を防ぐ
- 業務概念のズレを防ぐ
- 責務の混在を防ぐ
- テストされていない実装を防ぐ
- コーディングルール違反を防ぐ
- 危険変更の自動マージを防ぐ
- 人間が見るべき PR だけを人間に回す
- safe な PR だけを自動で流す
