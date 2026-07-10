---
plan_id: PLAN-L7-420-ci-strict-evidence-gates
title: "PLAN-L7-420 (troubleshoot): evidence 裏取り gate の CI 実効化 — green-command-digest 不一致 30 件 (17 PLAN) の再棚卸し + strict gate の CI 投入 + advisory 恒久化の meta 検出"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-10
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "L7-132/174/194 系列 (green-command-digest) と L7-192 (telemetry provenance) が導入済みの検証機構の運用実効化・退行是正であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: qa
    slot_label: "QA — digest 不一致 30 件の棚卸し (fake/stale/rerun 要の分類) + 是正"
  - role: se
    slot_label: "SE — CI への strict gate 投入 + advisory 放置 meta 検出の doctor check 実装"
  - role: tl
    slot_label: "TL — strict 化タイミングと escalation 方針のレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-420-ci-strict-evidence-gates.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    - docs/plans/PLAN-L7-174-green-command-digest-correction.md
    - docs/plans/PLAN-L7-194-green-command-digest-hard-gate.md
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
review_evidence: []
---

# PLAN-L7-420 (troubleshoot): evidence 裏取り gate の CI 実効化

## 背景 (2026-07-10 品質基盤全件監査所見)

「green を実際に実行した」claim を機械裏取りする唯一の gate である
green-command-digest は、L7-194 の訂正により opt-in strict
(`doctor --strict-green-command-digest`) として設計された。しかし:

- **G-1**: CI (`harness-check.yml` L74) は `bun src/cli.ts doctor` を strict
  フラグ無しで実行しており、strict gate はどの自動経路でも走っていない。
  現に digest 不一致 **30 件 (17 PLAN、fake/stale substance)** が advisory
  note のまま doctor exit 0 で通過している (L7-174 の「backlog clean」状態
  からの退行)。
- **G-2**: telemetry-provenance (L7-192) も同型で、CI が
  `--strict-telemetry-provenance` を渡さないため runtime provenance ゼロでも
  doctor pass。
- 構造問題: 「hard 化前の段階導入」という advisory 状態が、期限も検出機構も
  無いまま恒久化しうる (fail-open の看板替え)。

## 工程表

### Step 1: [直列] digest 不一致 30 件の棚卸しと是正
- 直列理由 = **downstream_dependency** (clean にならないと strict 投入で CI
  が恒常 Red になる)。
- `doctor --strict-green-command-digest` の全不一致を fake / stale /
  rerun 要に分類し、L7-174 と同型の rerun-bound correction で是正。
  claim が誤っていた confirmed PLAN があれば supersedes 手続きに従う。

### Step 2: [直列] CI への strict gate 投入
- harness-check.yml の doctor step へ `--strict-green-command-digest` を追加。
  telemetry-provenance は runtime provenance の現状を確認のうえ、投入可否を
  TL レビューで判断 (不可なら期限付き deferral を本 PLAN に記録)。

### Step 3: [並列] advisory 恒久化の meta 検出
- doctor 自身が「strict 化待ちのまま放置されている advisory check の一覧」を
  報告する check を追加 (導入日からの経過を可視化、閾値超で warn)。
  fail-open 看板替えの再発防止機構。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。strict 付き doctor green を CI 実走で確認。

## AC

- [ ] `doctor --strict-green-command-digest` が real repo で exit 0
      (不一致 0 件、CI 実走ログを evidence として引用)。
- [ ] harness-check.yml の doctor step が strict フラグ付きで実行されている。
- [ ] advisory 放置 meta 検出 check が追加され、real-repo regression test で
      検出動作が実証されている (coding≠substance)。
