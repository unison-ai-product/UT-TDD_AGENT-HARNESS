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
  receipt_id: certificate:0b6124249611a58f575d64c810631ab6
  command_id: plan-draft:issue-676:reverse-worker-sandbox-backfill-reissue-855:20261006:rechain-1
  admitted_at: 2026-10-06T06:05:50.000Z
  source_digest: sha256:b9d209d77449d52ee1aa34f8d24748e6678d0bd48e170fb8e24ebd70080461aa
  decision_digest: sha256:513eeeaefec53d12e38e38d03c0e36d324e15135275b2b2b28383b88a5fee7db
  receipt_digest: sha256:17409081815d064229751283008db13e5de18be6331a4b654a848e1b640e5844
  binding:
    path: docs/plans/PLAN-REVERSE-855-codex-worker-sandbox-backfill.md
    plan_id: PLAN-REVERSE-855-codex-worker-sandbox-backfill
    asset_id: plan:0b6124249611a58f575d64c810631ab6
    revision: 1
    content_digest: sha256:b9d209d77449d52ee1aa34f8d24748e6678d0bd48e170fb8e24ebd70080461aa
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
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #676のworker capability/fail-close gapを、新bounded
    PLAN855と専用pairから既存provider設計へReverse提案する。旧実装はpreservedとし、acceptance未達を維持する。"
---

# PLAN-REVERSE-855-codex-worker-sandbox-backfill (Reverse / proposal)

## §0 位置づけ

既存 PLAN-L7-68 の provider-dispatch 実装事実から、Issue #676 で承認された Codex worker の限定 workspace-write 権限と unknown-role fail-close 境界を、既存 provider function design へ back-fill する提案である。旧 confirmed revision の誤りを主張しない。新しい L6 設計文書は作らず、既存 function design への最小差分と専用 L7 test-design pair を使う。

## §1 R0–R4 (候補・未受入)

| phase | work | result / status |
|---|---|---|
| R0 evidence | a6ba5d0efaa8b8bf94256b5289adae8ff782eeba の既存 src/runtime/adapter.ts buildAdapterPlan、src/runtime/agent-guard-policy.ts、src/runtime/review-guard.ts、src/team/delegation-routing.ts、tests/runtime-adapter.test.ts、PLAN-L7-68 を参照する。 | source inspection のみ。provider/test は未実行。 |
| R1 observed contract | 現 adapter は Codex argv に stdin/model/effort を構築するが role別 sandbox grant を構築しない。Issue #676 の明示契約は worker role 6件のみ write、gate/advisor等は non-writer、unknown は spawn前拒否。 | 観測と承認の照合。OS/provider sandbox 実効性は未検証。 |
| R2 delta | adapter-level workspace-write allowlist、known non-writer と unknown-role の異なる扱い、normal delegation/direct adapter の spawn 0 oracle が未成立。 | contract gap。 |
| R3 intent | se/docs/be-api/be-logic/db-schema/devops-deploy の6 roleだけに workspace-write を1組付与。判断 gate、advisor、管理/調査、aim等の既知 non-writerへ付与せず、unknown Codex roleは通常 delegation と直接 adapter の両方で provider spawn前に拒否する。Claude argv/env、model・effort routing、stdin、reviewer custody、SessionStartは不変。runtime→team import、新module、second role registryを導入しない。 | candidate contract。 |
| R4 routing | 既存 docs/design/harness/L4-basic-design/function.md の provider invocation 節へ最小差分を戻し、新bounded owner PLAN-L7-855-codex-worker-sandbox-contract と専用 L7 pair を参照する。 | 将来の設計・pair review待ち。未freeze。 |

## §2 candidate oracle 対応 (すべて未実装・未達)

| candidate | oracle要点 | 状態 |
|---|---|---|
| CANDIDATE-U-ADAPTER-SANDBOX-001 | 6 role個別にworkspace-writeが一度だけ付与され、既存model/effort/stdinを維持 | 未実装 |
| CANDIDATE-U-ADAPTER-SANDBOX-002 | 全decision-gate roleはnon-writer、gate集合/custody不変 | 未実装 |
| CANDIDATE-U-ADAPTER-SANDBOX-003 | aim等known non-writerはwriteを得ない | 未実装 |
| CANDIDATE-U-ADAPTER-SANDBOX-004 | normal delegationのunknown Codex roleでprovider spawn 0 | 未実装 |
| CANDIDATE-U-ADAPTER-SANDBOX-005 | direct adapterのunknown Codex roleでもprovider spawn 0 | 未実装 |
| CANDIDATE-U-ADAPTER-SANDBOX-006 | Claude argv/env、model routing、stdin、gate policy不変 | 未実装 |

受入は未達。candidate row、設計提案、source inspectionを実装・test Green・provider実測の代替にしない。

## §3 範囲外

#835 SessionStart、providerのOS-level sandbox実効性、生成configの全role grant、verdict custody変更、PLAN-L7-160のbehavior-invariant extraction。Linux provider再測定は別のcontrol許可・attempt bindingに従う。
