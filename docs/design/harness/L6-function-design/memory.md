---
layer: L6
sub_doc: memory
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L7-329-module-l6-design-backfill.md
---

# UT-TDD Agent Harness — L6 機能設計: memory (Claude/Codex 共有プロジェクトメモリ)

## §1 概要と配置

- 目的: `.ut-tdd/memory/*.md` を SSoT とする、Claude/Codex 両ランタイム共有のプロジェクトメモリを
  書き込み・読み込み・harness.db 経由で検索・SessionStart で自動サーフェスする。
- 実装先: `src/memory/index.ts` (既存)。テストは `tests/memory-*.test.ts` 相当 (未確認、pair_artifact 参照)。
- 呼び出し元:
  - CLI `memory add` → `writeMemoryEntry` (`src/cli.ts:2806-2836`)
  - CLI `memory list` → `selectMemoryEntries` + `renderMemoryList` (`src/cli.ts:2838-2854`)
  - CLI `memory recall` → `selectMemoryEntries` + `renderMemorySurface` (`src/cli.ts:2856-2871`)
  - SessionStart hook 相当 → `surfaceMemoryToStdout` (`src/cli.ts:426-438`) が
    `selectMemoryEntries(db, { limit: 5 })` を `renderMemorySurface` に渡す (fail-open ラッパ内)

## §2 IF 契約

```ts
export type MemoryKind = "project" | "feedback" | "reference" | "user";

export interface MemoryEntry {
  memory_id: string;
  kind: MemoryKind;
  title: string;
  body: string;
  tags: string[];
  source_path: string; // repo-relative, "/" 正規化済み
  updated_at: string; // ISO 8601
  content_hash: string; // sha256(text)
}

export interface MemoryWriteInput {
  kind: MemoryKind;
  title: string;
  body: string;
  tags?: string[];
  now?: string; // テスト注入用の時刻上書き
}

// ファイル書き込み + parse を行い MemoryEntry を返す。secret-like なら throw (fail-close)。
export function writeMemoryEntry(repoRoot: string, input: MemoryWriteInput): MemoryEntry;

// frontmatter+body の markdown テキストを MemoryEntry へ parse。secret-like / 必須欠落なら throw。
export function parseMemoryFile(repoRoot: string, sourcePath: string, content?: string): MemoryEntry;

// .ut-tdd/memory/*.md を全件読み込み parse (ディレクトリ不在なら空配列)
export function loadMemoryEntries(repoRoot: string): MemoryEntry[];

// harness.db memory_entries テーブルから query/limit で検索 (DB 接続は呼び出し側が用意)
export function selectMemoryEntries(
  db: { prepare(sql: string): { all(): Record<string, unknown>[] } },
  opts?: { query?: string; limit?: number },
): MemoryEntry[];

// memory_id の決定的生成 (kind + slugify(title))
export function memoryIdFor(input: { kind: MemoryKind; title: string }): string;

// SessionStart / recall 用の人間可読テキストブロック整形 (空なら空文字)
export function renderMemorySurface(entries: MemoryEntry[]): string;

// memory list 用のタブ区切りテキスト整形
export function renderMemoryList(entries: MemoryEntry[]): string;
```

エラーは throw (fail-close): `writeMemoryEntry`/`parseMemoryFile` は secret-like 検出時・
kind 不正・title/body 欠落時に `Error` を投げる。

## §3 事前/事後条件・不変条件

| 関数 | 事前条件 | 事後条件 | 不変条件 |
|---|---|---|---|
| `writeMemoryEntry` | `input.kind` は `VALID_KINDS` の 4 種、`title`/`body` は trim 後非空 | `.ut-tdd/memory/<kind>-<slug>.md` を frontmatter 付きで書き込み、`parseMemoryFile` した `MemoryEntry` を返す | secret-like payload (title+body+tags) は書き込み前に throw、ファイルは作られない |
| `parseMemoryFile` | `sourcePath` は `.ut-tdd/memory/` 配下の frontmatter 付き md | frontmatter を yaml parse し `MemoryEntry` を構築 | secret-like な全文は throw、`kind` 不正/`title`・`body` 空も throw |
| `loadMemoryEntries` | `repoRoot` は絶対パス | `.ut-tdd/memory/*.md` を名前順ソートして全件 `parseMemoryFile` | ディレクトリ不在は例外なく `[]` |
| `selectMemoryEntries` | `db` は `memory_entries` テーブルを持つ DB ハンドル | `updated_at DESC, memory_id` 順で取得し、`query` があれば title/body/tags/kind の結合文字列に部分一致するもののみ、`limit` 件に切り詰め | `query` 未指定時は全件 (limit 内) |
| `renderMemorySurface` | `entries` は任意配列 | 0 件なら空文字、それ以外は先頭にヘッダ行 + 各 entry 1 行 (body は 160 文字に切り詰め) | body の空白は単一スペースに正規化 |

## §4 失敗モード

- 方針: **secret-like 検出は fail-close** (`writeMemoryEntry`/`parseMemoryFile` が throw し、
  secret を含む memory はファイルにも DB にも入らない)。一方で **`surfaceMemoryToStdout`
  (呼び出し元、CLI 側) は fail-open** — DB 不在/ロック/破損で runtime 全体を止めない設計
  (`src/cli.ts:421-423` のコメント「fail-open: memory surface は best-effort」)。
- 入力異常時の挙動:

| 異常 | 挙動 | 根拠 |
|---|---|---|
| title/body に secret-like トークンを含む | `writeMemoryEntry`/`parseMemoryFile` が throw | チーム共有ファイルへのシークレット混入を防ぐ (fail-close、`isSecretLike` 使用) |
| `kind` が `VALID_KINDS` 外 | throw (`unknown memory kind`) | 4 kind 以外はスキーマ違反として拒否 |
| `title`/`body` が空 (trim 後) | throw (`memory title/body is required`) | 空メモリの永続化を防ぐ |
| `.ut-tdd/memory/` ディレクトリ不在 (`loadMemoryEntries`) | 例外なく `[]` を返す | 新規 repo / 初回実行時に harness 全体を止めない |
| harness.db 不在・ロック・破損 (`surfaceMemoryToStdout` 経由) | catch して何も出力しない (fail-open) | SessionStart は補助情報であり、DB 障害でセッション開始自体をブロックしない |

## §5 データ形 (具体例)

```json
// 入力例 (writeMemoryEntry)
{
  "kind": "feedback",
  "title": "integration tests must hit real database",
  "body": "mock DB masked a broken migration last quarter.",
  "tags": ["testing", "db"]
}
```

```markdown
<!-- .ut-tdd/memory/feedback-integration-tests-must-hit-real-database.md (書き込み結果) -->
---
memory_id: memory:feedback:integration-tests-must-hit-real-database
kind: feedback
title: "integration tests must hit real database"
tags: ["db", "testing"]
updated_at: 2026-07-03T00:00:00.000Z
---

mock DB masked a broken migration last quarter.
```

## §6 エッジケース表

| # | ケース | 入力の特徴 | 期待挙動 | oracle |
|---|---|---|---|---|
| 1 | 境界: `.ut-tdd/memory/` ディレクトリが存在しない | 初回実行 repo | `loadMemoryEntries` は `[]` (例外なし) | U-MEM-LOAD-EMPTYDIR (起票時に採番) |
| 2 | 異常: title/body に secret-like トークンが混入 | `body` に `sk-...` を含む | `writeMemoryEntry`/`parseMemoryFile` が throw、ファイルは作られない/読めない | U-MEM-SECRET-FAILCLOSE |
| 3 | 正常系の代表: kind=project の write→parse ラウンドトリップ | 通常の title/body/tags | 書き込んだ内容と `parseMemoryFile` で読み戻した内容が一致 (tags はソート済み) | U-MEM-ROUNDTRIP |
| 4 | 境界: `selectMemoryEntries` に `query` 未指定 | `opts = {}` | `limit` (既定 8) 件まで、`updated_at DESC` 順で全種 kind を返す | U-MEM-SELECT-NOQUERY |
| 5 | 異常: frontmatter が無い md ファイル (`parseMemoryFile`) | `---` ブロック無し | throw (`memory frontmatter is required`) | U-MEM-PARSE-NOFRONTMATTER |

## §7 検証接続

- pair: frontmatter `pair_artifact` (L7 unit-test-design)。§6 の oracle 列が対応表。
- 回帰 fence: `bun run test` full green + `ut-tdd doctor` の DB/projection 系 check green
  (`tests/projection-writer.test.ts` が memory_entries 投影を回帰する隣接テスト)。

## §8 carry / 非スコープ

- `memory_entries` テーブルへの projection 書き込み経路 (`.ut-tdd/memory/*.md` → harness.db) は
  `src/state-db/projection-writer.ts` の責務であり本 doc のスコープ外 (別モジュール)。
- SessionStart hook の発火条件そのもの (`.claude/settings.json` 側) は本 doc の対象外。
