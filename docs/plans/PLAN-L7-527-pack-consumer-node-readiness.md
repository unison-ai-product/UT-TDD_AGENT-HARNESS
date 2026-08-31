---
plan_id: PLAN-L7-527-pack-consumer-node-readiness
title: "PLAN-L7-527 (add-impl): Bun 非依存の consumer Node readiness (S1-a)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
github_issue_id: 471
parent_design: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
agent_slots:
  - role: se
    slot_label: "SE - readiness を engines.node と Git の判定へ限定する"
  - role: qa
    slot_label: "QA - Bun 不在の clean consumer setup と Node range の負系を実測する"
generates:
  - artifact_path: docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
    artifact_type: markdown_doc
  - artifact_path: tests/setup-bun-readiness.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md
    - docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
    - docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
    - src/setup/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/471
review_evidence: []
---

# PLAN-L7-527: Bun 非依存の consumer Node readiness (S1-a)

## 1. 目的と境界

`PLAN-L7-522` が Issue #471 へ割り当てた S1-a だけを実装する。clean consumer の setup
readiness から Bun probe と `bunOk` を除去し、consumer `package.json` の `engines.node` と Git を
正本として判定する。生成成果物の Bun 撤去 (#470)、source CI (#472)、sealed Node producer
(#473) は所有しない。

## 2. 不変条件

1. Bun が PATH と既知 home path のどちらにも無くても、対応 Node と Git があれば setup は成功する。
2. readiness 出力に Bun check や Bun 導入案内を残さない。
3. Node version は `engines.node` の npm semver range を満たさない場合に fail-close する。
4. source `package.json` の build script、生成 template、source workflowは変更しない。
5. parentがdual-lockを保持する期間は `package-lock.json` と `bun.lock` の direct graph parity を維持する。

## 3. 完了条件

- `U-PACKBUN-001`: Bun 到達不能な隔離consumerで実setupが成功する。
- `U-PACKBUN-002`: Bun checkが消え、Node rangeの正負境界とGit checkが観測できる。
- 実 CLI acceptance は `process.execPath` でNodeを直接起動する。
- Linux / Windows / aggregate CIがexact HEADでGreenになる。
- Reverse-527が実測証跡をR4へ戻す。
