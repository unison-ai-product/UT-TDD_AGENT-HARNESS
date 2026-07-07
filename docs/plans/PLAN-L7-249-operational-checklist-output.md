---
plan_id: PLAN-L7-249-operational-checklist-output
title: "PLAN-L7-249 (impl): 運用チェック項目の自動出力 (機械判定 + 人間境界の合成 checklist)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - checklist 合成 (OT 抽出 + doctor/DB 判定注入 + markdown 出力)"
  - role: po
    slot_label: "PO - scope 種別 (release / ops / session) と人間境界項目の確定"
generates:
  - artifact_path: docs/plans/PLAN-L7-249-operational-checklist-output.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/test-design/harness/L1-operational-test-design.md
    - .ut-tdd/audit/A-171-full-release-close-checklist-2026-07-01.md
    - src/doctor/index.ts
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-249 (impl): 運用チェック項目の自動出力

## Status

draft 起票 (PO 要望 2026-07-02「運用のチェック項目の出力とかできるかな？」)。

## 背景 — 素材は構造化済み、合成器が無い

- **OT-01〜47** (`docs/test-design/harness/L1-operational-test-design.md`) が表構造 (OT-ID / 検証する要求 / 運用検証観点 / 合否目安) で機械抽出可能。
- **機械判定源**が DB/doctor に揃っている: doctor gate 結果、`roadmap_band_coverage` (band 状態)、`gate_runs`、`status --json` (outstanding/defers)、CI 状態、`issue_queue` (2 件)。
- **人間境界の checklist 前例**: A-171 (full release close) が boundary/実行者/必要証拠/close 更新先の表として手書き済み — これを生成対象の書式正本にできる。
- 現状、これらを 1 枚の運用 checklist に合成する出力器が存在しない (handover §1-§2 auto とは別物: handover は引き継ぎ、これは運用判定)。

## スコープ

`ut-tdd checklist --scope <release|ops|l14|session>` (名称は実装時確定):

1. **機械判定項目**: doctor / band coverage / outstanding / CI を実行時評価し ✅/❌ を自動記入 (evidence 参照付き。「宣言でなく実行結果」= coding ≠ substance 原則)。
2. **人間境界項目**: OT-* の運用観点 + A-171 型 boundary (UAT / signing / PO サインオフ) を未チェック □ + 必要証拠欄で出力 — 機械が勝手に ✅ を付けない (人間承認の代筆禁止)。
3. 出力は markdown (audit 配置可能な形) + `--json`。実行記録を DB へ投影 (document_export_runs 系 or 専用) し、checklist 発行履歴を追跡可能に。
4. scope 定義は宣言的 (どの OT 帯 / どの gate / どの boundary を含むか) にして新 scope 追加を設定で可能に。
5. **strict evidence gate の発火点設置 (A-178 G-13)**: `doctor --strict-green-command-digest` (PLAN-L7-194 で opt-in 化された fake-substance 検知) を release scope の機械判定項目に含める — 現状どの制御点からも呼ばれておらず、release checklist を定常の発火点にする。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | scope 定義スキーマ + 書式 (A-171 準拠) 確定 (PO) | 直列 |
| 2 | OT 抽出 + 機械判定注入の合成器実装 | 直列 |
| 3 | DB 投影 + regression test (機械項目が実行結果と一致すること) | 直列 |

## DoD

- [ ] `checklist --scope release` が A-171 相当の checklist を機械判定済み状態で出力 (test 固定)
- [ ] 人間境界項目が自動 ✅ にならないことを test で固定
- [ ] 発行履歴が DB に投影される
