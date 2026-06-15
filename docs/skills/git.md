---
schema_version: skill.v1
name: git
skill_type: process
applies_to:
  layers: [L7, L8, L10, L12, L14]
  drive_models: [Forward, Add-feature, Reverse, Recovery, Refactor, Retrofit]
upstream: vendor/helix-source/skills/common/git
---

# Git運用スキル

## 適用タイミング

このスキルは以下の場合に読み込む：
- コミット時
- ブランチ操作時
- PR作成時

---

## UT-TDD harness 自己開発の Git 規律

> この repo の自己開発（PO 単独 maintainer）では **main 直 commit + push** でよい。
> UT-TDD が利用者プロジェクトに課す branch-default / PR+CI とは別レイヤー。

---

## エージェント別 Git 権限

| エージェント / ロール | コミット | プッシュ | PR作成 |
|----------------------|---------|---------|--------|
| PO（Opus 等上位モデル） | ✅ | ✅ | ✅ |
| Worker subagent（Sonnet/Haiku） | ファイル変更のみ | ❌ | ❌ |

サブエージェントはコード変更のみ担当し、コミット・プッシュは PO が統合後に実行する。

---

## コミットタイミング

### する

1. 機能単位で完結したとき
2. ユーザーが明示的に指示したとき
3. 大きな作業の区切り（途中保存）

### しない

1. 作業途中の中途半端な状態
2. テスト未通過
3. lint 未通過
4. 複数機能を混ぜた状態

---

## コミットメッセージ

### フォーマット（Conventional Commits 必須）

```
<type>(<scope>): <subject>

[body（任意）]

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

Bash heredoc で書く（PowerShell here-string は commit-msg hook との相性が悪いため不可）:

```bash
git commit -F - <<'EOF'
feat(plan): add plan lint gate check

- Implement lint validation for PLAN files
- Add doctor integration for orphan detection

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
```

### type 一覧

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング |
| `docs` | ドキュメント |
| `test` | テスト |
| `chore` | 雑務（依存関係等） |
| `style` | フォーマット |
| `perf` | パフォーマンス |

---

## ブランチ戦略

### UT-TDD harness 自己開発

```
main（直接 commit/push）
```

### 利用者プロジェクト（UT-TDD が課す仕様）

```
main (本番)
  └── develop (開発統合)
        ├── feature/xxx
        ├── fix/xxx
        └── refactor/xxx
```

### 命名規則

| ブランチ | 用途 | 例 |
|---------|------|-----|
| `feature/*` | 新機能 | `feature/user-auth` |
| `fix/*` | バグ修正 | `fix/login-error` |
| `refactor/*` | リファクタ | `refactor/api-structure` |
| `hotfix/*` | 緊急修正 | `hotfix/security-patch` |

---

## プッシュ前チェック

```bash
# 必須チェック
bun run typecheck
bun run lint
bun run test
bun run doctor   # ut-tdd doctor

# 機密情報チェック
git diff --cached | rg -i "(password|secret|api_key)\s*="
```

### 禁止

```bash
# 禁止: 強制プッシュ（PO が明示した場合のみ）
git push --force

# 禁止: workflow スコープなしで .github/workflows/ を含む push
# (GitHub が workflow スコープなし PAT の push を拒否する)
```

---

## staged は明示ファイルのみ

`git add -A` / `git add .` を避け、自分が編集したファイルだけ stage する。

```bash
# 良い例
git add src/cli/plan.ts docs/design/plan-spec.md

# 悪い例（並行編集中のファイルを巻き込む）
git add .
```

---

## PR作成テンプレート

```markdown
## Summary
- 変更内容を箇条書き

## Changes
- [ ] 変更ファイル1
- [ ] 変更ファイル2

## Test plan
- [ ] テスト項目1
- [ ] テスト項目2

## Related
- Issue: #xxx
- PLAN: PLAN-XXX
```

---

## リリースノート自動生成

### Conventional Commits ベースの分類

```bash
git log --pretty=format:'%H|%s|%ad' --date=short \
  | grep -E '^(.*\|(feat|fix|docs|perf|refactor|test|chore):)' \
  | awk -F'|' '{printf("{\"sha\":\"%s\",\"subject\":\"%s\",\"date\":\"%s\"}\n",$1,$2,$3)}'
```

### 生成テンプレート

```markdown
# v1.2.0 リリースノート (YYYY-MM-DD)

## 新機能
- feat: ユーザー認証の追加 (#123)

## バグ修正
- fix: ログイン画面のバリデーション修正 (#456)

## 破壊的変更
- BREAKING: API v1 の廃止
```

---

## マージ条件

```
[ ] CI 通過（typecheck + lint + test + doctor）
[ ] コンフリクト解消済み
[ ] コミットメッセージ Conventional Commits 準拠
[ ] 機密情報なし
[ ] PO 承認（main へのマージ）
```
