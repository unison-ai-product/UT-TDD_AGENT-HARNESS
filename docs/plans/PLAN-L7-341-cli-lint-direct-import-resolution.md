---
plan_id: PLAN-L7-341-cli-lint-direct-import-resolution
title: "PLAN-L7-341 (impl): cli→lint 直 import の経路整理 (review サービス層 or doctor 経由への一本化)"
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
    slot_label: "PO - v2 活性化時期 (L7-340 と同時が効率的)"
  - role: tl
    slot_label: "TL - 正規経路の設計判断 (review 層新設 vs doctor 経由)"
  - role: se
    slot_label: "SE - 経路整理実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-341-cli-lint-direct-import-resolution.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-340-cli-registrar-completion.md
---

# PLAN-L7-341 (impl): cli→lint 直 import の経路整理

## Status

**version-up parked (v2)**。A-182 所見 AQ-3 (QU-14)。PO 指示 2026-07-03「アップデートでプラン化」。**L7-340 (cli 分割) と同時活性化が効率的** (同一ファイル起点)。

## 背景 (実測 2026-07-03、A-182 §2)

- src/cli.ts:51-54 (HEAD 時点) が `lint/change-impact`、`lint/green-command-digest`、`lint/outstanding`、`lint/review-evidence` を直 import — 正規経路 (cli → doctor → lint) と直呼びが併存 (AQ-3)。
- 影響: 後続エージェントが「doctor 経由か直呼びか」を判断できず設計が分岐し続ける。architecture.md §3.1 の依存方向宣言 (cli は runtime/doctor/plan/vmodel/(lint)) の「(lint)」括弧書きが実態の曖昧さをそのまま表している。

## スコープ (1 要件: cli からの lint 利用経路を 1 つに確定し、architecture.md の宣言を括弧なしへ更新する)

1. 経路の確定 (TL slot): 案 A `src/review/` サービス層新設 (review --uncommitted / --staged の走査を集約) / 案 B doctor の scoped 実行経由 (L7-300 の --scope 実装と整合)。**L7-300 (doctor scoped) が landed 済みなら案 B が二重層を作らず有利**。
2. cli.ts の lint 直 import を確定経路へ置換。
3. architecture.md §3.1 の cli 行「(lint)」を確定経路へ更新 (設計 doc の同時更新 — DQ-4 の教訓)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 経路の TL 決定 (L7-300 の状態を確認してから) | 直列 (先行) |
| 2 | 置換 + architecture.md 更新 | 直列 |
| 3 | regression fence (review コマンドの出力前後突合 + full test) | 直列 |

## DoD

- [ ] cli.ts (または後継 registrar) に lint 直 import が 0 件 (grep 固定)
- [ ] architecture.md の cli 依存宣言が実態と一致
- [ ] `ut-tdd review --uncommitted` の出力が前後同一 (突合ログ)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 活性化時 kind は refactor へ昇格。L7-340 と同一 commit 系列で進めてよいが、PLAN としては分離 (1 PLAN = 1 要件)。
