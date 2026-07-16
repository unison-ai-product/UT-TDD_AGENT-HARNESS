---
plan_id: PLAN-L6-87-nfr-contract-evidence-gate-contracts
title: "PLAN-L6-87 (add-design): NFR Contract / Normalized Evidence / NFR Gate core の機能契約 — Phase 1 freeze"
kind: add-design
layer: L6
sub_doc: function-spec
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / TL
parent_design: docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - contract/evidence schema の型契約と gate fail-close 条件 8 種の判断"
  - role: qa
    slot_label: "QA - pass/fail 両再現の負系 fixture と digest/期限/環境流用 oracle の設計"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/plans/PLAN-L6-87-nfr-contract-evidence-gate-contracts.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md
  requires:
    - docs/plans/PLAN-L3-03-nfr-grade.md
  blocks: []
  references:
    - docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md
    - docs/plans/PLAN-L3-08-nfr-contract-catalog.md
    - src/lint/verification-profile-catalog.ts
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/improvement-backlog.md
review_evidence: []
---

# PLAN-L6-87 (add-design): NFR Contract / Evidence / Gate core の機能契約

## 1. 問題 (非機能検証基盤 改善指示書 2026-07-16 Phase 1 / IMP-170, IMP-171)

L4-31 の 5 層方式を実装へ降下させる L6 機能契約が存在しない。契約なしで L7 実装へ進むと、
schema・fail-close 条件・adapter port が実装都合で決まり、「ツール実行成功 = 合格」「raw 出力の
gate 直結」という指示書の禁止事項をすり抜ける実装が Green になり得る。

## 2. 設計範囲 (Phase 1 契約のみ)

1. **NFR Contract 型契約**: zod schema の入出力契約。必須 field (id / category / stage / environment /
   metrics)、12 category enum、未知 category・閾値欠落・stage 未定義の reject を型 + parse 契約で固定。
2. **Normalized Evidence 型契約**: `contract_id` / `stage` / `profile_id` / `environment` /
   `tool.name` / `tool.version` / `measured` / `thresholds` / `verdict` / `executed_at` /
   `artifact_digest` (sha256) を必須とする evidence schema。raw ツール出力は evidence artifact として
   別置し、gate は normalized row のみ参照する port 契約。
3. **NFR Gate core 契約**: fail-close 条件 8 種を関数契約として固定 — (a) 必須契約に evidence 無し /
   (b) 対象外環境の evidence 流用 / (c) tool version 不明 / (d) evidence digest 不一致 / (e) 閾値超過 /
   (f) evidence 期限切れ / (g) 対象 stage 不一致 / (h) manual evidence 必須項目の人間承認欠落。
   各条件に対応する finding 型と doctor 統合点を宣言。
4. **Tool Adapter port 契約**: adapter は `(rawOutput, contract) → NormalizedEvidence` の純関数 port と
   し、閾値判定 (verdict 決定) は gate core が単独所有する (adapter へ NFR ロジックを分散させない)。
5. **verify recommend 決定論契約**: 変更ファイル・NFR category・対象 stage・実行環境 → 推薦 profile 集合
   の決定論写像。既存 `SIGNAL_TO_PROFILE` への NFR signal 追加契約。
6. **evidence 信頼アンカー契約 (2026-07-16 抜け監査 #2)**: digest は自己申告であり単独では改竄検知に
   ならない (IMP-149/158 教訓と同型)。evidence を `anchor_commit` + append-only receipt へ束縛し、
   contract 側の version/digest も evidence 必須 field に含める (旧契約 pass の新契約への流用を
   fail-close 条件 (i) contract version/digest 不一致 として追加、計 9 条件)。
7. **統計的判定契約 (同 #4)**: 測定回数・warmup・分散が契約宣言を満たさない evidence は
   verdict=pass でも gate reject。単発測定・mean-only を型と parse の両方で不可能にする。

## 3. 受入条件

- fail-close 9 条件 (8 条件 + contract version/digest 不一致) それぞれに負系 fixture 仕様
  (入力 → 期待 finding) が宣言され、宙吊り条件 0 件。
- gate core 自身の self-proof 方針 (mutation survivor 0、PLAN-L4-28 流儀) が L7 test design へ
  trace される。
- サンプル契約で pass / fail 両方を再現する oracle 仕様が L7 unit test design へ trace される
  (指示書 §6: 最低 3 profile pass/fail 両再現の第一歩)。
- 平均値のみでの性能判定を型で不可能にする (percentile 指標を metrics 語彙に含める)。
- `ut-tdd plan lint` / doctor green。

## 4. 降下先

L7 実装 (schema zod 化 / gate core / NFR-STATIC・NFR-SEC-CODE・NFR-PERF-SMOKE adapter) は本契約
freeze 後に Phase 単位の add-impl + Reverse pairing で後続起票する。本 PLAN では実装しない。
