---
plan_id: PLAN-L7-210-artifact-progress-impact-closure
title: "PLAN-L7-210: Artifact progress impact closure evidence binding"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L7-56-artifact-progress-state.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "This strengthens relation-impact projection evidence closure for existing artifact-progress semantics; no new user-facing requirement is introduced."
agent_slots:
  - role: qa
    slot_label: "QA - artifact progress feedback regression"
  - role: tl
    slot_label: "TL - evidence closure review"
generates:
  - artifact_path: docs/plans/PLAN-L7-210-artifact-progress-impact-closure.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-150-l7-l14-substance-gap-integrated-audit.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-151-green-command-digest-rerun-bind.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-152-l10-l14-current-close-snapshot.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  requires:
    - docs/plans/PLAN-L7-56-artifact-progress-state.md
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Close relation-impact false red rows only when generated artifacts have successful PLAN review evidence; preserve open impacts for unevidenced changes."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:d56af83ff426a05c53f3f8e6c73b7a5e631f1a4bf15a928690b4ff69c35db93a"
---

# PLAN-L7-210: Artifact progress impact closure evidence binding

## 目的

`artifact_progress_red` が、実際には PLAN の review evidence と green evidence に束ねられた変更まで open dependency impact として残る問題を閉じる。
これにより「未確認の変更」と「証跡付きの変更」を区別し、feedback の actionable surface を過大にしない。

## 対応

- relation-impact の closure 判定を、単一 owner の上書き map ではなく、複数の生成元 PLAN から証跡付き PLAN を探す方式にする。
- `approve_after_fixes` / `pass-with-fixes` を成功 verdict として扱う。
- PLAN 自体に対する `update-plan` action は、その PLAN に successful review evidence があれば closed にする。
- 証跡のない PLAN や生成関係のない artifact は open のまま残す。

## 受け入れ条件

- `bun run vitest run tests\projection-writer.test.ts --reporter=dot` が pass する。
- `bun run typecheck` が pass する。
- `bun src\cli.ts db rebuild` が pass する。
- `bun src\cli.ts feedback list --emit` の gate は 0 のままで、artifact-progress actionable が証跡付き変更で過剰に増えない。

## 境界

この PLAN は local projection の feedback 精度を上げる。
remote CI、tag、署名 tarball、公開 GitHub repo、post-publication consumer UAT は外部必須のまま残る。
