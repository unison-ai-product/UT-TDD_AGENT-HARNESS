---
schema_version: skill.v1
name: context-memory
skill_type: process
applies_to:
  layers: [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11]
  drive_models: [Forward, Add-feature, Discovery, Scrum, Reverse, Recovery, Incident, Refactor, Retrofit]
upstream: vendor/helix-source/skills/workflow/context-memory
---

# コンテキスト・メモリスキル

CLAUDE.md 運用を含む AI コンテキスト管理・知識永続化の運用手順を提供。

## 適用タイミング

- CLAUDE.md / AGENTS.md の設計・改善時
- AI セッション間での知識引継ぎ設計時
- コンテキストウィンドウ最適化時
- プロジェクト知識ベース構築時

---

## 1. CLAUDE.md 設計

### 1.1 設定の読み込み階層

#### settings 優先度（高→低）

| # | 種別 | パス | 用途 |
|---|------|------|------|
| 1 | Managed | `/etc/claude-code/managed-settings.json` | 組織ポリシー強制 |
| 2 | CLI引数 | `claude --flag` | セッション限りの一時上書き |
| 3 | Local | `.claude/settings.local.json` | 個人のマシン固有設定（gitignore） |
| 4 | Project | `.claude/settings.json` | チーム共有のプロジェクト設定 |
| 5 | User | `~/.claude/settings.json` | 個人の全プロジェクト共通設定 |

原則: **より限定的なスコープが優先**。Project で `deny` なら User の `allow` は無効。

#### CLAUDE.md の6種類

| # | 種別 | パス | 共有 | 読み込み |
|---|------|------|------|----------|
| 1 | Managed | `/etc/claude-code/CLAUDE.md` | 組織全体 | 常時（override不可） |
| 2 | Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | チーム（git管理） | 常時 |
| 3 | Rules | `./.claude/rules/*.md` | チーム（git管理） | 常時（モジュラー） |
| 4 | User | `~/.claude/CLAUDE.md` | 個人 | 常時 |
| 5 | Local | `./CLAUDE.local.md` | 個人（gitignore） | 常時 |
| 6 | Auto | `~/.claude/projects/<id>/memory/` | 個人 | MEMORY.md先頭200行のみ |

#### 探索ルール

```
上方向再帰探索:
  cwd → 親ディレクトリ → ... → ルート
  見つかった全ての CLAUDE.md / CLAUDE.local.md を読み込む

子ディレクトリ遅延読み込み:
  cwd より下のCLAUDE.md は起動時に読み込まない
  AIがそのディレクトリのファイルにアクセスした時点で読み込み

@import 構文:
  @path/to/file.md で外部ファイルを取り込み可能
  最大5ホップまで再帰（循環参照防止）
  相対パス / 絶対パス / ~ パス 対応

モジュラールール (.claude/rules/):
  トピック別にファイル分割 → 全て自動読み込み
  paths フロントマターで適用範囲を glob 指定可能
```

### 1.2 設計指針

#### 階層ごとの役割分担

```
Managed policy    → セキュリティ・コンプライアンス（組織強制）
User CLAUDE.md    → 個人の好み（言語、回答スタイル）
Project CLAUDE.md → 技術スタック、チーム規約、ビルドコマンド
rules/*.md        → トピック別ルール（testing.md, security.md 等）
CLAUDE.local.md   → 個人のプロジェクト固有設定（gitignore対象）
Auto memory       → セッション中の学習（AIが自動管理）
```

#### 効果的な分割パターン

```
ディレクトリ階層:
  CLAUDE.md（ルート）
  ├── 全体方針、技術スタック
  └── ディレクトリごとのCLAUDE.md
      ├── src/api/CLAUDE.md（API固有ルール）
      └── tests/CLAUDE.md（テスト規約）

rules/ 活用:
  .claude/rules/
  ├── coding-style.md    ← 命名・フォーマット
  ├── testing.md         ← テスト規約
  └── security.md        ← セキュリティルール
```

#### アンチパターン

- 個人設定を Project CLAUDE.md に記述 → CLAUDE.local.md へ
- 全階層で同じ内容を重複記述 → 上位階層で一度だけ定義
- 500行超えの巨大 CLAUDE.md → references/ や @import で分割
- @import 4段以上のネスト → 構造を見直し
- 曖昧な指示（"Format properly"） → 具体的に（"2-space indent"）

### 1.3 構造テンプレート

```markdown
# プロジェクト名

## 概要
一文でプロジェクトを説明

## 技術スタック
- Frontend: ...
- Backend: ...
- DB: ...

## コーディング規約
- 命名: camelCase / snake_case
- テスト: 必須
- 型: strict

## ディレクトリ構造
src/
├── ...

## コマンド
- ビルド: `npm run build`
- テスト: `npm test`
- lint: `npm run lint`

## 禁止事項
- any型の使用
- console.log残し
```

### 1.4 Codex CLI（AGENTS.md）差分

| 項目 | Claude Code | Codex CLI |
|------|-------------|-----------|
| 指示ファイル | `CLAUDE.md` | `AGENTS.md` |
| 個人上書き | `CLAUDE.local.md` | `AGENTS.override.md` |
| モジュラールール | `.claude/rules/*.md` | なし |
| 設定ファイル | `settings.json`（JSON） | `config.toml`（TOML） |

実務ルール:
- "共有 project context" は CLAUDE.md と AGENTS.md で揃える
- "Claude runtime / hook / orchestration policy" は `.claude/CLAUDE.md` に寄せる
- "実行ポリシー" は `config.toml` に寄せる
- 個人差分は `AGENTS.override.md`（gitignore 推奨）

---

## 2. コンテキストウィンドウ管理

### トークン配分戦略

```
200K コンテキストの推奨配分:

System Prompt / CLAUDE.md  ~10K
スキルファイル             ~20K
参照コード                ~50K
会話履歴                  ~70K
出力余裕                  ~50K

原則:
- 合計使用量は150K以内に抑える
- 出力用に50K以上確保
- 不要なコンテキストは除外
```

### コンテキスト圧縮テクニック

```
1. サマリゼーション
   長い会話履歴 → 要約に置換

2. 選択的ロード
   全スキル読み込み NG → 必要なスキルのみ

3. 段階的開示
   概要 → 必要に応じて詳細
   500行ルール → references/ に分割

4. コード参照の最適化
   ファイル全体 NG → 関連部分のみ

5. LLM ベース選定
   全スキル手動選定 NG → ut-tdd skill search で top N 自動選定
```

### スキル自動推挙

全スキルから LLM マッチングで最適なコンテキストを選定:

```bash
ut-tdd skill search "<タスク記述>" -n 5
ut-tdd skill chain  "<タスク記述>"
```

---

## 3. セッション間メモリ

### メモリ永続化戦略

```
Session Memory（揮発性）:
  - 現在のタスクコンテキスト
  - 会話履歴
  - 一時的な作業状態

Project Memory（永続性）:
  - CLAUDE.md（プロジェクト知識）
  - .claude/memory/（学習記録）
  - スキルファイル（定型知識）

Global Memory（個人知識）:
  - ~/.claude/CLAUDE.md
  - ~/.claude/memory/
  - 共有テンプレート
```

### auto memory 活用

`.claude/memory/MEMORY.md` 活用パターン:

1. デバッグ知見の記録
   - 遭遇したエラーと解決方法
   - プロジェクト固有のハマりポイント

2. アーキテクチャ判断の記録
   - 選択した設計とその理由
   - 却下した代替案とその理由

3. パターン・規約の記録
   - プロジェクト固有のパターン
   - チーム規約の補足

### MEMORY.md 制限事項

- MEMORY.md は先頭 200 行のみがシステムプロンプトに読み込まれる
- 簡潔に記述し、行数を節約する
- 詳細な記録はトピック別ファイルに分離
- トピックファイルは AI が必要時にオンデマンドで読む

### UT-TDD での引継ぎ

UT-TDD セッション引継ぎは `.ut-tdd/handover/CURRENT.json` と `ut-tdd handover` を使う。

### コンテキスト汚染検知

長時間セッションでコンテキストが汚染されると、重要な決定事項を「忘れる」。

検知パターン:
- critical: 決定事項無視 / 要件逸脱
- major: 設計方針逸脱
- warning: 同一質問繰り返し / 同一ミス繰り返し

対策:
- アクション前の回帰チェック（決定・制約・却下済みとの整合確認）
- 実装開始前・エラー3回連続後の決定事項回帰テスト

---

## 4. マルチエージェントでの知識共有

### エージェント間コンテキスト分離

```
PM（オーケストレーター）:
  コンテキスト:
  - プロジェクト概要
  - タスク全体像
  - 各エージェントの進捗サマリー
  ※ 実装詳細は持たない

SE（実装者）:
  コンテキスト:
  - 担当タスクの仕様
  - 関連コード
  - テスト要件
  ※ 他タスクの詳細は持たない

軽作業担当（Haiku）:
  コンテキスト:
  - 修正対象ファイル
  - 修正指示
  ※ 最小限のコンテキスト
```

### 引き継ぎプロトコル

```markdown
# タスク引き継ぎテンプレート

## 完了事項
- 実装したもの
- テスト結果

## 未完了事項
- 残タスク
- 既知の問題

## 判断事項
- 選択した方針とその理由
- 保留中の判断

## 参照ファイル
- 変更したファイル一覧
- 関連ドキュメント
```

---

## 5. 知識ベースの構築

### プロジェクト知識の階層

```
Level 1: 即時参照（CLAUDE.md）
  - 技術スタック、コマンド、規約
  - 常に読み込まれる

Level 2: タスク参照（スキルファイル）
  - タスク種別ごとの手順・チェックリスト
  - トリガー条件で読み込み

Level 3: 詳細参照
  - 詳細な実装例、料金表
  - 必要に応じて参照

Level 4: 履歴参照（memory/）
  - 過去の判断、デバッグ知見
  - AIが自動的に蓄積・参照
```

### 知識グラフベースの記憶

従来の記憶は key-value やフラットな JSON になりやすく、知識同士の関係性が失われやすい。
知識グラフ型では、エンティティ・関係・事実・時系列を同時に扱う。

構成要素:
- エンティティ: モジュール、API、設計判断、バグ、開発者
- 関係: `depends_on` / `caused_by` / `fixed_by` / `designed_by` / `tested_by`
- 事実: 例「認証モジュールは JWT を使う」「DB は PostgreSQL 14」
- 時系列: その事実がいつ有効だったかを保持し、バージョン変化を追跡する

### UT-TDD での実装パターン

- `.ut-tdd/harness.db` で軽量知識グラフを構築（entities / relations / facts）
- 技術選定理由、設計判断の背景、バグの根本原因をプロジェクト知識として蓄積

---

## チェックリスト

### CLAUDE.md 設計時

```
□ プロジェクト概要が一文で説明できるか
□ 技術スタックが網羅されているか
□ コマンド一覧があるか
□ 禁止事項が明記されているか
□ ディレクトリ構造が記載されているか
```

### コンテキスト最適化時

```
□ トークン配分は適切か
□ 不要なコンテキストは除外されているか
□ 500行ルールを遵守しているか
□ references/ への分割は適切か
```

### メモリ運用時

```
□ MEMORY.md に重要な知見を記録しているか
□ セッション間で知識が引き継がれているか
□ 古い/誤った情報が更新されているか
□ 引き継ぎテンプレートを使用しているか
```

### CLAUDE.md 階層設計時

```
□ 個人設定は CLAUDE.local.md に分離しているか
□ .claude/rules/*.md でトピック別に分割しているか
□ @import のネスト深度は5以内か
□ 各 CLAUDE.md は 500行以内か
□ MEMORY.md は 200行以内か
□ .gitignore に CLAUDE.local.md と settings.local.json が含まれているか
```

### セッション引継ぎ時

```
□ 完了事項を記録しているか（実装したもの・テスト結果）
□ 未完了事項を記録しているか（残タスク・既知の問題）
□ 判断事項を記録しているか（選択した方針と理由・保留中の判断）
□ 変更ファイル一覧を記録しているか
□ 決定事項との整合性を確認したか
□ 却下済みアプローチを再提案していないか
```
