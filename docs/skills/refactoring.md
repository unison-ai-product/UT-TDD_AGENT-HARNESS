---
schema_version: skill.v1
name: refactoring
skill_type: process
applies_to:
  layers: [L4, L6, L7]
  drive_models: [Refactor, Forward, Add-feature]
upstream: vendor/helix-source/skills/common/refactoring
---

# リファクタリングスキル

## 適用タイミング

- コード改善時
- 技術的負債の解消時
- パフォーマンス最適化時
- 可読性向上時

---

## 1. リファクタリング原則

### いつやるか

```
やる
- 機能追加の前（準備リファクタ）
- バグ修正時（理解のためのリファクタ）
- コードレビュー後
- テストが十分にある時

やらない
- 締め切り直前
- テストがない時
- 理解していないコード
- 機能追加と同時（分離する）
```

### リファクタリングの範囲

```
小: 変数名変更、メソッド抽出
中: クラス分割、責務移動
大: アーキテクチャ変更、設計変更

大きなリファクタは分割して段階的に
```

---

## 2. 共通化ルール

### DRY 原則

同じコードが3回出たら共通化を検討。

「たまたま同じ」と「本質的に同じ」を区別する。

### 共通化の判断基準

| 状況 | 判断 |
|------|------|
| 同じロジックが3箇所以上 | 共通化 |
| 2箇所だが今後増える見込み | 共通化 |
| 2箇所で変更頻度が違う | 分離のまま |
| 似てるが微妙に違う | 分離のまま |

### 共通化パターン

```typescript
// 重複コード
function getUserName(user: User) {
  return `${user.lastName} ${user.firstName}`
}
function getAdminName(admin: Admin) {
  return `${admin.lastName} ${admin.firstName}`
}

// 共通化
interface HasName {
  lastName: string
  firstName: string
}
function getFullName(person: HasName) {
  return `${person.lastName} ${person.firstName}`
}
```

### 共通化レイヤー

```
utils/        → 純粋関数、汎用ユーティリティ
helpers/      → ドメイン固有のヘルパー
services/     → ビジネスロジック
components/   → UIコンポーネント
hooks/        → React Hooks
```

---

## 3. 分割ルール

### 単一責任原則（SRP）

1クラス/1関数 = 1責務。変更理由が複数ある → 分割すべき。

### 関数分割の基準

| 指標 | 閾値 | 対応 |
|------|------|------|
| 行数 | 20行超 | 分割検討 |
| 引数 | 3個超 | オブジェクト化 or 分割 |
| ネスト | 3段超 | 早期リターン or 分割 |
| 分岐 | 5個超 | ポリモーフィズム検討 |

### 分割パターン

```typescript
// 巨大関数
function processOrder(order: Order) {
  // バリデーション（20行）
  // 在庫確認（15行）
  // 決済処理（30行）
  // 通知送信（10行）
  // ログ記録（5行）
}

// 責務で分割
function processOrder(order: Order) {
  validateOrder(order)
  checkInventory(order)
  processPayment(order)
  sendNotification(order)
  logTransaction(order)
}
```

### ファイル分割の基準

| 指標 | 閾値 | 対応 |
|------|------|------|
| 行数 | 300行超 | 分割検討 |
| クラス数 | 2個超 | 1ファイル1クラス |
| export数 | 5個超 | 関連性で分割 |

---

## 4. デグレ対策

### テストファースト

```
1. 既存の動作を確認するテストを書く
2. テストが通ることを確認
3. リファクタリング実施
4. テストが通ることを確認
5. 追加テストがあれば書く
```

### テストカバレッジ確認

```
リファクタリング前に確認:
[ ] 正常系テストあり
[ ] 異常系テストあり
[ ] 境界値テストあり
[ ] 変更箇所のカバレッジ十分
```

### 段階的変更

```
大きな変更 → 小さなステップに分割

1. インターフェースを先に作る
2. 新実装を並行して作る
3. 呼び出し元を段階的に切り替え
4. 旧実装を削除
```

### 後方互換性

```typescript
// 破壊的変更（避ける）
function getUser(id: string): User  // 旧
function getUser(id: number): User  // 新（既存コード壊れる）

// 後方互換を保つ
function getUser(id: string | number): User
// または
function getUserById(id: number): User  // 新APIを追加
```

---

## 5. コードスメル検出

### よくあるスメル

| スメル | 症状 | 対策 |
|--------|------|------|
| Long Method | 20行超の関数 | Extract Method |
| Large Class | 300行超のクラス | Extract Class |
| Long Parameter List | 3引数超 | Parameter Object |
| Duplicated Code | 同じコード3箇所 | Extract Method/Class |
| Feature Envy | 他クラスのデータばかり使う | Move Method |
| Data Clumps | 同じデータの組が複数箇所 | Extract Class |
| Primitive Obsession | プリミティブ型の多用 | Value Object |
| Switch Statements | 長いswitch文 | ポリモーフィズム |
| Comments | コメントで説明が必要 | Rename/Extract |

### 自動検出（rg ベース）

```bash
# 重複コード: 同一パターンの3回以上出現
rg -c "パターン" --type py | awk -F: '$2>=3'

# 長すぎる関数: 行数 > 50
rg -l --type py | xargs -I{} awk '/^def /{n=NR}/^[^ ]/{if(NR-n>50)print FILENAME":"n}' {}

# 深すぎるネスト
rg -n "^( {16,}|\\t{4,})" --type py

# パラメータ過多
rg -n "^def [a-zA-Z0-9_]+\\([^\\)]{40,}\\):" --type py
```

---

## 6. リファクタリングカタログ

### Extract Method

```typescript
// Before
function printOwing() {
  console.log("*****")
  console.log("Banner")
  console.log("*****")
  // 詳細計算...
}

// After
function printOwing() {
  printBanner()
  printDetails()
}
```

### Replace Conditional with Polymorphism

```typescript
// Before
function getSpeed(vehicle: Vehicle) {
  switch (vehicle.type) {
    case 'car': return vehicle.baseSpeed * 1.0
    case 'bike': return vehicle.baseSpeed * 0.8
    case 'truck': return vehicle.baseSpeed * 0.6
  }
}

// After
interface Vehicle {
  getSpeed(): number
}
class Car implements Vehicle {
  getSpeed() { return this.baseSpeed * 1.0 }
}
```

### Introduce Parameter Object

```typescript
// Before
function amountInvoiced(start: Date, end: Date, customer: Customer)
function amountReceived(start: Date, end: Date, customer: Customer)

// After
interface DateRange { start: Date; end: Date }
function amountInvoiced(range: DateRange, customer: Customer)
function amountReceived(range: DateRange, customer: Customer)
```

---

## 7. 技術負債の体系的管理

### 負債の分類

| 種類 | 例 | 緊急度 | 対処 |
|------|-----|--------|------|
| 意図的負債 | 「今は動くが将来問題」 | 低 | 台帳化 + 計画的返済 |
| 無意識的負債 | 設計ミス、知識不足 | 中 | 検出 → 台帳化 → 次スプリントで返済 |
| 環境的負債 | ライブラリ EOL、脆弱性 | 高 | 即時対応 or 期限付き計画 |
| テスト負債 | カバレッジ不足、flaky テスト | 中 | 20% 改善枠で返済 |

### 判断フロー

1. まず「本番事故に直結するか」を判定（脆弱性/EOL/認証不備は高優先）
2. 直近スプリントで触る領域の負債を優先返済（変更時に同時解消）
3. 触らない領域は台帳化して返済期限を設定
4. 返済不可なら ADR/台帳に「受容理由」「見直し日」を残す

### 自動検出パターン

```bash
# TODO / FIXME / HACK / WORKAROUND の一覧化
rg -n "TODO|FIXME|HACK|WORKAROUND" .

# 依存ライブラリの更新遅延を確認
npm outdated
pip list --outdated

# 循環依存の検出（Node.js 例）
npx madge --circular src

# 重複コードの検出（トークンベース）
npx jscpd .
```

### UT-TDD gate-policy 連携

- G4 通過条件として「未解決 debt の台帳化」を必須とする
- L8 後に返済タスクを次イテレーションへ移送する
- リファクタ実装は freeze-break を避け、原則 L4 着手前または次イテレーションで行う

---

## チェックリスト

### リファクタリング前

```
[ ] テストが十分にある
[ ] 変更範囲が明確
[ ] 機能追加と分離している
[ ] チームに共有済み
```

### リファクタリング後

```
[ ] テストが全て通る (bun run test)
[ ] パフォーマンス劣化なし
[ ] 可読性が向上した
[ ] コードレビュー済み
```
