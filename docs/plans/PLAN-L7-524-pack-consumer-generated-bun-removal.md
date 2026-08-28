---
plan_id: PLAN-L7-524-pack-consumer-generated-bun-removal
title: "PLAN-L7-524 (add-impl): setup 生成成果物から Bun 到達経路を撤去する (S1-b)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Claude
github_issue_id: 470
parent_design: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
agent_slots:
  - role: se
    slot_label: "SE - 生成 template / distribution / hook launcher から Bun 到達経路を撤去する"
  - role: qa
    slot_label: "QA - 生成 tree 全体の再帰走査と negative control、BAN lint の検出能力を実測する"
  - role: tl
    slot_label: "TL - S1-b の所有境界と L6-93 §5.2 削除禁止条項との非干渉を独立検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
    artifact_type: markdown_doc
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
    - src/setup/templates.ts
    - src/setup/distribution.ts
    - src/doctor/setup-smoke.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/450
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/470
review_evidence: []
---

# PLAN-L7-524: setup 生成成果物から Bun 到達経路を撤去する (S1-b)

## 1. 目的

`PLAN-L7-522` §5.3 が S1-b (Issue #470) へ束縛した範囲だけを実装する。すなわち
`ut-tdd setup` が consumer リポジトリへ**生成する成果物**から Bun 到達経路を 0 にする。

契約の正本は `PLAN-L7-522` であり、本 PLAN は契約を改訂しない。方式判断が必要になったら
実装を止めて `PLAN-L7-522` の改訂へ戻る (PR スコープ規律 2)。

## 2. 所有境界

本 PLAN が所有するのは次に限る。

- `src/setup/templates.ts` の生成 template (shebang / `common/run-bun.ts` / 生成 consumer CI / 案内文)
- `src/setup/distribution.ts` が生成 `package.json` へ書く script (`test` の起動語、`build` の除去)
- hook launcher の起動形 (`src/lint/project-hook.ts` / `src/lint/codex-hook-adapter.ts` /
  `src/doctor/setup-smoke.ts` の wrapper 契約)
- 上記を測る oracle 2 本 (`tests/setup-bun-removal.test.ts` / `tests/ban-lint-detection-power.test.ts`)

**所有しないもの**: setup readiness (S1-a / #471)、source CI の `setup-bun` (S1-c / #472)、
source `package.json` の `build` script と Node generation producer (Slice 2 / #473 系)。

## 3. 設計判断

### 3.1 生成物の script は保護対象ではない

`PLAN-L6-93` §5.2 は source repo の `build` script を rollback 手段として維持することを freeze する。
一方 Issue #450 AC2 は生成 tree に Bun 到達経路が無いことを要求する。両者は衝突しない —
**保護対象は source の script であって生成物の script ではない**。したがって
`transformCleanDistributionArtifact` は生成時に `scripts.build` を落とす。

### 3.2 hook launcher は wrapper CLI を node で直接起動する

`.ut-tdd/bin/run-bun.ts` を撤去し、hook は `node <wrapper> <subcommand>` 形へ倒す。
shell-free / canonical-path の契約は wrapper 自身に対して測る
(`setup-smoke` の `native-bun-launcher-contract` → `wrapper-launcher-contract`)。

### 3.3 BAN 検出側 lint の検出能力は減らさない

`PLAN-L7-522` §3.3 が freeze した 16 サンプルを各 lint へ入力する behavioral oracle
(`U-PACKBUN-006`) で固定する。条文の逐語一致では測らない。

## 4. 完了条件

- [x] 生成 consumer tree の再帰走査で Bun 到達が 0 件 (`U-PACKBUN-003`)
- [x] 生成経路ごとの negative control 5 軸が独立に Red になる (`U-PACKBUN-004`)
- [x] BAN 検出側 lint の検出能力が凍結サンプルで不変 (`U-PACKBUN-006`)
- [x] source `package.json` の `build` script が不変であることを oracle が固定している

close 条件 (exact-head CI Green と非著者 canonical receipt) は merge gate が独立に再判定するため
DoD checkbox には置かない。confirm 時点で実測できる項目だけを DoD とする。

## 5. 検証

対の test-design は `docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md`。
本 PLAN が昇格させた正規 oracle は `U-PACKBUN-003` / `004` / `006` であり、
`CANDIDATE-U-PACKBUN-001` / `002` (S1-a) と `005` (S1-c) は候補のまま各 slice が所有する。
