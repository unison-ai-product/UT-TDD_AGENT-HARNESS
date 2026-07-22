---
plan_id: PLAN-L7-453-provider-execution-receipt-contract
title: "PLAN-L7-453 (add-impl): provider execution capability / terminal receipt contract"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
owner: Codex TL / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - provider execution port / receipt implementation"
  - role: qa
    slot_label: "QA - capability fail-close / cleanup oracle verification"
  - role: tl
    slot_label: "TL - external boundary and native custody separation review"
generates:
  - artifact_path: docs/plans/PLAN-L7-453-provider-execution-receipt-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/external-if.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
  - artifact_path: src/runtime/provider-execution.ts
    artifact_type: source_module
  - artifact_path: tests/provider-execution.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-20-runtime-adapter-session-lifecycle.md
  requires:
    - docs/plans/PLAN-L6-20-runtime-adapter-session-lifecycle.md
    - docs/design/harness/L4-basic-design/external-if.md
    - docs/plans/PLAN-L7-68-provider-dispatch-portability.md
    - docs/plans/PLAN-L7-203-windows-provider-spawn-verbatim.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L7-453 (add-impl): provider execution capability / terminal receipt contract

## §0 位置づけ

既存の provider adapter は provider の解決、stdin、Windows `.cmd` quoting、session lifecycle を扱うが、
実行方式が deadline、terminal observation、process-tree custody、descendant reap を実際に提供できるかを
起動前に証明する共通契約と、全 terminal path を一意に閉じる receipt を持たない。

本PLANは `PLAN-L7-68` / `PLAN-L7-203` の確定済み実装を後から拡張扱いにせず、L4 external boundary と
L6 function contract に追加された意味を独立した L7 資産として所有する。検出器の allowlist や本文への
偶発的なパス記載で孤児判定だけを回避しない。

既存実装から判明した capability / terminal receipt の設計欠落は
`PLAN-REVERSE-453-provider-execution-receipt-backfill` がR4で上流へ引き戻す。本PLANは
`PLAN-L6-20-runtime-adapter-session-lifecycle` を設計祖先としてForwardへ再合流し、
`route_signal: feature_addition` / `route_mode: add-feature` の証明書を持つ。

## §1 契約範囲

- HARNESS policy が要求する capability 集合をcaller入力にせず固定正本として保持する。
- adapter port が提示する execution kind と capability を起動前に照合し、不足・unknown・未登録値を
  fail-closeする。能力不足時に別方式へsilent fallbackしない。
- 受理した invocation は success / provider non-zero / timeout / cancel / adapter error を同一schemaの
  terminal receiptへ正規化する。
- receipt は invocation binding、deadline、開始・終了時刻、provider exit、cleanup結果を検証する。
- provider exit 0であっても cleanup未検証、orphan残存、custody未解放、reap未完了なら成功にしない。
- Windows Job Object / POSIX process group・cgroup の実装そのものは native Resource Kernel の
  `ST-RGK-*` 責務とし、fake portのGreenをOS custody証拠へ流用しない。

## §2 TDD / 対応表

| 設計契約 | テスト設計 | 実装 / テスト |
|---|---|---|
| L4 `external-if.md` §3.1 capability preflight | U-ADAPTER-010/011 | `preflightProviderExecution` / `tests/provider-execution.test.ts` |
| L6 `executeProviderWithReceipt` | U-ADAPTER-012/013 | `executeProviderWithReceipt` / `tests/provider-execution.test.ts` |
| L6 `finalizeProviderExecution` | U-ADAPTER-014/015 | `validateProviderReceipt` / `finalizeProviderExecution` / `tests/provider-execution.test.ts` |
| L9 system boundary | ST-EXT-07 | provider adapter integration evidence。native custodyは `ST-RGK-*` に分離 |

## §3 工程表

### Step 1: [直列] 上流境界とL6関数契約

L4 external boundaryで方式非依存invariantを定義し、L6でrequest / preflight / receipt / outcomeへ落とす。

### Step 2: [並列] L7 unit oracleとL9 system oracle

U-ADAPTER-010〜015とST-EXT-07を追加し、unit fakeとnative custodyの証拠境界を明記する。

### Step 3: [直列] port / receipt実装

Step 1/2の契約を `src/runtime/provider-execution.ts` の小さな純粋関数と注入portへ実装する。

### Step 4: [直列] integration / review / confirm

unit契約だけでなく既存provider adapterとのintegration evidenceをST-EXT-07へ接続し、別runtime review後に
`status: confirmed`へ進める。native OS custodyの未実装を本PLANのmock Greenで閉じない。

## §4 検証状態

- U-ADAPTER-010〜015のtest codeは存在する。
- `impl-plan-trace`は本PLANの`generates`でsource/test ownershipを検査する。
- ST-EXT-07 integration evidenceとcross-runtime reviewは未完了のため、本PLANは`draft`のままとする。
- Bun永久BAN後のローカル検証ではBunコマンドを使わない。Node移行済みの正規runnerまたはCI evidenceで
  Greenを再取得するまで、既存の互換runner結果を完成証拠として扱わない。

## §5 DoD

- [x] L4/L6設計とL7 unit test designが対になっている。
- [x] `src/runtime/provider-execution.ts`と`tests/provider-execution.test.ts`がPLAN資産に所有される。
- [x] capability不足、receipt不正、cleanup不成立をfail-closeするunit oracleが存在する。
- [ ] ST-EXT-07のprovider adapter integration evidenceがGreenである。
- [ ] Node正規runnerでtargeted test / typecheck / lintがGreenである。
- [ ] 別runtime reviewでCritical/High/Important 0を確認し、review evidenceを記録する。
