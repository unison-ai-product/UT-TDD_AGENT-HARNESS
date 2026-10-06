---
plan_id: PLAN-L7-855-codex-worker-sandbox-contract
title: "PLAN-L7-855-codex-worker-sandbox-contract: Codex worker の限定書込み権限と
  unknown-role fail-close"
kind: troubleshoot
layer: L7
drive: agent
created: 2026-10-06
updated: 2026-10-06
backprop_decision: required
backprop_decision_reason: 新しいworkspace-write能力とunknown-role
  fail-close契約を既存provider function designへReverse pairで戻す。
owner: Codex TL
review_evidence: []
agent_slots:
  - role: tl
    slot_label: bounded worker capability contract
  - role: aim
    slot_label: scope/non-goalとfail-close境界
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
  receipt_id: certificate:63b8377746b1e03160a41a993436c898
  command_id: plan-draft:issue-676:codex-worker-sandbox-contract-reissue-855:20261006:rechain-1
  admitted_at: 2026-10-06T06:05:07.679Z
  source_digest: sha256:7861c00951d5cc2f297106a0e7d9f6229d94cb13e82cb39e6c24c459632f55ab
  decision_digest: sha256:6b742826cb1a3380451748a9e69c57deac348dd3c33d937b77721d00dfb292c1
  receipt_digest: sha256:4e84def9e66f1e5122c5829291308d1ec534c5f8ebf26f976728304cf5041096
  binding:
    path: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
    plan_id: PLAN-L7-855-codex-worker-sandbox-contract
    asset_id: plan:63b8377746b1e03160a41a993436c898
    revision: 1
    content_digest: sha256:7861c00951d5cc2f297106a0e7d9f6229d94cb13e82cb39e6c24c459632f55ab
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
  escape_reason: "Issue #676のworker sandbox契約を独立bounded
    PLANへ分離し、既存PLAN-L7-68のconfirmed scope/generatesを変更しない。"
---
# PLAN-L7-855-codex-worker-sandbox-contract: Codex worker sandbox contract

## 0. 目的

既存 provider dispatch を維持し、Issue #676 の承認に基づいてCodex成果物workerのworkspace-write認可境界を追加する。これは新能力のproposalであり、旧confirmed revisionが誤りだったとの訂正ではない。

## 1. 対象範囲

- Codex workspace-write grant候補は se、docs、be-api、be-logic、db-schema、devops-deploy の6 roleのみ。
- gate、advisor、管理・調査およびその他既知roleはnon-writer。aimは認識済みnon-writer、unknown Codex roleはprovider spawn前にfail-close。
- 既存lower-level role policyを再利用し、runtime→team importと新source moduleを禁止する。
- Claude argv/environment、model routing、reviewer custody、stdin、provider resolution、およびSessionStartは変更しない。
- 詳細な候補oracleは docs/test-design/harness/L7-codex-worker-sandbox-test-design.md の独立補足pairに置く。共通L7-unit-test-design.mdは編集しない。

## 2. 受入条件（未達・未実装）

CANDIDATE-U-ADAPTER-SANDBOX-001..006 の全候補を実装・確認するまでは未達とする。候補は正常系、6 roleごとの一度だけの付与、gate/non-writer/aimへのwrite非付与、正規経路とdirect adapter経路双方でunknown role spawn 0、Claude/model-routing/custody不変を含む。OS/providerの実sandbox状態を測ったとの主張はしない。

## 3. Reverse / 上位差分

新しいwrite-capabilityとfail-close制約はReverse pairで既存provider function designへ戻す。PLAN-REVERSE-855-codex-worker-sandbox-backfillがR0..R4を通り、専用L7 pairと上位設計差分がreviewされるまではこの契約をconfirmedにしない。新しいL6 documentは作らない。

## 4. 検証

必要なtest/typecheck/lint/doctor/CIは未実行。本candidateは契約draftであり、実装・test・greenを主張しない。


## 5. Schedule

- serial: 本draftのpair/Reverse境界を確定し、合流後にのみbounded実装・検証へ進む。
