---
plan_id: PLAN-L7-281-orchestrator-skill-injection
title: "PLAN-L7-281 (add-impl): orchestrator 自身への動的 skill 注入 (L 単位の動的ロード)"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/plans/PLAN-L5-06-skill.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - orchestrator 注入の面 (SessionStart / on-demand / hook) と分量の確定"
  - role: tl
    slot_label: "TL - 現在地検出 (layer/mode/plan) → skill 選定 → 注入の合成設計と L7-250/251/257 との重複整理"
  - role: se
    slot_label: "SE - 注入面の実装 + 予算 + 証跡"
generates:
  - artifact_path: docs/plans/PLAN-L7-281-orchestrator-skill-injection.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L5-06-skill.md
  requires: []
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - docs/plans/PLAN-L7-277-skill-recommendation-discrimination.md
    - docs/plans/PLAN-L7-278-skill-injection-safety.md
    - docs/plans/PLAN-L7-250-layer-question-catalog.md
    - docs/plans/PLAN-L7-251-observation-next-selector.md
    - docs/plans/PLAN-L7-257-orchestration-cell-roster.md
    - src/runtime/session-log.ts
---

# PLAN-L7-281 (add-impl): orchestrator 自身への動的 skill 注入

## Status

draft 起票 (A-180 §3b の残課題。PO 指示 2026-07-02「起票しておいて」)。正規形 = parent: PLAN-L5-06 (skill 設計、drive 一致) + Reverse pairing = PLAN-REVERSE-281。

## 背景 — 注入は委譲 worker 専用で、orchestrator 自身は柱 4 の外にいる

- skill 注入 (`resolveSkillContextInjection`) が効くのは `--plan --execute` の委譲経路のみ。**orchestrator (Claude/Codex の主セッション) には harness skill が一切注入されない** — SessionStart surface が出すのは feedback のみ。
- orchestrator は「いまどの L / mode / PLAN にいるか」に応じた運用知 (skills/ の該当 skill) を自力で探すしかなく、柱 4「関連 context のみ動的ロード」が自分自身に適用されていない。

## スコープ

1. **現在地→skill 選定の合成**: runtime 検出 (mode) + active plan (layer/drive/kind) から該当 skill を選定 (L7-277 の差別化 score を利用)。
2. **注入面 (PO 確定)**: 候補 = (a) SessionStart surface に該当 skill の要点/パスを追加、(b) on-demand コマンド (`ut-tdd context --here` 等、名称実装時) で現在地の skill セットを出力、(c) PostToolUse で layer 遷移を検知した時の差分 surface。過剰注入を避けるため予算 (L7-278 と同じ制御) と「同一 session 内の再注入抑制」を入れる。
3. **証跡**: orchestrator への注入も skill_invocations 系へ runtime provenance で記録 (L7-262 整合) — 「orchestrator が skill を使ったか」を初めて計測可能にする。
4. **重複整理 (TL)**: L7-250 (未回答質問の案内) / L7-251 (next selector) / L7-257 (roster 注入) と面が近い — 統合 surface (SessionStart の 1 枚) に載せる設計とし、別々の出力面を乱立させない。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 注入面 + 分量の PO 確定、L7-250/251/257 との統合設計 (TL) | 直列 |
| 2 | 現在地→選定→注入の実装 (予算 + 再注入抑制) | 直列 |
| 3 | 証跡記録 + regression test (現在地が変わると注入が追従 / 予算超過トリム) | 直列 |

## DoD

- [ ] orchestrator セッションが現在地に応じた skill 参照を受け取る (test 固定)
- [ ] 注入が予算内に収まり再注入が抑制される (test 固定)
- [ ] orchestrator 側の skill 消費が runtime provenance で記録される (test 固定)
