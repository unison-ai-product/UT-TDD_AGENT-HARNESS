---
plan_id: PLAN-L6-80-doctor-decomposition-check-contract-pairs
title: "PLAN-L6-80 (add-design/function-spec): doctor 分解 — check 単位の L6 契約 pair + pure core/adapter 分離 + 環境検査隔離"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-14
updated: 2026-07-14
owner: PO / TL
parent_design: docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: aim
    slot_label: "AIM - pure core / adapter 境界の設計判断 (check I/O 依存の注入方式)"
  - role: tl
    slot_label: "TL - check ↔ L6 契約 pair の粒度と環境検査の隔離境界レビュー"
  - role: qa
    slot_label: "QA - check 単位 oracle の fixture 設計 (live repo 非依存)"
generates:
  - artifact_path: docs/plans/PLAN-L6-80-doctor-decomposition-check-contract-pairs.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L5-22-detector-self-proof-receipt-physical-data.md
    - docs/plans/PLAN-L7-425-independent-detector-meta-verifier.md
    - docs/plans/PLAN-L7-183-doctor-test-performance.md
    - docs/plans/PLAN-L7-377-doctor-definition-groups.md
review_evidence: []
---

# PLAN-L6-80 (add-design): doctor 分解 — check 単位の L6 契約 pair

## 1. 問題 (PO 指摘 2026-07-14)

doctor は「エンジンと対になる検証器」であるべきなのに、現状は事実上の E2E である:

- `tests/doctor.test.ts` の real-repo aggregate は 1 テスト 6 分超 (U-TESTHYGIENE-028 実測
  389 秒)。live repo 全体 + harness.db rebuild に依存し、単一 check の退行が aggregate
  の中でしか観測できない。
- check (60+) の大半は L6 機能契約と 1:1 の pair を持たず、「doctor が green」という
  合算値だけが正しさの根拠になっている (coverage ≠ substance)。doctor 自身の正しさを
  保証する独立 oracle が無い (L7-425 の meta-verifier 系列が未着手のまま)。
- check 実装が repo 走査 (I/O)・git 呼び出し・判定ロジックを 1 関数に混在させ、
  fixture 単体で判定ロジックだけをテストできない。環境依存 (bun PATH / git 状態 /
  Windows path) の検査が機能検査と同じ層に混ざる。

## 2. 設計方針

1. **check ↔ L6 契約 pair**: 各 doctor check を L6 function-spec の契約 1 項目と対にし、
   check_id ↔ 契約 ID ↔ L7 oracle (fixture 単体テスト) の 3 点 trace を DB projection で
   機械検証する (pair 不在 check は fail-close で台帳化)。
2. **pure core / adapter 分離**: 判定ロジックを pure 関数 (入力 = 構造化データ、出力 =
   violation list) へ分離し、repo 走査・git・DB 読みは adapter へ隔離する。L7 oracle は
   pure core を fixture で直接叩き、live repo 非依存で全分岐を検証する。
3. **環境検査の隔離**: toolchain / PATH / git 状態などの環境 precondition 検査を
   機能 check から分離した profile (`environment`) へ移し、aggregate の実行時間と
   失敗帰属を機能検査と切り離す。
4. 既存の extraction 系 PLAN (L7-217〜L7-380 の doctor 分割群) は adapter 層の分割として
   再利用し、本 PLAN は「契約 pair + pure core 化」という検証構造の設計を追加する。

## 3. スコープ外

- meta-verifier 本体 (独立 detector の自己証明) は `PLAN-L7-425` / `PLAN-L6-77` の scope。
- 個別 check の判定仕様変更 (本 PLAN は構造の設計のみ、挙動不変)。

## 工程表

### Step 1: [直列] check 台帳と L6 契約 pair の設計
- 直列理由 = **downstream_dependency** (台帳の粒度が Step 2 以降の分割単位を決める)。
- 現行 check 全件を棚卸しし、L6 function-spec 契約 ID との対応表 (pair 台帳) を設計する。
  pair 不在 check は debt として台帳に明示する。

### Step 2: [並列] pure core / adapter 分離の function contract
- 代表 check 3 系統 (plan-governance / source-trace / runtime-surface) で pure core の
  入出力契約を定義し、L6 function-spec へ記載する。

### Step 3: [並列] 環境検査 profile の設計
- environment precondition check の一覧と隔離 profile の契約を設計する。

### Step 4: [直列] L7 テスト設計への pair-freeze
- 直列理由 = **verification_gate**。check 単位 oracle の命名規約と fixture 方針を
  `docs/test-design/harness/L7-unit-test-design.md` へ freeze する。

## AC

- [ ] check ↔ L6 契約 ↔ L7 oracle の 3 点 trace 台帳が設計され、pair 不在 check が
      debt として列挙されている (lint 化の受け口を含む)。
- [ ] 代表 3 check の pure core 入出力契約が L6 function-spec に記載され、fixture 単体で
      判定ロジックを検証できる形になっている。
- [ ] 環境検査が機能検査から profile 分離される設計が記載されている。
- [ ] 挙動不変 (既存 doctor の判定結果は変わらない) が設計上明記されている。
