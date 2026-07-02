---
plan_id: PLAN-RECOVERY-06-pack-consumer-doctor-profile
title: "PLAN-RECOVERY-06 (recovery): Pack consumer 実動線の doctor self-application 前提混入の是正"
kind: recovery
layer: cross
drive: be
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: aim
    slot_label: "AIM - 収束サイクルの主担当 (root cause 確定〜fullback)"
  - role: po
    slot_label: "PO - consumer profile 分離方針 (full doctor を生成 CI から外す vs consumer-profile 新設) の採否"
  - role: tl
    slot_label: "TL - doctor gate の self-application/consumer 境界設計レビュー"
  - role: se
    slot_label: "SE - 生成 CI template / project-hook gate / wrapper 解決の是正実装"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - docs/templates/github/common/harness-check.yml
    - src/setup/templates.ts
    - src/lint/project-hook.ts
---

# PLAN-RECOVERY-06 (recovery): Pack consumer 実動線の doctor self-application 前提混入の是正

## Status

draft 起票 (PO /goal 指示 2026-07-02: 監査所見の改善・対応を修正駆動モデルで起票)。着手時期は PO 判断。

## 根本原因 (A-172 C-1 / C-2、premise-gap)

doctor のガバナンス gate 群が self-application (source repo dogfood) 前提のまま配布エンジンへ焼き付いており、consumer profile が未分離:

1. setup が consumer へ生成する CI (`docs/templates/github/common/harness-check.yml` + `src/setup/templates.ts:464` builtin) が最終 step で full `doctor` を実行するが、fresh consumer では **exit 1 / violation 123 件** (実測、A-172)。README 自身が「full doctor を初期導入判定に使うな」と明記しており自己矛盾。
2. project-hook / codex-hook-adapter gate が source repo の hook 配線を要求する一方、setup 生成 settings.json は wrapper 配線 → **setup 出力が自製品の doctor を通らない** (missing_hook 11 件実測)。生成 CI 第一 step の wrapper も CI runner 上で 3 段解決すべて不能。

## 再発防止 (recovery exit 3 要件)

- **root cause**: gate 定数への self-application パス焼き込み (proposal-document-coverage-policy 等) + gate 要求と setup 生成物の非同期進化。
- **guard/test の具体変更点**: (a) 生成 CI から full doctor を外す or doctor に consumer-profile を新設 (PO 判断)、(b) project-hook gate の要求配線を setup 生成物と単一定義源で共有、(c) 「fresh consumer で setup → 生成 CI 相当が green」の regression test (実 setup 実行 smoke) を追加し、gate と setup の再乖離を fail-close。
- **L14 route**: Pack UAT 境界 (A-171) の前提修正として L13/L14 運用検証へ接続。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | consumer profile 方式の決定 (PO gate) | 直列 |
| 2 | doctor gate の self-application/consumer 境界実装 + 生成 CI template 修正 | 直列 |
| 3 | fresh-consumer smoke regression test 追加 | 直列 |
| 4 | Pack sync + A-171 UAT 境界の再評価 | 直列 |

## DoD

- [ ] fresh consumer での `setup --solo` → 生成 CI 相当コマンド列が green (regression test で固定)
- [ ] setup 生成 hook 配線が doctor project-hook / codex-hook-adapter gate を pass
- [ ] A-172 C-1/C-2 に correction note を追記し、A-171 UAT 境界の前提解除を記録
