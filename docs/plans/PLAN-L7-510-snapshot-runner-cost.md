---
plan_id: PLAN-L7-510-snapshot-runner-cost
title: "Snapshot runner fixed-cost measurement and reduction"
kind: refactor
layer: L7
drive: agent
route_signal: code_smell
route_mode: refactor
status: draft
created: 2026-08-26
updated: 2026-08-26
owner: Codex / Luna
github_issue_id: 409
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-snapshot-runner-cost-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "Luna worker - stage instrumentation and bounded optimization"
  - role: qa
    slot_label: "QA - timing and custody mutation oracles"
  - role: tl
    slot_label: "Codex TL - contract and exact-head validation"
dependencies:
  parent: docs/plans/PLAN-L7-463-vitest-snapshot-fixed-cost-cache.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-463-vitest-snapshot-fixed-cost-cache.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/test-design/harness/L7-snapshot-runner-cost-test-design.md
    - scripts/run-vitest-snapshot.ts
    - tests/vitest-snapshot-runner.test.ts
    - .github/workflows/harness-check.yml
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/409
generates:
  - artifact_path: docs/plans/PLAN-L7-510-snapshot-runner-cost.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-snapshot-runner-cost-test-design.md
    artifact_type: test_design
backprop_decision: not_required
backprop_decision_reason: "This slice adds opt-in diagnostics only; it does not change the verification-lane contract or snapshot custody semantics."
review_evidence: []
---

# PLAN-L7-510 Snapshot runner fixed-cost measurement and reduction

## Objective

Issue #409 の snapshot runner を段階別に実測し、sealed snapshot と reference fingerprint の
fail-close 契約を維持したまま、重複する `npm ci` と全量コピーを削減する。

## Scope

最初に `UT_TDD_SNAPSHOT_TIMING=1` で完了した各stageの所要時間を即時にstderrへ出す。後続stageが
停止・強制終了しても、それ以前の測定値を失わない。計測値を
Windows local、Linux CI、Windows CIで取得した後にのみ削減方式と目標値を確定する。

doc-lane allowlist、required aggregate、snapshot sealing、foreign-write fenceは変更しない。
Bun廃止は別レーンの所有物であり、本PLANからBun経路を新設・拡張しない。

## Completion conditions

- `CANDIDATE-SNAPSHOT-COST-001` がopt-in出力とdefault無出力を識別する。
- local / Linux CI / Windows CIのstage別baselineを同一revisionへ記録する。
- `npm ci`回数と全量コピー回数を削減するか、削減不能の契約根拠を記録する。
- 1ファイルのローカル確認時間を改善するか、軽量経路の責務を上位契約へbackfillする。
- Node targeted tests、typecheck、Biome、required CIをGreenにする。

## Current phase

Instrumentation Red→Green。削減実装および完了判定はbaseline取得後であり、未完了。

## Windows local baseline

Baseline revision: `fb8f3701c3f7e521c8b384e8532449c0fe020e0e` plus the instrumentation
working diff. Command:

`UT_TDD_SNAPSHOT_TIMING=1 node scripts/run-vitest-snapshot.ts tests/vitest-snapshot-runner.test.ts --reporter=dot`

Result: 21/21 Green, exit 0.

| Stage | Duration |
|---|---:|
| resolve source | 8.1 s |
| execution snapshot | 234.0 s |
| reference snapshot | 12.6 s |
| npm ci | 8.3 s |
| db rebuild | 95.4 s |
| seal reference | 10.4 s |
| initial fingerprint | 36.7 s |
| vitest | 73.6 s |
| final fingerprint | 35.5 s |
| cleanup | 16.8 s |

The first isolated Git snapshot is the largest single cost. `npm ci` is 1.6% of the measured
sum and is not the local bottleneck. The two full reference fingerprints together cost 72.3 s;
DB rebuild is the second-largest stage. Therefore removing only the inner `npm ci` would not
materially fix the development loop.

The current `git clone --no-hardlinks` is a custody boundary: the execution snapshot must not
share mutable Git object storage with the development checkout. Replacing it with a linked
worktree, shared clone, junction, or hardlink cache is rejected until an oracle proves source
GC/object mutation and cleanup cannot change the sealed subject. No such proof exists in this
revision.

Linux and Windows CI measurements remain pending and will set the optimization target. The next
candidate is a bounded current-revision object transfer or a formally classified early-detection
runner; neither is accepted without an oracle separating it from closure evidence.
