---
plan_id: PLAN-L7-504-review-merge-root-single-normalization
title: "review merge gate の Git root 正規化を単一点へ固定"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-25
updated: 2026-08-25
owner: Codex / Luna
github_issue_id: 397
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-review-merge-root-single-normalization-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "review merge gateの二重root正規化を単一点へ収束させ、L6-101のcontainment契約へ戻す。"
agent_slots:
  - role: se
    slot_label: "Luna worker - merge gate root normalization"
  - role: qa
    slot_label: "TDD - nested invocation and single-mutation oracle"
  - role: tl
    slot_label: "Codex - exact revision and merge gate verification"
  - role: qa
    slot_label: "Claude Opus 5 - non-author closing review"
generates:
  - artifact_path: docs/plans/PLAN-L7-504-review-merge-root-single-normalization.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-merge-root-single-normalization-test-design.md
    artifact_type: test_design
  - artifact_path: tests/review-merge-root-single-normalization.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
  blocks: []
  references:
    - src/feedback/review-merge-gate.ts
    - docs/plans/PLAN-L6-101-pack-independent-consumer-runtime-backfill.md
    - docs/plans/PLAN-REVERSE-504-review-merge-root-single-normalization-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/397
review_evidence:
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-25T04:35:36Z"
    tests_green_at: "2026-08-25T04:35:36Z"
    verdict: "preflight green; Claude Opus 5 non-author exact-head closing review pending"
    worker_model: codex-primary
    reviewer_model: codex
    plan_revision: 1b408cb9350996c7239aaa1543ddf787acfd10ad
    subject_head: 1b408cb9350996c7239aaa1543ddf787acfd10ad
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/review-merge-gate.test.ts tests/review-merge-root-single-normalization.test.ts tests/oracle-test-trace.test.ts tests/test-design-naming.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-25T04:35:36Z"
        evidence_path: tests/review-merge-root-single-normalization.test.ts
        output_digest: "sha256:aa76280125d85eb00bb715ff37dae002e70e0b29c7c71391f5c339c0c88bf2fa"
        anchor_commit: 1b408cb9350996c7239aaa1543ddf787acfd10ad
    scope: "Issue #397 bounded single-root normalization; exact-head Claude Opus 5 closing review remains required."
---

# PLAN-L7-504

`runPrMerge` が公開境界で一度だけGit toplevelを解決し、内部のreview input収集は正規化済みrootを
受け取る。`reviewInputRoots` 自身では冪等な再解決を行わないため、単点変異でどちらか一方を除去
しても同じテストがGreenになる二重防御を残さない。

## Scope

- `src/feedback/review-merge-gate.ts` のroot解決呼出しを `runPrMerge` に集約する。
- nested Git directoryからのreview evidence収集とreceipt配置を専用oracleで固定する。
- D1/D3判定、provider permission、Pack publication、worktree lifecycleは対象外。

## Exit

- nested invocationがroot evidenceを読み、rootへgate receiptを書き込む。
- `runPrMerge`側のroot解決を単独除去したmutationがRedになる。
- PLAN lint、targeted snapshot、TypeScript、Biome、Linux/Windows/aggregate CIをGreenにする。
- PLAN-REVERSE-504をR1→R4へ進め、Claude Opus 5 exact-head non-author receiptを取得する。
