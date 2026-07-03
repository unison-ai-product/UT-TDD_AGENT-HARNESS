---
plan_id: PLAN-L7-334-registrar-test-hardening
title: "PLAN-L7-334 (impl): cli-distribution-registrar テストの smoke→値一致昇格 (退行検出力の回復)"
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
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (wave Q1、XS)"
  - role: qa
    slot_label: "QA - assert 昇格の oracle 妥当性確認"
generates:
  - artifact_path: docs/plans/PLAN-L7-334-registrar-test-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
---

# PLAN-L7-334 (impl): registrar テストの oracle 昇格

## Status

**version-up parked (v2)**。A-182 所見 TQ-5 (QU-7)。PO 指示 2026-07-03「アップデートでプラン化」。規模 XS。

## 背景 (実測 2026-07-03、A-182 §2 LENS-TQ)

- `tests/cli-distribution-registrar.test.ts` が `toBeTruthy()` 主体 (expect 3 中 smoke 1) で、registrar の返すコマンドセットが変化 (削除・改名) しても green のまま — 退行検出力ゼロの smoke (TQ-5)。TQ 監査で 136 ファイル中 smoke 支配は本ファイルのみ (テスト実質は全体 B+)。

## スコープ (1 要件: registrar テストの assert を登録コマンドの値一致へ昇格する)

1. 登録コマンド名の集合を完全一致で assert (`.map(c => c.name())` 相当の sort 比較)。
2. 主要フラグ (requiredOption) の存在も 1 コマンド分は値で固定。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | assert 昇格 + full test green | 直列 |

## DoD

- [ ] コマンド改名/削除で当該テストが red になる (mutation 机上確認を review_evidence に記録)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 触るファイル: `tests/cli-distribution-registrar.test.ts` のみ。Codex が distribution registrar を再構成中なら着手前に非接触確認。
- 活性化時 kind は impl のまま (テスト追加のみ、Reverse pairing 不要域) — 昇格判断は §6 手順。
