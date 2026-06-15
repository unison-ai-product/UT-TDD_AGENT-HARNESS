---
schema_version: skill.v1
name: db
skill_type: design-contract
applies_to:
  layers: [L2, L3, L6, L7, L8]
  drive_models: [Forward, Add-feature, Reverse, Retrofit, Refactor]
upstream: vendor/helix-source/skills/project/db
---

# DB設計スキル

## 適用タイミング

このスキルは以下の場合に読み込む：
- テーブル設計時（L2-L3 全体設計 / L3 詳細設計）
- マイグレーション作成時
- クエリ最適化時

---

## 1. テーブル設計原則

### 命名規則

```
テーブル名:  snake_case、複数形（users, posts, order_items）
カラム名:    snake_case（user_id, created_at）
インデックス: idx_{table}_{column}
外部キー:    fk_{table}_{ref_table}
```

### 共通カラム

```sql
-- 全テーブルに必須
id          SERIAL PRIMARY KEY        -- or UUID
created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- 必要に応じて
deleted_at  TIMESTAMP WITH TIME ZONE  -- 論理削除
created_by  INTEGER REFERENCES users(id)
updated_by  INTEGER REFERENCES users(id)
```

### 正規化レベル

```
第1正規形: 繰り返しグループを排除
第2正規形: 部分関数従属を排除
第3正規形: 推移関数従属を排除

注意: パフォーマンスのため意図的に非正規化することもある
注意: 非正規化時はコメントで理由を明記する
```

---

## 2. データ型選択

### PostgreSQL推奨型

| 用途 | 型 | 備考 |
|------|-----|------|
| 主キー | SERIAL / UUID | 自動採番 / 分散対応 |
| 文字列（短） | VARCHAR(n) | 最大長を指定 |
| 文字列（長） | TEXT | 長さ制限なし |
| 整数 | INTEGER | -2B〜2B |
| 大きな整数 | BIGINT | 金額等 |
| 小数 | NUMERIC(p,s) | 精度が必要な場合 |
| 浮動小数 | DOUBLE PRECISION | 科学計算 |
| 真偽値 | BOOLEAN | true/false |
| 日付 | DATE | 日付のみ |
| 日時 | TIMESTAMP WITH TIME ZONE | タイムゾーン付き |
| JSON | JSONB | 検索可能なJSON |
| 配列 | TYPE[] | 配列型 |
| ベクトル | vector(n) | pgvector拡張 |

### 避けるべき

```
避ける: CHAR(n)      → VARCHAR(n)を使う
避ける: FLOAT        → NUMERIC or DOUBLE PRECISIONを使う
避ける: TIMESTAMP    → TIMESTAMP WITH TIME ZONEを使う
避ける: JSON         → JSONBを使う（検索性能）
```

---

## 3. インデックス設計

### 基本ルール

```sql
-- 主キー（自動作成）
PRIMARY KEY (id)

-- 外部キー（必須）
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 検索条件カラム
CREATE INDEX idx_users_email ON users(email);

-- ユニーク制約
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
```

### 複合インデックス

```sql
-- 順序が重要（左端から使われる）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- WHERE user_id = ? AND status = ?  → 使われる
-- WHERE user_id = ?                 → 使われる
-- WHERE status = ?                  → 使われない
```

### 部分インデックス

```sql
-- 特定条件のみインデックス化
CREATE INDEX idx_orders_pending ON orders(created_at) 
WHERE status = 'pending';
```

### GINインデックス（JSON、配列、全文検索）

```sql
-- JSONB
CREATE INDEX idx_users_metadata ON users USING gin(metadata);

-- 配列
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- 全文検索
CREATE INDEX idx_posts_content ON posts 
USING gin(to_tsvector('japanese', content));
```

---

## 4. リレーション設計

### 1対多

```sql
-- users(1) : posts(多)
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL
);
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

### 多対多

```sql
-- users(多) : roles(多)
CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

### 1対1

```sql
-- users(1) : profiles(1)
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT
);
```

### 外部キー制約

| オプション | 動作 |
|-----------|------|
| ON DELETE CASCADE | 親削除時に子も削除 |
| ON DELETE SET NULL | 親削除時にNULL設定 |
| ON DELETE RESTRICT | 親削除を禁止（デフォルト） |
| ON UPDATE CASCADE | 親更新時に子も更新 |

---

## 5. テーブル定義例

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'banned'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_metadata ON users USING gin(metadata);

COMMENT ON TABLE users IS 'ユーザーマスタ';
COMMENT ON COLUMN users.metadata IS 'ユーザー設定などの拡張データ';
```

---

## 6. マイグレーション

### ルール

```
必須: 1マイグレーション = 1変更
必須: ロールバック可能に（up/down 双方向）
必須: データ移行は別マイグレーション
必須: 本番適用前にステージングで検証
```

### 安全な変更

```sql
-- カラム追加（NULLABLEまたはDEFAULT付き）
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- インデックス追加（CONCURRENTLY で本番無停止）
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone);
```

### 危険な変更（注意）

```sql
-- カラム削除
-- 注意: アプリケーションから参照がないことを確認
ALTER TABLE users DROP COLUMN old_column;

-- カラム型変更
-- 注意: データ移行が必要
ALTER TABLE users ALTER COLUMN age TYPE BIGINT;

-- NOT NULL追加
-- 注意: 既存データにNULLがないことを確認
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
```

---

## 7. クエリ最適化

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- 確認ポイント:
-- - Seq Scan（全件スキャン）→ Index Scan にする
-- - 推定行数と実際の行数の乖離
-- - Sort, Hash Join のコスト
```

### N+1問題

```sql
-- 悪い例（N+1）
SELECT * FROM users;
-- ループで1件ずつ
SELECT * FROM posts WHERE user_id = 1;
SELECT * FROM posts WHERE user_id = 2;

-- 良い例（JOIN）
SELECT u.*, p.* FROM users u
LEFT JOIN posts p ON u.id = p.user_id;

-- または（IN）
SELECT * FROM posts WHERE user_id IN (1, 2, 3, ...);
```

### ページネーション

```sql
-- オフセット（遅くなる、避ける）
SELECT * FROM posts ORDER BY id LIMIT 20 OFFSET 1000;

-- カーソル（高速、推奨）
SELECT * FROM posts WHERE id > 1000 ORDER BY id LIMIT 20;
```

---

## 8. DB 設計最適化チェックリスト

### 正規化チェック（1NF / 2NF / 3NF）

```text
1NF:
- 繰り返し属性（例: tag1, tag2, tag3）を排除できているか
- 1カラム1値（配列を使う理由が明確か）

2NF:
- 複合主キーの場合、非キー列が主キーの一部にだけ依存していないか

3NF:
- 非キー列が他の非キー列に依存していないか
```

### インデックス設計ガイド（クエリパターン起点）

| クエリパターン | 推奨インデックス | 補足 |
|---------------|------------------|------|
| `WHERE a = ?` | `INDEX(a)` | 選択性が低い場合は効果を要確認 |
| `WHERE a = ? AND b = ?` | `INDEX(a, b)` | 等価条件を先頭に配置 |
| `WHERE a = ? ORDER BY created_at DESC` | `INDEX(a, created_at DESC)` | フィルタ + ソートを同時最適化 |
| `WHERE deleted_at IS NULL` | 部分インデックス | `WHERE deleted_at IS NULL` を条件化 |
| `JSONB @>` | `GIN(JSONB)` | 高頻度アクセスキーは列化も検討 |

### パーティショニング判断基準

```text
導入を検討:
- テーブル行数が 1,000万件以上
- 日付範囲クエリが支配的
- 古いデータの削除/アーカイブを定期実施

導入を見送る:
- クエリの大半が主キー1件取得
- パーティションキーがクエリ条件に現れない
- 運用チームがメンテナンス手順を持っていない
```

---

## 9. UT-TDD ゲート連携

### 完了判定基準

```
[ ] マイグレーション: up/down 双方向 exit code 0
[ ] EXPLAIN ANALYZE: フルスキャン 0件（主要クエリ）
[ ] 外部キー制約: 全リレーション定義済み
```

### D-DB 成果物の品質基準

D-DB artifact（`docs/design/` 配下）には以下を必須化する:
- 正規化判定（1NF/2NF/3NF）結果が記録されている
- 主要クエリごとのインデックス根拠が記録されている
- パーティショニング採否と理由が記録されている
- EXPLAIN ANALYZE の代表結果が添付されている

### `ut-tdd plan lint` 確認項目

- D-DB 成果物が存在するか
- G3 Schema Freeze 連携（schema freeze 前に D-DB が承認済みか）
- マイグレーション双方向テストが CI に含まれているか

---

## 10. 設計チェックリスト

```
[ ] 命名規則に従っている
[ ] 共通カラム（id, created_at, updated_at）がある
[ ] 外部キーにインデックスがある
[ ] 検索条件カラムにインデックスがある
[ ] 適切なデータ型を選択している
[ ] 制約（NOT NULL, UNIQUE, CHECK）が設定されている
[ ] テーブル・カラムコメントが付いている
[ ] マイグレーションが up/down 双方向で動作する
```
