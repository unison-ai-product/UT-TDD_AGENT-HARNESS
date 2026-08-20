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
  - artifact_path: src/doctor/runtime-state.ts
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
    reviewed_at: "2026-08-20T14:35:51+09:00"
    tests_green_at: "2026-08-20T14:35:51+09:00"
    verdict: pass
    scope: >-
      PF3 bounded slice の implementation verification。U-WTTOPO-015 を CANDIDATE から 1:1 昇格し、
      empty facts は no-op、findings は advisory 表示のみとした。collector/analyzer は削除・prune・
      repairへ拡張せず、doctor hard-gate / CI exit code へ接続していない。実装 worker は
      gpt-5.6-luna、effort=high。non-author Claude closing review は別途 HARNESS Memory 経由で依頼する。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-luna
    green_commands:
      - kind: unit_test
        command: >-
          node --input-type=module -e 'import { checkWorktreeTopologyAdvisory } from
          "./src/doctor/worktree-topology-advisory.ts"; const empty={facts:[],adminEntries:[]};
          if(JSON.stringify(checkWorktreeTopologyAdvisory(empty))!==JSON.stringify({ok:true,messages:[]}))
          throw new Error("empty-no-op"); const input={facts:[{worktreePathKey:"C:/repo/worktree",
          adminPathKey:"C:/repo/.git/worktrees/worktree",headOid:"0123456789012345678901234567890123456789",
          isMain:false,directoryObserved:false,worktreeToAdminOk:true,adminToWorktreeOk:true,dirty:false,
          branch:"refs/heads/feature",mergedIntoMain:false}],adminEntries:[]}; const result=
          checkWorktreeTopologyAdvisory(input); if(!result.ok || !result.messages.join("\\n").includes("dir_missing"))
          throw new Error("finding-advisory"); console.log("U-WTTOPO-015: 2 assertions passed; advisory ok=true");'
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T14:35:51+09:00"
        evidence_path: tests/worktree-topology-doctor.test.ts
        output_digest: "sha256:4a3cfe61dcab160c4a58b7f866472b0f926502e02f412e8ed933bdaec8ec68d5"
        anchor_commit: ce2ed7f2402242cc44eb85988a27dc94ebdf87cb
      - kind: typecheck
        command: "npm run typecheck"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T14:35:51+09:00"
        evidence_path: src/doctor/worktree-topology-advisory.ts
        output_digest: "sha256:ba4e06489994328a4657ccae4fc09d73f962f140c4d07b4c9b1db1bf03a3c5a0"
        anchor_commit: ce2ed7f2402242cc44eb85988a27dc94ebdf87cb
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
