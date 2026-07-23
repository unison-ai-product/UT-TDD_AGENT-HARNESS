---
plan_id: PLAN-L7-452-forward-escape-contract-red
title: "PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green — forward escape 判定関数群"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-23
owner: PO / Claude (起票・実装)
parent_design: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 契約判定、SQLite custody、GitHub Issue create/adopt/reconcile portの実装"
  - role: qa
    slot_label: "QA - U-EXISSUE-001..018 / ADOPT-001..008 のRed→Greenと採番・資産trace"
generates:
  - artifact_path: docs/plans/PLAN-L7-452-forward-escape-contract-red.md
    artifact_type: markdown_doc
  - artifact_path: src/execution/forward-escape.ts
    artifact_type: source_module
  - artifact_path: src/execution/sqlite-forward-escape-journal.ts
    artifact_type: source_module
  - artifact_path: tests/forward-escape-issue-contract.test.ts
    artifact_type: test_code
  - artifact_path: tests/forward-escape-issue-adoption-contract.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-452-forward-escape-contract-backfill.md
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/plans/PLAN-L7-436-execution-ledger-episode-domain.md
    - src/github/node-gh-forward-escape-issue-port.ts
    - tests/node-gh-forward-escape-issue-port.test.ts
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: 2026-07-23T10:58:00+09:00
    tests_green_at: 2026-07-23T10:58:00+09:00
    verdict: technical_pass_gate_followup
    scope: "PR #117 HEAD f6bb0660のclaim-blind/spec-blind review。Node worker、SQLite排他、
      single provider call、37 testsをClaudeが独立再現し技術面PASS。総合FLAGは本PLANと
      PLAN-RECOVERY-16がdraftのためmerged-plan-statusがRedというconfirm bootstrap条件、
      および当時未達だったRECOVERY-16 DoD #8であり、本PLAN実装の未反駁attackではない。"
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "Claude independent Node rerun: forward escape/adoption/GitHub port"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-23T10:58:00+09:00
        evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/117#issuecomment-5053669909"
        output_digest: sha256:cc736b37f31e65f8
        anchor_commit: f6bb0660e38ad5c5b60a78c97fdc615f80fef18d
  - reviewer: codex-intra-runtime-subagent-exact-delta
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-07-23T14:47:10+09:00
    tests_green_at: 2026-07-23T14:46:56+09:00
    verdict: approve
    scope: "implementation HEAD 015659193539668592546d2d5674c8e235cd564aの差分review。
      U-EXISSUE-007..018とU-EXISSUE-ADOPT-001..008を全ID実走し、stale replay、
      SQLite同時実行、POST後remote再観測、drive交差変異を攻撃。44 tests Green、
      unrefuted attack 0。CI Green後のClaudeCode最終PR再reviewをmerge条件として残す。"
    green_commands:
      - kind: unit_test
        command: "npx vitest run tests/forward-escape-issue-contract.test.ts tests/forward-escape-issue-adoption-contract.test.ts tests/node-gh-forward-escape-issue-port.test.ts --reporter=dot"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-23T14:46:56+09:00
        evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/130#issuecomment-5054924515"
        output_digest: sha256:cc736b37f31e65f852fcb3772440619b063362824d49e7c447390cb15b34cfa4
        anchor_commit: 015659193539668592546d2d5674c8e235cd564a
---

# PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green

## Status

confirmed (2026-07-23)。Claudeの先行cross-provider reviewで実装中核を技術PASS、
exact implementation HEAD `015659193539668592546d2d5674c8e235cd564a` の独立delta reviewで
`U-EXISSUE-007..018` / `U-EXISSUE-ADOPT-001..008`を44 tests Greenとして再実測した。
CI Green後のClaudeCode最終PR再reviewはmerge条件として残す。

## 背景とスコープ

PLAN-L6-83 (Forward外遷移Issue・駆動モデル選択契約) の AC 入口は
「`U-EXISSUE-*` Red → 独立 review → L7-436 実装 → Reverse backfill」。本 PLAN は
その最初の2段から拡張した縦sliceとして、基礎6 oracleに加えcustody/projection/adoptionを含む
`U-EXISSUE-001..018` / `U-EXISSUE-ADOPT-001..008`をRed固定し、§4の判定関数
(`classifyForwardBoundary` / `validateForwardEscape` / `checkDriveModelAlignment` /
`renderForwardEscapeIssueBody` / `projectForwardEscapeIssue` / `adoptForwardEscapeIssue` /
`reconcileIssueProjection`) を GitHub SDK 非依存の純粋関数 + port として Green 化する。
`src/github/node-gh-forward-escape-issue-port.ts` と対応testの生成所有者は
PLAN-RECOVERY-16であり、本PLANはその既存資産を参照して契約oracleと変更traceを保持する。

- Redesign を含む12駆動モデルを閉じた enum で固定 (技術 drive とは別 value object、混入 fail-close)。
- Redesign は `design_to_implementation` + `discarded|none` + `supersedes` 一件 + 後続実装 target、
  Reverse は `implementation_to_design` + 実装保持として交差変異をfail-closeする。
- 冪等 payload digest による command 再送/改変再利用の判別。
- GitHub 障害時は `IssueProjectionDeferred` (event 非損失・throw なし)。
- cross-review FLAG追補として、Ledger実在revision/state lookup、opaque E2 custody、SQLite durable projection
  journal、digest-chain replay照合、remote-success crash window、GitHub成功binding全拘束、canonical drive
  enum照合、空projection拒否、SQLite改変検出を `U-EXISSUE-007..014` で固定する。再レビューで検出した
  custody storage例外のstructured violation化と、同一commandを複数SQLite workerが同時処理しても
  certificate / queued receiptを1件へ収束させる原子create-or-getを`U-EXISSUE-015..016`で固定する。
  projection canonical境界とprovider→E4のprocess競合を、重複しない`U-EXISSUE-017..018`で固定する。
- reconcile は削除/改変/重複/別 repository を finding 化 (Ledger 書換なし)。
- 既存Issue採用は本文不変、番号GET preimage完全一致、canonical metadata comment、独立adoption FSM、
  SQLite restart/replay、trusted repository identity、E4 evidence resolverまでを同じ縦sliceで固定する。

## 非スコープ

- E0-E15 episode 集約・repository/outbox の永続化 (PLAN-L7-436)。
- webhook/polling inbox (PLAN-L7-437)。GitHub CLI adapterのIssue GET/comment create-or-getは本sliceに含む。
- L6-83 の confirm (L7-436 実装 + Reverse backfill 後、L6-83 自身の AC で閉じる)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | U-EXISSUE-001..018 / ADOPT-001..008を重複なしでL7 test designへRed固定 | 直列 |
| 2 | 本PLAN所有の純粋契約・SQLite custodyをGreen化し、PLAN-RECOVERY-16所有のGitHub create/adopt/reconcile portを参照して契約oracleをGreen化 | 並列後合流 |
| 3 | snapshot runner実測、typecheck/lint、exact-head blind review | 直列 |
| 4 | review evidenceとDoDを実証範囲だけ閉じ、confirmed判定 | 直列 |

## DoD

- [x] U-EXISSUE-007..018をsnapshot runnerで実測し、別runtimeのcross-reviewとexact-head delta reviewでFLAG根拠を解消する。
- [x] U-EXISSUE-ADOPT-001..008をsnapshot runnerで実測し、別runtimeのcross-reviewとexact-head delta reviewでFLAG根拠を解消する。

2026-07-23 exact-head evidence: `U-EXISSUE-ADOPT-006` は改変markerとcanonical comment重複を
別caseとして固定し、Node/Vitestでforward escape、adoption、GitHub portの3 files / 44 tests
Greenを確認した。Bunは起動せず、実装anchorとcommand/output digestをreview_evidenceへ固定した。

- [x] U-EXISSUE-001..006 が Red (module 不在 fail の snapshot 実測) から Green へ遷移した。
      根拠: commit 履歴 (test-only commit で snapshot FAIL 実測 / 実装 commit 後
      6 tests pass) と `tests/forward-escape-issue-contract.test.ts`。
- [x] 判定関数が throw / 推測補完をせず structured violation を返す (fail-close)。
      根拠: U-EXISSUE-002/003/004 (空 origin_layer 負例含む)。
- [x] GitHub 障害時に event を失わず冪等再開する。根拠: U-EXISSUE-005。
- [x] PLAN-REVERSE-452 R0-R4 の完了は本 slice では claim しない。`status: draft` /
      `workflow_phase: R0` の REVERSE-452 が R2 で L6-83 §2-§5 との語彙差分と blind review
      軽微所見 2 件を gap-only 照合する (R2 照合前に backfill 完了とは扱わない)。
