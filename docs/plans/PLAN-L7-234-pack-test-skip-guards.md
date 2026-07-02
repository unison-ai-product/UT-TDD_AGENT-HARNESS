---
plan_id: PLAN-L7-234-pack-test-skip-guards
title: "PLAN-L7-234 (impl): Pack 同梱 source-only テストの skip ガード化"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - source-only 前提テストへの存在チェック skip ガード導入"
  - role: po
    slot_label: "PO - skip ガード vs Pack artifact 除外の方針採択"
generates:
  - artifact_path: docs/plans/PLAN-L7-234-pack-test-skip-guards.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - tests/readability.test.ts
---

# PLAN-L7-234 (impl): Pack 同梱 source-only テストの skip ガード化

## Status

draft 起票 (PO /goal 2026-07-02、A-172 feature-gap)。

## 背景 (A-172)

Pack は tests/ 122 ファイルを同梱するが、47 ファイルは source repo 専用 doc (docs/plans / docs/design / root CLAUDE.md 等) 前提で Pack 内では実行不能。規定 `bun run test` (smoke 6 ファイル) は緑で README にも境界明記済みだが、外部利用者が `vitest run` を叩くと赤の山になる。

## スコープ

source-only 前提テストへ `describe.skipIf(!existsSync(...))` 型の存在ガードを導入 (先例: `tests/readability.test.ts:40-44`) し、Pack checkout でも `vitest run` が green になる状態にする。代替案 (Pack artifact からの除外 = V-pair 同梱性の放棄) との比較は PO 判断。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 47 ファイルの前提 asset 分類 | 直列 |
| 2 | skip ガード導入 (source repo では全実行を維持) | 直列 |
| 3 | Pack clone での `vitest run` green を distribution-acceptance に追加 | 直列 |

## DoD

- [ ] Pack clone で `bunx vitest run` が green (skip 表示付き)
- [ ] source repo では skip されず従来件数を維持
