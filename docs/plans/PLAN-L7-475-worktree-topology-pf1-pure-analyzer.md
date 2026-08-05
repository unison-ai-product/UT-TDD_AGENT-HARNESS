---
plan_id: PLAN-L7-475-worktree-topology-pf1-pure-analyzer
title: "PLAN-L7-475 (impl): PF1 pure analyzer・canonical identity/remap"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-05
updated: 2026-08-05
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - pure typed analyzerとcanonical identity/remapをTDD実装する"
  - role: qa
    slot_label: "QA - PF1 owner oracleの順序不変・fail-safe・collisionを検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-475-worktree-topology-pf1-pure-analyzer.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/worktree-topology.ts
    artifact_type: source_module
  - artifact_path: tests/worktree-topology.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/253
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-05T15:35:00+09:00"
    tests_green_at: "2026-08-05T15:19:00+09:00"
    verdict: approve
    scope: >-
      PR #261 (exact HEAD d9dfa851) の post-merge cross-review。author family=codex /
      reviewer family=claude で族分離は成立。retirable の fail-safe (finding のある worktree を
      unsafe 集合で除外し、observation 不能な worktree を廃棄候補へ昇格させない) を実装
      (src/runtime/worktree-topology.ts) と oracle (U-WTTOPO-011) の双方で確認。detached は
      detachedRetained===true を追加要求しており、reviewer 側の先行実装 (PR #234/#238) より
      厳しい安全側。非 blocking 所見 1 件: ok=findingList.length===0 は link 切れが常態の環境で
      恒常 false になり得るため、PF3 doctor advisory (#255) で gate 判定へ直結させないこと。
      **手続き注記**: 本 PR は非 author verdict なしで merge され (reviews=0)、その結果
      merged-plan-status が main を fail-close させた (run 30981482419)。本 evidence は
      main 復旧のための事後記録である。
      **worker_model 注記**: author 側の実モデルはコミット trailer・PR 本文・session log の
      いずれにも記録が無く特定できなかった。ここでは CLAUDE.md の routing 既定 (codex 実装
      レーン) を記載している。上限解除後に author が実値へ訂正すること。
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/worktree-topology.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-05T15:19:00+09:00"
        evidence_path: tests/worktree-topology.test.ts
        output_digest: "sha256:08a1b20bd5cb31246da01798dd47915307b5fe1f62b3c4091b7cbd6e6cdcb22e"
        anchor_commit: ee76dd2732848bc613388f6ce7e0dde029e8a32e
---

# PF1: pure analyzer・canonical identity/remap

本PLANはmaster `PLAN-L7-474` のadd-impl lifecycleを実行可能な粒度へ分けたforward implementation
partitionであり、独立したadd-feature/Reverse lifecycleではない。Reverse R1〜R4とaggregate acceptanceは
masterと`PLAN-REVERSE-474`が所有する。

## Entry

PF-0 correctionがmainへmergeし、Issue #253がBlockedからReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-001`〜`006`、`008`〜`011`を所有する。Git I/O、realpath/reparse実証、
doctor結線、aggregate migration acceptanceは所有しない。PR #243のpure実装commitは本契約へ
適合する部分だけ再利用し、commit自体を正本扱いしない。

`CANDIDATE-WTTOPO-009`はfindingsだけでなく、countsの各bucketとretirable集合を含む全出力が
入力順に依存しないことを要求する。canonical remapはroot/prefix境界、longest-prefix、escape、
many-to-one/cross-path collisionを純粋判定する。

## Exit

owner oracleのRed→Green、同commitでの`U-*`昇格、exact HEAD CI、非author closing PASSを満たす。

## 実装証跡

`src/runtime/worktree-topology.ts` は PF1 の唯一の source module とし、collector / Git I/O / OS
realpath は持たない。入力factsを canonical identity、stable findings、counts、retirableへ純粋に
還元する。`tests/worktree-topology.test.ts` は `U-WTTOPO-001`〜`006`、`008`〜`011` と、PF1が
所有する canonical remapの root・longest-prefix・alias/collision/escape境界を引用する。
型検査と Biome は実装commit前に Green を確認した。closing review と exact HEAD CI は本PLANのExitまで
未取得のため、review evidenceへ先取り記録しない。
