---
layer: L6
sub_doc: context
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L7-329-module-l6-design-backfill.md
---

# UT-TDD Agent Harness — L6 機能設計: context / doc-router (起動コンテキスト tier 化)

## §1 概要と配置

- 目的: canonical doc (concept/requirements、CLAUDE.md Read Order で合計 11.3 万トークン、A-181 CE-1)
  を丸ごと読まず、タスク kind から**読むべき見出しセクションだけ**を推挙する。索引は実行時 parse
  (静的生成しない) で doc 改訂に追従する。
- 実装先: `src/context/doc-router.ts` (既存)。テストは `tests/doc-router.test.ts` 相当 (未確認、pair_artifact
  参照)。
- 呼び出し元: CLI `context suggest --task <text>` (`src/cli.ts:2878-2905`)。`classifyTask` の kind を
  `contextSuggest(repoRoot, kind)` に渡す。

## §2 IF 契約

```ts
// 純関数: markdown → 見出し索引 (I/O なし)
export function buildDocIndex(path: string, content: string): DocIndex;

// I/O: repo-relative path を読んで索引化。存在しなければ null。
export function loadDocIndex(repoRoot: string, path: string): DocIndex | null;

// 純関数: kind + 索引群 → 推挙セクション一覧
export function suggestSections(kind: string, indexes: (DocIndex | null)[]): ContextSuggestResult;

// I/O 込み CLI 配線用ラッパ: ROUTABLE_DOCS を読んで suggestSections を呼ぶ
export function contextSuggest(repoRoot: string, kind: string): ContextSuggestResult;

export interface DocSection {
  level: number; // 見出しレベル (# の数)
  heading: string; // 見出しテキスト
  section_number: string | null; // 先頭の節番号 (§2, 2.1 等)。無ければ null
  start_line: number; // 1-indexed
  end_line: number; // 次の同/上位見出し直前、または文末
}

export interface DocIndex {
  path: string; // repo-relative パス
  total_lines: number;
  sections: DocSection[];
}

export interface SectionSuggestion {
  path: string;
  heading: string;
  section_number: string | null;
  start_line: number;
  end_line: number;
  matched: string; // 照合したキーワード
}

export interface ContextSuggestResult {
  kind: string;
  fail_open: boolean; // true のとき sections は空、全文読み推奨
  fail_open_reason: string | null;
  sections: SectionSuggestion[];
}

// 定数: tier 化対象の canonical doc (現状 concept + requirements のみ)
export const ROUTABLE_DOCS: readonly string[];
```

エラーは throw しない設計 (関数はすべて正常値を返す、`loadDocIndex` は不在時 `null`)。

## §3 事前/事後条件・不変条件

| 関数 | 事前条件 | 事後条件 | 不変条件 |
|---|---|---|---|
| `buildDocIndex` | `content` は markdown 文字列 (空文字も許容) | 見出し行のみから `sections` を構築、`end_line` は次の同/上位見出し直前 or 文末 | 純関数 (I/O なし)、同一入力で同一出力 |
| `loadDocIndex` | `repoRoot` は絶対パス | ファイル不在は `null`、存在すれば `buildDocIndex` の結果 | 例外を投げない (existsSync ガード) |
| `suggestSections` | `kind` は任意文字列、`indexes` は `null` 混在可 | `KIND_TOPIC_KEYWORDS` に `kind` が無い、またはマッチ 0 件なら `fail_open: true` かつ `sections: []` | マッチ 0 件は必ず fail-open (読み漏れより読み過ぎを選ぶ) |
| `contextSuggest` | `repoRoot` は絶対パス | `ROUTABLE_DOCS` を読み `suggestSections` を呼んだ結果を返す | `loadDocIndex` が `null` を返す doc は無視して継続 (index 不在は fail-open の一因) |

## §4 失敗モード

- 方針: **fail-open**。索引照合はヒューリスティック (kind→keyword) であり、マッチ失敗を「セクション無し」
  と断定すると読み漏れ事故につながる。マッチ 0 件時は「全文読み推奨」を明示的に返し、呼び出し側 (CLI) が
  ユーザーに伝える。
- 入力異常時の挙動:

| 異常 | 挙動 | 根拠 |
|---|---|---|
| `kind` が `KIND_TOPIC_KEYWORDS` に未登録 | `fail_open: true`、`fail_open_reason` にメッセージ | 未知 kind は topic 対応が定義できないため全文読みへ倒す |
| 対象 doc がファイルシステムに不在 | `loadDocIndex` が `null` → `suggestSections` はその doc を無視して続行 | fixture / 部分 checkout で doc が無いケースを想定 (既存コメント §「本 module」参照) |
| キーワードにマッチする見出しが 0 件 | `fail_open: true`、`fail_open_reason` に「doc 改訂で topic 語が消えた可能性」 | doc 改訂追従の耐性 (静的キャッシュを持たない設計と対) |
| `content` が空文字 | `sections: []` の `DocIndex` を返す (例外なし) | 見出し 0 件は異常ではなく正常な境界値として扱う |

## §5 データ形 (具体例)

```json
// 入力例: contextSuggest(repoRoot, "design")
{ "repoRoot": "/abs/path/to/repo", "kind": "design" }
```

```json
// 期待出力 (マッチあり)
{
  "kind": "design",
  "fail_open": false,
  "fail_open_reason": null,
  "sections": [
    {
      "path": "docs/governance/ut-tdd-agent-harness-concept_v3.1.md",
      "heading": "2.3 V-model 対応",
      "section_number": "2.3",
      "start_line": 120,
      "end_line": 168,
      "matched": "v-model"
    }
  ]
}
```

```json
// 期待出力 (fail-open: kind 未登録)
{
  "kind": "unknown-kind",
  "fail_open": true,
  "fail_open_reason": "kind=unknown-kind は既知の topic に対応しない。canonical doc を全文読みすること (読み漏れ回避、安全側)。",
  "sections": []
}
```

## §6 エッジケース表

| # | ケース | 入力の特徴 | 期待挙動 | oracle |
|---|---|---|---|---|
| 1 | 境界: 見出しが 1 つも無い doc | `content = "本文のみ、見出し無し"` | `sections: []` の `DocIndex` を返す (例外なし) | U-CTX-BUILDIDX-EMPTY (起票時に採番) |
| 2 | 異常: `kind` が `KIND_TOPIC_KEYWORDS` に未登録 | `kind = "unknown"` | `fail_open: true`、`sections: []` | U-CTX-SUGGEST-UNKNOWNKIND |
| 3 | 異常: 全 index が `null` (doc 不在) | `indexes = [null, null]` | キーワードがあっても `sections: []` → `fail_open: true` | U-CTX-SUGGEST-NULLINDEX |
| 4 | 正常系の代表: kind="design" でキーワード一致セクションが複数 doc にまたがる | concept と requirements 両方に「設計」見出しあり | 両 doc からの `SectionSuggestion` を含む配列、`fail_open: false` | U-CTX-SUGGEST-MULTIDOC |
| 5 | 境界: 節番号無しの見出し (`## 概要` 等) | 見出しに `§` も数字ドット列も無い | `section_number: null` | U-CTX-BUILDIDX-NONUMBER |

## §7 検証接続

- pair: frontmatter `pair_artifact` (L7 unit-test-design)。§6 の oracle 列が対応表。
- 回帰 fence: `bun run test` full green + `ut-tdd doctor` の doc 系 check green (readability を含む)。

## §8 carry / 非スコープ

- `ROUTABLE_DOCS` の対象拡大 (concept/requirements 以外の canonical doc の tier 化) は本 doc のスコープ外
  (別 PLAN スライス、CLAUDE.md 本文にも「Read Order の改訂は別スライス」と明記)。
- キャッシュ戦略 (呼び出し側の裁量) は本 module の責務外。
