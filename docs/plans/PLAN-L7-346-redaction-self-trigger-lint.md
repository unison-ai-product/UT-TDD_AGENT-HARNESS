---
plan_id: PLAN-L7-346-redaction-self-trigger-lint
title: "PLAN-L7-346 (impl): 検出器 self-trigger 回避 lint — 検出パターンの literal 素書きを doc/レポートから検出する"
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
    slot_label: "PO - v2 活性化時期 + L7-279 (XML 残渣) との統合可否"
  - role: tl
    slot_label: "TL - self-scan の対象範囲 (secret.ts / readability / 将来検出器) レビュー"
  - role: se
    slot_label: "SE - self-scan lint 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-346-redaction-self-trigger-lint.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
    - docs/plans/PLAN-L7-279-xml-residue-lint.md
    - src/secret.ts
---

# PLAN-L7-346 (impl): 検出器 self-trigger 回避 lint

## Status

**version-up parked (v2)**。A-183 所見 LM-2。PO 指示 2026-07-03。**未決分岐**: L7-279 (XML 残渣 lint) のスコープを「機密/危険パターン検出器全般の self-trigger」へ拡張して統合するか、本 PLAN を独立で進めるか — 活性化時に PO 判断し、統合なら supersedes 整理。

## 背景 (A-183 §2)

- 「検出器を説明する doc に trigger 文字列を素書きしない」教訓 (redaction self-trigger、実害 1 件既往) が**完全 prose** かつ記録が個人セッション memory のみ — 担い手交代で消える典型例 (LM-2)。
- 対象の構造: secret.ts / readability 等の検出器が持つパターンを、doc・監査レポート・PLAN 本文が literal で引用すると、その doc 自身が検出に引っかかる (自己発火) か、redaction が doc を破壊する。

## スコープ (1 要件: 検出器パターンの literal 素書きを prose 資産から warn 検出する)

1. self-scan lint (warn-first): 検出器実装 (`src/secret.ts` 等、対象一覧は TL レビュー) が持つパターン定義を読み、docs/ と .ut-tdd/audit/ の prose に literal 一致が現れたら warn — 「間接参照 (パターン名) か fixture 分離で書け」と誘導。
2. 検出器実装ファイル自身と tests/ の fixture は除外 (正当な置き場)。
3. 本 lint 自体が self-trigger しない実装様式 (パターンを間接ロード) を test で固定 — 再帰的な同罪を防ぐ。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | L7-279 統合可否の PO 判断 + 対象検出器の TL 確定 | 直列 (先行) |
| 2 | self-scan lint + fixture tests | 直列 |
| 3 | 実 repo 走査で既存違反の基線記録 | 直列 |

## DoD

- [ ] trigger 文字列を素書きした doc fixture が warn (test 固定)
- [ ] lint 自身が自分のパターンで発火しない (test 固定)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 本 PLAN の本文にも trigger 文字列を書かないこと (この注意自体が教訓の実践)。
- 活性化時 kind は add-impl へ昇格。
