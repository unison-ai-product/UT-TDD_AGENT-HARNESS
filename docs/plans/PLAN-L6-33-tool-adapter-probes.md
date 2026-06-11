---
plan_id: PLAN-L6-33-tool-adapter-probes
title: "PLAN-L6-33 (add-design): graph and diagram tool adapter probes"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-11
owner: Codex TL / PO
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "PLAN-L6-33 close: tool adapter setup/announce scope, U-TOOLADAPTER oracles, PLAN-L7-34 implementation entry, and REVERSE-34 back-fill are present; doctor/review-evidence green."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - tool adapter probe design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
  requires:
    - .ut-tdd/audit/A-124-cross-artifact-graph-tooling.md
    - docs/research/cross-artifact-graph-tooling-research-2026-06-09.md
---

# PLAN-L6-33 (add-design): graph and diagram tool adapter probes

## §0 Position

This PLAN is the L6 entry for optional dependency/diagram tool adapter probes. It does not replace the core TypeScript/Bun relation graph collector.

> **スコープ改訂 (2026-06-10 PO 決定、IMP-131)**: tool adapter (dependency-cruiser / Knip / Madge / Graphviz DOT / Mermaid / D2) は **gate truth でない insight 系** (A-124「raw 出力を gate truth にしない」) のため、**harness core の profile カタログとしてモデル化しない**。代わりに **`ut-tdd setup graph-tools [--with ...]` の一括セットアップ + layer-context アナウンス**へ降格する。これにより adapter ごとの probe/normalize/findings/優先順位を core に持たず、保守表面積を削減する。Madge⊂dependency-cruiser の重複や 3 図化レンダラ (Mermaid/DOT/D2) の選択は `--with` のユーザー選択に吸収され、カタログ優先順位を維持する必要が消える。**MCP / verification profile (playwright / testcontainers / github-mcp / msw / mcp-inspector / vitest-browser) は別扱い = マストツール系**として profile + 機械着地を維持する (V-model gate を支える検証であり gate truth になるため、setup+announce へ降格しない)。本 PLAN の §1-§4 は下記のとおり setup/announce 設計へ読み替える。

## §1 Scope

**改訂後 (IMP-131)**: `ut-tdd setup graph-tools` セットアップコマンド (冪等、`--with` で dependency-cruiser/knip/madge/graphviz/mermaid/d2 から選択導入、生成 config は git 秘匿の外 = §6.8.10 安全則踏襲) と、layer-context が関連 V-model 工程で導入手順をアナウンスする設計。adapter 出力の DB 正規化は「project が setup で opt-in した時のみ薄く配線」とし、未導入を前提に gate を組まない。

> 旧スコープ (改訂前、参考): dependency-cruiser / Knip / Madge / Graphviz DOT / Mermaid / D2 を adapter catalog/probe/normalization/stale diagram refresh として profile 設計。→ IMP-131 で setup+announce へ置換。

## §2 Contracts

The function contracts are documented in `module-drift.md` "Tool Adapter Probe Addendum":

- `catalogToolAdapters`
- `probeToolAdapter`
- `normalizeToolAdapterRun`
- `planDiagramRefresh`

## §3 Test Design

The L7 pair artifact adds U-TOOLADAPTER-001..010.

## §5 Guard

No package installation, source implementation, or external command execution is authorized by this PLAN alone. L7 requires PLAN-L7-34 TDD Red and PLAN-REVERSE-34.

## §8 DoD

- [x] L6 function contracts are documented as setup/announce design after IMP-131 scope revision.
- [x] U-TOOLADAPTER unit oracles are added to L7 unit test design.
- [x] L7 implementation PLAN references this PLAN and is confirmed.
- [x] Reverse pairing PLAN exists for implementation back-fill.

Status is `confirmed`: optional adapter execution remains out of scope and must be explicitly enabled by later workflow evidence.
