---
schema_version: skill.v1
name: ai-coding
skill_type: orchestration
applies_to:
  layers: [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11]
  drive_models: [Forward, Add-feature, Refactor, Reverse, Recovery, Discovery, Scrum]
upstream: vendor/helix-source/skills/tools/ai-coding
---

# AI コーディングスキル

AI ツール活用で構造化プロンプトテンプレート・マルチエージェント戦略・CI/CD エージェント統合パターン・出力レビューチェックリストを提供。

## 適用タイミング

- AI ツールを使った開発時
- プロンプト作成時
- AI 出力のレビュー時

---

## 1. AI コーディングの原則

### 基本姿勢

```
AIは「ジュニア開発者」と考える:
- 指示は具体的に
- 出力は必ず確認
- 全体設計は人間が行う
- 細部の実装をAIに任せる
```

### やるべきこと

- 明確な指示を出す
- コンテキストを十分に与える
- 出力をレビューする
- テストで検証する
- 段階的にタスクを進める

### やってはいけないこと

- 出力を鵜呑みにする
- 曖昧な指示で期待する
- 一度に大量のタスクを依頼
- レビューなしでマージ
- テストなしでデプロイ

---

## 2. 効果的なプロンプト

構造化プロンプトの要点:
- コンテキスト（ファイルパス・仕様）を必ず含める
- 期待する出力形式を明示する
- 成功条件・完了条件を明記する

---

## プロンプト自己最適化

### 最適化ループ

1. `ut-tdd codex` で委譲実行
2. 結果（成功/失敗）を記録
3. 失敗パターンから role prompt の弱点を特定
4. role prompt の改善案を生成
5. A/B テスト（旧 prompt vs 新 prompt）
6. 改善が確認されたら role prompt を更新

### 実践的なプロンプト改善パターン

- コンテキスト不足: 参照ファイルリストを自動拡張する
- 指示の曖昧さ: 具体的な出力フォーマット指定を追加する
- スコープ逸脱: 制約条件を明示化する
- エラーハンドリング不足: 異常系の明示的指示を追加する

### 安全装置

- prompt 変更は `ut-tdd plan` 経由で実施し、レビューを必須にする
- 本番影響のある prompt 変更は人間承認を必須にする

---

## 3. コンテキスト管理

### 効果的なコンテキスト

```markdown
# プロジェクト概要
このプロジェクトは〇〇のためのWebアプリです。

# 技術スタック
- Frontend: Next.js 14, TypeScript, Tailwind
- Backend: FastAPI, Python 3.12
- DB: PostgreSQL 16, Prisma
- Auth: JWT + Refresh Token

# コーディング規約
- 型は厳格に（anyは禁止）
- 関数は20行以内
- テストは必須
```

### コンテキストの与え方

```
1. CLAUDE.md に基本情報を記載
2. タスクごとに関連ファイルを @mention
3. 必要な仕様を都度提供
4. 前提知識は省略せず明示
```

---

## 4. マルチエージェント戦略

### フェーズ別フロー

```
【設計】 PM が言語化 → TL (code-reviewer) がレビュー → 合意
             ↓ ← ut-tdd codex --role tl（設計レビュー）: G2（設計凍結）
             ↓ ← ut-tdd codex --role tl（API契約レビュー）: G3（実装着手 / API契約レビュー）
【実装】 SE が設計から実装まで一気通貫で実行
             │ ← ut-tdd review（軽量: Critical/High のみ）: 実装.2（TL レビュー）
             │ ← ut-tdd review（フル品質）: 実装.5（TL レビュー）
             ↓ ← ut-tdd review --uncommitted: G4（実装凍結）
【品質アップ】 TL がリファクタ・清書
【テスト】 Sonnet (qa-test) がテストコード作成・実行
             ↓
【ドキュメント】 Sonnet が設計書・仕様書を実装結果に合わせて更新
             ↓
【調査】 Haiku が随時、情報収集・下調べを担当
```

### 実装フェーズ内ゲート（実装.1〜.5）（必須・スキップ不可）

実装作業は **実装.1 → .2 → .3 → .4 → .5** の順に進める（スキップ不可 / 先送り不可）。

| ゲート | 目的（要約） |
|---|---|
| 実装.1 | コード調査（.1a）+ 変更計画（.1b）：既存コードを読んでから計画を固定 |
| 実装.2 | 最小実装（動作を通すための骨格を先に作る） |
| 実装.3 | 安全性・互換性（破壊変更や回帰を潰す） |
| 実装.4 | テスト・検証（テストで仕様を固定） |
| 実装.5 | 仕上げ（レビュー観点とドキュメント整合） |

各ゲート完了時は、ゲート状態（gate_status）として `passed | failed | blocked | interrupted` を明示して返す。

- `failed` は原則「同一ゲート内で修正して再判定」
- `blocked` は「前提不足/仕様不明」として停止し、オーケストレーターへ報告
- `interrupted` は「前提崩壊/範囲再定義」で **リトライカウントに含めない**

実装タスクを受けたら、必ず次の **5 行をチェックリストとして先に書く**:

- [ ] 実装.1: コード調査（.1a）+ 変更計画（.1b）
- [ ] 実装.2: 最小実装（骨格を通し、残件を列挙）
- [ ] 実装.3: 安全性・互換性（回帰/破壊変更/リスク潰し）
- [ ] 実装.4: テスト・検証（テスト or 手順で仕様固定）
- [ ] 実装.5: 仕上げ（レビュー観点 + ドキュメント整合）

### UT-TDD での呼び出し方

```bash
# TL: 設計レビュー・コードレビュー・品質アップ・トラブルシュート
ut-tdd codex --role tl --task "レビュー: X feature の設計書"
ut-tdd review --uncommitted      # コードレビュー

# SE: 実装メイン
ut-tdd codex --role se --task "Implement X feature based on design docs"

# PG: 軽量実装・軽微修正
ut-tdd codex --role pg --task "Fix lint errors in src/..."

# Sonnet: テスト・ドキュメント
Task(model: "sonnet", prompt: "Write tests for ...")
Task(model: "sonnet", prompt: "Update design-doc with ...")

# Haiku: リサーチ
Task(model: "haiku", prompt: "Search for ... and summarize")
```

### 使い分けの判断基準

```
タスクの種類は？
├── 設計を詰める → PM（言語化）+ TL（エンジニアレビュー）
├── 設計書・仕様書をレビューする → ut-tdd codex --role tl --task "レビュー: ..."
├── コード実装 → ut-tdd codex --role se
├── 軽量実装・軽微修正 → ut-tdd codex --role pg
├── コードをレビューする → ut-tdd review --uncommitted
├── テストを書く → Sonnet（Task tool）
├── ドキュメントを更新する → Sonnet（Task tool）
├── リサーチ → Haiku（Task tool）
└── ビジネス判断 → 人間（PM）
```

### 複数エージェント協調（Agent Teams）

```
Sub-agents（上記）= 親子関係。実装の並列化に最適。
Agent Teams = 対等関係。設計の多角検証に最適。

判断:
- 実装タスク → ut-tdd codex（このセクション）
- 設計検証・アーキテクチャ決定 → Agent Teams（docs/skills/agent-teams.md 参照）
```

---

## 5. AI の出力レビュー

### 必ず確認すること

```
□ コードが動くか（実行確認）
□ 意図した動作か（仕様確認）
□ セキュリティリスクはないか
□ パフォーマンス問題はないか
□ 既存コードとの整合性
□ テストは十分か
```

### よくある問題

| 問題 | 対策 |
|------|------|
| 存在しないライブラリを使用 | インポートを確認 |
| 古いAPI/構文を使用 | ドキュメントと照合 |
| エラーハンドリング不足 | 異常系を追加指示 |
| 型が緩い（any多用） | 厳格な型を指示 |
| テスト不十分 | カバレッジ確認 |
| セキュリティ考慮不足 | セキュリティ観点を指示 |

---

## 6. 事前調査・検索ルール（強制）

### 事前調査の強制条件

以下に該当する場合、設計（L2）・実装（L4）前に**必ず事前調査を実施**する。

| 条件 | レベル |
|------|--------|
| 外部API連携（新規/変更） | **MUST** |
| 認証・認可ロジック | **MUST** |
| 新規ライブラリ/フレームワーク導入 | **MUST** |
| 技術選定（ADR対象） | **MUST** |
| メジャーアップグレード | **MUST** |
| 公開API/DB契約変更 | **MUST** |
| 決済・PII・法令影響 | **MUST** |
| 高負荷/並行性/移行 | SHOULD |
| 純粋な内部リファクタリング/バグ修正 | 不要 |

### 検索の優先ソース（権威順）

| 優先度 | ソース | 信頼性 |
|--------|--------|--------|
| 1 | 公式ドキュメント / RFC | 最高 |
| 2 | GitHub Issues/Discussions（公式リポジトリ） | 高 |
| 3 | 技術ブログ（Qiita, Zenn, dev.to） | 中（要クロスチェック） |
| 4 | Stack Overflow | 中（回答の鮮度を確認） |

### 調査レポートフォーマット

```yaml
research_report:
  topic: "調査対象"
  date: "YYYY-MM-DD"
  sources:
    - url: "URL"
      summary: "1行要約"
      relevance: high/medium/low
  conclusion: "設計/実装への影響"
  adoption: "採用/不採用の理由"
  risks: ["発見したリスク"]
```

通過条件: 「検索した」ではなく「調査メモが存在する」こと
記録先: `docs/research/YYYY-MM-DD-{topic}.md`

---

## CI/CD エージェント統合

GitHub Actions 上で AI エージェントを補助運用し、レビュー負荷と初動コストを下げる。

### 代表パターン

| パターン | 自動化内容 | 最低限の出力 |
|---------|-----------|-------------|
| Issue トリアージ | ラベル自動付与 + 担当者候補提案 | `labels`, `assignee_candidates`, `reason` |
| PR レビュー | 変更要約 + リスク評価 | `summary`, `risk_level`, `hotspots` |
| CI 失敗分析 | ログ要約 + 原因候補 + 修正案 | `root_cause_hypothesis`, `fix_candidates` |
| リリースノート生成 | コミット差分から公開向け要約 | `highlights`, `breaking_changes`, `migration_notes` |

### UT-TDD gate との統合ポイント

1. UT-TDD gate の結果を GitHub Actions で再現実行し、PR 上で pass/fail を可視化
2. `ut-tdd review --uncommitted` による PR 本文生成をワークフロー内に組み込む

---

## チェックリスト

### AI活用前

```
[ ] タスクの明確化
[ ] 必要なコンテキスト整理
[ ] 期待する出力の明確化
```

### AI活用中

```
[ ] 段階的に進める
[ ] 中間確認を行う
[ ] 軌道修正する
```

### AI活用後

```
[ ] 出力をレビュー
[ ] 動作確認
[ ] テスト実行
[ ] セキュリティ確認
```
