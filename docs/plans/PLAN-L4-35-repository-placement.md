---
plan_id: PLAN-L4-35-repository-placement
title: "PLAN-L4-35 (design/repository-placement): リポジトリの置き場所と 3 区分の分離"
kind: design
layer: L4
drive: fullstack
route_signal: forward
route_mode: forward
created: 2026-10-07
updated: 2026-10-07
owner: PO / TL
parent_design: docs/design/harness/L4-basic-design/repository-placement.md
sub_doc: architecture
pair_artifact: docs/test-design/harness/L9-repository-placement-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: TL - 3 区分の境界、registry の正本、Pack の構造化
  - role: se
    slot_label: SE - 書き込み時の guard、patrol、内部デプロイの経路
  - role: qa
    slot_label: QA - 置き場所の oracle と Pack inventory の検証
generates:
  - artifact_path: docs/plans/PLAN-L4-35-repository-placement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/648
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/822
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/759
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/872
    - docs/governance/repository-structure.md
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
github_issue_id: 648
backprop_decision: not_required
backprop_decision_reason: >-
  新しい置き場所の契約 (3 区分、registry、guard、patrol、内部デプロイ) を定める genesis 設計であり、
  既存実装を正本として設計へ引き戻す Reverse ではない。kind=design は Reverse 対を必須としない。
review_evidence: []
status: draft
---

# PLAN-L4-35: リポジトリの置き場所と 3 区分の分離

## 上流の設計 revision digest

- `docs/design/harness/L4-basic-design/repository-placement.md@4f1861ade5adeb0ee941effebd23a661d8b0589d` sha256:7deeb5f0a583864d990d0fa1cd48596ca538122067d3005b62d405b350ea3d6b
- `docs/test-design/harness/L9-repository-placement-test-design.md@4f1861ade5adeb0ee941effebd23a661d8b0589d` sha256:75d9138fcfe82d0e668bfb8e795c741c540bdb93760d436a2eeed8ef6682bb23

## 引き渡し物

- `docs/design/harness/L4-basic-design/repository-placement.md` (本 PLAN で凍結する設計文書)
- `docs/test-design/harness/L9-repository-placement-test-design.md` (対になるテスト設計)

## 検証の対

- 設計 ↔ テスト設計: 上記 2 文書の対 (oracle 候補 CANDIDATE-PLACE-001〜009、テストのレベルと実行環境はテスト設計側に書く)

## 完了条件

- [ ] 引き渡し物が上流 digest の revision と整合し、非著者 family (Codex Sol) の review が PASS
- [ ] `ut-tdd plan lint` exit 0
- [ ] 設計 §3 の未決 2 件 (`parts/` の名前、`docs`・`tests`・`scripts` を `dev/` の下へ移すかどうか) が確定し、設計文書に反映されている
