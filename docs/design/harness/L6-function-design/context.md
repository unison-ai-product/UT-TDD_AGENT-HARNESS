---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: context
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
---

# L6 機能設計: context / doc-router

> **L6 contract marker**: `buildDocIndex`, `loadDocIndex`, `suggestSections`, `contextSuggest` は unit-test 粒度の contracts とする。DbC pre/post/invariant は §2-§3、L7 oracle family は U-CONTEXT-001..005。

## §1 概要

`context` module は、タスク種別に応じて読むべき canonical doc section を提示する doc-router である。対象 doc は `ROUTABLE_DOCS` に限定し、section index を作って keyword matching で suggestion を返す。doc 不在や unknown kind は runtime を止めず、明示的な fail-open 結果を返す。

実装は `src/context/doc-router.ts`、CLI surface は `context suggest --task <text>` である。

## §2 IF 契約

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `buildDocIndex` | buildDocIndex(path: string, content: string) => DocIndex | `path` は repo-relative 文字列、`content` は markdown 文字列 | heading ごとの `DocSection` と `total_lines` を返す | 純関数。I/O を行わない | U-CONTEXT-001 |
| `loadDocIndex` | loadDocIndex(repoRoot: string, path: string) => DocIndex \| null | `repoRoot` は repo root、`path` は repo-relative | file が読めれば `DocIndex`、不在なら `null` | 読み取り失敗を caller に throw しない | U-CONTEXT-002 |
| `suggestSections` | suggestSections(kind: string, indexes: (DocIndex \| null)[]) => ContextSuggestResult | `kind` は任意文字列、`indexes` は null 混在可 | match があれば `fail_open=false`、unknown/no-match なら `fail_open=true` | suggestion は入力 index からのみ構成し、doc 本文を変更しない | U-CONTEXT-003 |
| `contextSuggest` | contextSuggest(repoRoot: string, kind: string) => ContextSuggestResult | `repoRoot` は repo root | `ROUTABLE_DOCS` を読み `suggestSections` の結果を返す | doc 不在は fail-open として扱う | U-CONTEXT-004 |

## §3 失敗方針

- `context` は探索補助であり、失敗時に作業を止めるべきではないため fail-open とする。
- unknown kind、対象 doc 不在、section match 0 件は `fail_open=true` と `fail_open_reason` で surface する。
- parse 不能な markdown は section 0 件として扱い、credential や provider transcript を永続化しない。

## §4 エッジケース

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| 1 | heading の無い markdown | `sections=[]` の `DocIndex` | U-CONTEXT-001 |
| 2 | file 不在 | `loadDocIndex` が `null` | U-CONTEXT-002 |
| 3 | unknown kind | `fail_open=true` | U-CONTEXT-003 |
| 4 | kind は既知だが match 0 件 | `sections=[]` かつ理由付き fail-open | U-CONTEXT-004 |
| 5 | 複数 doc に match | repo-relative path 付きで複数 suggestion | U-CONTEXT-005 |

## §5 検証接続

L7 unit-test design の U-CONTEXT-* が本 doc の contract を検証する。pair は `pair_artifact` に固定し、source 変更時は `tests/doc-router.test.ts` 系または同等の targeted vitest で確認する。
