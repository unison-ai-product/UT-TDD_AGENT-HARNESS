---
plan_id: PLAN-L7-476-worktree-topology-pf2-os-collector
title: "PLAN-L7-476 (impl): PF2 OS collector・realpath/reparse・retained refs"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-05
updated: 2026-08-13
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 薄いOS collectorとtyped observationを実装する"
  - role: qa
    slot_label: "QA - Windows reparse/realpathとretained ref解決を実OSで検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-476-worktree-topology-pf2-os-collector.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/worktree-topology-collector.ts
    artifact_type: source_module
  - artifact_path: tests/worktree-topology-collector.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-475-worktree-topology-pf1-pure-analyzer.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/254
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-13T12:23:37Z"
    tests_green_at: "2026-08-13T11:49:26Z"
    verdict: approve
    scope: >-
      PR #308 の blind closing review 2 周。初回 FLAG (blocking 3) は U-WTTOPO-016 の恒真アサート、
      U-WTTOPO-014 oracle の pin 不足 (mutant M4 生存)、loadAdminRecords の unguarded readdir/stat
      (dangling reparse で uncaught throw)。是正 726db0b0 で M4 は KILL、恒真アサートは実 finding
      照合へ置換 (mutant 複合で RED 実証)、admin scan は typed finding 化 (probe 2 種で実測)。
      delta 再レビューで PASS (blocking 0)。subject は exact HEAD
      726db0b0c5d0dadeabf0085f482bf5f8353262e2。main (#310 merge 後 8f89bf22) への
      rebase で成果物 diff 空を確認し PASS 維持 (subject 36af138f、2026-08-13T12:23:37Z)。
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/308#issuecomment-5279398289"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/308#issuecomment-5279883631"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/worktree-topology-collector.test.ts"
        runner: bash
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-13T11:49:26Z"
        evidence_path: tests/worktree-topology-collector.test.ts
        output_digest: "sha256:de8435e0bdf2031823f92f4f0c573781ef37ff0a62ffa50dd0072b0440130247"
        anchor_commit: 726db0b0c5d0dadeabf0085f482bf5f8353262e2
---

# PF2: OS collector・realpath/reparse・retained refs

本PLANはmaster `PLAN-L7-474` のforward implementation partitionであり、独立Reverseを起票しない。
Reverse R1〜R4とaggregate acceptanceはmasterと`PLAN-REVERSE-474`が所有する。

## Entry

PF1がmainへmergeし、Issue #254がReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-007`、`012`、`014`、`016`、`017`を所有する。porcelain、gitdir/admin、
command failure、retained refとsymbolic aliasをtyped facts/findingsへ変換し、正常値へ丸めない。

`CANDIDATE-WTTOPO-016`は文字列fixtureだけではGreenにしない。Windows上で実reparse pointを作り、
`realpath.native`相当の実観測から同じidentityへ収束する証跡を必須とする。作成不能な環境では
skip GreenではなくOS能力不足として明示し、Windows CI laneを正本証拠にする。

## Exit

owner oracleのRed→Green、実OS証跡、同commitでの`U-*`昇格、exact HEAD CI、closing PASSを満たす。
