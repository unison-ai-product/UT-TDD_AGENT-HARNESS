---
plan_id: PLAN-L6-82-universal-pr-trigger-contract
title: "PLAN-L6-82 (add-design): 全 PR 共通 harness-check trigger contract (issue #57)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-14
updated: 2026-07-14
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - trigger contract と branch-protection context 不変の検証"
generates:
  - artifact_path: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
    - .ut-tdd/memory/project-stacked-pr-harness-check-trigger-debt.md
    - .github/workflows/harness-check.yml
---

# PLAN-L6-82 (add-design): 全 PR 共通 harness-check trigger contract

## 背景 (issue #57、2026-07-14 実測)

PR #56 (base=設計 branch) で harness-check が 0 件のまま MERGEABLE 表示になった。
source/Pack workflow の `pull_request.branches: [main]` が親子 (stacked) PR を除外するため。
concept §7.2 / requirements §7.5-7.6 の「全 PR 共通 aggregate harness-check」契約に違反する。
同日 PR #56 は main retarget 後の初 CI で実バグ 2 件を捕捉しており、実害は実証済み。

## 契約 (L6)

1. **universal PR trigger**: `pull_request` は base branch を限定しない (branches フィルタ削除
   または全 branch 許容)。`push` trigger は main 限定を維持 (solo main 直 dogfood)。
2. **branch-protection context 不変**: required status check 名は `harness-check` 1 本のまま。
3. **3 面同時更新**: source workflow / Pack template
   (`docs/templates/github/common/pack-harness-check.yml`) / setup builtin が同一契約。
4. **mutation fail-close**: `github-ci-policy` detector が「main 限定 pull_request trigger」への
   退行を violation として検出する (現 detector は本契約を検査していない)。
5. issue #57 の Codex 設計コメント (branch は隔離のみ、工程正本は PLAN+harness.db /
   Execution Ledger 構想) と整合し、branch 命名契約は本 PLAN の scope 外。

## AC

- [ ] 非 main base の PR で harness-check が発火することが GitHub event fixture テストで
      固定されている (L8 receipt)。
- [ ] `github-ci-policy` が main 限定 trigger 退行を fail-close する負例テストあり。
- [ ] source / Pack template / setup builtin の 3 面が drift せず同一契約 (既存 detector 拡張)。
- [ ] 実装は PLAN-L7-434。確定済み PLAN-L7-197 / L7-221 は上書きせず本ペアで訂正する。
