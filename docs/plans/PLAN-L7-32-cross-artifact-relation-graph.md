---
plan_id: PLAN-L7-32-cross-artifact-relation-graph
title: "PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-15
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-10"
    tests_green_at: "2026-06-10"
    verdict: pass
    scope: "collect+impact 2 機能 (U-RELGRAPH-001..006)。code-reviewer APPROVE / Critical 0。Important I-1 (test-design→paired design の behavioral-contract 逆引き) / I-3 (test-design 変更 oracle 追加) / m-2/m-4/m-5 を同サイクルで反映。hybrid だが Codex CLI が壊れ legacy のため intra_runtime_subagent review (cross-agent 不在を evidence に記録)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: tl
    slot_label: "TL - relation graph implementation"
  - role: qa
    slot_label: "QA - relation graph oracles"
generates:
  - artifact_path: src/lint/relation-graph.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph.test.ts
    artifact_type: test_code
  # §9 discharge (2026-06-15): graph CLI loader + subcommand
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
  requires:
    - docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
    - docs/plans/PLAN-REVERSE-32-cross-artifact-relation-graph.md
---

# PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection

## §0 Position

This PLAN is the only authorized L7 implementation entry for A-124 / A-125 relation graph source work. It exists because PLAN-RECOVERY-03 proved that ad-hoc source creation is unsafe.

## §1 Entry Conditions

Implementation must not start until:

- PLAN-L6-31 has confirmed function signatures and U-* oracles.
- `tests/relation-graph.test.ts` is created first as TDD Red entry and fails only because implementation is absent.
- Existing `verification-profile` tests remain green.
- No raw MCP response, browser trace, screenshot, provider transcript, secret, or credential is stored in the projection rows.

## §2 Implementation Scope

> **粒度ドクトリン適用 (DISCOVERY-05 §4.4 D3、PO 2026-06-10)**: relation-graph 4 関数を 2 span に分割。
> 本 PLAN = **collect + impact の 2 機能** (U-RELGRAPH-001..006)。export + verification-evidence-projection
> (U-RELGRAPH-007..010) は **PLAN-L7-36** へ分離 (TDD 2× で 1 cycle に収める)。

Allowed implementation after entry conditions are met (本 span = 2 機能):

- `src/lint/relation-graph.ts`: `collectRelationGraphProjection` (U-RELGRAPH-001..003) + `analyzeRelationImpact` (U-RELGRAPH-004..006) の pure projection / impact 解析。
- `tests/relation-graph.test.ts`: 上記 2 機能の unit fixtures (U-RELGRAPH-001..006 を it.todo → it 昇格)。
- CLI wiring (`ut-tdd graph impact`) は pure functions green 後。

Out of scope:

- Actual external tool installation.
- Actual MCP server invocation beyond A-125 readiness gates.
- SQLite write path before DB collector/rebuild profile is confirmed.

## §3 Work Schedule

### Step 1: [直列] TDD Red oracle

直列理由: downstream_dependency. The relation graph contract must fail for missing implementation before source is added.

### Step 2: [直列] Pure projection functions

直列理由: downstream_dependency. CLI / DB writer must depend on deterministic pure output.

**進捗 (2026-06-10、塊C span)**:
- 第1段: `collectRelationGraphProjection` (U-RELGRAPH-001..003) を `src/lint/relation-graph.ts` に実装、001..003 を green 昇格 (node 安定 ID + typed edge + (kind,id,path) dedup / DB table upstream + orphan finding / sanitization で raw payload 非複製)。
- 第2段: `analyzeRelationImpact` (U-RELGRAPH-004..006) を実装、004..006 を green 昇格。source 変更→sibling test/L6 design contract/L7 oracle/PLAN/reverse-backprop へ展開、design/test-design/physical-data 変更→paired artifact/DB table/PLAN DoD/trace-freeze へ展開 (behavioral-contract edge 無ければ source test 非要求)、missing-projection/stale-edge は ok=false finding (`analyzeChangeImpact` へ無音 fallback しない)。

**これで PLAN-L7-32 (collect+impact 2 機能) 実装完了**。green + review 前置後に confirmed → G-L7.C1 reached。export+evidence (007..010) は PLAN-L7-36。

### Step 3: [並列] CLI smoke and docs back-fill

CLI smoke and doc back-fill can proceed after pure function green.

### Step 4: [直列] review

直列理由: downstream_dependency. typecheck / lint / vitest / doctor must be green before review evidence is recorded.

## §8 DoD

- [x] Red test exists before source implementation.
- [x] `bun run test tests/relation-graph.test.ts tests/verification-profile.test.ts` passes.
- [x] `bun run typecheck`, `bun run lint`, and `bun run src/cli.ts doctor` pass.
- [x] Reverse fullback closes governance/backlog additions.

## §9 Discharged — `ut-tdd graph impact|export` CLI (2026-06-15、PO 指示で前倒し実装)

2026-06-15 L7 完全実装監査 (PLAN-L7-52) で「PLAN §2 が予告した `ut-tdd graph impact` CLI が未実装・formal defer 記録なし」が指摘され、本節で `explicit_l7_defer` として明示記録していた。**2026-06-15 PO 指示 (キャリー解消) で前倒し実装し discharge した。**

- **実装内容 (discharge)**:
  - **repo→`RelationGraphSourceSet` loader** = `src/graph/loader.ts` (`loadRelationGraphSourceSet(repoRoot)`)。既存 loader を再利用 (`loadImplPlanTraceInput` で src/**, `loadReviewPlans` + frontmatter で plan generates/FR refs, `loadPairDocs` で design↔test-design pair, tests import 解析で source→test covered-by)。db-table node のみ projection-writer 経由 (`rebuildHarnessDb` の `input.relationGraph`) で別供給に集約 (loader は doc/source graph に集中)。
  - **CLI surface** = `ut-tdd graph impact --changed <path...>` (loader → `collectRelationGraphProjection` → `analyzeRelationImpact`、changedNodes/impacted/actions/findings 出力、error finding で exit 1) / `ut-tdd graph export --format mermaid|dot [--scope]` (→ `exportRelationDiagram`、mermaid 常時 / dot は純粋 DOT テキスト emit)。`src/cli.ts` の `graph` command group。
  - **テスト** = `tests/relation-graph-loader.test.ts` (plan→source / source→test / design→test-design edge 生成 + 純関数結合 impact/export + 空 repo fail-open)。
- **first slice (既存)**: `ut-tdd verify recommend --changed <path>` は引き続き changed-file → profile trigger の Mermaid impact evidence を emit (用途別の補完導線)。
- **残 follow-up (任意、別 scope)**: ① db-table node の loader 取り込み (現状 projection-writer 供給)、② `--scope` の per-scope 絞り込み (現状 full export + scope ラベル表示のみ)、③ dependency-cruiser / Graphviz 等の外部 adapter 連携 (ADR-002 A-124 の DB-backed expansion 本体)。これらは本 CLI slice の価値を阻害しない増分。
