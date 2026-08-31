---
plan_id: PLAN-L7-524-pack-consumer-generated-bun-removal
title: "PLAN-L7-524 (add-impl): setup 生成成果物から Bun 到達経路を撤去する (S1-b)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
worker_model: gpt-5.6-luna
worker_effort: high
github_issue_id: 470
parent_design: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-generated-bun-removal-backfill-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
agent_slots:
  - role: se
    slot_label: "SE - 生成 template / distribution / hook launcher から Bun 到達経路を撤去する"
  - role: qa
    slot_label: "QA - 生成 tree 全体の再帰走査と negative control、BAN lint の検出能力を実測する"
  - role: tl
    slot_label: "TL - S1-b の所有境界と L6-93 §5.2 削除禁止条項との非干渉を検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-pack-consumer-generated-bun-removal-backfill-test-design.md
    artifact_type: test_design
  - artifact_path: tests/setup-bun-removal.test.ts
    artifact_type: test_code
  - artifact_path: tests/ban-lint-detection-power.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/450
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/470
review_evidence: []
---

# PLAN-L7-524: setup 生成成果物から Bun 到達経路を撤去する (S1-b)

## 1. 目的と境界

`PLAN-L7-522` §5.3 が Issue #470 へ束縛した S1-b だけを実装する。`ut-tdd setup` が
consumer repository へ生成する成果物から、Bun 実行子、Bun shebang、setup-bun、run-bun
launcher、Bun 実行案内を除去し、Node/npm 経路へ統一する。

source repository の `package.json` の `build` script、readiness (S1-a)、source CI (S1-c)、
Node producer (Slice 2) は所有しない。source の `build: bun build ...` は
`PLAN-L6-93` §5.2 の rollback 条件として不変であり、生成 consumer の `build` script は
配布物で到達する必要がないため生成時に除去する。

## 2. 実装対象

- `src/setup/templates.ts` の Node wrapper、生成 hook、生成 CI、案内文、および `run-bun.ts` の撤去
- `src/setup/distribution.ts` の生成 `package.json` test script を npm 化し build を除去
- `src/lint/project-hook.ts` / `src/lint/codex-hook-adapter.ts` の直接 Node wrapper 契約
- `src/doctor/setup-smoke.ts` の wrapper 契約
- `U-PACKBUN-003` / `004` / `006` の実測 oracle と対の test-design / Reverse

## 3. 完了条件

- 生成 consumer tree の再帰走査が Bun 到達 0 件になる。
- 生成経路を5軸で1つずつ復活させたとき、それぞれ期待 finding 集合と完全一致して Red になる。
- runtime-portability、github-ci-policy、rule-drift、toolchain-pin の既存検出能力を、凍結サンプルで各 rule 単位に fail-close する。
- source `package.json` の `build` script が不変である。
- exact-head CI、非著者レビュー、Reverse-524 R4 は merge gate で確認する。

## 4. 方針

契約の正本は `PLAN-L7-522` であり、この子 PLAN は実装所有と trace を定義するだけである。
新しい規範が必要になった場合は本 PLAN に追加せず、親 PLAN の docs-only delta review へ戻す。
negative control は `not.toEqual([])` ではなく case ごとの finding 集合を固定し、別軸の検出で
変異の生存を隠さない。検出側 lint の変更は行わず、behavioral oracle で能力低下を監視する。
