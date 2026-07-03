---
plan_id: PLAN-L7-330-test-design-l6-crosswalk
title: "PLAN-L7-330 (impl): L6 設計 21 本 ↔ L7 unit-test-design の対応表追記 (テスト設計粒度の可視化)"
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
    slot_label: "PO - v2 活性化時期 (wave Q0)"
  - role: tl
    slot_label: "TL - 対応表の網羅確認 (L6 21 本すべてに行があるか)"
  - role: qa
    slot_label: "QA - unit-test-design section と L6 機能の対応判定"
generates:
  - artifact_path: docs/plans/PLAN-L7-330-test-design-l6-crosswalk.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L7-330 (impl): L6 設計 ↔ L7 unit-test-design 対応表

## Status

**version-up parked (v2)**。A-182 所見 DQ-5 (QU-3)。PO 指示 2026-07-03「アップデートでプラン化」。

## 背景 (実測 2026-07-03、A-182 §2)

- docs/test-design/ は 6 ファイルのみで、L6 設計 21 本は L7-unit-test-design.md 1 本との**集合 pair**。集合 pair 自体は設計意図 (architecture.md V-pair 注記と同型) だが、L6 個別機能がどの test-design section に対応するかの表が無く、テスト設計粒度が不可視 (DQ-5)。
- 影響: 「設計粒度 = テスト設計粒度」ルールの充足を機械でも人でも確認できない。L6 機能を追加した際に test-design 側の抜けが検出されない。

## スコープ (1 要件: L7-unit-test-design.md へ L6 対応表を 1 節追記する — 個別 doc 化はしない最小対処)

1. `docs/test-design/harness/L7-unit-test-design.md` に「L6 対応表」節を追加: L6 設計 doc 21 本 (+ L7-329 で増える分) × 対応 test-design section / 対応 tests ファイル / 判定 (covered / gap)。
2. gap 行が出た場合は本 PLAN で埋めず、所見として improvement backlog へ記録 (スコープ = 可視化まで。是正は別 routing)。
3. 対応表の維持規律を同節に 1 行明記: L6 doc 追加時は本表へ行追加 (L7-337 の設計参照 lint が将来の発火点候補)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | L6 21 本の一覧化と test-design section / tests の突合 | 直列 |
| 2 | 対応表追記 + gap の backlog 起票 | 直列 |

## DoD

- [ ] 対応表に L6 全 doc の行がある (L6 の `find` 件数と表の行数一致)
- [ ] gap 判定行が improvement backlog へ記録されている (0 件ならその旨を表に明記)
- [ ] doctor readability green

## 実装ノート (後続モデル向け)

- docs-only、コード無変更。tests の対応判定は describe 名 / ORACLE_ID の Grep で機械的に行う。
- 活性化時 kind 昇格は reverse back-fill 型が自然。
