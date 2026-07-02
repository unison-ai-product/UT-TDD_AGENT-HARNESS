---
plan_id: PLAN-L7-262-skill-telemetry-provenance
title: "PLAN-L7-262 (impl): skill telemetry の provenance 分離 + session_id 貫通 + 注入実績記録"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - provenance 分離設計 (auto-projection の扱い: 除外 or 別系列) レビュー"
  - role: se
    slot_label: "SE - projection 改修 + session_id 貫通 + 注入実績記録"
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/state-db/skill-projections.ts
    - src/state-db/runtime-projections.ts
    - src/cli.ts
---

# PLAN-L7-262 (impl): skill telemetry の provenance 分離

## Status

draft 起票 (A-178 G-8/G-9/G-11。PO 確定所見 2026-06-29「skill_invocations 全部 auto-projection・実発火 0」の構造是正)。

## 背景 — 偽装構造が未是正のまま増加

2026-07-02 実測:

- skill_invocations 1,850 件中 **1,840 件 (99.5%) が `auto-projection:review-evidence`** (rebuild 時の単一バースト間接推定、実発火でない)。実 runtime 発火 (`runtime-hook:skill-suggest`、PLAN-L7-201 経路) は 10 件のみ。
- `skill_firing_rate` / `skill_acceptance_rate` の feedback 355 件×2 は偽データから算出 — metrics が実使用を反映していない ([[feedback_coverage_not_substance]] の DB 実例)。
- skill_recommendations (2,195 件) / auto-projection invocations は全件 `session_id=""` (`skill-projections.ts:93,109`) で lifecycle と切断。
- `resolveSkillContextInjection` (`src/cli.ts:238-262`) は rebuild 失敗時に **silent undefined** — 注入されなかった事実が無記録のまま委譲続行 (柱 4 の実効性が検証不能)。

## スコープ

1. **provenance 分離**: auto-projection 行を実発火系列から分離 (provenance 列の必須化 + metrics 算出から除外、または別テーブル化)。firing/acceptance rate は runtime 発火のみから算出し、算出元 provenance を feedback payload に明示。
2. **session_id 貫通**: skill suggest/注入の実行時に現 session_id を記録 (hook_events と同じ貫通水準へ)。rebuild 由来の間接推定行は session 不明として明示 (空文字での偽装をやめる)。
3. **注入実績/失敗の記録**: `resolveSkillContextInjection` の注入成功 (required/optional 件数)・注入 skip (rebuild 失敗等) を session jsonl へ記録し projection で追跡可能に。silent fail-open は「握った事実の記録付き fail-open」へ。
4. 既存 1,840 件の扱い (削除 or provenance 再ラベル) は移行手順として明記し、監査値の改ざんにならない形 (再ラベル優先) を取る。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | provenance 分離設計 (TL、metrics 定義の変更含む) | 直列 |
| 2 | projection 改修 + session_id 貫通 | 直列 |
| 3 | 注入実績記録 + 既存行移行 | 直列 |
| 4 | regression test (metrics が runtime 発火のみを数える / 注入 skip が記録される) | 直列 |

## DoD

- [ ] firing/acceptance rate が auto-projection を含まない (test 固定)
- [ ] 新規 skill 推奨/注入に session_id が乗る (test 固定)
- [ ] 注入 skip (rebuild 失敗) が記録される (test 固定)
