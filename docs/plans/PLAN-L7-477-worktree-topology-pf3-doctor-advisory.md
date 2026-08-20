---
plan_id: PLAN-L7-477-worktree-topology-pf3-doctor-advisory
title: "PLAN-L7-477 (impl): PF3 doctor advisory wiring"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-05
updated: 2026-08-20
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - collector/analyzerをdoctor advisoryへ薄く結線する"
  - role: qa
    slot_label: "QA - empty no-opとhard-gate不変を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-477-worktree-topology-pf3-doctor-advisory.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/worktree-topology-advisory.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/worktree-topology-doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-476-worktree-topology-pf2-os-collector.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/255
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T14:42:27+09:00"
    tests_green_at: "2026-08-20T14:42:27+09:00"
    verdict: pass
    scope: >-
      PF3 bounded slice の implementation verification。U-WTTOPO-015 を CANDIDATE から 1:1 昇格し、
      empty facts は no-op、findings は advisory 表示のみとした。collector/analyzer は削除・prune・
      repairへ拡張せず、doctor hard-gate / CI exit code へ接続していない。実装 worker は
      gpt-5.6-luna、effort=high。non-author Claude closing review は別途 HARNESS Memory 経由で依頼する。
      collector は DoctorDeps の lazy provider とし、check 定義列挙では起動せず、1 doctor run の advisory
      評価時に一度だけ呼び出す。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-luna
    green_commands:
      - kind: unit_test
        command: "npm exec -- vitest --config vitest.pf3.config.ts run tests/worktree-topology-doctor.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T14:42:27+09:00"
        evidence_path: tests/worktree-topology-doctor.test.ts
        output_digest: "sha256:88c5cd941c1c00d9405f021d05d337e7bd1b7207541385cf43614bdca3772b4c"
        anchor_commit: 102ab2a3f44031dd6377dda8a7b88dc32eefa674
      - kind: typecheck
        command: "npm run typecheck"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T14:35:51+09:00"
        evidence_path: src/doctor/worktree-topology-advisory.ts
        output_digest: "sha256:bdcc224ded42e10234845f7bf2d842d9e4fff32d981c9a6c8fadb3817381e77e"
        anchor_commit: 102ab2a3f44031dd6377dda8a7b88dc32eefa674
---

# PF3: doctor advisory wiring

本PLANはmaster `PLAN-L7-474` のforward implementation partitionであり、独立Reverseを起票しない。
Reverse R1〜R4とaggregate acceptanceはmasterと`PLAN-REVERSE-474`が所有する。

## Entry

PF2がmainへmergeし、Issue #255がReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-015`を所有する。CI等のempty factsは完全no-op、findingはadvisory表示するが
doctor全体のhard-gate/exit codeを変えない。削除・prune・repairは行わない。

## Exit

empty/advisoryのTDD、doctor registry parity、exact HEAD CI、closing PASSを満たす。
