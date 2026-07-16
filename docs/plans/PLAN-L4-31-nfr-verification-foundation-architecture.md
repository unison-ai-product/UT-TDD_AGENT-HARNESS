---
plan_id: PLAN-L4-31-nfr-verification-foundation-architecture
title: "PLAN-L4-31 (add-design): 非機能検証基盤の方式設計 — NFR Contract → Profile → Adapter → Evidence → Gate 5 層と実行環境分離"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / TL
parent_design: docs/plans/PLAN-L3-08-nfr-contract-catalog.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - 5 層構造の責務境界と既存 verify/doctor/gate/harness.db への統合方式判断"
  - role: se
    slot_label: "SE - 実行環境 4 面 (local / GHA / VPS staging / AWS) の割当と evidence 流用禁止境界の設計"
  - role: qa
    slot_label: "QA - stage 割当 (L7-L14) と G-VERIFY gate の NFR evidence 要求の oracle 設計"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L3-08-nfr-contract-catalog.md
  requires:
    - docs/plans/PLAN-L3-08-nfr-contract-catalog.md
    - docs/plans/PLAN-L7-34-tool-adapter-probes.md
  blocks: []
  references:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - src/lint/verification-profile-catalog.ts
    - docs/improvement-backlog.md
review_evidence: []
---

# PLAN-L4-31 (add-design): 非機能検証基盤の方式設計

## 1. 問題 (非機能検証基盤 改善指示書 2026-07-16 / IMP-169〜172)

現行の verify 基盤は `src/lint/verification-profile-catalog.ts` の 8 profile (bun-unit / doctor / MCP 系 /
test-foundation 系) のみで、非機能検証 (性能・耐障害・セキュリティ実測・復旧・可観測性) を扱う
profile・adapter・evidence・gate が存在しない。具体的弱点:

- `verify recommend` の入力 signal に NFR category / 対象 stage / 実行環境が無く、NFR profile を
  決定論的に推薦できない。
- ツール raw 出力を gate 判定へ直結する以外の経路が無い (正規化層不在)。
- G-VERIFY.L8-L14 は PLAN-M-00-verify-cutover で passed だが、NFR 実測 evidence は 0 件のまま
  (「ツール実行成功 = 合格」型の弱点と同型)。
- VPS staging の実測を AWS 本番相当と誤読する境界 (環境 binding) が未定義。

## 2. 設計範囲

1. 5 層構造の方式確定: NFR Contract → Verification Profile → Tool Adapter → Normalized Evidence →
   NFR Gate。各層の責務・入出力型・所有 module 境界 (`src/lint` / `src/doctor` / 新設 `src/nfr` 等) を
   `architecture.md` へ追記。NFR 判定ロジックを adapter 側へ分散させない (指示書 §7)。
2. stage 割当: L7 (軽量静的 + security gate) / L8 (結合障害・data integrity) / L9 (負荷・耐久・DAST・
   互換・a11y) / L10 (人間ユーザビリティ) / L11 (AWS 負荷分散・冗長・復旧) / L12 (release 証跡集約) /
   L13-L14 (本番観測・SLO/MTTR/cost)。既存 V-model gate (G8-G14) への NFR evidence 要求の接続点を定義。
3. 実行環境 4 面の割当と流用禁止: local / GitHub Actions / VPS staging / AWS。environment を evidence の
   必須 field とし、対象外環境の evidence 流用を gate fail-close にする方式を宣言。
4. Verification Profile 拡張方針: 初期 8 profile (NFR-STATIC / NFR-SEC-CODE / NFR-PERF-SMOKE /
   NFR-PERF-STAGING / NFR-RESILIENCE / NFR-WEB-QUALITY / NFR-RECOVERY / NFR-OBSERVABILITY) を既存
   catalog へ統合し、riskTier / requiresNetwork / requiresHumanApproval 等の既存 safety field を継承。
5. Tool Adapter 候補 (k6 / Trivy / Gitleaks / Semgrep or CodeQL / Checkov / OWASP ZAP / Playwright /
   axe-core / Toxiproxy) の adapter port 方針: raw 出力は evidence artifact として保存、gate は
   normalized row のみ参照 (IMP-120 `tool_runs` 構想と接続)。
6. harness.db projection 方針: `nfr_contracts` / `nfr_evidence` の projection table 追加方針を宣言
   (物理設計は L5 carry)。

## 3. 受入条件

- 5 層それぞれの責務と禁止事項 (指示書 §7) が architecture.md に明文化され、既存系統 (V-model /
  doctor / verify profile / harness.db / Gate) への統合点が全て特定されている (別系統化 0)。
- stage × environment × profile の割当表が L7-L14 全 stage を被覆する。
- 実装 Phase 順 (Phase 1: schema + gate core → Phase 2: STATIC/SEC-CODE/PERF-SMOKE → Phase 3:
  staging 系 → Phase 4: recovery/observability/AWS) が後続 PLAN 起票単位として宣言されている。
- `ut-tdd plan lint` / doctor green。

## 4. 降下先

- L5 物理データ設計 (projection schema / DDL) と L6 契約 (PLAN-L6-87) が本方式を受ける。
- L7 実装は Phase 単位の add-impl + Reverse pairing で後続起票。本 PLAN では実装しない。
