---
plan_id: PLAN-L7-427-workspace-artifact-integrity-gate
title: "PLAN-L7-427 (troubleshoot): workspace/artifact 整合 gate — DB orphan の gate 化 + Pack manifest/SHA 照合 + registry drift 負系 fence"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-13
updated: 2026-07-13
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "既存の可視化・生成機構 (orphanTraceEdges 報告 / Pack sync manifest 生成) を fail-close gate へ昇格させる欠陥是正であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — gate 境界の設計判断 (report-only と fail-close の線引き)"
  - role: se
    slot_label: "SE — doctor check 追加 / manifest-SHA 照合 / 負系 fixture 実装"
  - role: qa
    slot_label: "QA — 負系 fixture が確実に Red になることの独立検証"
  - role: tl
    slot_label: "TL — PLAN-L7-421 fence / PLAN-L7-413 acceptance との重複排除レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-427-workspace-artifact-integrity-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - docs/plans/PLAN-L7-413-distribution-export-integrity-defects.md
    - docs/plans/PLAN-L4-28-design-detection-self-proof.md
review_evidence: []
---

# PLAN-L7-427 (troubleshoot): workspace/artifact 整合 gate

## 背景 (2026-07-13 基盤欠陥指摘の検証監査)

外部指摘「workspace cleanliness gate の不在」を検証した結果、テスト残渣 fence
と `.ut-tdd/` 誤配置検出は PLAN-L7-421 が捕捉済みだが、以下 3 点は既存 PLAN の
どれにも載っていない残ギャップと確認した。

- **W-1 (DB orphan が report-only)**: `src/state-db/maintenance.ts:24-39` の
  `countOrphanTraceEdges()` は `ut-tdd db status` の報告値のみで、doctor の
  check 一覧 (`src/doctor/check-definition-groups.ts`) に配線されておらず
  fail-close しない。orphan row が増えても CI は green のまま。
- **W-2 (Pack manifest/SHA は生成のみで照合 gate 無し)**: `src/cli/distribution.ts`
  は `.ut-tdd-pack-sync-manifest.json` と sha256 checksum を生成するが、
  manifest ↔ source SHA の一致を検証して不一致で fail する gate が doctor /
  CI / distribution acceptance のいずれにも無い (再現性 claim が機械検証
  されていない)。
- **W-3 (generated registry drift の負系不在)**: `tests/fr-registry-audit.test.ts`
  は現行 repo の正常系 (orphan=0/mismatch=0) 確認のみ。
  `src/lint/fr-registry-audit.ts` の異常系ロジック (unregistered /
  attributeOrphans / countMismatches) を実発火させる合成破損 fixture が無く、
  検出器が壊れても green になりうる (coding ≠ substance)。

## 工程表

### Step 1: [並列] W-1 DB orphan gate 化
- `orphanTraceEdges` (および同種 orphan 計数) を doctor check として配線し、
  閾値超過で fail-close する。合成 orphan 注入の負系テストを添える。

### Step 2: [並列] W-2 Pack manifest/SHA 照合 gate
- distribution acceptance に「manifest 記載 SHA ↔ 実 source/artifact SHA
  一致」検証を追加し、不一致 fixture で Red を実証する。照合は出力側
  (artifact 集合) に対して行い、PLAN-L7-413 の D-2 semantics (入力存在で
  block しない) を踏襲する。

### Step 3: [並列] W-3 registry drift 負系 fixture
- `fr-registry-audit` の各異常系分岐 (unregistered / orphan / count mismatch)
  を発火させる合成 fixture テストを追加する。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。全テスト green + doctor exit 0 +
  追加負系 fixture が全て意図どおり Red 検出することを確認。

## AC

- [ ] DB orphan が doctor で fail-close し、合成 orphan 注入テストが Red を
      実証する (実コマンド evidence 付き)。
- [ ] Pack manifest/SHA 不一致が distribution acceptance で fail し、
      不一致 fixture テストが Red を実証する。
- [ ] fr-registry-audit の異常系分岐すべてに発火 fixture がある。
- [ ] 既存正常系は false-positive 0 (full suite green)。

## Boundary

- テスト残渣 fence / vitest 設定 / `.ut-tdd/` 誤配置検出は PLAN-L7-421 の
  スコープであり本 PLAN では扱わない。
- deny semantics の変更は行わない (PLAN-L7-413 確定済み挙動を維持)。
- detector 自己証明の一般機構 (mutation / receipt) は PLAN-L4-28 系列の
  スコープであり、本 PLAN は上記 3 ギャップの個別是正に限定する。
