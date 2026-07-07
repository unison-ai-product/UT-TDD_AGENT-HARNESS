---
plan_id: PLAN-L7-308-plan-archive-mechanism
title: "PLAN-L7-308 (impl): PLAN archive 経路 — completed 台帳の可逆な退避で 482 本の走査コストを抑える"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - archive 条件 (completed + 180 日) の承認と v2 活性化時期"
  - role: tl
    slot_label: "TL - 参照整合 (trace/graph/依存) を壊さない退避設計のレビュー"
  - role: se
    slot_label: "SE - plan archive コマンド + advisory 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-308-plan-archive-mechanism.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-300-doctor-scoped-execution.md
---

# PLAN-L7-308 (impl): PLAN archive 経路

## Status

**version-up parked (v2)**。A-181 DV-4。wave 4 (低優先) — PLAN-L7-300 (doctor 高速化) が先に入れば走査コスト面の緊急性は下がるため、価値は「台帳の見通し」寄り。

## 背景 (実測 2026-07-03)

- docs/plans/ は 482 本 (confirmed 398 / draft 57 / completed 25 / **archived 1**)。増加は週 5〜10 本ペース、archive への昇格経路が事実上存在しない (手作業 1 例のみ)。
- 482 本の全走査が doctor の複数 check・オーケストレータの Glob/Grep 双方のコストを押し上げ続ける。参照されない completed が本流ディレクトリに滞留するほど、後続モデルの探索ノイズも増える。

## スコープ (1 要件: completed PLAN を参照整合を壊さず可逆に退避する正規経路を作る)

1. **`ut-tdd plan archive <plan_id>`**: 対象を `docs/plans/archive/` へ移動し frontmatter `status: archived` + `archived_at` を刻印。**条件検査**: status=completed かつ updated から 180 日超のみ許可 (それ以外は要 `--force` + 理由)。dry-run 既定。
2. **参照整合の保証**: 移動前に他 PLAN の `dependencies.requires/references` と設計 doc からの被参照を検索し、被参照が生きている場合は移動を拒否 (参照切れの発生を防ぐ)。plan_registry / trace 系投影は archive 後もパス更新で追随 (relation graph の node は消さない)。
3. **advisory**: doctor `plan-archive-candidates` — archive 条件を満たす completed が N 本 (既定 30) を超えたら候補一覧を advisory 表示。**機械自動移動はしない** (履歴連続性のため人間/PO 起動)。
4. lint/doctor の PLAN 走査は archive/ も読める必要があるものと読まない方が正しいものがある — 各 check の扱い (含む/除く) を表にして TL レビュー (ここが本 PLAN の主要な設計作業)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | check 別 archive/ 走査要否の表 + TL レビュー | 直列 |
| 2 | plan archive コマンド (条件検査 + 参照整合 + dry-run) | 直列 |
| 3 | 投影/graph のパス追随 | 直列 |
| 4 | advisory check + regression test (被参照ありは拒否 / archived が trace から消えない) | 直列 |

## DoD

- [ ] 被参照が生きている PLAN の archive が拒否される (test 固定)
- [ ] archive 後も doctor 全 check が green を維持し、trace/graph に orphan が生じない (real-repo で doctor 実行)
- [ ] 候補 advisory が条件該当のみ列挙する (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/cli.ts` (plan archive)、PLAN loader 群 (`loadReviewPlans` 相当 — archive/ 込み読みのオプション化)、`src/state-db/projection-writer.ts` (パス追随)。
- `docs/plans/archive/` は既存 1 本 (archived) の置き場と整合させる — 着手時に現状の archived 1 本がどこに居るかを確認し、同じ規約に揃える。
- git 履歴は `git mv` で追跡を保つ。
