---
plan_id: PLAN-L7-397-relation-graph-docs-root-ledger-coverage
title: "PLAN-L7-397 (troubleshoot): relation graph loader docs/ 直下 ledger coverage 欠落"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-07-08
updated: 2026-07-08
owner: Claude / PO
route_signal: incident
route_mode: incident
backprop_decision: not_required
backprop_decision_reason: "Relation graph loader coverage fix for two existing docs/ root ledger files; no runtime user behavior changes, no new design surface."
review_evidence:
  - reviewer: code-reviewer-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T21:50:00+09:00"
    tests_green_at: "2026-07-08T21:41:00+09:00"
    verdict: approve
    scope: "docs/feedback-log.md と docs/improvement-backlog.md の relation-graph node 未登録 (missing-projection gate error) の是正。DOCS_ROOT_LEDGER_FILES 追加パターンの妥当性、fail-open statSync、他の docs/ 直下 file 網羅漏れ有無を確認。"
    worker_model: claude-sonnet-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T21:41:00+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:9c7f7fdf42eb63a9f20fd428c1eb2b6d2469547f7d3f46630dc7892752f7a943"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T21:41:00+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:34bdf648d3941df893443e9e917aed2f61d03b273e79438e0a36581949646160"
agent_slots:
  - role: tl
    slot_label: "TL - relation graph loader docs/ root ledger coverage review"
  - role: aim
    slot_label: "AIM - troubleshoot and cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-397-relation-graph-docs-root-ledger-coverage.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
---

# PLAN-L7-397: relation graph loader docs/ 直下 ledger coverage 欠落

## 0. 検出 (システム全体監査、2026-07-08)

`ut-tdd feedback list` の gate バケットに `missing-projection` (severity=error) が
1 件常駐していた: `changed path docs/improvement-backlog.md has no relation-graph
node; impact cannot be analyzed (no silent change-impact fallback)`。

原因調査 (`src/graph/loader.ts`): relation graph loader は docs/design, docs/process,
docs/adr, docs/governance, docs/test-design, docs/plans, .claude/agents,
.claude/commands, skills/, docs/templates/adapter, .ut-tdd/review, .ut-tdd/audit,
.ut-tdd/evidence を再帰 walk するが、`docs/` 直下に直接置かれるファイルは対象外
だった。`docs/*.md` を実 glob すると `docs/feedback-log.md` と
`docs/improvement-backlog.md` の 2 件のみが該当し (PLAN-L7-142 が既に
ROOT_CANONICAL_DOCS / GOVERNANCE_DOCS で同種の穴を塞いだのと同じクラスの欠落)、
`docs/improvement-backlog.md` は 146 件の backlog エントリを持つ活発な
ledger であるため、単独編集のたびに gate error が発生し続けていた
(coverage の穴が「たまに踏む」ではなく「ほぼ毎回踏む」規模)。

再現:

```
bun run src/cli.ts graph impact --changed docs/improvement-backlog.md docs/feedback-log.md
# → exit 1, missing-projection x2 (修正前)
```

## 1. 是正

`src/graph/loader.ts` に `DOCS_ROOT_LEDGER_FILES = ["docs/feedback-log.md",
"docs/improvement-backlog.md"]` を追加し、`ROOT_CANONICAL_DOCS` と同じ
fail-open (`statSync` try/catch → `addDesignDocIfAbsent`) パターンで
design node として登録する。node kind を "design" に寄せるのは
`ROOT_CANONICAL_DOCS` / `GOVERNANCE_DOCS` が既に非-design 統治文書を
"design" node bucket へ汎用登録している既存慣習に合わせたもの
(新しい node kind を追加するスコープではない)。

## 2. 受け入れ条件

- `bun run src/cli.ts graph impact --changed docs/improvement-backlog.md
  docs/feedback-log.md` が exit 0 になる。
- `tests/relation-graph-loader.test.ts` の real-repo regression fence
  (PLAN-L7-142 由来) に両 path の `missing-projection` 非発生アサーションが
  追加され、green である。
- `bun run typecheck` / 対象ファイルの `biome check` が green である。
