---
plan_id: PLAN-L7-423-gate-minor-hardening-batch
title: "PLAN-L7-423 (troubleshoot): gate/lint Minor 硬化バッチ — secret-scan 同一行 allowlist・tests/ 走査外・plan loader catch-continue・doctor requires 非強制・supersession wildcard backref"
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
backprop_decision_reason: "既存 gate/lint 群の局所的 fail-open/検知漏れの硬化バッチであり、新規 L0/L1 要件ではない。各項目は独立に適用可能な Minor 修正。"
agent_slots:
  - role: se
    slot_label: "SE — 各 Minor 硬化の実装 + 個別 regression test"
  - role: tl
    slot_label: "TL — 意図的 fail-open / 意図的スコープ境界 (docstring 宣言済み) を壊さないレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-423-gate-minor-hardening-batch.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/secret-scan.ts
    artifact_type: source_module
  - artifact_path: src/doctor/runner.ts
    artifact_type: source_module
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-41-substance-lints.md
    - docs/plans/PLAN-L7-246-doctor-result-aggregation-extraction.md
review_evidence: []
---

# PLAN-L7-423 (troubleshoot): gate/lint Minor 硬化バッチ

## 背景 (2026-07-10 品質基盤全件監査所見、いずれも Minor)

1. **secret-scan 同一行 allowlist**: `src/lint/secret-scan.ts:38-46` は
   `dummy|example|fixture` 等の marker 語が実秘密と同一行にあると
   false-negative (`api_key="AKIA...REAL" # example`)。行単位でなく
   トークン近傍判定へ絞る。
2. **tests/ が secret 走査対象外**: `src/audit/quality.ts:66-72` (includeTests
   既定 false) + secret-scan の走査 dir に tests/ が無く、tests/ 配下の実秘密
   が両 gate をすり抜ける。tests/ を走査対象へ追加 (fixture 用 allowlist 併設)。
3. **plan loader の per-file `catch { continue }`**: plan-artifact-existence /
   plan-body-substance / plan-completion-drift / sub-doc-section-structure 等で
   単一 PLAN の read 失敗が当該 lint を silent escape。read 失敗を violation
   として計上する fail-close へ統一。
4. **doctor runner が `requires` 宣言を強制しない**: `src/doctor/runner.ts:44-86`
   は definition.requires を読まず配列順のみに依存 (dead contract)。順序検証
   または起動時 assert を追加 (現状 backstop の fail-close は維持)。
5. **plan-supersession backref の wildcard 照合**: `src/lint/plan-supersession.ts:75-83`
   は後継 ID が本文のどこかに出現すれば合格。「訂正注記」節見出し等の構造的
   マーカー照合へ強化 (prose 真偽の機械化はしない、という既存境界は維持)。
6. **review-evidence の presence/semantics 二重経路**: presence regex 合格かつ
   YAML 壊れの組で深部検査 skip (backstop = frontmatterSchema fail-close 有り)。
   presence 判定を YAML parse 結果へ一本化して経路乖離を消す。

## 工程表

### Step 1: [並列] 項目 1-6 の個別硬化
- 各項目は独立。1 項目 = 1 commit + 対応 regression test (Red→Green)。

### Step 2: [直列] 回帰確認
- 直列理由 = **verification_gate**。全テスト green + doctor exit 0 +
  意図的境界 (docstring 宣言済み fail-open/スコープ) の不変をレビューで確認。

## AC

- [ ] 各項目に Red→Green の regression test があり、全テスト green。
- [ ] tests/ 配下に置いた擬似 secret が gate で検出されることを実証。
- [ ] read 失敗 PLAN が violation として fail-close することを実証。
