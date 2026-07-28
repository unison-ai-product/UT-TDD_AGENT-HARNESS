---
plan_id: PLAN-L7-244-right-arm-citation-gate
title: "PLAN-L7-244 (impl): 右腕 citation gate の被覆拡張 (IT/ST 採番 + defer 機械追跡)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - ORACLE_ID regex 拡張 + defer frontmatter 追跡"
  - role: qa
    slot_label: "QA - IT-CONTRACT-01〜03 の実装 or 明示 defer の確定"
generates:
  - artifact_path: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - src/lint/oracle-test-trace.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-244 (impl): 右腕 citation gate の被覆拡張

## Status

draft 起票 (PO /goal 2026-07-02、A-174 F-1 feature-gap [important])。

2026-07-28 追記: issue #165 (PR #146/#147 構造分析で再発見) は本 PLAN スコープ 1 と同一の
fail-open 穴。実害インスタンスが増えた: PR #146 宣言の 2 桁 ID (IT-DOCLEDGER-01..07 /
ST-DOCLEDGER-01..05 / ST-DOCSEM-01..08) が U-OTT-004 zero-orphan gate の対象外。
本 PLAN が #165 の機構化正本であり、新規 PLAN は起票しない (重複回避)。

## 背景 (A-174 F-1)

`ORACLE_ID = /\b(?:U|IT)-[A-Z0-9]+-[0-9]{3}\b/` (src/lint/oracle-test-trace.ts:21) が 3 桁採番のみ対象のため、2 桁採番の IT-* (IT-CONTRACT-01〜03 = tests 実装 0 件・defer 宣言なし) と ST-* 全体が citation gate を素通り。「未実装」と「明示 defer」の機械区別も無く、G8/G9 close を宣言ベースで通過し得る (右腕片肺の残存形)。

## スコープ

1. ORACLE_ID の桁ゆらぎ吸収 (2-3 桁) + ST-* パターン追加 (baseline 拡張は縮小のみ可ルール維持)。
2. test-design 側 defer の機械追跡 (defer 宣言 frontmatter/表形式の規格化 + 「未実装かつ非 defer」の fail-close)。
3. IT-CONTRACT-01〜03 の実装 or 明示 defer 化 (QA 判断)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | regex/パターン拡張 + 影響 baseline 算定 | 直列 |
| 2 | defer 機械追跡の規格化 | 1 と並列 |
| 3 | IT-CONTRACT disposition + G8/G9 close 前提の regression test | 直列 |

## DoD

- [ ] IT/ST 全採番が citation gate 被覆 (test 固定)
- [ ] 未実装かつ非 defer の右腕 ID が doctor red になる
