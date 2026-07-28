---
plan_id: PLAN-L1-07-vmodel-engine-swap-requirements-delta
title: "PLAN-L1-07: Vモデル engine-swap 要件差分"
kind: research
layer: L1
drive: fullstack
status: confirmed
route_signal: research
route_mode: research
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
pair_artifact: docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L4
review_evidence:
  - reviewer: codex-subagent-post-test-confirm-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T17:04:38+09:00"
    tests_green_at: "2026-07-10T17:03:36+09:00"
    verdict: approve
    scope: "既存L1/L14 confirmed freezeを不変に保つadditive revision、exact pair、VUP-REQ-08A/09/10とOT-VUP-008A/009/010、program exit分離を受入。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-pair.test.ts tests/right-arm-gate-planning.test.ts tests/upgrade-frontier.test.ts tests/plan-lint.test.ts tests/backfill-pairing.test.ts tests/vmodel-source-assets.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T17:00:23+09:00"
        evidence_path: tests/vmodel-source-assets.test.ts
        output_digest: "sha256:7872ee0f9acf7a4f221cec689c46bdf352d50e618edd3bb29501eb260d87d23a"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
agent_slots:
  - role: po
    slot_label: "PO - engine-swap/full-scopeと最終検収"
  - role: tl
    slot_label: "TL - 既存freezeを保存したadditive要件改訂"
  - role: qa
    slot_label: "QA - L8-L14右腕と独立自己証明"
  - role: se
    slot_label: "SE - L4-L7および全docsへの波及"
generates:
  - artifact_path: docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md
    artifact_type: test_design
dependencies:
  parent: PLAN-L0-01-vmodel-harness-upgrade-charter
  requires:
    - PLAN-L1-06-vmodel-upgrade-requirements
  blocks: []
  references:
    - docs/governance/vmodel-source-manifest.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/process/vmodel-contract.yaml
    - docs/process/plan-asset-v2.md
    - docs/process/design-detection-self-proof.md
---

# PLAN-L1-07: Vモデル engine-swap 要件差分

## 1. 目的

2026-07-08に凍結した `PLAN-L1-06` の VUP-REQ-01〜08と、その凍結に依存して完了した後続PLANを履歴として保存する。
その上に、checked ZIPの再監査で確定した624 file entries、109 numbered source docs、21 categories、163 items、
8 profilesと、POのengine-swap/full-scope要求をadditive deltaとして積む。

本PLANは変更最小化を完了条件にしない。既存HARNESSのchassisを再利用しながら、Forward FSM、PLAN Asset v2、
設計由来detector、G8-G14右腕、全tracked docs、DDD/OOP class/method設計、独立自己証明まで全面的に改修する。

## 2. 要件差分

- VUP-REQ-09: Forwardを明示状態機械とappend-only PLAN Asset v2へ移行する。
- VUP-REQ-10: L0-L14/G0.5-G14の宣言型contractからdetectorを導出し、独立mutationで自己証明する。
- 109 sourceと163 itemを現行設計・実装・test/evidenceへ追跡し、gapはdebt PLANへ起票する。
- repository全tracked docsを個別に維持・更新・統合・廃止判定し、orphanを残さない。
- 状態と不変条件を持つ領域はaggregate/value object/serviceへ分離し、L4判断、L5 module、L6 public method contract、L7実装を揃える。
- active upgradeのyellow/draft frontierをdoctor/statusが既存greenの裏へ隠さない。

## 3. 工程

1. L1差分とL14 operational test-designをdraftでpairし、VUP-REQ-09/10を固定する。
2. U18a〜U18gをL4からL5/L6/L7へ降下し、L8〜L14 verify PLANを起票する。
3. 163 item自己監査と全docs dispositionを完了し、gap/debtをPLAN化する。
4. contract compiler、detector registry、独立meta-verifier、mutation receiptを実装する。
5. L1/L14 pair-freeze review、targeted design lint、DB projection整合を通して本要件deltaをconfirmed化する。
6. 下流programの完遂はU18a〜gとL5〜L14の各PLANで個別に閉じ、本PLANのconfirmedと混同しない。

## 4. engine-swap program exit trace

- `PLAN-L1-06` と既存依存PLANのconfirmed履歴を変更せず、現行deltaを別revisionとしてfreezeする。
- VUP-REQ-08A/09/10とOT-VUP-008A/009/010がpairされ、U18a〜gとL8〜L14へ双方向traceされる。
- 109/163/21/8の全件性とZIP hashがtracked authoring sourceだけで再検証できる。
- detectorを無効化・改変するnegative controlでmeta-verifierがfail-closeし、survivorが0になる。
- 全docs監査とsemantic item監査がpending 0になり、未解決gapはowner/exit付きdebt PLANを持つ。
- program完遂時に`plan lint`、`db rebuild`、full `doctor`、CI、別runtime judgement reviewがgreenになる。

## 5. L1 pair-freeze条件

- VUP-REQ-09/10、109/163/21/8、full-scope、設計由来detector、独立self-proofの要求境界がL1に定義される。
- OT-VUP-008A/009/010がdelta L14に対応し、既存VUP-REQ-01〜08は旧confirmed pairへ固定され、U18a〜gの下流PLANが起票される。
- 既存`PLAN-L1-06`のconfirmed履歴と本deltaのrevisionが分離される。
- independent design review、design-language、PLAN governance、L1/L14整合testがgreenになる。

## 6. 現在地

要件・運用test-designのadditive freeze、U18a〜g起票、source/item/profile/FSM/contract基盤、active frontier表示まで完了。
L5〜L14への降下、全docs/163 item判定、独立self-proof実装と最終検収は未完である。
