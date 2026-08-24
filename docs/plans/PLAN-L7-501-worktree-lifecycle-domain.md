---
plan_id: PLAN-L7-501-worktree-lifecycle-domain
title: "PLAN-L7-501 (add-impl): worktree lifecycle domain FSM"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-24
updated: 2026-08-24
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - worktree lifecycle immutable domain/reducer"
  - role: qa
    slot_label: "QA - U-WTLIFE-001/002/006/010 mutation oracle"
  - role: tl
    slot_label: "TL - non-author lifecycle transition review"
generates:
  - artifact_path: docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/worktree-lifecycle/domain/errors.ts
    artifact_type: source_module
  - artifact_path: src/runtime/worktree-lifecycle/domain/index.ts
    artifact_type: source_module
  - artifact_path: src/runtime/worktree-lifecycle/domain/reducer.ts
    artifact_type: source_module
  - artifact_path: src/runtime/worktree-lifecycle/domain/store.ts
    artifact_type: source_module
  - artifact_path: src/runtime/worktree-lifecycle/domain/types.ts
    artifact_type: source_module
  - artifact_path: tests/worktree-lifecycle-domain.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L9-system-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-REVERSE-501-worktree-lifecycle-domain-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/384
github_issue_id: 384
backprop_decision: required
review_evidence:
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-24T20:40:00+09:00"
    tests_green_at: "2026-08-24T20:28:00+09:00"
    verdict: "approve; blocking 0; Claude non-author closing review pending"
    scope: >-
      Luna実装を親Codexが差分検収し、複合identity、単調revision、sealed activation-abortと
      path-lease release、authenticated parent-lossだけのterminal欠落、late receipt再評価、
      terminal digest差替え拒否を確認した。返却recordと保存recordが別objectになるRedを検出して
      appendを唯一のreducer適用点へ修正後、exact ba0fac98 detached target 6/6 Green、
      181f88c2でPLAN artifact/impl/deliverable trace Greenを確認した。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.5
    plan_revision: 181f88c2d6fc8db917afd98489485e1a429865cf
    subject_head: 181f88c2d6fc8db917afd98489485e1a429865cf
    evidence_path: tests/worktree-lifecycle-domain.test.ts
    anchor_commit: 181f88c2d6fc8db917afd98489485e1a429865cf
    citations:
      - "src/runtime/worktree-lifecycle/domain/store.ts"
      - "src/runtime/worktree-lifecycle/domain/reducer.ts"
      - "tests/worktree-lifecycle-domain.test.ts: U-WTLIFE-001/002/006/010"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/worktree-lifecycle-domain.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-24T20:28:00+09:00"
        evidence_path: tests/worktree-lifecycle-domain.test.ts
        output_digest: "sha256:81e9cdf2801d0a05a343f2f679b83405d65e2783bf7be84e90f1eed2166128bc"
        anchor_commit: 181f88c2d6fc8db917afd98489485e1a429865cf
---

# PLAN-L7-501: worktree lifecycle domain FSM

## 1. 目的と境界

Issue #384 の最初の実装 slice として、worktree lifecycle の authoring source である
immutable record、append-only event、in-memory reducer を実装する。DB、CLI、FS、Git、
process stop、cleanup、topology adapter は本 PLAN の後続 slice とし、ここへ持ち込まない。

## 2. 固定する契約

- 起動前に必須 identity を持つ `planned` record を revision 1 で原子的に登録する。
- `planned -> active` は同一 attempt の start receipt、inventory available、authenticated owner
  が揃った場合だけ許可する。欠落は `activation_unresolved` で fail-close する。
- activation abort は `planned -> terminal_pending` の sealed domain event として記録する。
- `active -> terminal_pending` は terminal input または owner loss を受け、receipt 欠落を
  `terminal_missing` として保持する。
- `terminal_pending -> retained | retired` と `retained -> terminal_pending`（後着 receipt 再評価）を
  reducer の許可遷移として固定する。inventory 欠測は `inventory_unavailable` で拒否する。
- revision は event ごとに単調増加し、attempt/identity不一致・不正遷移・replay conflict は例外で
  fail-close する。状態を直接上書きしない。

## 3. 正規 oracle と成果物

`CANDIDATE-U-WTLIFE-001/002/006/010` をそれぞれ `U-WTLIFE-001/002/006/010` へ昇格し、
`tests/worktree-lifecycle-domain.test.ts` から実装契約を検証する。candidate 表記は設計参照へ
残し、実装 Green の証拠には使わない。

## 4. 後続境界

この slice の後に、#232 read-only inventory、#124 terminal receipt、retention policy、
status/doctor/Memory projection、dry-run/apply、filesystem cleanupを別の原子的 PR へ降ろす。
本 slice は物理 worktree を作成・削除せず、既存 worktree の回収も行わない。

## 5. 受入条件

- targeted test、TypeScript、Biome、plan lint が Green。
- 正規 U oracle と設計表の 1:1 trace がある。
- event log と reducer の revision monotonicity、不正遷移 fail-close、immutable snapshot が
  テストで確認される。
- exact HEAD の非著者レビューを取得するまで merge-ready と宣言しない。
