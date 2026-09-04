---
plan_id: PLAN-REVERSE-530-bun-final-retirement-backfill
title: "PLAN-REVERSE-530: Bun 最終撤去の実装事実をL6へ戻す"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
confirmed_reverse_type: design
created: 2026-09-04
updated: 2026-09-04
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-530-bun-final-retirement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_decision: required
backprop_decision_reason: 最終撤去で観測したBun到達面とtuple証跡をL6の削除条件へgap-onlyで反映する。
agent_slots:
  - role: qa
    slot_label: QA - production reachable surface と retained fixture の分類を独立照合する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-530-bun-final-retirement-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-530-bun-final-retirement.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/487
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 487
admission_receipt:
  schema_version: v2
  receipt_id: certificate:4727c21e7227fefefdb428f11662676c
  command_id: plan-draft:issue-487:reverse:1
  admitted_at: 2026-09-04T00:01:00.000Z
  source_digest: sha256:026e86fe268420312674ff407135830de837b328b81d178cde4f2aa7dc8fab32
  decision_digest: sha256:4ec6e99485c001055e4e4cddebb2dc0245c086c7eebbcc035303d7366bec411e
  receipt_digest: sha256:04d5de668ebdec62759a24e35866113f043f9bb92bd03d97bba978a4f29b8426
  binding:
    path: docs/plans/PLAN-REVERSE-530-bun-final-retirement-backfill.md
    plan_id: PLAN-REVERSE-530-bun-final-retirement-backfill
    asset_id: plan:4727c21e7227fefefdb428f11662676c
    revision: 1
    content_digest: sha256:026e86fe268420312674ff407135830de837b328b81d178cde4f2aa7dc8fab32
  route:
    signal: design_gap
    mode: reverse
  issue:
    provider: github
    issue_id: 487
    episode_id: E4-487-bun-final-retirement
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-530-bun-final-retirement
    revision: 1
    digest: sha256:11316cc8122064fe93207fe743ad89cc051a9ea6c72f46293fbaffa0791b71
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L6-93-node-bootstrap-contract
    target_revision: 27
    phase: forward_merge
  escape_reason: "Issue #487 implementation facts backfill to L6 contract"
---

# PLAN-REVERSE-530: Bun 最終撤去の実装事実をL6へ戻す

## R0 — 対象境界

本 Reverse は、`PLAN-L7-530-bun-final-retirement` の実装結果を、既存の
`PLAN-L6-93-node-bootstrap-contract` §5.4 と `PLAN-L7-458-node-self-hosted-bun-ban-foundation`
へ gap-only で戻すための pair である。実装を設計の代替根拠にせず、実測した差分・未観測面・
残存fixture境界だけを記録する。Q0、Node producer、consumer runtime、Pack publication、
Memory/notification の完了は本 Reverse から導出しない。

## R1 — 4要素 tuple と履歴証跡

Forward実装が提出する sealed build receipt と Node parity receiptを、次の4要素で再構成する。

`subject_revision` / `generation_id` / `artifact_digest` / `retirement_subject`

両receipt、F0c aggregate、Q0 parity、撤去commitのGit objectが同一 chain に属することを、
完全履歴確認後の ancestor 検証で確認する。欠落、shallow/promisor history、別producer、
stale/wrong revision、二重admission、tupleの一要素変異は、それぞれ固有typed reasonとして
保持し、PASSへ丸めない。実装がreceiptの存在だけを検証していた場合は未充足gapとして戻す。

## R2 — candidate / oracle 対応

Forward/test-designと同じ候補をこの Reverse の実装検証境界にも束ねる。candidateの実装所有は
本 Reverse pairへ固定し、既存L6の契約記述は定義、L7-458のQ0契約は前提参照として扱う。

| candidate | 実装Red | 独立Green oracle |
|---|---|---|
| `CAND-NODEBOOT-208` | production reachable な Bun surface を1件残す、またはfixtureをproduction allowlistへ混ぜる | production到達面の全件inventoryが0、fixtureは専用rootで実行時到達不能 |
| `CAND-NODEBOOT-023` | sealed/parityの片側欠落・失敗・skipで撤去を進める | 両receiptの論理積を満たさない限り write/activation/削除が0 |
| `CAND-NODEBOOT-027` | stale、wrong-revision、wrong-generation、wrong-artifactを各々混在させる | 4変異を各々拒否し、tuple完全一致のみ受理 |
| `CAND-NODEBOOT-028` | 過去成立receiptを別の撤去commitへ流用する | `retirement_subject`不一致を拒否し、現撤去commitだけを受理 |

各candidateは同じ実装revisionでRed実測、修正、Green実測の順に記録する。候補IDの存在や
既存L6表の記述だけをGreen証跡にしない。

## R3 — gap分類と backfill

実装後に次を区別して上位へ戻す。

- `reachable_production`: package script、wrapper、setup/readiness/CI、Pack/consumer template、
  generated tree、runtime fallbackから到達可能な Bun surface。1件でも残れば未完了。
- `retained_fixture`: Q0 detectorが自分自身を検証するための専用fixture。production inventory、
  allowlist、生成Pack、consumer runtimeから参照できないことを実測する。
- `unobserved`: OS、権限、provider、history、または対象面が観測不能な状態。解決済み扱いせず
  `Indeterminate`として保持する。

差分はL6 §5.4の撤去条件、L6 §5.2のwrapper条件、L7-458 §2の三値complianceと
`coverage`へ反映する。既存契約を上書きせず、矛盾が見つかれば successor PLANで
supersedes/back-referenceを作る。

## R4 — Forward再合流条件

R4で次の全てを同一 implementation revisionへ束縛してから、Forwardへ再合流する。

- 4 candidateのRed/Green、production/fixture inventory、typed failureの実測
- sealed/parity/F0c/Q0 receiptのsubject/generation/artifact/retirement tuple
- Linux/Windows/aggregateで Bun executable/install/download/invocation/fallback = 0 の実測
- 既存L6/L7-458/test-designとのcandidate・owner・pathの一致
- 非著者closing reviewとrequired CIのexact-head証跡

R4はBun removalが実施済みであることを確認するが、Pack正式配布、複数consumerの隔離、
stable昇格、rollback運用まで完了扱いしない。

## Scope boundary

このReverseは #487 の実装結果を上位設計へ戻す pair-freeze であり、実装・削除・Q0実行・
release公開そのものではない。`status: draft` の間は、現行mainのproduction artifactの
所有を変更せず、実装PRが同一revisionで必要なpathを追加する。

上位 `PLAN-L6-93` / `PLAN-L7-458` の直接改訂はこのpair-freeze PRのscope外とする。
既存上位契約は定義元、`PLAN-L7-530` pairは最終撤去の実装・test・evidenceの唯一のownerと
して分離し、同一artifactの二重所有を作らない。R3で実装差分を確定した後にだけ、正規の
PLAN revision経路で上位へのback-referenceとgapを反映する。
