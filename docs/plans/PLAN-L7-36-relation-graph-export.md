---
plan_id: PLAN-L7-36-relation-graph-export
title: "PLAN-L7-36 (add-impl): relation graph export + verification-evidence projection (L7-32 分割の後半 2 機能)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-10
updated: 2026-06-11
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "U-RELGRAPH-007..010 promoted from it.todo to green tests; exportRelationDiagram and collectVerificationEvidenceProjection implemented as pure deterministic projections. Critical 0 / Important 0. External adapter execution remains out of scope; unavailable DOT/D2 returns findings only. Raw MCP/tool payload, screenshots, traces, provider transcript, secret-like fields are not projected."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - relation graph export 実装レビュー (別 runtime)"
  - role: qa
    slot_label: "QA - U-RELGRAPH-007..010 oracle"
generates:
  - artifact_path: src/lint/relation-graph.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
  requires:
    - docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
---

# PLAN-L7-36 (add-impl): relation graph export + verification-evidence projection

## §0 Position

DISCOVERY-05 §4.4 D3 (粒度 = 1〜3 機能) に従い、L7-32 (relation-graph 4 関数) を 2 span に分割した
**後半 2 機能**。前半 (collect + impact = L7-32) の pure projection が green になってから着手する
(同一 `src/lint/relation-graph.ts` を拡張するため downstream_dependency)。

## §1 Entry Conditions

- PLAN-L7-32 (collect + impact、U-RELGRAPH-001..006) が green。
- `tests/relation-graph.test.ts` に U-RELGRAPH-007..010 の Red oracle が存在 (scaffold 済 it.todo)。
- projection 行に raw MCP response / browser trace / screenshot / provider transcript / secret を保存しない。

## §2 Implementation Scope (本 span = 2 機能)

- `exportRelationDiagram` (U-RELGRAPH-007..008): snapshot → 決定的 Mermaid + DOT/D2 unavailable-adapter finding。
- `collectVerificationEvidenceProjection` (U-RELGRAPH-009..010): A-125 evidence record → projection 行 (raw payload 除外)。

Out of scope: 実外部ツール実行、SQLite write path。

## §3 Work Schedule

### Step 1: [直列] exportRelationDiagram を Red→Green (U-RELGRAPH-007..008)

直列理由: downstream_dependency. L7-32 の pure projection (snapshot 型) に依存。

### Step 2: [直列] collectVerificationEvidenceProjection を Red→Green (U-RELGRAPH-009..010)

直列理由: file_conflict. 同一 relation-graph.ts を Step 1 と続けて書く。

### Step 3: [直列] review (固定 review Step)

直列理由: downstream_dependency. typecheck / lint / vitest / doctor green 後に review evidence。

## §6 用語更新 (§G.9)

| 語 | 定義 | 確定経路 |
|---|---|---|
| exportRelationDiagram | relation graph snapshot を決定的 Mermaid/DOT/D2 へ。raw evidence payload 不含 | L7 impl で glossary back-merge |
| collectVerificationEvidenceProjection | A-125 verification-evidence-v1 を projection 行へ (summary/classification のみ) | 同上 |

## §8 DoD

- [x] U-RELGRAPH-007..010 promoted from `it.todo` to green `it` in `tests/relation-graph.test.ts`.
- [x] `bun run typecheck`, `bun run lint`, and targeted `bun run vitest run tests/relation-graph.test.ts` are green before review.
- [x] PLAN-REVERSE-32 (relation graph fullback) has the L7-36 merge declaration.
