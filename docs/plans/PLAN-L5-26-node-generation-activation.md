---
plan_id: PLAN-L5-26-node-generation-activation
title: "PLAN-L5-26: append-only Node generation activation redesign"
kind: add-design
layer: L5
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
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
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-07-29T15:10:00+09:00"
    tests_green_at: "2026-07-29T15:05:00+09:00"
    verdict: pass
    worker_model: codex
    reviewer_model: claude-opus-5
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint (848 PLAN、plan-schedule OK)"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-29T15:00:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:368462623766175e76783b927571c6db812830af063e413cd5776e7280dc2ebf"
      - kind: unit_test
        command: "bun run test:vitest-snapshot tests/plan-lint.test.ts tests/review-evidence.test.ts tests/readability.test.ts tests/green-command-digest.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-29T15:05:00+09:00"
        evidence_path: tests/review-evidence.test.ts
        output_digest: "sha256:5fef87a0e2879c4b9bd7608c92e01a1ad0aa45cdd0578fba065f2307b81354c4"
    scope: "D0-N 降下 (L5) の cross-family review (Codex/PO 著作 → Claude 検証、hybrid 非 author family)。実測した範囲: (a) 本 PLAN が宣言する oracle ID 2 件が pair 先 L8 に文字列一致で実在、(b) pair 先 L8 に CAND-CUTOVER 27 件 / CAND-NODEBOOT 13 件の群が実在し本 PLAN の cutover / activation 主題と対応、(c) pair 双方 (physical-data.md / L8-integration-test-design.md) が status=confirmed かつ pair_artifact / next_pair_freeze 相互整合、(d) parent (PLAN-L4-33) が同一 PR train で confirmed 済みであり降下順が成立、(e) generates / references / blocks の宣言ファイルが全件実在、(f) oracle-test-trace orphans=0、(g) ut-tdd plan lint 848 PLAN OK。未検証 (この evidence は主張しない): activation / generation の実行時挙動と、L8 oracle 群が本 PLAN の全契約を漏れなく覆うかの全数写像 — 前者は実装が存在しないため add-design freeze の対象外、後者は ID 存在照合と主題対応までを実測範囲とする。"
status: confirmed
sub_doc: internal-processing
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:32609bf5993fe24c17679e378e4ad67a
  command_id: pr154-trust-confirm-l5-20260724
  admitted_at: 2026-07-24T09:30:00.000Z
  source_digest: sha256:630f9d3e550c9b06c435e8076f72c94015df052579d617a5fdb2225aa5cf4222
  decision_digest: sha256:3f19c930119437bd3cfd46aac862973c5750bd1a43f8b029f7446ccb11bc8f75
  receipt_digest: sha256:05e82d85c3814d52e32c162fa702d2ec6bbf13404488498ef46b1ca62d43d70e
  binding:
    path: docs/plans/PLAN-L5-26-node-generation-activation.md
    plan_id: PLAN-L5-26-node-generation-activation
    asset_id: plan:legacy:899f8a663115a111568393119bad90941df8d487e1f69e16a914b1bbb1cb90f5
    revision: 4
    content_digest: sha256:630f9d3e550c9b06c435e8076f72c94015df052579d617a5fdb2225aa5cf4222
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L5-03-internal-processing
    revision: 2
    digest: sha256:7bad46547eb3ecf1422dcdaa851d7192c42f6a34b78ea14530ba31f800d97e48
  reentry:
    target_plan_id: PLAN-L5-26-node-generation-activation
    target_revision: 4
    phase: forward_merge
  escape_reason: PR 154 final trust and L6 confirmation closure
---

# PLAN-L5-26: append-only Node generation activation redesign

## 1. 差替え境界

Issue #152のL4-33を、Node標準filesystem APIだけでWindows/POSIXへ実装可能な物理protocolへ降ろす。
`PLAN-L5-03`を一般内部処理のcanonical predecessor/referenceとして維持し、Node generation activationの
additive refinementだけを
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
`CAND-CUTOVER-101..113`とpair-freezeする。
各候補はL7-458 ownership表のowner revisionでtestとimplementationを同一commitへ追加し、
Red実測するまで正式`IT-*`へ昇格しない。
