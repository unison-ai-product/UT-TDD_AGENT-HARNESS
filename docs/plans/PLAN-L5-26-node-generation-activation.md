---
plan_id: PLAN-L5-26-node-generation-activation
title: "PLAN-L5-26: append-only Node generation activation redesign"
kind: add-design
layer: L5
drive: fullstack
route_signal: design_correction
route_mode: redesign
created: 2026-07-24
updated: 2026-07-24
owner: PO / TL
agent_slots:
  - role: se
    slot_label: SE - append-only activation物理protocol
  - role: qa
    slot_label: QA - crash/競合/lock永久停止oracle
parent_design: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
transition_direction: design_to_implementation
implementation_disposition: none
implementation_target: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
generates:
  - artifact_path: docs/plans/PLAN-L5-26-node-generation-activation.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
  requires: []
  references:
    - docs/plans/PLAN-L5-03-internal-processing.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/test-design/harness/L8-integration-test-design.md
  blocks:
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
review_evidence: []
status: draft
sub_doc: internal-processing
github_issue_id: 152
supersedes:
  - PLAN-L5-03-internal-processing
admission_receipt:
  schema_version: v2
  receipt_id: certificate:8962e415155a779fbcea5c1fc297e504
  command_id: pr154-d0-admission-l5-20260724
  admitted_at: 2026-07-24T06:30:00.000Z
  source_digest: sha256:ecc631bed18919241ec468a53b08970bbf7b8308aaf1f7b9b26f7d293ccf296f
  decision_digest: sha256:1024ce4c2e25bb2dac7c6ba552c46a0661cf9d60c26669e1e149594586e62dc2
  receipt_digest: sha256:e6a55a866baddcf4911c36eaa2537fc83957d5d1b85a4d6fa3d61ddd5bf03f06
  binding:
    path: docs/plans/PLAN-L5-26-node-generation-activation.md
    plan_id: PLAN-L5-26-node-generation-activation
    asset_id: plan:legacy:899f8a663115a111568393119bad90941df8d487e1f69e16a914b1bbb1cb90f5
    revision: 2
    content_digest: sha256:ecc631bed18919241ec468a53b08970bbf7b8308aaf1f7b9b26f7d293ccf296f
  route:
    signal: design_correction
    mode: redesign
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:e440f122e517c5d0ddbaaa2ad5fbc6b18cad57aa7db2865cbda6ab0a6c70e48f
  origin:
    plan_id: PLAN-L5-03-internal-processing
    revision: 1
    digest: sha256:cc1efdefacc0ea53eb96e37e2a3591ac7e6e5e3563575aba472a3c72a1a9ffed
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
      target_revision: 2
  reentry:
    target_plan_id: PLAN-L5-26-node-generation-activation
    target_revision: 2
    phase: forward_merge
  escape_reason: Node control-plane D0-N design replacement and Forward reentry
  supersedes:
    - PLAN-L5-03-internal-processing
---

# PLAN-L5-26: append-only Node generation activation redesign

## 1. 差替え境界

Issue #152のL4-33を、Node標準filesystem APIだけでWindows/POSIXへ実装可能な物理protocolへ降ろす。
`PLAN-L5-03`を一般内部処理のpredecessor/referenceとして維持し、Node generation activationの差分だけを
本PLANが所有する。

## 2. Activation protocol

1. immutable generationをprivate tempへ構築し、全fileをsync/closeしてcomplete receiptを封印する。
2. writerはexact `dist/node-publish.lock/`をatomic `mkdir`だけで取得する。`open("wx")`等の代替backendは禁止する。
3. lease取得後にmax sequence `N`を読み、`N+1`を割り当てる。同時writerはretryせずfail-closeする。
4. activation markerをtempへwrite、file sync、closeし、存在しない一意final名へ同一filesystem renameする。
5. readerは全final markerを検証し、sequence・generation・receiptが完全な最大markerだけを採用する。
6. temp、torn、invalid markerは無視する。crash残留lockはowner.json欠落時も保持し、F0にrecovery/steal/clear APIを作らずpublishを永久blockする。readerはcomplete markerを引き続き利用できる。
7. F0 rollbackは同一revisionの旧generationを指す新markerだけ。cross-revisionはunsupportedで、git revert後の新revision buildを使う。

既存file置換、shell、native helperへ依存しない。F0ではautomatic GCとgeneration deletion APIを禁止し、
全immutable generationを保持する。reader lease/reclamationは後続PLANへdeferする。

process crashとpower lossを別oracleにする。POSIXは可能な場合parent directoryをsyncする。Windows Node-only
F0bは最新markerのpower-loss persistenceも旧marker存在も保証しない。検証可能complete markerが1件以上なら
最大sequenceを選び、0件ならfail-closeする。
power-loss durable activationはResource Kernel bundle側trust floorへ委譲する。

## 3. Cutover transition processing

1. 最新`CutoverTransitionReceipt`を`previous_receipt_digest`→`receipt_digest` chain込みで検証し、projection値を入力正本にしない。
2. edge別の必要evidenceは直後の厳密registryだけをSSoTとし、各transitionは対応rowを完全一致で満たす。
3. 次receiptはL5正本の12 field schemaだけを持ち、canonical encodingして`receipt_digest`を生成しappendする。
4. invalid state、非隣接遷移、reverse、skip、別revision replay、digest欠落/不一致は書込み前にfail-closeする。
5. state projectionはvalidated receipt chainをfoldして再構築し、receiptなしの直接更新を拒否する。

edge evidenceの唯一のcanonical registryは
`docs/design/harness/L5-detailed-design/internal-processing.md`の`CUTOVER-EVIDENCE-REGISTRY-v1`である。
本PLANは表を複製せず、同registryのlexical kind/producer ID、count、revision/ancestry、digest、success条件を
規範参照する。wrong-edge、stale/replay、non-ancestor、skipはfail-closeする。
`review_digest` / `admission_digest`と対応evidence rowの等価条件、deterministic `evidence_set_digest`、
sealed edgeの`PLAN-RECOVERY-16` + `PLAN-L7-452`両方必須条件も同registryを規範参照する。
functionsは`src/runtime/cutover-transition.ts`、pair testは`tests/cutover-transition.test.ts`へ固定する。
全edgeでfresh 2-lane `ReviewBundleReceipt`とapproved admissionを要求する。initialize/appendは
sequence、expected previous head、exclusive lock内atomic CASを使い、fork/double genesis/CAS loser/crash partialを拒否する。

## 4. Pair

L8 `CAND-NODEBOOT-101..106`はtoolchain/build/CI結合だけとpairし、cutover競合へ流用しない。
cutoverのCAS、fork、crash、rollback、GC、slice FSM、trusted review/admissionはL8
`CAND-CUTOVER-101..108`とpair-freezeする。
各候補はL7-458 ownership表のowner revisionでtestとimplementationを同一commitへ追加し、
Red実測するまで正式`IT-*`へ昇格しない。
