---
plan_id: PLAN-L7-436-execution-ledger-episode-domain
title: "PLAN-L7-436 (add-impl): Execution Episode集約・E0-E15 reducer・outbox基盤"
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
    slot_label: "SE - ExecutionEpisode aggregate、command、event reducer、repository実装"
  - role: qa
    slot_label: "QA - E0-E15違法遷移、transaction crash、replay決定性のRed oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-436-execution-ledger-episode-domain.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-436-execution-ledger-episode-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-437-github-issue-projection-inbound.md
  references:
    - docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-REVERSE-436-execution-ledger-episode-backfill.md
review_evidence: []
---

# PLAN-L7-436: Execution Episode集約・E0-E15 reducer・outbox基盤

## 1. 実装目的

L4-30/L5-23/L6-83で固定したForward escapeの制御背骨をTypeScript/Bunで実装する。GitHub adapterより先に、外部サービスなしでE0-E15の合法性、drive model必須化、append-only event、transactional outbox、replay決定性を自己証明する。

本sliceではGitHub APIをdomainへ埋め込まない。`ExecutionEpisode`がcommandを検証してeventを返し、repositoryがevent appendとoutbox enqueueを同一transactionで確定する。query reducerはevent列だけから現在stateと次の合法actionを再構築する。

## 2. 実装候補

### 2.1 domain object

- `ExecutionEpisodeId`、`RecurrenceId`、`CommandId`
- `OriginForwardRef(assetId, revisionId, layer, state)`
- `DriveModelSelection(model, rationaleDigest, overrideEvidence?)`
- `ReentryTarget(assetId, revisionId, layer, state, policyRevision)`
- `ExecutionCommand` / `ExecutionEvent`
- `ExecutionEpisode.decide(command)` と `reduceExecutionEpisode(events)`

constructorはparse/validation resultを返すfactory経由とし、空値、未知enum、技術driveとの混同、PLAN/route/branch不整合をstructured violationで拒否する。現在testが通る値へ暗黙補正しない。

### 2.2 repository / outbox

- event streamのoptimistic sequence check
- `(episode_id,event_sequence)`と`command_id`の一意制約
- event appendとGitHub intent outboxのatomic transaction
- canonical payloadとdigestから導くidempotency key
- projectionを消してeventから再構築するread model writer
- lease期限、retry schedule、ack observationを持つoutbox query/command分離

`repository.ts`はSQL rowをdomain objectへ変換するadapterとし、E-state遷移規則を複製しない。`outbox.ts`は送信意図を扱い、GitHub成功を推測してE4/E13へ進めない。

## 3. TDD Red oracle

`tests/execution-ledger-episode.test.ts`へ以下をRedで先置きし、実装前に対象failを確認する。

- `U-EXEP-001`: 通常Forward辺はepisodeを作らず、escape分類だけがE0を生成する。
- `U-EXEP-002`: drive model欠落・未知・技術drive・route不一致をE1前に拒否する。
- `U-EXEP-003`: E0→E15の合法隣接遷移をすべて受理する。
- `U-EXEP-004`: 全状態について飛越し、逆行、terminal後追加をmutationして拒否する。
- `U-EXEP-005`: 同じcommand/payloadの再送は同じevent identity、同じcommand/異payloadはviolationになる。
- `U-EXEP-006`: 順序正しいevent replayが同じstate/next action/digestを返す。
- `U-EXEP-007`: 欠番、重複sequence、payload digest改変、unknown eventをfail-closeする。
- `U-EXEP-008`: event appendとoutbox enqueueの各fault pointが全commitまたは全rollbackになる。
- `U-EXEP-009`: projection全削除/rebuild前後でstate、external intent、merge readinessが一致する。
- `U-EXEP-010`: rationaleなしoverride、stale origin revision、reentry target欠落を拒否する。
- `P-EXEP-001`: 任意の合法event列への重複/交換/削除mutationで不正昇格しない。

## 4. AC

- [ ] command/value object/aggregate/reducerが短い責務単位に分かれ、GitHub SDKへ依存しない。
- [ ] E0-E15の唯一の遷移表からcommand判定とreducerが導出され、別実装の二重真実を作らない。
- [ ] drive modelとorigin/reentry tupleの欠落・矛盾がstructured violationになる。
- [ ] event appendとoutbox enqueueが同一transactionで、fault injectionによりpartial commitが0である。
- [ ] command再送、event replay、projection rebuildが決定論的かつ冪等である。
- [ ] `U/P-EXEP-*`をRed→Greenにし、typecheck・targeted test・plan lintを通す。
- [ ] Reverse-436で実装発見gapだけをL5/L6/L7 test-designへbackfillし、独立review後にconfirmed化する。

## 5. 非スコープと接続

GitHub webhook/API処理はL7-437、reentry certificateはL6-84後続slice、PR/review/mergeはL6-85後続sliceが所有する。本sliceはそれらが同じepisode event streamへ接続できるportと不変条件を提供する。
