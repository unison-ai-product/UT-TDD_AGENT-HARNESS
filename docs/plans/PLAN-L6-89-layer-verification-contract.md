---
plan_id: PLAN-L6-89-layer-verification-contract
title: "PLAN-L6-89 (redesign/function-spec): L別設計検証契約の必須化と完了誤判定の遮断"
kind: add-design
layer: L6
drive: agent
route_signal: design_correction
route_mode: redesign
created: 2026-07-21
updated: 2026-07-21
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - L対検証契約schemaとfail-close境界の判定
  - role: se
    slot_label: SE - verification_contract正規化・DoD双方向trace・coverage scope照合の契約
  - role: qa
    slot_label: QA - unchecked DoD / orphan test / claim-only evidence / scope
      mismatchのRed oracle
generates:
  - artifact_path: docs/plans/PLAN-L6-89-layer-verification-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  references:
    - docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
    - docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - .ut-tdd/audit/A-189-execution-ledger-design-trio-blind-review-2026-07-21.md
  blocks: []
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 108
supersedes:
  - PLAN-L6-72-forward-fsm-evidence-policy-contracts
admission_receipt:
  schema_version: v2
  receipt_id: certificate:ffcb68c5c115107bfeb9ad33557e897b
  command_id: plan-l6-89-20260721-01
  admitted_at: 2026-07-21T18:50:00.000+09:00
  source_digest: sha256:23c7239650bf0709e24252a3601e2f3bf61627f32b54a525c4c96b02a61eb77b
  decision_digest: sha256:83c0bfb106d870f8c88c24f0e0259dee8d55fdb648af0f909e1a95ab114572d4
  receipt_digest: sha256:6cd82789426001caf1c143ce3c9e40cec54c7857684725ad1d6c3a8e9e534d86
  binding:
    path: docs/plans/PLAN-L6-89-layer-verification-contract.md
    plan_id: PLAN-L6-89-layer-verification-contract
    asset_id: plan:ffcb68c5c115107bfeb9ad33557e897b
    revision: 1
    content_digest: sha256:23c7239650bf0709e24252a3601e2f3bf61627f32b54a525c4c96b02a61eb77b
  route:
    signal: design_correction
    mode: redesign
  issue:
    provider: github
    issue_id: 108
    episode_id: E4-108
    projection_digest: sha256:d542a3e40399ef66bf10a53f5059dbe4f75e056cc2407381865cf1f9e82eb25e
  origin:
    plan_id: PLAN-L6-72-forward-fsm-evidence-policy-contracts
    revision: 1
    digest: sha256:2c84d88303f04b08d508531a7ca8281d26810834db963d9f2a8eedb7ec2db580
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-456-layer-verification-contract-gates
      target_revision: 1
  reentry:
    target_plan_id: PLAN-L6-72-forward-fsm-evidence-policy-contracts
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #108: PR #103 post-merge incident where a primitive CI
    Green was misjudged as full Redesign completion; design artifacts lack a
    mandatory per-layer verification contract"
  supersedes:
    - PLAN-L6-72-forward-fsm-evidence-policy-contracts
---

# PLAN-L6-89: L別設計検証契約の必須化と完了誤判定の遮断

## 1. 目的と根因 (Issue #108)

PR #103 / Issue #102 では、単体の revision authoring 実装が CI Green になったことを Redesign
全体の完了と誤判定した。また 2026-07-21 の blind review (A-189) では、L6 設計 (PLAN-L6-83) の
AC が要求する L7 oracle が test-design に未執筆のまま設計だけが先行する非対称を検出した。
根因は共通で、設計成果物に「どの検証が何を証明するか」という **検証契約** と、未証明時の
状態遷移禁止が機械化されていないことにある。本 PLAN は PLAN-L6-72 の evidence policy 契約を
起点 (origin) とし、それを L 別検証契約へ拡張・差し替える redesign である。L6-72 の
Forward FSM 遷移契約 (`U-FSM-*` / `P-FSM-*`) は本 PLAN の対象外であり効力を維持する。

## 2. L対検証契約 (verification_contract) の正規化

L0〜L6 の各設計成果物は、対となる検証層 (L14〜L7) への検証契約を必須で持つ。

| 設計層 | 検証層 | pair artifact (正本) |
|---|---|---|
| L4 basic-design | L9 system-test | docs/test-design/harness/L9-system-test-design.md |
| L5 detailed-design | L8 integration-test | docs/test-design/harness/L8-integration-test-design.md |
| L6 function-spec | L7 unit-test | docs/test-design/harness/L7-unit-test-design.md |

検証契約は少なくとも次を構造化して持ち、prose の主張だけでは契約と認めない。

- `invariant`: 証明対象の不変条件 (設計本文の節参照付き)
- `oracle`: pair test-design 内に実在する oracle ID (`ST-*` / `IT-*` / `U-*`)
- `negative_boundary`: 負系・fault 境界 (欠落・改変・stale・重複の各系)
- `evidence_source`: test run / CI run / audit のいずれかと digest anchor
- `verdict_rule`: 合否判定 (exit code / 期待 Red を含む)
- `command`: 再現可能な実行 command

## 3. DoD 双方向 trace と fail-close

1. PLAN の DoD / AC 各項目は oracle ID または evidence ID へ **双方向** trace する
   (AC → oracle、oracle → AC。orphan test と claim-only AC を同時に検出する)。
2. unchecked DoD 項目、oracle 未実在 (PLAN 本文にしか ID が無い)、evidence digest 欠落の
   いずれかを持つ PLAN の `confirmed` 化と merge を fail-close する。
3. A-189 型の非対称 (設計層 confirmed 化時に pair test-design 側 oracle が未執筆) は
   この規則の直接の検出対象である。

## 4. coverage scope の機械照合

部分実装の Green を上位設計全体の Green へ昇格しない。検証契約は `scope` (対象 oracle 集合 /
対象成果物集合) を宣言し、gate は「宣言 scope ⊆ 実測 Green 集合」を機械照合する。
PR #103 型の「primitive Green だが bundle 未実装」は、bundle 側 scope の未充足として拒否する。

## 5. Redesign prospective graph 検証

Redesign では origin correction、replacement PLAN、supersedes / back-reference、reentry、
implementation target を **同一 prospective graph** として検証する。graph の一部だけの Green
(例: replacement 単体の CI Green) を graph 全体の完了と判定しない。graph 節点は
plan admission receipt (PLAN-L6-86) と supersession gate (PLAN-L7-89) の既存機構へ束縛する。

## 6. post-merge aggregate gate

検証は PR 時点で終わらない。main merge 後にも状態・証跡・設計契約を再評価する aggregate gate
を持ち、merge 後に生じた stale 化 (pair test-design の後退、oracle 削除、digest 不一致) を
検出して Issue projection へ戻す。

## 7. 検出器の生成方向

検出器 (lint / doctor / gate) へ設計を合わせない。設計契約を正本とし、検出器は契約から
生成・更新する。検出器と契約が矛盾した場合は契約側の改訂 PLAN を要求し、検出器の黙認緩和を
禁止する (fail-open 看板替えの禁止)。

## 8. L6↔L7 pair / oracle

L7 test-design に `U-LVC-*` を追加し、少なくとも次を mutation で固定する。

1. verification_contract の必須 field 欠落 (invariant / oracle / evidence_source /
   verdict_rule / command のいずれか) を fail-close する。
2. oracle ID が pair test-design に実在しない PLAN の confirmed 化を拒否する (A-189 型)。
3. unchecked DoD を持つ PLAN の confirmed / merge を拒否する。
4. orphan test (どの AC からも trace されない oracle) を finding 化する。
5. claim-only evidence (digest / command を持たない prose 主張) を evidence と認めない。
6. 宣言 scope より狭い Green で全体 Green を主張する fixture (PR #103 再現) を拒否する。
7. supersedes 宣言に対する reciprocal back-reference 欠落を拒否する (L7-89 と整合)。
8. post-merge aggregate gate が pair test-design の後退 (oracle 削除) を検出する。

## 9. AC

- [ ] L4↔L9 / L5↔L8 / L6↔L7 の pair schema と verification_contract 正規形が本 function-spec に固定される。
- [ ] DoD 双方向 trace が定義され、unchecked DoD / orphan test / claim-only evidence / scope mismatch の Red oracle (`U-LVC-1..8`) が L7 test-design に執筆される。
- [ ] PR #103 型「primitive Green だが bundle 未実装」を fixture で確実に拒否する。
- [ ] A-189 型「設計 confirmed 化時に pair oracle 未執筆」を fixture で確実に拒否する。
- [ ] requirements / concept / ADR への design-verification contract の backprop 方針が記録される。
- [ ] Linux / Windows / aggregate および main post-merge gate の Green を経て、cross-runtime blind review PASS で confirmed 化する。

## 10. 降下先と supersession

L7 実装 (PLAN-L7-456: verification_contract parser / trace gate / scope 照合 / post-merge
aggregate gate) を implementation target とし、Forward 合流後に開始する。本 PLAN は
PLAN-L6-72 の evidence policy 契約部分を supersede する (L6-72 側に相互 back-reference を
記録する)。L6-72 の Forward FSM 遷移契約は存続する。
