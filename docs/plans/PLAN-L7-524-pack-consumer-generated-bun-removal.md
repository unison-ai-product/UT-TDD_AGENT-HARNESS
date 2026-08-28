---
plan_id: PLAN-L7-524-pack-consumer-generated-bun-removal
title: "PLAN-L7-524 (add-impl): setup 生成成果物から Bun 到達経路を撤去する (S1-b)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
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
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-08-28T11:56:22Z"
    tests_green_at: "2026-08-28T11:56:11Z"
    verdict: "preflight。S1-b deliverable を slice-scoped PLAN 対へ分離する方向が非著者 lane に確認され、同時に Windows stale oracle (distribution-acceptance の run-bun 期待) が blocking として指摘された"
    worker_model: claude-opus-5
    reviewer_model: gpt-5.6-sol
    effort: low
    plan_revision: 9a85b0b7368cbf13ecab8635fb940913751d69d1
    subject_head: 9a85b0b7368cbf13ecab8635fb940913751d69d1
    evidence_path: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
    anchor_commit: 9a85b0b7368cbf13ecab8635fb940913751d69d1
    scope: >-
      preflight review_evidence である (merged-plan-status 是正手順 (B))。著者 family は claude、
      非著者 family は codex。対象は local HEAD 9a85b0b7 における PLAN 分離の方向確認と、
      exact remote HEAD caf61e20 の CI 実測に基づく指摘 2 件 (Linux: PLAN-L7-522 の DoD 未達、
      Windows: distribution-acceptance の run-bun 期待残存) である。
      **exact PR HEAD に対する非著者 closing review はこの時点では未取得**であり、
      close gate はそれを別途要求する。本 evidence は confirm の前提を満たすためのものであって
      closing verdict の代替ではない。契約は #469 で freeze 済みの PLAN-L7-522 S1-b であり、
      本 PLAN は新規の規範・oracle・受入条件を追加しない所有/trace PLAN である。
    citations:
      - "docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md"
      - ".ut-tdd/memory/feedback-pr-478-final-governance-clarification-preserve-469-freeze-child-owns-s1-b--db5b8212cf8a.md"
      - ".ut-tdd/memory/feedback-pr-478-exact-head-ci-feedback-child-plan-stale-windows-oracle--3e4658c89a6c.md"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/setup-bun-removal.test.ts tests/ban-lint-detection-power.test.ts tests/hook-native-launcher.test.ts tests/doctor-setup-smoke.test.ts tests/doctor-test-repository-isolation.test.ts tests/oracle-test-trace.test.ts tests/setup.test.ts tests/codex-hook-adapter.test.ts"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-28T11:56:11Z"
        evidence_path: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
        output_digest: "sha256:8e55139673d23aba879a07dfa04fca18b493e35915e0f50844645166330774e7"
        anchor_commit: 9a85b0b7368cbf13ecab8635fb940913751d69d1
---

# PLAN-L7-524: setup 生成成果物から Bun 到達経路を撤去する (S1-b)

## 1. 目的

`PLAN-L7-522` §5.3 が S1-b (Issue #470) へ束縛した範囲だけを実装する。すなわち
`ut-tdd setup` が consumer リポジトリへ**生成する成果物**から Bun 到達経路を 0 にする。

契約の正本は `PLAN-L7-522` であり、本 PLAN は契約を改訂しない。方式判断が必要になったら
実装を止めて `PLAN-L7-522` の改訂へ戻る (PR スコープ規律 2)。

### 1.1 #469 freeze への束縛 (新規規範を持たないことの明示)

本 PLAN は **所有 / trace PLAN** であり、PR #469 exact HEAD
`58f88f14a2f938a287240caaa949dcdf4bdb7ca6` で非著者 closing review PASS を得た
`PLAN-L7-522` の S1-b 契約を具体化するだけである。新規の規範・oracle・受入条件を追加しない。
対応は次のとおりで、いずれも #469 で freeze 済みの条項の再述である。

| 本 PLAN | 束縛先 (#469 freeze 済み) |
|---|---|
| §2 所有境界 | `PLAN-L7-522` §2.1 撤去対象 inventory と §5.3 slice ↔ 子 Issue 束縛表 |
| §3.1 生成物の script は保護対象でない | `PLAN-L7-522` §2.1.1 設計判断 |
| §3.2 hook launcher は node 直接起動 | `PLAN-L7-522` §2.1 (launcher 契約の consumer である `src/lint/project-hook.ts` / `src/doctor/setup-smoke.ts` を同一 PR で追随させる条項) |
| §3.3 BAN lint の検出能力不変 | `PLAN-L7-522` §3.3 と §6 不変条件 4 |
| §4 DoD の oracle | 対の test-design が宣言する `CANDIDATE-U-PACKBUN-003` / `004` / `006`。正規 ID への昇格は test-design 自身が定める「各 test 実装と Red 実測の同一 commit で昇格する」手順に従う |

新規の規範を追加する必要が生じた場合は、本 PLAN へ書き足さず `PLAN-L7-522` の改訂として
docs-only の delta review を先行させる。

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
