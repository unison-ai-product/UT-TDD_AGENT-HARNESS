---
schema_version: skill.v1
name: quality-lv5
skill_type: testing
applies_to:
  layers: [L4, L6]
  drive_models: [Forward, Add-feature, Refactor, Recovery]
upstream: vendor/helix-source/skills/workflow/quality-lv5
---

# テスト品質検証スキル（V-L5）

## 適用タイミング

このスキルは以下の場合に読み込む:
- テスト作成完了時の品質確認
- 品質ゲート通過判定時（G4/G6）
- リリース前の最終検証時
- V-L5 検証（テスト検証）実行時

> 責務の使い分け:
> - **テストを書く**: `common/testing` を参照
> - **テスト品質の合否判定**: 本スキル（G4/G6 ゲート時）
> - **成果物 ↔ 要件の突合検証**: `docs/skills/verification.md`（L1 受入条件 / L8 受入 / Reverse ゲート）

---

## 1. 品質レベル定義

> 本スキルのテスト品質レベル (T1-T5) は、開発成熟度とは別の軸。
> T = テスト品質の深さ。

### T1: 最低限

```
□ 主要機能の正常系テスト
□ クリティカルバグの検出可能
目標: Unit 50%+
```

### T2: 基本

```
□ 正常系 + 主要異常系
□ バリデーションテスト
□ 境界値テスト
目標: Unit 60%+, Integration 主要フロー
```

### T3: 標準

```
□ 正常系 + 全異常系
□ エッジケース
□ 回帰テスト
目標: Unit 70%+, Integration 60%+
```

### T4: 高品質

```
□ T3 + パフォーマンステスト
□ セキュリティテスト
□ 負荷テスト
目標: Unit 80%+, Integration 70%+, E2E クリティカルパス
```

### T5: 最高品質

```
□ T4 + カオステスト
□ 耐障害性テスト
□ 継続的テスト
目標: Unit 90%+, Integration 80%+, E2E 全フロー
```

---

## 2. テストピラミッド検証

### 理想比率

```
        /\
       /  \      E2E: 10%
      /----\
     /      \    Integration: 20%
    /--------\
   /          \  Unit: 70%
  /------------\
```

### 比率計算

```typescript
// テスト数ベース
const ratio = {
  unit: unitTests.length / totalTests * 100,
  integration: integrationTests.length / totalTests * 100,
  e2e: e2eTests.length / totalTests * 100
};

// 判定
const isHealthy =
  ratio.unit >= 60 &&
  ratio.integration >= 15 &&
  ratio.integration <= 30 &&
  ratio.e2e <= 15;
```

### アンチパターン

```
アイスクリームコーン（E2E過多）: E2E が全体の 30%+ → Unit が薄く回帰が遅い
ホールグラス（Integration不足）: Unit と E2E だけで Integration が 0 → 統合バグを検出できない
```

---

## 3. カバレッジ検証

### 測定対象

```
□ ステートメントカバレッジ（行）
□ ブランチカバレッジ（分岐）
□ 関数カバレッジ（関数）
□ 条件カバレッジ（条件式）
```

### 目標設定

| レイヤー | 最低限 | 推奨 | 理想 |
|---------|-------|------|------|
| Unit | 60% | 80% | 90% |
| Integration | 40% | 60% | 70% |
| E2E | クリティカル | 主要フロー | 全フロー |

### 除外対象

```typescript
// カバレッジ除外の正当な理由
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  // 開発時のみのコード
}

// 除外すべきでないもの
// - ビジネスロジック
// - エラーハンドリング
// - バリデーション
```

---

## 4. クリティカルパス検証

### クリティカルパスの定義

```
優先度1（必須）:
□ ユーザー認証フロー
□ 決済フロー
□ 主要CRUD操作

優先度2（重要）:
□ パスワードリセット
□ 通知送信
□ データエクスポート

優先度3（通常）:
□ 設定変更
□ 検索・フィルタ
□ 表示オプション
```

### クリティカルパステスト（TypeScript）

```typescript
describe('Critical Path: User Authentication', () => {
  test('CP-001: User can register with valid data', async () => {
    // 正常系
  });

  test('CP-002: User can login with correct credentials', async () => {
    // 正常系
  });

  test('CP-003: User cannot login with wrong password', async () => {
    // 異常系
  });

  test('CP-004: User can reset password', async () => {
    // リカバリーパス
  });
});
```

---

## 5. テスト品質メトリクス

### 主要メトリクス

| 指標 | 推奨値 |
|------|--------|
| Flaky率 | < 5% |
| パス率 | > 95% |
| テスト/コード比 | > 1.0 |
| Unit平均実行時間 | < 100ms |

---

## 6. 品質ゲート

### 通過条件

```yaml
quality_gate:
  coverage:
    min_statement: 70%
    min_branch: 60%

  tests:
    must_pass: true
    max_flaky: 5%

  new_code:
    min_coverage: 80%
    no_new_bugs: true

  security:
    no_critical: true
    no_high: true
```

### CI/CD統合（GitHub Actions）

```yaml
test:
  steps:
    - run: npm test -- --coverage
    - name: Quality Gate
      run: |
        coverage=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
        if (( $(echo "$coverage < 70" | bc -l) )); then
          echo "Coverage below threshold: $coverage%"
          exit 1
        fi
```

---

## 7. 品質目標・測定・改善

### 品質目標

```
□ 定量目標の明記
  - カバレッジ、欠陥許容値、応答時間などの数値目標がある
□ SLA / SLO の明記
  - 稼働率、復旧時間、応答時間などの運用目標がある
□ 品質対象範囲の明記
  - 対象機能、対象環境、対象利用者が定義されている
```

### 品質測定

```
□ test カバレッジの測定
  - statement / branch / critical path の測定方法がある
□ バグ密度の測定
  - 欠陥件数、再発率、重大度区分の集計方法がある
□ 性能の測定
  - レイテンシ、スループット、負荷時の劣化基準がある
```

### 品質改善

```
□ 継続改善の手順
  - 指摘を backlog 化し、改善サイクルへ入れる手順がある
□ レビューの手順
  - 設計・実装・テストのレビュー責務が定義されている
□ 監査の手順
  - 監査証跡、再検証、是正記録の残し方が定義されている
```

---

## チェックリスト

### テスト作成時

```
□ 正常系テスト
□ 異常系テスト
□ 境界値テスト
□ エッジケーステスト
```

### 品質検証時

```
□ カバレッジ目標達成
□ ピラミッド比率確認
□ クリティカルパス網羅
□ Flakyテストなし
```

### リリース前

```
□ 全テスト通過
□ 品質ゲート通過
□ パフォーマンステスト
□ セキュリティテスト
```
