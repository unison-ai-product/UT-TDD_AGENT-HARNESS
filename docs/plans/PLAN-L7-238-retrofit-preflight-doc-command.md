---
plan_id: PLAN-L7-238-retrofit-preflight-doc-command
title: "PLAN-L7-238 (impl): retrofit.md 誤コマンド修正 + doc 記載コマンド実在 lint"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/retrofit.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - retrofit.md 訂正 + cited-command 実在 lint"
generates:
  - artifact_path: docs/plans/PLAN-L7-238-retrofit-preflight-doc-command.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - docs/process/modes/retrofit.md
    - src/cli.ts
---

# PLAN-L7-238 (impl): retrofit.md 誤コマンド修正 + doc 記載コマンド実在 lint

## Status

draft 起票 (PO /goal 2026-07-02、A-173 F-2 latent-defect)。

## 背景 (A-173 F-2)

`docs/process/modes/retrofit.md:34,84` が必須手順として `ut-tdd doctor --preflight upgrade` を記載するが該当コマンドは存在しない (正: `ut-tdd guard preflight`、src/cli.ts:893)。upgrade 高リスク時の必須手順が実行不能で、retrofit 実行者を確実にブロックする。

## スコープ

1. retrofit.md の誤コマンド訂正。
2. 再発防止: process/governance doc 内の `ut-tdd <sub>` 記載を CLI surface と突合する cited-command 実在 lint (doc が存在しないコマンドを正規手順として記載したら fail)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | doc 訂正 | 直列 |
| 2 | cited-command lint + 全 process doc 走査 green | 直列 |

## DoD

- [ ] retrofit.md 記載コマンドが全て実在 (lint green)
- [ ] lint が意図的擬似例 (プレースホルダ) を除外できる書式規約を持つ
