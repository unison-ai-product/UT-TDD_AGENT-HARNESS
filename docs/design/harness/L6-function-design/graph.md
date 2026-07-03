---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: graph
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
---

# L6 機能設計: graph / relation graph

> **L6 contract marker**: `loadRelationGraphSourceSet`, `collectRelationGraphProjection`, `analyzeRelationImpact`, `exportRelationDiagram` は unit-test 粒度の contracts とする。DbC pre/post/invariant は §2-§3、L7 oracle family は U-GRAPH-001..005。

## §1 概要

`graph` module は requirements / PLAN / design / test-design / source / tests を relation graph として読み取り、影響分析と diagram export の入力を作る。I/O 層は `src/graph/loader.ts`、純粋 projection / analysis 層は `src/lint/relation-graph.ts` と `src/lint/relation-graph-types.ts` に分かれる。

loader は欠損 repository 断片に強く、個別 directory や frontmatter の読取失敗で全体を止めない。

## §2 IF 契約

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `loadRelationGraphSourceSet` | loadRelationGraphSourceSet(repoRoot: string) => RelationGraphSourceSet | `repoRoot` は repo root | docs / src / tests から source set を作る。欠損領域は空配列 | I/O 失敗を部分欠損として扱い、raw provider payload を保存しない | U-GRAPH-001 |
| `collectRelationGraphProjection` | collectRelationGraphProjection(input: RelationGraphSourceSet) => RelationGraphProjection | normalized source set | stable node ID と typed edge を返す | 純関数。projection は rebuildable で authoring source ではない | U-GRAPH-002 |
| `analyzeRelationImpact` | analyzeRelationImpact(input: RelationImpactInput) => RelationImpactResult | changed path と graph projection | upstream/downstream impact と follow-up finding を返す | source change は design/test impact を見逃さない | U-GRAPH-003 |
| `exportRelationDiagram` | exportRelationDiagram(input: ExportRelationDiagramInput) => DiagramArtifact | graph snapshot と format | deterministic diagram text を返す | diagram export は review evidence であり DB/source を mutate しない | U-GRAPH-004 |

## §3 失敗方針

- loader は fail-open。部分的な filesystem 欠損は空配列として継続する。
- projection / analysis は入力済み source set を前提とする純関数として扱う。
- graph rows は raw browser trace、MCP response、credential、provider transcript を複製しない。

## §4 エッジケース

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| 1 | `docs/plans` 不在 | `plans=[]` で継続 | U-GRAPH-001 |
| 2 | 壊れた frontmatter | 当該 plan を skip し他を継続 | U-GRAPH-001 |
| 3 | archived PLAN | live graph から除外 | U-GRAPH-002 |
| 4 | test が source を import | `covered-by` edge を生成 | U-GRAPH-002 |
| 5 | changed source path | upstream/downstream impact を返す | U-GRAPH-003 |

## §5 検証接続

L7 unit-test design の U-GRAPH-* が本 doc の contract を検証する。`tests/relation-graph*.test.ts`、`tests/graph-loader.test.ts`、doctor の relation graph 系 gate が回帰 fence になる。
