---
plan_id: PLAN-L7-342-doctor-submodule-tests
title: "PLAN-L7-342 (impl): doctor サブモジュール直接 unit test の追加 (barrel 経由のみのカバレッジ脆弱性解消)"
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
    slot_label: "PO - v2 活性化時期 (Codex の doctor 抽出 L7-325/326 系の完了後 — 対象構造が固まってから)"
  - role: qa
    slot_label: "QA - 対象サブモジュールの優先順と oracle 設計"
  - role: se
    slot_label: "SE - unit tests 追加"
generates:
  - artifact_path: docs/plans/PLAN-L7-342-doctor-submodule-tests.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-325-doctor-lint-gate-extraction.md
    - docs/plans/PLAN-L7-326-doctor-runtime-state-extraction.md
---

# PLAN-L7-342 (impl): doctor サブモジュール直接テスト

## Status

**version-up parked (v2)**。A-182 所見 TQ-4 (QU-15)。PO 指示 2026-07-03「アップデートでプラン化」。**活性化トリガー = Codex の doctor 抽出 (L7-325/326 で lint-gates.ts / runtime-state.ts が新設済み、後続スライス継続中) の完了** — 抽出中にテストを固定すると抽出のたびに書き直しになる。

## 背景 (実測 2026-07-03、A-182 §2)

- `src/doctor/lint-gates.ts`、`plan-governance.ts`、`runtime-state.ts`、`setup-smoke.ts` は tests/doctor.test.ts の barrel (index.ts) 経由でのみ検証されており、サブモジュール関数の直接 unit test が無い (TQ-4)。
- 影響: サブモジュール固有の edge (個別 check の fail-open 境界、入力異常) が統合テスト越しにしか検出できず、barrel 再構成でカバレッジが無言で落ちる。

## スコープ (1 要件: 高影響 doctor サブモジュールへ直接 unit test を追加する)

1. 優先 2 本 (lint-gates / plan-governance — hard 判定に直結) へ直接 unit test を追加: 正常系 + fail-open 境界 (入力欠損で warn か silent か) + 代表 check の red fixture。
2. runtime-state / setup-smoke は同型で続く (QA 優先順で範囲確定)。
3. oracle_id 引用は L7-338 の様式に従う (先に landed していれば)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | Codex doctor 抽出完了の確認 + QA 優先順確定 | 直列 (先行) |
| 2 | lint-gates / plan-governance の直接テスト | **並列可** (ファイル独立) |
| 3 | 残りサブモジュール | 並列可 |

## DoD

- [ ] 対象サブモジュールに直接 import の unit test が存在 (barrel 非経由を import 文で固定)
- [ ] 各対象に red fixture (判定反転で fail するケース) が 1 件以上
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- テスト追加のみでプロダクトコード無変更が原則 — テスト作成中に見つけた実装疑義は improvement backlog へ (無言修正しない)。
- 活性化時 kind は impl のまま or add-impl 昇格を §6 手順で判断。
