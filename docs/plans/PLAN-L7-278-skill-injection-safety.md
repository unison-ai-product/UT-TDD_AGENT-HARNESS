---
plan_id: PLAN-L7-278-skill-injection-safety
title: "PLAN-L7-278 (add-impl): skill 注入の安全弁 (path 実在再検証 + 注入予算)"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 注入予算 (件数/バイト) の閾値設計レビュー"
  - role: se
    slot_label: "SE - path 再検証 + 予算 + CLI 調整口 + test"
generates:
  - artifact_path: docs/plans/PLAN-L7-278-skill-injection-safety.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L5-06-skill.md
  requires: []
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - src/skill-engine/recommend.ts
    - docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
---

# PLAN-L7-278 (add-impl): skill 注入の安全弁

## Status

draft 起票 (A-180 S-8)。正規形 = parent: PLAN-L5-06 (skill 設計、drive 一致) + Reverse pairing = PLAN-REVERSE-278。

## 背景

`buildSkillInjectionSet` は `automation_assets.path` を**実在再検証なしで** required_paths/optional_paths に返す — stale 永続 DB 経路 (`skill suggest --record` 等) でファイル削除/rename 後の path が注入指示に乗り得る (「後から消えた」ケースは missing_skill_ids でも拾えない非対称)。注入件数/サイズの明示上限も無く (`rankSkills` の暗黙 limit=5 のみ、CLI 調整口なし)、context 溢れの予算制御が未設計 (柱 4「関連 context のみ注入」の安全側)。

## スコープ

1. **path 実在再検証**: 注入セット構築時に existsSync 確認、不在は missing_skill_ids へ (silent drop しない)。
2. **注入予算**: 件数 + 概算バイトの上限を宣言的既定値で導入、超過時は優先度順トリム + トリム事実の surface。CLI `--limit` 調整口。
3. **注入実績の記録接続**: L7-262 (注入実績/失敗の記録) と整合 — 本 PLAN は安全弁、記録は 262 の担当のまま。
4. **配信様式の実効化 (A-180 §3b)**: 現状の注入は bare ラベル行 (`- required skill: <path>`) のみで読めという**命令文が無く、本文も埋め込まれない** (`adapter.ts:426-437`)。(a) header を命令形へ (required は着手前読了必須と明示)、(b) 予算内なら小 skill の本文埋込 (path 参照との併用、予算は本 PLAN の上限制御と同居)、(c) worker session の読了証跡 (注入 path への Read 有無) を PLAN-L7-258 の session command scan と接続して評価可能にする。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 予算閾値設計 (TL) | 直列 |
| 2 | 再検証 + 予算 + CLI 口 実装 | 直列 |
| 3 | regression test (不在 path が注入されない / 超過トリムが surface される) | 直列 |

## DoD

- [ ] 削除済み path が required_paths に乗らない (test 固定)
- [ ] 予算超過がトリム + surface される (test 固定)
