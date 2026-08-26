---
plan_id: PLAN-L7-511-managed-worktree-lifecycle
title: "PLAN-L7-511 (add-impl): managed worktree lifecycle orchestration"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-26
updated: 2026-08-26
owner: Codex / TL
parent_design: docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
pair_artifact: docs/test-design/harness/L7-managed-worktree-lifecycle-test-design.md
generates:
  - artifact_path: docs/plans/PLAN-L7-511-managed-worktree-lifecycle.md
    artifact_type: markdown_doc
  - artifact_path: src/cli/worktree-lifecycle.ts
    artifact_type: source_file
  - artifact_path: src/runtime/worktree-lifecycle/application/managed-worktree.ts
    artifact_type: source_file
  - artifact_path: src/runtime/worktree-lifecycle/adapters/jsonl-ledger.ts
    artifact_type: source_file
  - artifact_path: src/runtime/worktree-lifecycle/adapters/node-managed-worktree.ts
    artifact_type: source_file
  - artifact_path: tests/managed-worktree-lifecycle.test.ts
    artifact_type: test_file
dependencies:
  parent: docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
  requires:
    - PLAN-L7-501-worktree-lifecycle-domain
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-511-managed-worktree-lifecycle-backfill.md
    - docs/test-design/harness/L7-managed-worktree-lifecycle-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/425
github_issue_id: 425
backprop_decision: required
review_evidence: []
---

# PLAN-L7-511: managed worktree lifecycle orchestration

## 目的

Codex/Claudeのworker、review、snapshot、scratch worktreeを作成前のowner leaseから終了時の
cleanup handoffまで束縛し、AI session終了後に未所有worktreeが増え続ける構造を止める。

## 契約

1. managed createはrepository lineage、lifecycle ID、owner session、Issue、PLAN revision、用途、
   TTL、branch、HEAD、`C:\dev\`直下のcanonical pathが揃わなければGit mutation 0で拒否する。
2. lifecycle ledgerはGit common-dir配下のproject runtimeへ置き、全linked worktreeから同じ
   append-only hash chainを読む。worktree-local DBを正本にしない。
3. path lease予約、planned event、`git worktree add`、inventory照合、activateをsagaとして実行する。
   各段階の失敗はactivation-abort、lease release、cleanup handoffを記録し、無音孤児を残さない。
4. success/failure/cancel/timeout/parent-lossはterminal eventとcleanup handoffを同時に記録する。
   物理削除は#426が所有し、本PLANは推測削除を行わない。
5. direct/unmanagedなworktreeはinventory上でtyped `owner_unknown`として可視化し、managed workerの
   起動経路では直接`git worktree add`を許可しない。
6. Stop hookが届かないcrashは次のSessionStartまたは明示`worktree reconcile`で再生し、期限切れまたは
   parent-lossのplanned/activeをactivation-abort/terminal handoffへ移す。

## 設計と検証の対

| 境界 | oracle |
| --- | --- |
| 必須owner/Issue/PLAN/TTLと配置root | `CANDIDATE-U-WTMAN-001` |
| create sagaの全faultと補償event | `CANDIDATE-U-WTMAN-002` |
| ledger hash chain・競合・replay | `CANDIDATE-U-WTMAN-003` |
| terminalとcleanup handoffの原子的記録 | `CANDIDATE-U-WTMAN-004` |
| owner/status/Stop reconciliation | `CANDIDATE-U-WTMAN-005` |
| doctorのexpired/unmanaged投影 | `CANDIDATE-U-WTMAN-006` |
| 別worktreeから同じledgerを観測 | `CANDIDATE-P-WTMAN-001` |

## 非Scope

- 既存145本の物理回収、branch削除、quarantine apply（#426）。
- dirty/unpushed/unmerged worktreeの強制削除。
- lifecycle domain FSMの再実装。

## Schedule

1. [並列] application portとledger oracleをRed化する。
2. [直列] append-only repositoryとmanaged create/terminal sagaを実装する。
3. [直列] CLI/hook/agent入口へ結線し、unmanaged作成を検出する。
4. [並列] Windows/Linux、path escape、fault injection、replayを検証する。
5. [直列] Reverse R1-R4、CI、非著者closing reviewへ進む。

## 完了条件

- creatorごとの正常終了/cancel/timeout/crashでplanned/active孤児0。
- owner/Issue/PLAN/TTL欠落時はworktree作成0。
- terminal後に人間の再指示なしでcleanup handoffが残る。
- targeted test、TypeScript、Biome、PLAN lint、Linux/Windows/aggregate CIがGreen。
- exact HEADのClaude Opus 5 non-author closing receiptを得る。
