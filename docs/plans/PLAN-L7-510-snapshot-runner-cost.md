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
updated: 2026-08-27
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
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: "2026-08-27T03:17:05Z"
    tests_green_at: "2026-08-27T01:37:47Z"
    verdict: "measurement slice の非著者 closing review 成立 (PASS / blocking 0)。Issue #409 の最適化完了は未主張のため status は draft"
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: claude-opus-5
    plan_revision: f829e9414d0f14aa67d3e62364865d3c291ca995
    subject_head: f829e9414d0f14aa67d3e62364865d3c291ca995
    evidence_path: docs/test-design/harness/L7-snapshot-runner-cost-test-design.md
    anchor_commit: f829e9414d0f14aa67d3e62364865d3c291ca995
    scope: >-
      PR #423 exact HEAD f829e941 に対する非著者 closing delta review。canonical request
      rv1-89b41293dbf4c9843dc9d769e03aecf6efd5b4898832ce58bd099065042d5ade の receipt が
      verdict=PASS / blocking 0 / reviewerFamily=claude を記録している。先行 FLAG
      (immediate stage emission oracle) は同 HEAD で是正済み。PR は 2026-08-27T03:18:15Z に
      merge 済み。scope は計測のみで、Issue #409 の最適化完了は主張しない。
      worker_model / effort は receipt・request・commit trailer・PR record の
      いずれにも記録が無く、Codex session corpus (~/.codex/sessions) の turn_context 実測から
      確定した。2026-08-26/27 の Codex 実行系は gpt-5.6-luna (effort high) と
      gpt-5.6-sol (effort low) の 2 つだけで、創出レーンが luna/high、review・verdict レーンが
      sol/low に分かれている。実値の申告があれば本欄を訂正する。Issue #429 が本欄の
      手書き運用そのものを所有する。
    citations:
      - ".ut-tdd/review/receipts/89b41293dbf4c9843dc9d769e03aecf6efd5b4898832ce58bd099065042d5ade.json"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/33030014480"
    green_commands:
      - kind: unit_test
        command: "GitHub harness-check run 33030014480 (harness-check-linux / harness-check-windows / harness-check aggregate)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-27T01:37:47Z"
        evidence_path: docs/test-design/harness/L7-snapshot-runner-cost-test-design.md
        output_digest: "sha256:4d3b45484fd53a3d816133101b3ff746eb80f6e47821288cea38996690c16db6"
        anchor_commit: f829e9414d0f14aa67d3e62364865d3c291ca995
---

# PLAN-L7-510 Snapshot runner fixed-cost measurement and reduction

## Objective

Issue #409 の snapshot runner を段階別に実測し、sealed snapshot と reference fingerprint の
fail-close 契約を維持したまま、重複する `npm ci` と全量コピーを削減する。

## Scope

最初に `UT_TDD_SNAPSHOT_TIMING=1` で完了した各stageの所要時間を即時にstderrへ出す。CI (`CI=true`)
では同じ診断を既定で有効にする。後続stageが
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

Baseline revision: exact HEAD `23120b59b0dab43a738f9d510baf208c8c42a390` (the
instrumentation is included in this commit). Command:

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
