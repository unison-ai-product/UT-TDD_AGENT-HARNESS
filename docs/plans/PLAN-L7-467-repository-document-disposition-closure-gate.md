---
plan_id: PLAN-L7-467-repository-document-disposition-closure-gate
title: "PLAN-L7-467 (add-impl): repository document disposition auditor / closure gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-28
owner: PO / Codex
review_evidence:
  - reviewer: claude-cross-review
    review_kind: cross_agent
    reviewed_at: "2026-07-28T09:16:00Z"
    tests_green_at: "2026-07-28T09:15:36Z"
    verdict: pass
    scope: "Design substantive HEAD 83a09fcb と implementation substantive HEAD c00d68e4 の claim-blind / spec-blind review は両 lane PASS。統合 HEAD bada31f4 は U-DOCLEDGER-001..005、oracle trace、plan lint、legacy migration、design-language、typecheck を通過し、PR #146 CI 30345405817 は Linux / Windows / aggregate gate Green。"
    worker_model: codex-gpt-5.6-sol
    reviewer_model: claude-opus-5
    green_commands:
      - kind: smoke
        command: "GitHub Actions harness-check run 30345405817"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-07-28T09:15:36Z"
        evidence_path: .ut-tdd/memory/project-claude-pr-147-doc-snapshot-review.md
        output_digest: "sha256:28c4b87b54640c08a74a82b98b5fe4035dba59d5673b42d2f0cabb7261cace28"
        anchor_commit: bada31f47b4ac282e2eba31d50467e869e0896be
parent_design: docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - snapshot/shard/materialize/reference closure CLI"
  - role: qa
    slot_label: "QA - U-DOCLEDGER Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-467-repository-document-disposition-closure-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-467-repository-document-ledger-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/document-disposition/application/capture-repository-docs-snapshot.ts
    artifact_type: source_module
  - artifact_path: src/document-disposition/domain/canonical-frame.ts
    artifact_type: source_module
  - artifact_path: src/document-disposition/domain/repository-docs-snapshot.ts
    artifact_type: source_module
  - artifact_path: src/document-disposition/ports/git-object-snapshot.ts
    artifact_type: source_module
  - artifact_path: tests/document-disposition/capture-repository-docs-snapshot.test.ts
    artifact_type: test_code
  - artifact_path: src/document-disposition/domain/analyze-repository-document-closure.ts
    artifact_type: source_module
  - artifact_path: tests/document-disposition/analyze-repository-document-closure.test.ts
    artifact_type: test_code
  - artifact_path: src/document-disposition/domain/document-disposition.ts
    artifact_type: source_module
  - artifact_path: tests/document-disposition/document-disposition.test.ts
    artifact_type: test_code
  - artifact_path: src/document-disposition/domain/replay-document-deltas.ts
    artifact_type: source_module
  - artifact_path: src/document-disposition/domain/document-delta.ts
    artifact_type: source_module
  - artifact_path: src/document-disposition/domain/document-delta-reducer.ts
    artifact_type: source_module
  - artifact_path: src/document-disposition/domain/document-delta-finding.ts
    artifact_type: source_module
  - artifact_path: tests/document-disposition/replay-document-deltas.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - docs/plans/PLAN-REVERSE-467-repository-document-ledger-backfill.md
---

# PLAN-L7-467

U-DOCLEDGERをRed freezeし、Git object snapshot、shard materialize、validator、typed reference closure、生成reportを実装する。baseline 3d232e9c/921を不変保持し以後をdelta化する。DoDはpending/orphan/phantom 0、review、Reverse-467合流である。

planned deliverablesは`docs/governance/repository-document-disposition/**`の921件materialized ledger、`src/document-disposition/{domain,application,ports,adapters}`、正規化DB schema/projection、write/query分離CLI、実行可能Red/property/mutation testである。既存relation graphは検証済みedgeのconsumerに限定しoracleにしない。
