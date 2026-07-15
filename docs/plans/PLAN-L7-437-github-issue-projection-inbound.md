---
plan_id: PLAN-L7-437-github-issue-projection-inbound
title: "PLAN-L7-437 (add-impl): off-Forward GitHub Issue projection・inbox・reconciliation"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - GitHub port、Issue projector、inbox normalization/reconciliation実装"
  - role: qa
    slot_label: "QA - timeout、重複webhook、改変、外部孤児IssueのRed oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-437-github-issue-projection-inbound.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-437-github-issue-projection-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
    - docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    - docs/plans/PLAN-REVERSE-437-github-issue-projection-backfill.md
review_evidence: []
---

# PLAN-L7-437: off-Forward GitHub Issue projection・inbox・reconciliation

## 1. 実装目的

E3 `issue_outboxed`をGitHub Issueへ冪等投影し、webhook/polling観測をdurable inboxへ正規化してE4 `issue_projected`へ接続する。GitHub IssueはForward escapeの外部境界だが、Execution Ledgerを上書きするworkflow正本にはしない。

Issue作成、応答喪失、rate limit、外部編集、二重配送、削除、別repository投影をadapter境界で処理する。GitHub不通時もepisode/outboxを失わず、復旧時はremote queryを先行して重複Issueを作らない。

## 2. 実装候補

- `GitHubIssuePort`: create/find/update/readの最小interface。domain型をGitHub SDK型へ漏らさない。
- `GitHubIssueProjector`: canonical Issue DTO、idempotency marker、projection digestを生成する。
- `GitHubInbox`: provider event identity、delivery、object/head、payload digestを保存・dedupeする。
- `GitHubIssueReconciler`: Ledger intentとremote snapshotの一致、missing/duplicate/drift/orphanを判定する。
- outbox worker: lease、retry-after、指数backoff、circuit、manual resume、ack observationを扱う。

Issue bodyはorigin asset/revision/L/state、escape type/reason、drive model、reentry target、episode/PLAN identityをtyped sectionとして含む。checkboxや自由記述からdrive modelを推測せず、Ledger DTOからのみ生成する。外部編集は正本へ逆輸入せず、許可commandへparseできる変更だけを明示review後にevent化する。

## 3. inbound境界

webhookとpollingは同じnormalizerを通す。署名/installation/repository境界を検証できないevent、未知event、別repository、payload digest不一致は処理せずfinding化する。Issue close/reopen/label/body変更をForward FSM遷移として直接採用しない。

remote-only Issueはorphan finding、Ledger-only intentはpending/deferred、external ID重複はconflictとする。reconcileはread-only判定と修復command生成を分け、自動付替えや自動closeを行わない。

## 4. TDD Red oracle

`tests/github-issue-projection.test.ts`へ次をRedで先置きする。

- `U-GHISS-001`: E3 intentから完全なorigin/drive/reentry sectionを持つIssue DTOを生成する。
- `U-GHISS-002`: 必須sectionを1つずつ除くmutationとdigest改変を検出する。
- `U-GHISS-003`: 同一idempotency keyの再送、timeout後remote成功、worker再起動でもIssueは1件である。
- `U-GHISS-004`: 同じdelivery/provider eventの二重配送をinboxで1件に縮約する。
- `U-GHISS-005`: webhook順序逆転とpolling重複でE4 eventを重複appendしない。
- `U-GHISS-006`: 429/retry-after、5xx、circuit open、manual resumeでoutbox intentを失わない。
- `U-GHISS-007`: body改変、削除、duplicate、別repository bindingをtyped reconciliation findingにする。
- `U-GHISS-008`: Issue close/reopenだけではForward/reentry stateを変更しない。
- `U-GHISS-009`: invalid signature/installation/repository/unknown eventをfail-closeする。
- `U-GHISS-010`: inbox/projection rebuildだけではGitHub write portが0回である。

## 5. AC

- [ ] GitHub port、projector、inbox、reconciler、workerが分離され、domain遷移を複製しない。
- [ ] Issue bodyにorigin tuple、escape、drive model、reentry target、episode/PLAN identityが完全投影される。
- [ ] create応答喪失を含む全retryでremote照会を先行し、重複Issueが0である。
- [ ] webhook/pollingの重複・逆順が同じnormalized observationとevent結果になる。
- [ ] GitHub外部編集はLedger正本を暗黙変更せず、drift/findingとして可視化される。
- [ ] credentials、署名secret、raw provider transcriptをLedger/Issueへ保存しない。
- [ ] `U-GHISS-*`をRed→Greenにし、fake portとfault injectionでGitHub障害復旧を自己証明する。
- [ ] Reverse-437で実装発見gapだけをL5/L6/L7 test-designへbackfillする。

## 6. 非スコープ

reentry certificateと二段testはL6-84系列、draft PR/cross-review/mergeはL6-85系列が所有する。本sliceはIssue external identityとinbound observationを同じExecution Episodeへ安全に接続する。
