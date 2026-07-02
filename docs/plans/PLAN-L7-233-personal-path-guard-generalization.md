---
plan_id: PLAN-L7-233-personal-path-guard-generalization
title: "PLAN-L7-233 (impl): 個人パスガードの一般化と公開 fixture の example 化"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - FORBIDDEN_PATH_RE 一般化 + fixture 置換"
  - role: qa
    slot_label: "QA - no-username-leak 検査の全域化 (機能退行なし確認)"
generates:
  - artifact_path: docs/plans/PLAN-L7-233-personal-path-guard-generalization.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - src/lint/project-hook.ts
    - src/lint/asset-drift.ts
    - tests/handover.test.ts
---

# PLAN-L7-233 (impl): 個人パスガードの一般化と公開 fixture の example 化

## Status

draft 起票 (PO /goal 2026-07-02、A-172 latent-defect)。

## 背景 (A-172)

維持者個人の Windows ユーザーパスが検出器定数 (`src/lint/project-hook.ts:79` FORBIDDEN_PATH_RE、`asset-drift.ts:42`、legacy repo 名含む) と公開 fixture (`tests/handover.test.ts` ほか) に焼き込まれ MIT 公開されている。guard が特定ユーザー名固定のため、**外部利用者環境では個人パスガードとして機能しない**機能欠陥を兼ねる。同 test 自身が「no username leak」を仕様として assert しており自己矛盾。

## スコープ

1. FORBIDDEN_PATH_RE / asset-drift パターンを「任意の個人絶対パス」(`C:\Users\` 配下任意 + `/home/` + `/Users/`) へ一般化。
2. fixture の実個人パスを `C:\Users\example` 等へ置換 (機能退行なし)。
3. no-username-leak 検査を src+tests 全域スキャンへ拡張し、再混入を fail-close。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | パターン一般化 + 既存 test green 維持 | 直列 |
| 2 | fixture example 化 | 1 と並列 |
| 3 | 全域 no-username-leak lint + Pack sync | 直列 |

## DoD

- [ ] `grep -ri "Users.\+micro" src tests` = 0 (lint で固定)
- [ ] 一般化 guard が任意ユーザー名の個人パスを検出 (test 固定)
