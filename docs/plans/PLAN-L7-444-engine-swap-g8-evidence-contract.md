---
plan_id: PLAN-L7-444-engine-swap-g8-evidence-contract
title: "PLAN-L7-444 (add-impl): engine-swap G8 evidence契約・検証器・program gate"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - typed evidence manifest、contract verifier、doctor/program gate"
  - role: qa
    slot_label: "QA - stale/partial/旧manifest偽GreenのRed oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-444-engine-swap-g8-evidence-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-444-engine-swap-g8-evidence-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks:
    - docs/plans/PLAN-L8-01-engine-swap-integration-verification.md
  references:
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/plans/PLAN-L5-18-vmodel-contract-right-arm-physical-data.md
    - docs/plans/PLAN-L7-168-g8-integration-workflow.md
    - docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
    - docs/plans/PLAN-L7-171-g8-adapter-asset-evidence.md
    - docs/plans/PLAN-REVERSE-444-engine-swap-g8-evidence-backfill.md
review_evidence: []
---

# PLAN-L7-444: engine-swap G8 evidence契約・検証器・program gate

## 1. 目的

既存G8 workflow healthは旧 `IT-MODULE` / `IT-STATE` manifestを読むため、engine-swap固有のL8実証を代替できない。本PLANは旧manifestを壊さず、engine-swapについてだけ canonical `.ut-tdd/evidence/g8-integration/engine-swap.json` と宣言型V-model contractを結合するtyped verifierを実装する。実証前にmanifestを作ってGreenを得ることは禁止する。

## 2. 境界

- 一般 `checkG8IntegrationWorkflow()` は通常G8のworkflow healthを所有し続ける。
- 新 `EngineSwapG8EvidenceManifest` は `contract_revision` / digest、PLAN ID、gate、anchor commit、source tree digest、required IT集合、command receipt、coverage、defer、doctor resultをcanonicalに持つ。
- engine-swap program gateはcontract compilerからL8 obligationとcanonical evidence pathを導出する。旧manifestはengine-swap pass判定へ一切混入させない。
- `engine-swap.json` は全required ITの実証commandが同一anchorで完走した場合だけ生成可能とし、checkerやdoctorが補完・推測してはならない。
- general doctor healthとengine-swap program gateを分離する。未実証はprogramを`IN-PROGRESS`/not-readyにし、通常doctorの無関係な恒常FAILへ変換しない。

## 3. fail-close契約

次を構造化findingにする: canonical manifest不在/壊れ、plan/gate/path/contract digest不一致、anchorがHEAD非到達、unknown/duplicate/missing required IT、selected/mandatory/deferred partition不全、defer理由・waiting layer・期限不正、command/evidence未紐付け、非zero exit、output receipt/digest/path改変、blocking doctor、未実装ITをpassedとする主張。

`IT-VMSOURCE-01..02`、`IT-PLANASSET-01`、`IT-WORKFLOW-01`、`IT-VMCONTRACT-01`、`IT-DOCLEDGER-01..02`、`IT-MODULE-01`、`IT-ASSESS-01`、`IT-SELFPROOF-01`（およびprojection rebuild 3件）のrequired集合はL8 test-designとcontractの両方から照合する。417/418以外の未実装sliceをpassへ読み替えない。

## 4. 実装構造

`src/verification/g8/` に value object / verifier / port / tracked manifest adapterを置く。既存の汎用lintへprogram固有状態機械を埋め込まない。doctor adapterはprogram gate判定をread-onlyで公開し、後続のgate run/Execution Ledger記録はL8の実証完了時にだけ行う。CLIは検証・説明をread-onlyにし、evidence生成コマンドは実行receiptなしでwriteできない。

## 5. TDD Red

`tests/verification/g8-engine-swap-evidence.test.ts` に次を先置きする。

- `U-G8ES-001`: engine-swap canonical manifest不在はnot-readyであり、旧G8 manifestだけではpassしない。
- `U-G8ES-002`: plan/gate/contract digest/anchor/source treeの不一致を拒否する。
- `U-G8ES-003`: required ITの欠落、重複、未知、未実装pass、selected/deferred重複を拒否する。
- `U-G8ES-004`: deferの理由、waiting layer、期限、case参照欠落を拒否する。
- `U-G8ES-005`: command exit/output digest/path改変、doctor blockerを拒否する。
- `U-G8ES-006`: path escape、旧manifest混入、checkerによるevidence補完を拒否する。
- `I-G8ES-001`: `PLAN-L8-01` + contract compiler + live repositoryは実証前にnot-readyを返し、偽passしない。

## 6. AC / 後続

- [ ] 一般G8 workflow healthとengine-swap program gateが別結果として観測できる。
- [ ] canonical manifestとL8 required IT/contract obligationの三面が不一致ならfail-closeする。
- [ ] 実証未完時はL8をcompletedにせず、明示的not-readyとdefer根拠を返す。
- [ ] 417/418 receiptをadapter化後、419/422/424/425の実証を追加し、全mandatory ITを固定commitで実行して初めてmanifestを生成する。
- [ ] L8 complete、gate_runs/Execution Ledger、cross reviewは全required IT証跡の後だけ許可する。
- [ ] Reverse-444で実装事実をgap-only backfillし、detectorを実装へ合わせて緩めない。

## 7. 工程表

| 順序 | 作業 | 完了証跡 |
|---|---|---|
| 1 | typed schema/verifierとRed oracle | U-G8ES fail→Green、contract mismatch負系 |
| 2 | tracked adapter/doctor program-gate | old manifest偽Green 0、live repo not-ready |
| 3 | 417/418 receipt adapter | IT-VMSOURCE/PLANASSET実行receipt |
| 4 | 419/422/424/425後に残ITを実証 | canonical manifest、L8 gate evidence |
