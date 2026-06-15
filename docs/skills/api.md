---
schema_version: skill.v1
name: api
skill_type: design-contract
applies_to:
  layers: [L2, L3, L6, L7, L8]
  drive_models: [Forward, Add-feature, Reverse, Retrofit]
upstream: vendor/helix-source/skills/project/api
---

# API設計スキル

## 適用タイミング

このスキルは以下の場合に読み込む：
- API 設計時（L2-L3）
- REST/GraphQL 選定時
- 認証認可パターン検討時

契約凍結後の検証フェーズは `api-contract` スキルを使用する。

---

## エンドポイント規約

### URL設計

```
/{version}/{resource}/{id?}/{sub-resource?}

例:
GET    /api/v1/users           # 一覧
POST   /api/v1/users           # 作成
GET    /api/v1/users/{id}      # 詳細
PUT    /api/v1/users/{id}      # 更新
DELETE /api/v1/users/{id}      # 削除
GET    /api/v1/users/{id}/posts # サブリソース
```

### HTTPメソッド

| メソッド | 用途 | べき等性 |
|---------|------|---------|
| GET | 取得 | ✅ |
| POST | 作成 | ❌ |
| PUT | 全体更新 | ✅ |
| PATCH | 部分更新 | ❌ |
| DELETE | 削除 | ✅ |

---

## レスポンス形式

### 成功時

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### エラー時

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Invalid format" }
    ]
  }
}
```

---

## ステータスコード

| コード | 用途 |
|--------|------|
| 200 | 成功（GET, PUT, PATCH） |
| 201 | 作成成功（POST） |
| 204 | 成功・レスポンスなし（DELETE） |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース未存在 |
| 422 | バリデーションエラー |
| 500 | サーバーエラー |

---

## 認証・認可

### 認証方式

```
Authorization: Bearer {jwt_token}
```

### 認可チェック

```python
# エンドポイントで必ずチェック
@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user)  # 認証
):
    if not can_access(current_user, user_id):  # 認可
        raise HTTPException(403, "Forbidden")
    ...
```

---

## バリデーション

### リクエスト

```python
from pydantic import BaseModel, EmailStr, Field

class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(..., ge=0, le=150)
```

### クエリパラメータ

```python
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at", regex="^(created_at|name)$"),
    order: str = Query("desc", regex="^(asc|desc)$")
):
    ...
```

---

## ページネーション

### リクエスト

```
GET /api/v1/users?page=1&per_page=20
```

### レスポンス

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## エラーハンドリング

### 共通例外ハンドラ

```python
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(exc),
                "details": exc.errors()
            }
        }
    )
```

### カスタム例外

```python
class NotFoundError(Exception):
    def __init__(self, resource: str, id: any):
        self.resource = resource
        self.id = id
        super().__init__(f"{resource} {id} not found")
```

---

## フロント連携

### API呼び出し（TypeScript）

```typescript
// services/api/users.ts
export const usersApi = {
  list: (params: ListParams) => 
    client.get<UsersResponse>('/users', { params }),
  
  get: (id: string) => 
    client.get<UserResponse>(`/users/${id}`),
  
  create: (data: CreateUserInput) => 
    client.post<UserResponse>('/users', data),
}
```

### 型定義

```typescript
// types/api/users.ts
interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface UsersResponse {
  success: true
  data: User[]
  meta: PaginationMeta
}
```

---

## UT-TDD ゲート連携

### 完了判定基準

```
[ ] OpenAPI定義: 全エンドポイント記載（実装との差分 0件）
[ ] APIテスト: bun run test exit code 0（正常系 + 主要エラー系）
[ ] レスポンス例: 全エンドポイントにサンプル記載
```

### `ut-tdd plan lint` 確認項目

- D-API 成果物が存在するか
- OpenAPI spec のバリデーション通過
- 認証/認可の設計がセキュリティスキルの要件と整合しているか
