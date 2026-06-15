---
schema_version: skill.v1
name: verification
skill_type: verification
applies_to:
  layers: [L1, L2, L3, L4, L5, L6, L7, L8]
  drive_models: [Forward, Reverse, Discovery, Scrum, Recovery]
upstream: vendor/helix-source/skills/workflow/verification
---

# 検証スキル（L1-L8 + Reverse RG0-RGC）

## 適用タイミング

このスキルは以下の場合に読み込む:
- 各開発フェーズの品質ゲート通過時
- 設計・実装・テスト・デプロイの検証時
- V-model 各層の検証実行時（Forward / Reverse 両対応）

---

## フェーズ別判断チェックリスト

各フェーズで Go/No-Go を判断する際の最小チェック項目。

### L1（要件）

- スコープ確定（対象/対象外が明示）
- NFR 基準（性能・可用性・セキュリティ等）
- PoC 要否（不確実性が高い領域の有無）
- 事前調査要否（技術・法務・運用）

### L2（設計）

- ADR 作成（意思決定の記録）
- 技術選定理由（比較根拠と採否）
- 脅威モデル（STRIDE/OWASP 観点）
- adversarial-review 要否（反証レビュー実施判断）

### L3（詳細設計・契約）

- API 凍結（エンドポイント/型/エラー）
- DB 凍結（スキーマ/制約/マイグレーション方針）
- 契約凍結（FE-BE-DB 整合）
- テスト方針（Unit/Integration/E2E の配分）
- [ ] 結合テスト設計 (D-TEST-DESIGN-INT) と単体テスト設計 (D-TEST-DESIGN-UNIT) が別文書として存在する
- [ ] D-API / D-DB から テスト設計への双方向 reference が記載されている

### L4（実装）

- リファクタ vs 突進（負債返済か機能優先か）
- 共通化（重複 3 箇所以上の扱い）
- 外部化（プロジェクト横断で使うか）
- ship or fix（出荷可能性の判断）

### L5（Visual）

- V0/V1/V2 分類（品質段階の判定）
- a11y 合格（最低基準クリア）
- デザイン完了（仕様との一致）

### L6（統合検証）

- テスト十分性（網羅性・安定性）
- 性能合格（目標 SLO/指標達成）
- セキュリティ合格（Critical/High なし）
- RC 判定（リリース候補可否）

### L7（デプロイ）

- ロールバック判断基準（切戻し条件）
- 安定判定（監視・アラート正常）
- 人間承認（本番影響の承認）

### L8（受入）

- 受入/差戻し（要件突合結果）
- 残余リスク受容（受容可否の明示）
- 運用引継ぎ完了（Runbook/SLO/連絡経路）

---

## 1. 検証レイヤー概要

```
L1:    要件検証      ← 企画書・要件定義
L2:    設計検証      ← 基本設計・詳細設計
L3_api: API整合性   ← Frontend/Backend/DB間の型・スキーマ一致
V-L3:  コントラクト  ← API仕様・インターフェース定義
V-L4:  依存関係      ← パッケージ・外部サービス
V-L5:  テスト検証    ← 単体・結合・E2E
V-L6:  運用検証      ← 監視・アラート・SRE

※ V-L3〜V-L6 は本スキル固有の検証レイヤー番号。
  UT-TDD フェーズ番号（L3=詳細設計+API契約、L4=実装、L5=Visual Refinement、L6=統合検証、L7=デプロイ、L8=受入）とは別体系。
```

---

## 2. L1: 要件検証

### 検証項目

```
□ 要件の完全性
  - 全機能要件が定義されている
  - 非機能要件が明確
  - 受け入れ条件が具体的

□ 要件の一貫性
  - 矛盾する要件がない
  - 優先順位が明確
  - スコープが定義されている

□ 要件の追跡可能性
  - 要件IDが付与されている
  - ビジネス目標との紐付け
  - テストケースへの対応
```

### 出力

```yaml
l1_verification:
  status: pass/fail
  coverage:
    functional: 100%
    non_functional: 100%
  issues: []
  timestamp: "ISO8601"
```

---

## 3. L2: 設計検証

### 検証項目

```
□ 設計の妥当性
  - 要件を満たす設計か
  - 技術選定の根拠
  - スケーラビリティ考慮

□ 設計の整合性
  - 画面設計とAPI設計の整合
  - データモデルとビジネスロジックの整合
  - コンポーネント間の依存関係

□ 設計の実現可能性
  - 期間内に実装可能か
  - チームスキルとのマッチ
  - 技術的リスクの評価
```

---

## 4. L3: API整合性検証（API契約検証）

→ 詳細は `docs/skills/api-contract.md` を参照

### 検証項目

```
□ Frontend/Backend/DB間の型一致
  - リクエスト/レスポンスの型定義がFE/BE間で一致
  - DBスキーマとバックエンド型の整合
  - 列挙型・定数値の同期

□ スキーマ整合性
  - OpenAPI仕様と実装の一致
  - 契約テスト（Consumer-Driven Contract）の通過

□ 自動検証
  - 型一致率の数値判定
  - 不合格時はL3 API契約検証内でループ（契約再定義 or 各層の実装修正）
```

### 出力

```yaml
l3_api_verification:
  status: pass/fail
  type_match_rate: "100%"  # Frontend ↔ Backend ↔ DB
  schema_coverage: "100%"
  issues: []
  timestamp: "ISO8601"
```

---

## 5. V-L3: コントラクト検証

→ 詳細は `docs/skills/api-contract.md` を参照

```
□ API仕様定義の完全性
□ エラーコード網羅
□ 後方互換性
□ バージョニング戦略
```

---

## 6. V-L4: 依存関係検証

→ 詳細は `docs/skills/dependency-map.md` を参照

```
□ 依存パッケージの脆弱性
□ ライセンス互換性
□ バージョン互換性
□ 循環依存の検出
```

---

## 7. V-L5: テスト検証

→ 詳細は `docs/skills/quality-lv5.md` を参照

```
□ テストカバレッジ
□ テストピラミッド比率
□ クリティカルパスの網羅
□ 回帰テストの実行
```

---

## 8. V-L6: 運用検証

> **V-L6 と L7 の責務境界**: V-L6 は「運用体制の充足性」（可観測性設計・アラート設定・運用手順の存在）を検証する。
> 「デプロイ後の SLO 達成」は L7（本番安定性ゲート）の責務。
> V-L6 は統合検証フェーズ（L5 → L6）で実施され、L7 の開始前提として pass が必要。

```
□ 可観測性
  - ログ出力の網羅
  - メトリクス収集
  - トレーシング設定

□ アラート設定
  - SLO/SLI定義
  - アラートしきい値
  - エスカレーションパス

□ 運用手順
  - デプロイ手順書
  - ロールバック手順
  - 障害対応フロー
```

---

## 8.5. フェーズ証跡 vs L6 集約再検証

| 検証項目 | 証跡作成フェーズ | L6 で再検証するか | 備考 |
|---------|----------------|-----------------|------|
| 要件カバレッジ | L1（G1 通過時） | ○ 突合のみ | 実装結果と要件の対応確認 |
| 設計整合性 | L2（G2 通過時） | ○ 差分検証 | 実装が設計から逸脱していないか |
| API/型一致率 | L3（G3 通過時） | ○ 再計測 | FE↔BE↔DB の型一致を実コードで再検証 |
| 実装品質 | L4（各ゲート） | △ サンプル | レビュー結果の確認（全件再実行はしない） |
| ビジュアル適合 | L5（G5 通過時） | △ スクリーンショット | UI変更時のみ |
| 依存関係・脆弱性 | L3/L4 | ○ 再スキャン | npm audit / pip-audit を最新状態で実行 |
| テストカバレッジ | L4（実装.4） | ○ 再実行 | 全テストスイート実行 |
| 運用体制 | L6 で新規作成 | — | SLO定義・アラート・運用手順の存在確認 |

---

## 9. 検証実行フロー

```
開始
  │
  ├─→ L1検証 ──→ fail → 要件修正 → 再検証
  │     │
  │     pass
  │     ↓
  ├─→ L2検証 ──→ fail → 設計修正 → 再検証
  │     │
  │     pass
  │     ↓
  ├─→ L3 API整合性検証 → fail → 型/スキーマ修正 → 再検証
  │     │
  │     pass
  │     ↓
  ├─→ V-L3検証 ──→ fail → API仕様修正 → 再検証
  │     │
  │     pass
  │     ↓
  ├─→ V-L4検証 ──→ fail → 依存修正 → 再検証
  │     │
  │     pass
  │     ↓
  ├─→ V-L5検証 ──→ fail → テスト追加 → 再検証
  │     │
  │     pass
  │     ↓
  └─→ V-L6検証 ──→ fail → 運用設定修正 → 再検証
        │
        pass
        ↓
      完了（デプロイ可能）
```

---

## 10. 検証結果の記録

```yaml
verification_report:
  project: "project-name"
  version: "1.0.0"
  timestamp: "ISO8601"

  layers:
    L1:
      status: "pass"
      coverage: "100%"
      issues: []
    L2:
      status: "pass"
      coverage: "100%"
      issues: []
    L3_api:
      status: "pass"
      type_match_rate: "100%"
      schema_coverage: "100%"
      issues: []
    V-L3:
      status: "pass"
      coverage: "95%"
      issues: []
    V-L4:
      status: "pass"
      vulnerabilities: 0
      outdated: 2
    V-L5:
      status: "pass"
      unit_coverage: "85%"
      integration_coverage: "70%"
      e2e_coverage: "critical_paths"
    V-L6:
      status: "pass"
      observability: "complete"
      alerts: "configured"

  # Reverse モード（該当時のみ追加）
  reverse_layers:
    RG0:
      status: "pass"
      coverage: "100%"
      unknowns_cataloged: true
    RG1:
      status: "pass"
      api_coverage: "92%"
      confidence_high_rate: "83%"
      contradictions: 0
    RG2:
      status: "pass"
      adr_confidence_high_rate: "75%"
      contradictions: 0
      adversarial_review: completed
    RG3:
      status: "pass"
      po_verified_rate: "85%"
      unknown_tasks_assigned: true
    RGC:
      status: "pass"
      gap_closed: 38
      gap_partial: 3
      gap_open: 1
      po_approval: "PO-approved"

  overall: "pass"
  notes: "Ready for production deployment"
```

---

## 11. 自動化ツール統合

```yaml
# CI/CD例 (GitHub Actions)
verify:
  jobs:
    l1-requirements:
      # 要件追跡ツール連携
    l2-design:
      # 設計ドキュメント検証
    l3-api-integrity:
      # Frontend/Backend/DB型一致検証
    vl3-contract:
      # OpenAPI検証
    vl4-dependencies:
      - run: npm audit
      - run: npx license-checker
    vl5-testing:
      - run: npm run test:coverage
      - run: npm run test:e2e
    vl6-operations:
      # 監視設定検証
```

---

## 12. 監査の責任者・対応SLA

### RACI定義

| 役割 | 担当 |
|------|------|
| Accountable | PM |
| Responsible | SE / 担当エージェント |
| Consulted | TL |
| Informed | PO（人間） |

### 対応SLA（回数ベース）

| 重大度 | 対応基準 | エスカレーション閾値 |
|--------|----------|---------------------|
| critical | 次ゲート到達前に対応必須 | 未対応のまま次フェーズ進行 → 人間通知 + 停止必須 |
| high | 同一フェーズ内で対応 | 2回未対応 → 人間通知 |
| medium | 次マイルストーンまでに対応 | 3回未対応 → 人間通知 |
| low | 終端レトロまでに対応 | ミニレトロで記録のみ |

### 人間エスカレーション条件

以下は必ず人間にエスカレーションする:

**即時エスカレーション（Critical）**

| 条件 | エスカレーション形式 |
|------|---------------------|
| 本番環境への影響 | 実行前に承認を得る |
| 外部API連携の新規追加/既存変更 | 承認を得る |
| 認証・認可ロジックの変更 | 設計承認を得る |
| 課金・決済関連 | 実装前に承認を得る |
| 個人情報の取り扱い変更 | 方針決定を仰ぐ |
| ライセンス・著作権関連 | 判断を仰ぐ |

Critical条件は明示的な承認を待機する（推奨選択肢で勝手に続行しない）。

---

## 13. V字モデル検証サイクル

各レイヤーは独立した検証ループを持ち、左（計画）と右（検証）の対比で品質を確認する。

```
L1  要件定義 ←──────────────────→ 受入検証（L8）
L2    設計書 ←────────────────→ 設計整合性検証
L3      詳細設計+API契約 ←──→ API整合性検証+依存関係検証+テスト検証
             L4 実装（底）
             L5 Visual Refinement
L6        統合検証 ←────────→ E2E・性能・セキュリティ検証
L7             デプロイ ←──→ 本番検証
```

### 4 artifact 双方向 trace 検証責務

V-model における 4 artifact（① 設計 / ② 実装コード / ③ テスト設計 / ④ テストコード）はすべて別文書として存在する。
verification スキルは、4 artifact の揃いと双方向 reference の trace 整合性を G2/G3/G4 ゲートで検証する責務を持つ。

- G2: ① 全体設計 ↔ ③ 総合テスト設計 の双方向 reference を確認
- G3: ① 詳細設計 (D-API / D-DB) ↔ ③ 結合テスト設計 + ① 機能設計 ↔ ③ 単体テスト設計 の双方向 reference を確認
- G4: ② 実装コード ↔ ④ テストコード の docstring reference を確認

### レイヤー内検証ループ

```
設計書 → 契約/仕様作成 → 実装突合 → 一致率判定
  ↑                                    │
  │                    100%? ──No──→ 修正指示
  │                      │
  └──────────────────── Yes → 次レイヤーへ

ループ上限: 各レイヤー最大5回
超過時: 上位レイヤーにエスカレーション
最上位(L1)超過時: 人間にエスカレーション
```

---

## 14. Reverse モード検証

Forward 検証が「**仕様に対する実装の適合**」を判定するのに対し、Reverse 検証は「**証拠に対する仮説の十分性**」を判定する。

→ Reverse フロー詳細: `vendor/helix-source/skills/workflow/reverse-analysis/SKILL.md` (historical reference)

### Forward ↔ Reverse 検証の対比

| | Forward 検証 | Reverse 検証 |
|--|-------------|-------------|
| 問い | 「実装は仕様を満たすか？」 | 「証拠は仮説を支持するか？」 |
| 判定基準 | 一致率・カバレッジ・pass/fail | coverage, confidence, contradictions, unknowns |
| 不合格時 | 実装修正 → 再検証 | 追加証拠収集 or 仮説修正 → 再検証 |

### Reverse ゲート検証項目

#### RG0 証拠網羅検証

```
□ evidence_map にスコープ内全モジュール含有
□ 依存グラフ（内部 + 外部）完成
□ DB スキーマ取得済み
□ unknowns が全て cataloged
□ ファイルツリーで未スキャン領域 = 0
```

#### RG1 契約検証

```
□ API エンドポイント抽出 coverage ≥ 90%
□ DB スキーマ抽出 coverage ≥ 90%
□ 型マッピング（FE↔BE↔DB）抽出 coverage ≥ 90%
□ confidence high の契約 ≥ 80%
□ contradictions 0（未解決）
```

#### RG2 設計検証

```
□ アーキテクチャスタイル特定済み
□ ADR 仮説の confidence high ≥ 70%
□ contradictions 0（未解決）
□ adversarial-review 実施済み（M/L サイジング時）
```

#### RG3 仮説検証

```
□ PO 検証済み仮説率 ≥ 80%
□ 全仮説に Intended / Accidental / Unknown / Deprecated 分類済み
□ unknown 分類の全項目に調査タスク割当済み
```

### RGC Gap 閉塞検証

```
□ gap_register 全項目に closed / partial / open ステータス付与
□ closed 項目に evidence 記録済み
□ 仮説成果物の昇格判定完了（intent_hypotheses は PO 承認必須）
□ 残存 gap → debt_register に移管済み
```

---

## 15. Spec 駆動検証

仕様成果物（D-API / D-CONTRACT / D-DB）を起点に、実装後テストを自動導出する。
実装コードから逆算してテストを作るのではなく、仕様を正として不足を検出する。

### 仕様 → テスト自動導出の基本手順

1. D-API: エンドポイント、メソッド、期待ステータスを抽出
2. D-CONTRACT: Consumer/Provider の契約条件を抽出
3. D-DB: テーブル、制約、NULL可否、境界値条件を抽出
4. テンプレートに流し込み、テスト雛形を生成
5. G4 で自動実行し、L8 で仕様突合レポートに統合

### API 仕様 → マトリクステスト

最小単位は `endpoint × method × status_code`。

| endpoint | method | status | 目的 |
|----------|--------|--------|------|
| `/api/v1/users` | `GET` | `200` | 正常系 |
| `/api/v1/users` | `POST` | `201` | 作成成功 |
| `/api/v1/users/{id}` | `GET` | `404` | 存在しないID |
| `/api/v1/users` | `POST` | `422` | バリデーション違反 |

### テスト生成テンプレート（Jest）

```typescript
describe('D-API matrix', () => {
  const cases = [
    { method: 'get', path: '/api/v1/users', status: 200 },
    { method: 'post', path: '/api/v1/users', status: 201 },
    { method: 'post', path: '/api/v1/users', status: 422 },
  ] as const

  test.each(cases)('$method $path => $status', async ({ method, path, status }) => {
    const res = await request(app)[method](path)
    expect(res.status).toBe(status)
  })
})
```

---

## 16. 仕様突合チェック（L8 受入時）

### 検出対象

- 仕様に書いてあるが実装に存在しない項目（spec-only）
- 実装に存在するが仕様に書いていない項目（impl-only）

### 出力フォーマット（L8 添付）

```yaml
spec_reconciliation:
  d_api:
    spec_only: []
    impl_only: []
  d_contract:
    spec_only: []
    impl_only: []
  d_db:
    spec_only: []
    impl_only: []
  verdict: pass/fail
```

---

## チェックリスト

### 検証開始前

```
□ 検証対象の範囲を確認
□ 前提条件を確認
□ 必要なツール・環境を準備
```

### 検証実行中

```
□ 各レイヤーを順次実行
□ 発見した問題を記録
□ ブロッカーは即座にエスカレーション
```

### 検証完了後

```
□ 検証レポートを作成
□ 未解決の問題をトラッキング
□ 次フェーズへの申し送り
```
