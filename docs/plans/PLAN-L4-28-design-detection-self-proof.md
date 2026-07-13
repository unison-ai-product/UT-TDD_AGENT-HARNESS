---
plan_id: PLAN-L4-28-design-detection-self-proof
title: "PLAN-L4-28 (add-design): 設計由来detectorの独立自己証明・mutation統制"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-13
owner: PO / Codex
parent_design: docs/process/vmodel-contract.yaml
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - authoring source/compiler/detector/meta-verifierの信頼境界"
  - role: se
    slot_label: "SE - deterministic generation、digest、coverage、receipt設計"
  - role: qa
    slot_label: "QA - mutation、negative control、false-negative/positive、rebuild再現"
generates:
  - artifact_path: docs/process/design-detection-self-proof.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/vmodel-contract.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/plans/PLAN-L4-27-vmodel-semantic-self-audit.md
    - docs/adr/ADR-008-forward-fsm-plan-asset-v2.md
---

# PLAN-L4-28: 設計由来detectorの独立自己証明・mutation統制

## 1. 問題

設計を機械可読化しても、detectorが未配線、欠落rule、fail-open、stale生成物、自己参照oracleであれば統制は成立しない。
「doctorがgreen」と「設計どおりの違反を実際に検出できる」を分け、後者を独立証明する。

## 2. 信頼境界

```text
authored design contract
  → schema validator
  → deterministic compiler / registry
  → runtime detector / doctor
  → normalized finding / evidence receipt

independent meta-verifier
  ├─ authored source completeness
  ├─ source hash ↔ generated digest
  ├─ contract rule ↔ detector registration exactly-once
  ├─ mutation / negative controlで実発火
  └─ receipt ↔ commit / revision / test run照合
```

meta-verifierは検査対象detectorのpass/fail関数をoracleとして再利用しない。構造、digest、fixture期待値、process exitを
独立に照合する。

## 3. 自己証明receipt

各ruleは少なくとも`rule_id`、contract_revision、source_hash、generated_hash、detector_id、positive fixture、negative fixture、
expected finding/exit、actual finding/exit、test_run_id、source commit、verified_at、verifier versionを持つ。

## 4. 受入条件

- contractの全rule/gateがdetector registryへexactly once登録され、orphan/duplicate 0である。
- source変更で生成digestがstaleならdetector実行前にfail-closeする。
- 各ruleに違反fixtureと正常fixtureがあり、違反で必ず期待finding/exit、正常でfalse-positive 0を確認する。
- mutationで条件削除、mappingずれ、detector未配線、例外握り潰し、DB-only補完を注入し、meta-verifierが全て検出する。
- CLI、hook、doctor、CIが同じrule identity/verdictを返し、surface欠落を検出する。
- DB全削除/rebuild後もreceipt identityとfinding結果が再現する。
- self-proof receiptが無いruleは「未統制」であり、green coverageへ含めない。
- verifier自身にもunit/property testと別model family reviewを要求する。

## 5. 降下先

L5 receipt/schema、L6 compiler/verifier contract、L7 small modules/CLI/doctor/CI、L9 mutation system testへ降下する。

## 付録A: negative-fixture 現況マッピング (2026-07-13 監査)

外部指摘 12 種の既知欠陥について「異常系入力で検出器が Red になることを assert
するテスト」の現況を監査した結果。L7 降下時の fixture 設計の初期スコープとして
使う (有=既存 fence を再利用、無/限定=本 PLAN 系列で新設)。

| 欠陥種 | 現況 | 根拠 |
|---|---|---|
| duplicate YAML key | 無 (parser は yaml v2 uniqueKeys 既定で fail-close だが専用負系テスト無し。parse error に対象ファイル名が付かない改善余地あり) | `src/plan/lint.ts:151` |
| merge key `<<` 衝突 | 無 (`merge: true` 非指定のため merge key 自体が無効。未文書化・未テスト) | `src/plan/lint.ts:3` |
| evidence 欠落 | 有 | `tests/review-evidence.test.ts:235-240` |
| revision 不一致 | 限定的 (vmodel additive pairing のみ) | `tests/vmodel-pair.test.ts:136-151` |
| stale evidence 流用 | 有 | `tests/green-command-digest.test.ts:69-80,181-191` |
| deny artifact 混入 | 無 (検出ロジックは PR #43 で出力側判定へ是正済みだが、意図的混入の負系 fixture 無し) | `src/setup/distribution.ts:254`, `tests/distribution-acceptance.test.ts` |
| orphan gate run | 有 | `tests/doctor.test.ts:198-214` |
| DB projection drift | 有 | `tests/db-currency.test.ts:48-63` 他 |
| Markdown-ledger 不一致 | 有 | `tests/merged-plan-status.test.ts` |
| generated registry drift | 表層のみ (実 repo の正常系確認のみ、合成破損 fixture 無し) | `tests/fr-registry-audit.test.ts:19-66` |
| workspace 汚染 | 有 (top-level drift のみ。テスト残渣 fence は PLAN-L7-421 側) | `tests/tracked-canonical.test.ts:13-20` |
| Windows path 衝突 | 無 (case 衝突 / 予約名 / 長パス等の検出ロジック自体が不在。新規 detector 設計が必要) | `src/lint/personal-path.ts`, `src/lint/runtime-portability.ts` |
