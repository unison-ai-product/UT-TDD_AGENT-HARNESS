---
plan_id: PLAN-L7-232-sync-pack-clean-tree-guard
title: "PLAN-L7-232 (impl): sync-pack の clean-tree guard と sync commit 規約の機械強制"
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
    slot_label: "SE - collectDistributionCandidatePaths の clean-tree 前提化"
  - role: tl
    slot_label: "TL - hybrid 運用 (相手 runtime 未コミット常在) での配布安全境界レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-232-sync-pack-clean-tree-guard.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - src/cli.ts
    - src/setup/distribution.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-232 (impl): sync-pack の clean-tree guard と sync commit 規約の機械強制

## Status

draft 起票 (PO /goal 2026-07-02、A-172 latent-defect)。

## 背景 (A-172)

`sync-pack` は source repo の **working tree をファイルシステム走査でコピー** (git HEAD 基準でない) し、clean-tree 確認が無いのに manifest は gitHead() を名乗る。hybrid 運用では相手 runtime の未コミット編集が常在するため、公開 Pack への混入リスクが構造的。加えて最新 sync commit (9ec7d6c) が `chore: sync clean pack <source-sha>` 規約を外れ、source SHA が Pack 側に未記録。

## スコープ

1. sync-pack / sync-stage / package 実行前に working tree の dirty 検出 → fail-close (override は明示 flag + 監査記録)。
2. sync commit 規約 (`chore: sync clean pack <source-sha>`) の出力・検証を機械化 (次コマンド提示に SHA 埋め込み + 検証 subcommand)。
3. 実 repo regression test (dirty tree で sync-pack が fail する)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | dirty-tree 検出 + fail-close 実装 | 直列 |
| 2 | sync commit 規約の機械化 | 1 と並列 |
| 3 | regression test + doctor/README 反映 | 直列 |

## DoD

- [ ] dirty tree での sync-pack が exit 1 (test 固定)
- [ ] sync 提示コマンドに source SHA が常に含まれる
