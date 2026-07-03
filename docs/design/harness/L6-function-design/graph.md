---
layer: L6
sub_doc: graph
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L7-329-module-l6-design-backfill.md
---

# UT-TDD Agent Harness — L6 機能設計: graph (relation graph の I/O 組み立てと純粋投影の分業)

## §1 概要と配置

- 目的: repo 上の requirements / PLAN / design / test-design / source / test を横断する
  relation graph を、**I/O 収集層 (`src/graph/loader.ts`)** と **純粋投影ロジック層
  (`src/lint/relation-graph.ts`)** に分業して構築する。前者は fail-open な走査・parse、
  後者は node/edge の正規化・impact 分析・diagram export を担う副作用なしの純関数群。
- 実装先:
  - `src/graph/loader.ts` (既存) — repoRoot から `RelationGraphSourceSet` を組み立てる I/O 層。
  - `src/lint/relation-graph.ts` (既存) — `RelationGraphSourceSet` を受け取り projection/impact/diagram
    を返す純関数群 (型定義は `src/lint/relation-graph-types.ts` に分離、本 doc の対象外)。
- 呼び出し元: `src/cli.ts:730,752` — `collectRelationGraphProjection(loadRelationGraphSourceSet(repoRoot))`
  の 2 系統呼び出し (relation graph コマンド群の実装点)。
  `src/state-db/projection-writer.ts` も `loadRelationGraphSourceSet` を利用 (harness.db 投影経路)。

## §2 IF 契約

```ts
// ---- I/O 層: src/graph/loader.ts ----
// 実 repo の docs/plans / src / tests / docs/design / docs/test-design 等を走査し
// RelationGraphSourceSet を組み立てる。fail-open (各ディレクトリ不在/parse失敗は空集合)。
export function loadRelationGraphSourceSet(repoRoot: string): RelationGraphSourceSet;

// ---- 純粋投影層: src/lint/relation-graph.ts (型は relation-graph-types.ts) ----
// SourceSet → 安定 node ID + typed edge の rebuildable projection (副作用なし)
export function collectRelationGraphProjection(
  input: RelationGraphSourceSet,
): RelationGraphProjection;

// 変更影響分析 (node の変更が波及する下流 node/edge を辿る)
export function analyzeRelationImpact(input: RelationImpactInput): RelationImpactResult;

// projection を diagram (mermaid 等) へ export
export function exportRelationDiagram(input: ExportRelationDiagramInput): DiagramArtifact;

// I/O 層が組み立てる入力の形 (loader.ts の出力型、relation-graph-types.ts で定義・re-export)
export interface RelationGraphSourceSet {
  requirements: RequirementInput[];
  sourceFiles: SourceFileInput[];
  tests: TestFileInput[];
  plans: PlanInput[];
  designDocs: DesignDocInput[];
  testDesignDocs: TestDesignDocInput[];
  dbTables: DbTableInput[]; // loader.ts は常に [] (projection-writer 経由で別途供給)
}
```

## §3 事前/事後条件・不変条件

| 関数 | 事前条件 | 事後条件 | 不変条件 |
|---|---|---|---|
| `loadRelationGraphSourceSet` | `repoRoot` は絶対パス (repo ルート) | `docs/plans`/`src`/`tests`/`docs/design` 等を走査した `RelationGraphSourceSet` を返す。`dbTables` は常に `[]` | 各走査ステップは個別 try/catch で fail-open — 1 ディレクトリの走査失敗が全体を止めない |
| `collectRelationGraphProjection` | `input` は `RelationGraphSourceSet` (loader.ts の出力または fixture) | 安定 node ID + typed edge の `RelationGraphProjection` を返す | 純関数、I/O なし、raw MCP response / browser trace / secret / credential を行へ複製しない (sanitization invariant, U-RELGRAPH-003) |
| `analyzeRelationImpact` | `input` は既存 projection 上の有効な起点 node を含む | 波及先 node/edge を含む `RelationImpactResult` を返す | 純関数、projection の再構築なし |

## §4 失敗モード

- 方針: **loader.ts (I/O 層) は fail-open**、**relation-graph.ts (純粋層) は入力契約準拠を前提とする
  (呼び出し前に loader が正規化済みデータを渡す設計)。「各ディレクトリ不在 / parse 失敗は空集合として
  扱う」がモジュール冒頭コメントに明記された設計方針 (loader.ts:15)。
- 入力異常時の挙動:

| 異常 | 挙動 | 根拠 |
|---|---|---|
| `docs/plans` が空 / `loadReviewPlans` が throw | try/catch で `plans: []` に fail-open | loader.ts コメント「loadReviewPlans は docs/plans 不在で throw する (fail-close) ため、loader の fail-open 原則を保つために全体を try/catch で包む」(loader.ts:293-295) |
| `tests/` walk 中に readdir 失敗 | `walkTs` は catch して早期 return、`testPaths` は部分結果のまま継続 | 各 walk ヘルパは個別に try/catch (readdirSync/statSync 失敗を吸収) |
| plan frontmatter が不正 yaml | `parsePlanFrontmatter` は catch して `{}` を返す | 1 PLAN の frontmatter 不正が全体走査を止めない |
| test file の import 文が読めない (readFileSync 失敗) | `content = ""` のまま継続、当該テストの import 解析は空扱い | `buildCoveredByMap` 内の try/catch (loader.ts:142-146) |
| `status: archived` の PLAN | live graph から除外 (node/edge を出さない) | 削除済み artifact を指す dangling edge を防ぐ (PLAN-L7-142 是正) |

## §5 データ形 (具体例)

```json
// 入力例: loadRelationGraphSourceSet(repoRoot) の出力断片
{
  "requirements": [{ "id": "FR-L1-05", "path": "docs/design/harness/L1-requirements/functional-requirements.md" }],
  "sourceFiles": [{ "path": "src/graph/loader.ts", "tests": [] }],
  "tests": [{ "path": "tests/graph-loader.test.ts" }],
  "plans": [{ "id": "PLAN-L7-32", "path": "docs/plans/PLAN-L7-32-....md", "generates": ["src/graph/loader.ts"] }],
  "designDocs": [{ "id": "docs/design/harness/L6-function-design/graph.md", "path": "docs/design/harness/L6-function-design/graph.md" }],
  "testDesignDocs": [],
  "dbTables": []
}
```

```json
// collectRelationGraphProjection(sourceSet) の期待出力断片
{
  "nodes": [{ "id": "source:src/graph/loader.ts", "kind": "source" }],
  "edges": [{ "from": "plan:PLAN-L7-32", "to": "source:src/graph/loader.ts", "kind": "generates" }]
}
```

## §6 エッジケース表

| # | ケース | 入力の特徴 | 期待挙動 | oracle |
|---|---|---|---|---|
| 1 | 境界: `docs/plans` ディレクトリ不在 | 空 fixture repo | `loadRelationGraphSourceSet` は `plans: []` を含む結果 (例外なし) | U-GRAPH-LOADER-NOPLANSDIR (起票時に採番) |
| 2 | 異常: plan frontmatter が不正 yaml | 壊れた `---` block | 当該 plan は `plans` から除外、他 plan は継続処理 | U-GRAPH-LOADER-BADFRONTMATTER |
| 3 | 境界: `status: archived` の PLAN | frontmatter に `status: archived` | live graph の `plans` に含まれない (node/edge を出さない) | U-GRAPH-LOADER-ARCHIVEDPLAN |
| 4 | 正常系の代表: test ファイルが `../src/...` を import | `tests/foo.test.ts` が `import ... from "../src/foo"` | `sourceFiles` の該当 entry の `tests` に `tests/foo.test.ts` が含まれる (covered-by 逆引き成立) | U-GRAPH-LOADER-COVEREDBY |
| 5 | 異常: FR registry (`loadFrDocs`) が読めない | `docs/design/harness/L1-requirements/` 不在 | `loadRegistryFrIds` は catch して `[]`、`requirements` は plan 参照分のみになる | U-GRAPH-LOADER-NOFRREGISTRY |

## §7 検証接続

- pair: frontmatter `pair_artifact` (L7 unit-test-design)。§6 の oracle 列が対応表。
- 回帰 fence: `bun run test` full green + `ut-tdd doctor` の relation-graph / plan-lint 系 check green。

## §8 carry / 非スコープ

- `RelationGraphProjection`/`RelationImpactResult`/`DiagramArtifact` の型詳細と `relation-graph-types.ts`
  は別 doc 化候補 (本 doc は loader との分業境界に焦点、純粋層の内部ロジックは非スコープ)。
- `dbTable` node の供給経路 (`projection-writer.ts` 経由) は別モジュールの責務、本 doc の対象外。
