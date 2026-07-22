---
plan_id: PLAN-L7-452-forward-escape-contract-red
title: "PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green — forward escape 判定関数群"
kind: add-impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-22
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
---

# PLAN-L7-452 (add-impl): PLAN-L6-83 契約の U-EXISSUE Red→Green

## Status

draft (2026-07-22 cross-review FLAG修正後の再検証待ち)。旧slice evidenceとReverse pairingは保持するが、
`U-EXISSUE-007..018` / `U-EXISSUE-ADOPT-001..008` のsnapshot実測・再review前にconfirmedへ戻さない。

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

- 11 駆動モデルを閉じた enum で固定 (技術 drive とは別 value object、混入 fail-close)。
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

- [ ] U-EXISSUE-007..018をsnapshot runnerで実測し、別runtimeのcross-reviewでFLAG解消を確認する。
- [ ] U-EXISSUE-ADOPT-001..008をsnapshot runnerで実測し、別runtimeのcross-reviewでFLAG解消を確認する。

2026-07-22 targeted evidence: `U-EXISSUE-ADOPT-006` は改変markerとcanonical comment重複を
別caseとして固定し、`bun test tests/node-gh-forward-escape-issue-port.test.ts
tests/forward-escape-issue-adoption-contract.test.ts` で18 tests Greenを確認した。これはtargeted
unit evidenceであり、未実施のsnapshot runner実測またはcross-review完了を代替しない。

- [x] U-EXISSUE-001..006 が Red (module 不在 fail の snapshot 実測) から Green へ遷移した。
      根拠: commit 履歴 (test-only commit で snapshot FAIL 実測 / 実装 commit 後
      6 tests pass) と `tests/forward-escape-issue-contract.test.ts`。
- [x] 判定関数が throw / 推測補完をせず structured violation を返す (fail-close)。
      根拠: U-EXISSUE-002/003/004 (空 origin_layer 負例含む)。
- [x] GitHub 障害時に event を失わず冪等再開する。根拠: U-EXISSUE-005。
- [x] PLAN-REVERSE-452 R0-R4 の完了は本 slice では claim しない。`status: draft` /
      `workflow_phase: R0` の REVERSE-452 が R2 で L6-83 §2-§5 との語彙差分と blind review
      軽微所見 2 件を gap-only 照合する (R2 照合前に backfill 完了とは扱わない)。
