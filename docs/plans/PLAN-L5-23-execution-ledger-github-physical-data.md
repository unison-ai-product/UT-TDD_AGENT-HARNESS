---
plan_id: PLAN-L5-23-execution-ledger-github-physical-data
title: "PLAN-L5-23 (add-design/physical-data): Execution Ledger・GitHub
  projection・再合流証跡の物理設計"
kind: add-design
layer: L5
drive: db
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-21
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: TL - append-only正本、projection再構築、retention境界
  - role: se
    slot_label: SE - table/FK/UNIQUE/outbox/inbox/idempotency transaction設計
  - role: qa
    slot_label: QA - crash recovery、duplicate delivery、rebuild、stale evidenceのL8 oracle
generates:
  - artifact_path: docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
  requires:
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L6-50-execution-assignment-ledger.md
  blocks: []
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/process/plan-asset-v2.md
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: 2026-07-21T18:24:00+09:00
    tests_green_at: 2026-07-21T18:23:35+09:00
    verdict: approve
    scope: claim-blind / spec-blind 両レーン PASS。L8 pair oracle (IT-EXEP/IT-GHISS)
      実在、冪等 key 階層と transaction 境界の内部整合を確認。詳細は A-189。
    worker_model: codex-gpt-5
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: lint
        command: bun src/cli.ts plan lint
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-07-21T18:23:35+09:00
        evidence_path: .ut-tdd/audit/A-L7-420-execution-ledger-plan-lint-2026-07-28.log
        output_digest: sha256:bfb6d2cbe5ad2c112261bcd98c176c37f3697459b6be31b139146a1ea2f7a719
        anchor_commit: 33dbd46dfe7581428a1bc09ac1a8f7875f0782c0
status: confirmed
sub_doc: physical-data
github_issue_id: 213
admission_receipt:
  schema_version: v2
  receipt_id: certificate:ea33e36eaf38c2331c6d62c7331080a4
  command_id: command:pr210-schema-reconcile:1785500248403
  admitted_at: 2026-07-31T12:17:28.403Z
  source_digest: sha256:d133956efc4af9726e50eb13a30a431af5cee0f0859eeaa0d00bc53a1777ce49
  decision_digest: sha256:4462c11ef8f4fd999e05d0312516d197d31ee1520ad85e70e389e14502f8573e
  receipt_digest: sha256:5aba110cb258ad350d7474ac223a17f25884918d4a7014fbe8e18d91d38e8a25
  binding:
    path: docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
    plan_id: PLAN-L5-23-execution-ledger-github-physical-data
    asset_id: plan:legacy:f2525adb50df140055a950653d54731a769ce2cf4e2e5287d1edcce0ed9bbe37
    revision: 3
    content_digest: sha256:d133956efc4af9726e50eb13a30a431af5cee0f0859eeaa0d00bc53a1777ce49
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 213
    episode_id: E4-213
    projection_digest: sha256:bc53329c5463b7eb8e9e9f65a6b57824e7207ff8fe6160f4c8ba066c7343bd97
  origin:
    plan_id: PLAN-L5-23-execution-ledger-github-physical-data
    revision: 2
    digest: sha256:f8c6cfbc155fcdf7413c81d2780e9e3ce28fba3c17d8c2346864b2ddad09bc54
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L5-23-execution-ledger-github-physical-data
    target_revision: 3
    phase: forward_merge
  escape_reason: "PR #210 cross-reviewで検出したForward基盤表とExecution Episode目標表のschema名衝突を解消する"
---

# PLAN-L5-23: Execution Ledger・GitHub projection・再合流証跡の物理設計

## 0. 目的と正本境界

PLAN-L4-30のE0-E15 lifecycleを、SQLite transaction、append-only event、transactional outbox、deduplicating inbox、再構築可能projectionへ降下する。Execution Ledgerのevent列が制御正本であり、GitHub Issue/PR/check/review/mergeとそのキャッシュはprojectionである。GitHubからの観測でauthoritative eventを上書きせず、受理可能な観測だけをdomain commandへ変換して新しいeventをappendする。

## 1. 物理テーブル

### 1.1 正本テーブル

- `execution_episodes`: `episode_id` PK、`recurrence_id`、origin PLAN Asset/revision/L/state、escape type/reason、assumption/decision、必須drive model、reentry target/policy revision、created/closed timestamp。
- `execution_episode_events`: `(episode_id, event_sequence)`複合PK、`event_id` UNIQUE、E0-E15 event kind、payload、payload digest、source commit/head、policy revision、actor/runtime/model、occurred_at。既存eventのUPDATE/DELETEは禁止。
- `drive_model_selections`: episodeごとのselection revision、model、適合結果、根拠digest、override有無・actor・reason・evidence。active revisionは一意。
- `reentry_certificates`: certificate ID、episode、origin/reentry revision/state、drive verification evidence、intermediate-test policy、source/head SHA、digest、issued/consumed/revoked event sequence。
- `execution_evidence_refs`: episode/eventとtest run、CI run、review、artifact、digestを結ぶ。evidence種別間の代用は禁止。

### 1.2 配送テーブル

- `execution_github_projection_outbox`: outbox ID、episode、operation kind、target logical key、idempotency key、canonical payload/digest、attempt count、next attempt、lease、ack observation ID。
- `github_inbound_events`: provider event identity PK、delivery ID、repository、event kind、external object ID、head SHA、received timestamp、raw payload digest、normalized payload、processing result。
- `execution_github_object_bindings`: `(episode_id, object_kind)` UNIQUE、external ID/number/URL、repository、last reconciled head、projection revision。

Issue、branch、PRのcreate operationは`(repository, episode_id, object_kind, intent_revision)`を冪等keyとし、HTTP timeout後も同一keyでreconcileしてから再送する。webhook delivery IDだけに依存せず、provider event identityとobject/head identityで重複を吸収する。

### 1.3 projectionと学習テーブル

- `execution_episode_projection`: reducerが算出したcurrent E-state、block reason、next legal action、latest head、merge readiness。
- `github_projection`: Issue/branch/PR/check/review/mergeの最終観測。外部状態を正本化しない。
- `forward_escape_observations`: layer、escape type、cause、drive model、recurrence、PoC S4 decision、reentry/route/merge outcome。
- `forward_escape_rollups`: policy revisionと集計window単位の再構築projection。生eventを捨ててrollupだけを正本にしない。

## 2. 制約とtransaction境界

1. `execution_episodes.drive_model`、origin asset/revision/L/state、escape/reentry項目はNOT NULLとする。
2. drive model、escape type、E-stateはschema/catalog参照またはCHECKで未知値を拒否する。
3. `(episode_id,event_sequence)`は連続し、同一command IDから生成できるauthoritative eventは最大1件とする。
4. domain event appendとoutbox enqueueを同一transactionでcommitする。
5. inbox insert、normalization、処理結果記録をcrash-safeに分け、未完処理をlease timeout後に再開できるようにする。
6. E9 certificate consume、E10 event append、projection更新意図を同一transactionに置き、二重再合流を防ぐ。
7. merge ready判定はprojection cacheを鵜呑みにせず、certificate、CI、review、head SHAのauthoritative refsを同一snapshotで再評価する。
8. external bindingの付替えは履歴eventを要求し、URL/numberの直接上書きを禁止する。

schema registryがFK、複合UNIQUE、CHECK、partial index、append-only triggerを表現できない場合はregistry/migration機構を先に拡張し、application validationだけで代替しない。

## 3. index・lease・再試行

- episode lookup: origin asset/revision、current state、recurrence ID、drive model。
- outbox dispatch: status/next attempt/lease expiry、idempotency key UNIQUE。
- inbox dedupe: provider event identity、delivery ID、external object/head。
- merge gate: episode、certificate validity、head SHA、required profile、review verdict。
- telemetry: layer/escape/cause/drive/recurrence/outcome。

retryは指数backoffと上限を持つが、上限到達でepisodeを消さない。dead-letter相当は新しいblocked eventと運用actionを生成する。worker crash後はleaseを回収し、送信済み未ackの場合は外部照会を先に行う。

## 4. rebuild・retention・監査

- `execution_episode_events`、drive selection、certificate、evidence refs、outbox/inbox raw digestは監査期間中append-onlyで保持する。
- episode/github/rollup projectionは削除してeventとinboxから再構築できる。
- rebuildは外部副作用を発生させない。outbox replayは明示したdispatch phaseだけで行う。
- payloadにsecret/PIIを保存せず、必要な外部本文はredacted canonical formとcontent digestを保持する。
- schema migrationは旧eventを意味変換せず、upcaster versionと変換digestを記録する。

## 5. L8受入条件

- E0-E15のevent列からprojectionを再構築し、削除前とcurrent state、next action、merge readinessが一致する。
- event appendとoutbox enqueueの各crash pointで、eventだけ/outboxだけが残るpartial commitを起こさない。
- Issue/PR createのtimeout、429、5xx、worker crashを反復してもexternal objectが1件だけ生成される。
- webhook二重配送、順序逆転、pollingとの重複でevent sequenceとprojectionが増殖しない。
- `drive_model`欠落、未知値、矛盾、根拠なしoverrideをDB制約とdomain validationの双方で拒否する。
- 別episode・別PLAN revision・別headのcertificate/evidenceをFK・policyの双方で拒否する。
- certificateの二重consume、E8未完のE9、E9未完のE10、E11未完のE12、stale review/CIによるE14を拒否する。
- GitHubが利用不能でもepisode/outboxを保持し、復旧後reconcileでE4/E12へ一度だけ進む。
- raw episodeからlayer/type/cause/drive/recurrence/outcome rollupを再生成し、同一recurrenceを二重計上しない。
- rebuild処理だけではGitHub writeが一度も呼ばれないことをspyで証明する。

## 6. 後続降下

L6でExecution Episode domain、drive selection、reentry/merge policy、GitHub port/outbox/inbox contractを分割する。L7でmigration、repository、worker、CLI、GitHub adapterを実装し、L8 integration test designと対でfreezeする。

## 7. Forward readiness / Project item projection（Reverse backfill 2026-07-31）

新しい依存グラフ正本は作らない。既存の`plan_registry`、`schedule_entries`、
`graph_nodes`、`dependency_edges`、`review_evidence_registry`を再利用し、次の再構築可能な
projectionを追加する。

- `execution_readiness_projection`: `plan_id`、`plan_revision`、`readiness`、
  `current_gate`、`implementation_order`、`blocked_reason`、`unlock_condition`、
  `next_plan_ids`、`unlocked_plan_ids`、`computed_at`
- `github_project_item_projection`: `repository_id`、`project_id`、`project_item_id`、
  `plan_id`、`plan_revision`、`content_node_id`、`head_sha`、`sync_status`、
  `last_reconciled_at`

`schedule_entries.plan_revision`は対応PLANの`admission_receipt.binding.revision`を保持し、
`source_hash`は文書内容fingerprintとして分離する。schedule authoring sourceを優先する場合も
対応PLANからrevisionを解決し、receiptを持たないlegacy PLANだけsource hashへfallbackする。

`github_object_bindings.object_kind`は`project`、`project_item`、`branch`、`issue`、
`pull_request`、`check_run`、`review`、`merge`を表現できること。provider object identityの
異PLAN再割当を拒否し、同一PLANの正式revision更新は同じidentityへ収束させる。stale観測は
`observed_at`を後退させずno-opにする。

`github_review_lane_receipts`は`plan_id + plan_revision + lane + subject_head`を一意にし、
`claim-blind`と`spec-blind`を別rowで保持する。各rowはverdict、review/test時刻、
worker/reviewer model、attack trial数、citation、PLAN sourceを持つ。DB rowだけでなくcanonical
`docs/plans/*.md` frontmatterと再照合し、両laneの結合digestがPR traceと一致しなければ
merge closureをfail-closeする。digestは改変検知であり、真正性はprovider identity、exact HEAD、
canonical PLAN sourceの結合から得る。

Project V2はfield名・single-select option・duplicate itemをremote mutation前に全件検証する。
remote観測もSQLite transaction開始前に完了し、確定したbinding commandだけを単一transactionで
commitする。transaction内からnetwork/APIを呼び出してはならない。

現行の`github_object_bindings` / `github_projection_outbox`はPLAN revisionを主語にしたForward基盤であり、
episode未確定の段階でepisode IDを創作しない。Execution Episode降下時は
`execution_github_object_bindings` / `execution_github_projection_outbox`へ明示変換し、同名表を
非互換schemaで上書きしない。現行outbox payloadは`project-item-upsert`の
`owner,projectNumber,readiness,currentGate,headSha`だけをcanonical JSONで保存し、SHA-256 digestを併記する。
