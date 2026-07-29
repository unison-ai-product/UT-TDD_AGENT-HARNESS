---
plan_id: PLAN-L4-33-node-control-plane-redesign
title: "PLAN-L4-33: Node control-plane architecture redesign"
kind: add-design
layer: L4
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-24
updated: 2026-07-24
owner: PO / TL
agent_slots:
  - role: tl
    slot_label: TL - Node制御面RedesignとForward再合流判定
  - role: qa
    slot_label: QA - L4/L9候補oracleと縮退防止
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
transition_direction: design_to_implementation
implementation_disposition: none
implementation_target: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
generates:
  - artifact_path: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L4-02-architecture.md
    - docs/plans/PLAN-L5-26-node-generation-activation.md
    - docs/test-design/harness/L9-system-test-design.md
  blocks:
    - docs/plans/PLAN-L5-26-node-generation-activation.md
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-07-29T14:50:00+09:00"
    tests_green_at: "2026-07-29T14:45:00+09:00"
    verdict: pass
    worker_model: codex
    reviewer_model: claude-opus-5
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint (848 PLAN、plan-schedule OK)"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-29T14:40:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:368462623766175e76783b927571c6db812830af063e413cd5776e7280dc2ebf"
      - kind: unit_test
        command: "bun run test:vitest-snapshot tests/plan-lint.test.ts tests/review-evidence.test.ts tests/readability.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-29T14:45:00+09:00"
        evidence_path: tests/review-evidence.test.ts
        output_digest: "sha256:5fef87a0e2879c4b9bd7608c92e01a1ad0aa45cdd0578fba065f2307b81354c4"
    scope: "D0-N 設計 freeze の cross-family review (Codex/PO 著作 → Claude 検証、hybrid 非 author family)。実測した範囲: (a) 本 PLAN が §3 で pair 宣言する CAND-NODEBOOT-201..213 が pair 先 L9 に文字列一致で 13/13 実在 (欠落 0)、(b) pair 双方 (architecture.md §9 / L9-system-test-design.md) が status=confirmed かつ pair_artifact / next_pair_freeze 相互整合、(c) generates / references / blocks の宣言ファイルが全件実在 (PLAN-L5-26 / L6-93 / L7-458 ほか)、(d) oracle-test-trace orphans=0 (issue #158 の構造 Red は本 D0 集合に未発火)、(e) ut-tdd plan lint 848 PLAN OK。本文読解で確認した点: cutover は 5 状態 (inventory_frozen → node_shadow → node_primary → bun_removed → sealed) のみを許し append-only receipt chain を正本とすること、Node parity 前の旧 Bun gate 削除禁止と Node primary 後の Bun fallback 禁止が明記され Bun 永久 BAN (PO 決定 2026-07-22 / issue #134) と矛盾しないこと。未検証 (この evidence は主張しない): receipt chain の暗号学的健全性と実行時挙動 — 実装が存在しないため add-design freeze の対象外であり L7/L8 降下時に検証する。"
status: confirmed
sub_doc: architecture
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f445ac9d4c96432cf17c37e743bdf3a2
  command_id: pr154-trust-confirm-l4-20260724
  admitted_at: 2026-07-24T09:30:00.000Z
  source_digest: sha256:a8e4d70f4b3df7b8c5ad3e351cc81ed5c7473dc829654160961a38484159b784
  decision_digest: sha256:62e6ce75f2cd849b5f14d48a35ca71dfb96d3748dc8f9f6cb89d7af791f09a12
  receipt_digest: sha256:b8d4d2d155d5484c99c0d04dbe93049a0543e5e5440656d0ae29f58a447b94ac
  binding:
    path: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
    plan_id: PLAN-L4-33-node-control-plane-redesign
    asset_id: plan:legacy:ba9f2efe68bd7373538eb65009dc992ad9d06677095453f0abbff9967f53d6cd
    revision: 4
    content_digest: sha256:a8e4d70f4b3df7b8c5ad3e351cc81ed5c7473dc829654160961a38484159b784
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L4-02-architecture
    revision: 2
    digest: sha256:3b7d663d5a6a63703a0ca3d03f1c0e7434554dbc53bc45c264843c37781b9f0a
  reentry:
    target_plan_id: PLAN-L4-33-node-control-plane-redesign
    target_revision: 4
    phase: forward_merge
  escape_reason: PR 154 final trust and L6 confirmation closure
---

# PLAN-L4-33: Node control-plane architecture redesign

## 1. 起点と差替え

Issue #152は、現行Bun control planeをNode化済みと誤認せず、設計を先にNode targetへ差し替えてから
実装へ再降下するRedesignである。`PLAN-L4-02`を一般architectureのpredecessor/referenceとして維持し、
Node runtime/build image/cutoverに関するadditive refinementだけを本PLANが所有し、general canonicalを
supersedeしない。先行F0実装は採択根拠にせず
`none`として扱う。

## 2. L4不変条件

- current Bunはmigration debt、target Nodeは未実装の設計状態として別field・別receiptで表す。
- Node/npm/toolchain/dependency/subject revisionをsealed generationへ結合する。
- activationはappend-only immutable markerであり、既存current pointerを上書きしない。
- publishはexact `dist/node-publish.lock/` atomic mkdir leaseで直列化し、crash残留leaseはF0で永久fail-closeする。recovery/steal/clearを持たない。
- F0では全immutable generationを保持してautomatic GCを禁止する。
- process-crash atomicityとpower-loss durabilityを分離し、power loss後はcomplete marker 1件以上なら最大を選び、0件ならfail-closeする。
- F0 rollbackは同一revision内だけ。cross-revisionはunsupportedで、git revertから新revisionをbuildする。
- Node parity前に旧Bun gateを削除せず、Node primary後にBunへfallbackしない。
- Resource Kernel/Rust companionをNode build imageの開始条件にしない。

cutoverは`inventory_frozen → node_shadow → node_primary → bun_removed → sealed`の5状態だけを許す。
状態変更の正本はTypeScriptが発行するappend-only `CutoverTransitionReceipt` chainであり、各receiptは
`schema_version`、`registry_id`、`transition_id`、`sequence`、`subject_revision`、`previous_state`、`current_state`、
`evidence_set_digest`、`review_digest`、`admission_digest`、`previous_receipt_digest`、`receipt_digest`を持つ。
別名`evidence_digest` / `chain_digest`は持たない。隣接する一方向遷移以外、状態skip、reverse、別revision replay、
evidence/review欠落、chain不一致はfail-closeする。DB/UIのcurrent stateはreceipt chainから再構築するprojectionであり、
直接更新できない。

genesis receiptは`previous_state=null`、`previous_receipt_digest=null`、`current_state=inventory_frozen`で、
inventory evidenceとreview/admission receiptを要求する。空chainのprojectionは`uninitialized`であり開始不能、
validated genesis digestだけがchain headになる。
通常transition receiptはcandidate HEADをsubjectにする。inventory_frozen→node_shadowのF0a/F0b/F0c証跡は
各producer slice commitをsubjectとし、candidate HEADが全commitのdescendantであるancestry closureを要求する。
evidence setとreceipt digestのcanonicalization、review/admission rowとのdigest等価条件、sealed edgeの
必須負債2件はL5 `CUTOVER-EVIDENCE-REGISTRY-v1`を規範参照する。
全production edgeはfresh claim-blind+spec-blind PASS bundleとapproved admissionを要求する。chain entryは
evidence receiptsも保持し外部再照会なしで検証する。genesis/appendはsequenceとexpected headの
exclusive-lock CASでatomic化し、fork/double genesis/crash partialを拒否する。

slice admissionは`d0_admitted → f0a_complete → f0b_complete → f0c_complete → q0_complete`だけを許し、
各candidate commitのmerge admissionでF0b/F0c/Q0はそれぞれF0a custody/F0b sealed build/F0c aggregate
receiptをtyped dependencyとして要求する。edit-start gateにはしない。
review+admission済みD0 draftが許可するのは順序内の非activation workだけで、production activation、hook/runtime switch、
Bun final deletion、cutoverはL6 confirmed+D0 admissionまで禁止する。

## 3. PairとForward再合流

L9の`CAND-NODEBOOT-201..213`とpair-freezeし、L5-26→L6-93→L7-458へ降下する。
候補oracleは対応testと実装の同一commit Red実測まで正式`ST-*`へ昇格しない。
