---
plan_id: PLAN-L4-18-roadmap-drive-selection-hardening
title: "PLAN-L4-18 (add-design/function): 工程表 + filing target による駆動モデル選択の設計主導化"
kind: add-design
layer: L4
sub_doc: function
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/design/harness/L4-basic-design/function.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T11:47:11+09:00"
    tests_green_at: "2026-07-08T11:47:11+09:00"
    verdict: approve
    scope: "U2 工程表 + filing target の L4 外部設計 back-fill。設計 SSoT が mode/kind/layer/sub_doc/pairing/current_location/profile を定め、doctor/detector/status はこの projection に従う方針を明示。検出系に設計を合わせるため、detector は finding/signal を出すだけで filing target を創作しない。targeted plan lint、db rebuild、full doctor で検証する。"
    green_commands:
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L4-18-roadmap-drive-selection-hardening.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T11:47:11+09:00"
        evidence_path: docs/design/harness/L4-basic-design/function.md
        output_digest: "sha256:bc792f97eed1c441d4d50c6d037a50419d08a57ccf2d4e48ec51f9798206c5d6"
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T11:47:11+09:00"
        evidence_path: docs/test-design/harness/L9-system-test-design.md
        output_digest: "sha256:e75fa687eb155828faf3aee11f3fbf93d2b8ac97fd490596d3799fd1f41d2db3"
agent_slots:
  - role: tl
    slot_label: "TL - 工程表・現在地・filing target の外部設計判断"
  - role: se
    slot_label: "SE - L4 function と L9 system test design への設計追補"
  - role: qa
    slot_label: "QA - L9 総合テスト観点と右肺接続確認"
generates:
  - artifact_path: docs/plans/PLAN-L4-18-roadmap-drive-selection-hardening.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-03-function.md
  requires:
    - PLAN-L1-06-vmodel-upgrade-requirements
    - PLAN-L5-10-drive-model-router-redesign
  blocks: []
  references:
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    - docs/process/forward/overview.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L9-system-test-design.md
---

# PLAN-L4-18: 工程表 + filing target による駆動モデル選択の設計主導化

## 0. 役割

本 PLAN は U2 として、VUP-REQ-01 / VUP-REQ-02 を L4 外部設計へ反映する。目的は、検出系や route 実装が
都合よく filing 先を決める状態を止め、L4 設計正本が工程表、現在地、駆動モデル、kind、layer、sub_doc、
pairing obligation、profile を決める構成へ寄せること。

## 1. 設計判断

- Forward spine は正規の現在地座標であり、全駆動モデルは出口で Forward のどの L 工程へ戻るかを持つ。
- `route eval` / detector / doctor は signal や finding を出すが、filing target の正本ではない。
- filing target は L4 §3.1 / §3.2 / §3.2.1 の設計表から導出する。
- `.ut-tdd/harness.db` は schedule / filing target の projection であり、authoring source ではない。
- 右肺 `kind=verify` は同じ filing target に乗り、L8-L14 の検証結果は defect routing として左肺へ戻る。

## 2. 変更内容

- `function.md` §3.2.1 を追加し、`routeFiling(signal, context) -> FilingTarget` の外部形状を定義する。
- FilingTarget に `current_location`、`schedule_entry`、`mode`、`allowed_kinds`、`layer_band`、
  `sub_doc_hint`、`pairing_obligation`、`activation_profile`、`forward_insufficient_reason` を含める。
- L9 system test design に ST-FUNC-10 を追加し、detector が設計正本に無い filing target を創作しないことを
  総合テスト観点として固定する。

## 3. 工程表

### Step 1: L4 function へ FilingTarget 外部設計を追加 [直列]

直列理由: file_conflict。`function.md` §3.2 routing の直後に、設計 SSoT と projection 境界を追加する。

進捗: 完了。

### Step 2: L9 system test design へ ST-FUNC-10 を追加 [並列]

別ファイルのため並列可。L4 設計追補に対応する総合テスト観点を追加する。

進捗: 完了。

### Step 3: review (TL self / subagent findings integration) [直列]

直列理由: downstream_dependency。設計 SSoT と検出系の従属関係、Verify の taxonomy、U3/U4 への接続を
TL が確認し、サブエージェント調査結果と矛盾しないことを確認する。

進捗: 完了。

### Step 4: lint / db rebuild / doctor 検証 [直列]

直列理由: downstream_dependency。設計とテスト設計の pair 追補後に targeted lint、DB 再投影、full doctor を確認する。

進捗: 実行待ち。

## 3.1 実装計画

本 PLAN は add-design であり、L4 外部設計と L9 テスト設計のみを変更する。L5 function contract、L7 route
実装、DB schema の追加は後続 U2/U3/U4 の子 PLAN で扱う。ここでは「設計が filing target を定め、検出系は
その投影に従う」という設計順序を正本化する。

## 4. DoD

- [ ] `function.md` に FilingTarget 外部設計がある。
- [ ] FilingTarget が工程表、現在地、mode、kind、layer、sub_doc、pairing、profile を含む。
- [ ] detector / doctor / route eval は設計 SSoT 由来の filing target に従うと明記されている。
- [ ] `L9-system-test-design.md` に ST-FUNC-10 がある。
- [ ] `ut-tdd plan lint` / `db rebuild` / `doctor` が green。

## 5. 後続

- L5/L6: `routeFiling` contract と schedule projection の内部処理・関数仕様。
- L7: route eval / doctor / detector が FilingTarget を返す実装。
- U3/U4: declarative spec IR と DB-backed detection の schema / projection 設計。
