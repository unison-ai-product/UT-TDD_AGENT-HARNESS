---
plan_id: PLAN-REVERSE-855-codex-worker-sandbox-backfill
title: "PLAN-REVERSE-855-codex-worker-sandbox-backfill: Codex worker の限定書込み権限を設計へ戻す提案"
kind: reverse
layer: cross
confirmed_reverse_type: code
drive: agent
route_signal: reverse
route_mode: reverse
created: 2026-10-06
updated: 2026-10-06
owner: Codex TL（起票案）
forward_routing: gap-only
promotion_strategy: reuse-as-is
review_evidence: []
agent_slots:
  - role: tl
    slot_label: R0–R4 の実測・設計戻し・再合流を確認する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-855-codex-worker-sandbox-backfill.md
    artifact_type: markdown_doc
pair_artifact: docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
dependencies:
  parent: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
  requires: []
  references:
    - docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
    - docs/design/harness/L4-basic-design/function.md
workflow_phase: R0
status: draft
github_issue_id: 676
admission_receipt:
  schema_version: v2
  receipt_id: certificate:a7520748afd73be8dbc05d756b0d5689
  command_id: plan-revise:issue676:pr855-reverse-flag3-correction:20261006
  admitted_at: 2026-10-06T07:07:22.698Z
  source_digest: sha256:1aec49759a92c3ee1f5e14eb66f81a2063bd491bbc0b6cf43c8346b91405d4ce
  decision_digest: sha256:2b36771053ae48ade8573d48309384308bba2ad0b28d7381bdafe8d5a4b30f90
  receipt_digest: sha256:379675a0b86b5a1869310c042910042ad62ad60f03e292601372189d99c7ef87
  binding:
    path: docs/plans/PLAN-REVERSE-855-codex-worker-sandbox-backfill.md
    plan_id: PLAN-REVERSE-855-codex-worker-sandbox-backfill
    asset_id: plan:2899913ad54e00d875510805f827f3d3
    revision: 2
    content_digest: sha256:1aec49759a92c3ee1f5e14eb66f81a2063bd491bbc0b6cf43c8346b91405d4ce
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 676
    episode_id: reverse-676-worker-sandbox-backfill-reissue-855-20261006
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-676-release-consumer-dev-start
    revision: 24
    digest: sha256:aad8875239a4b5ea94d844a89553421ca77be2b5fe04bf6d0d933f299fbf1734
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-855-codex-worker-sandbox-contract
    target_revision: 2
    phase: forward_merge
  escape_reason: Opus FLAG3とcontrol6011015340に従いdirect
    adapterの新規spawn拒否を撤回し、writer6roleの限定grantだけを規定する。既存delegation/caller/Claudeは維持する。
---
# PLAN-REVERSE-855-codex-worker-sandbox-backfill (Reverse / proposal)

## §0 位置づけ

Issue #676 の承認に基づき、Codex worker 6 role に限る `workspace-write` 権限を既存 provider function design へ back-fill する提案である。既存 provider dispatch と通常 delegation allowlist refusal は維持する。旧 confirmed revision の誤りを主張せず、新しい L6 設計文書は作らない。

## §1 R0–R4 (候補・未受入)

| phase | work | result / status |
|---|---|---|
| R0 evidence | 現行 adapter、runtime role policy、通常 delegation、既存 L7-68 と関連 test を source inspection する。 | source inspection のみ。provider/test は未実行。 |
| R1 observed contract | Issue #676 の承認は writer 6 role に限定した workspace-write 付与である。他 role の既存 invocation と通常 delegation refusal は既存契約のまま扱う。 | 承認との照合。OS/provider sandbox 実効性は未検証。 |
| R2 delta | adapter の限定 write-role allowlist と既存 runtime role policy からの単一 export が未成立。 | contract gap。unknown role の direct-adapter spawn refusal は gap ではない。 |
| R3 intent | `se`、`docs`、`be-api`、`be-logic`、`db-schema`、`devops-deploy` の6 roleだけに `--sandbox workspace-write` を一組付与する。その他の role (advisor、reviewer/gate、管理・調査、`aim`、unknown worker を含む) は既存 invocation を維持し、新規 grant/refusal を加えない。 | candidate contract。 |
| R4 routing | 既存 provider function design に最小差分を戻し、PLAN-L7-855 と専用 L7 test-design pair を参照する。runtime から team routing への import、team routing 変更、新 module、第二 role registry は追加しない。 | 将来の設計・pair review待ち。未freeze。 |

## §2 candidate oracle 対応 (すべて未実装・未達)

専用 L7 test-design に定める4 oracleを対象とする: (1) writer 6 roleへ workspace-write をちょうど一組付与、(2) representative non-writer の既存 invocation 維持とgrant不在、(3) Claude invocation 不変、(4) 通常 delegation refusal と frontier/release-consumer 回帰不在。直接 adapter に渡された unknown role は既存 invocation を維持し、provider spawn 前の新規拒否は行わない。

候補表や source inspection を実装・test Green・provider実測の代替にしない。受入は未達。

## §3 範囲外

SessionStart、provider/OS-level sandbox 実効性、全 role 一律 grant、verdict custody 変更、PLAN-L7-160 の behavior-invariant extraction は範囲外。Linux provider の再測定は別途 control が指定する。
