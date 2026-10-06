---
plan_id: PLAN-L7-855-codex-worker-sandbox-contract
title: "PLAN-L7-855-codex-worker-sandbox-contract: Codex worker の限定書込み権限"
kind: troubleshoot
layer: L7
drive: agent
created: 2026-10-06
updated: 2026-10-06
backprop_decision: required
backprop_decision_reason: 新しいworkspace-write能力を既存provider function designへReverse pairで戻す。
owner: Codex TL
review_evidence: []
agent_slots:
  - role: tl
    slot_label: bounded worker capability contract
  - role: aim
    slot_label: scope/non-goal境界
generates:
  - artifact_path: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  requires:
    - docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  references:
    - docs/plans/PLAN-REVERSE-855-codex-worker-sandbox-backfill.md
    - docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
    - docs/design/harness/L4-basic-design/function.md
pair_artifact: docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
route_signal: incident
route_mode: incident
status: draft
github_issue_id: 676
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f8d3a52ead9214d5864e7ff3ffa4613b
  command_id: plan-revise:issue676:pr855-contract-flag3-correction:20261006:rechain-1
  admitted_at: 2026-10-06T07:06:24.090Z
  source_digest: sha256:5cfe7610112e3a2eef6e2599c34279d982d680d00216d1c07957cad4cd2c37e3
  decision_digest: sha256:25c81da59e2295969152a14e53e35c145469333b7824e01f37ac03a604bd6ab8
  receipt_digest: sha256:4edb92311d81a1c078e84e48ad180caa96765d51232444b7bbe93321228594f1
  binding:
    path: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
    plan_id: PLAN-L7-855-codex-worker-sandbox-contract
    asset_id: plan:63b8377746b1e03160a41a993436c898
    revision: 2
    content_digest: sha256:5cfe7610112e3a2eef6e2599c34279d982d680d00216d1c07957cad4cd2c37e3
  route:
    signal: incident
    mode: incident
  issue:
    provider: github
    issue_id: 676
    episode_id: incident-676-codex-worker-sandbox-contract-855-20261006
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-676-release-consumer-dev-start
    revision: 24
    digest: sha256:aad8875239a4b5ea94d844a89553421ca77be2b5fe04bf6d0d933f299fbf1734
  reentry:
    target_plan_id: PLAN-L7-676-release-consumer-dev-start
    target_revision: 24
    phase: forward_merge
  escape_reason: Opus FLAG3とcontrol6011015340に従いdirect
    adapterの新規spawn拒否を撤回し、writer6roleの限定grantだけを規定する。既存delegation/caller/Claudeは維持する。
---
# PLAN-L7-855-codex-worker-sandbox-contract: Codex worker sandbox contract

## 0. 目的

Issue #676 の承認に基づき、Codex 成果物 worker 6 role に限定して `workspace-write` を付与する契約を追加する。既存 provider dispatch と既存の通常 delegation allowlist refusal は維持する。

## 1. 対象範囲

- `se`、`docs`、`be-api`、`be-logic`、`db-schema`、`devops-deploy` の6 roleだけに `--sandbox workspace-write` を1組付与する。
- advisor、判断 gate、管理・調査 role、`aim`、その他の既知 role、および unknown role は対象外であり、既存の invocation を維持して新たな workspace-write を付与しない。unknown role を理由とする直接 adapter invocation の新規拒否は加えない。
- 正規 delegation の既存 allowlist refusal は変更しない。これは direct adapter の新規拒否契約ではない。
- 既存 runtime 層に write-role allowlist の単一 export constant を置き、adapter が利用する。runtime から team routing への import、team routing の変更、新 source module、第二の role registry は導入しない。
- Claude argv/environment、model・effort routing、stdin、reviewer custody、既存 gate-role policy は不変とする。flag の不在から OS-level sandbox 実効性を主張しない。

## 2. 受入条件（未達・未実装）

専用 test-design の4 oracle が実装・確認されるまでは未達とする。対象は6 writer roleの一度だけの付与、代表的 non-writer の既存 invocation 維持とwrite非付与、Claude invocation不変、既存 delegation拒否およびfrontier/release consumer regressionの不在。OS/providerの実sandbox状態は受入主張に含めない。

## 3. Reverse / 上位差分

新しい write-capability は Reverse pair で既存 provider function design へ戻す。PLAN-REVERSE-855 と専用 L7 pair が review されるまでは confirmed にしない。新しい L6 document は作らない。

## 4. 検証

必要な test/typecheck/lint/doctor/CI は未実行。本 candidate は契約 draft であり、実装・test・green を主張しない。

## 5. Schedule

- serial: 本 draft の pair/Reverse 境界を確定し、合流後にのみ bounded 実装・検証へ進む。
