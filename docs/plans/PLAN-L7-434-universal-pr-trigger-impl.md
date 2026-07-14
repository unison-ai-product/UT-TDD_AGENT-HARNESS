---
plan_id: PLAN-L7-434-universal-pr-trigger-impl
title: "PLAN-L7-434 (add-impl): 全 PR 共通 harness-check trigger 実装 + github-ci-policy fail-close (issue #57)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-14
updated: 2026-07-14
owner: PO / 実装 = Codex lane (hybrid cross-execution)
parent_design: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
review_evidence: []
agent_slots:
  - role: se
    slot_label: "SE - workflow trigger / Pack template / setup builtin / detector 同時更新"
  - role: qa
    slot_label: "QA - 負例 (main 限定退行) と stacked PR 発火 fixture"
generates:
  - artifact_path: docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
  - artifact_path: docs/templates/github/common/pack-harness-check.yml
    artifact_type: config
  - artifact_path: docs/templates/github/common/harness-check.yml
    artifact_type: config
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
  - artifact_path: docs/plans/PLAN-REVERSE-434-universal-pr-trigger-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    - docs/plans/PLAN-REVERSE-434-universal-pr-trigger-backfill.md
    - .ut-tdd/memory/project-stacked-pr-harness-check-trigger-debt.md
---

# PLAN-L7-434 (add-impl): 全 PR 共通 harness-check trigger 実装

## 実装範囲 (L6-82 契約の実装、issue #57)

1. `.github/workflows/harness-check.yml`: `pull_request` の `branches: [main]` フィルタを
   撤去 (全 base で発火)。`push: [main]` は維持。concurrency group は ref 単位のまま。
2. Pack template `docs/templates/github/common/pack-harness-check.yml` と setup builtin を
   source templateとともに同一契約へ更新し、4 artifactをdetector入力にする。
3. `github-ci-policy` detector: 「pull_request trigger が base 限定されている」状態を
   violation としてfail-closeし、不正trigger型とpush main限定欠落も拒否する。
4. add-impl ペア: `PLAN-REVERSE-434-universal-pr-trigger-backfill` を併起票し、
   requirements §7.5-7.6 / L6-82 への backfill を R0-R4 で閉じる。
5. 確定済み PLAN-L7-197 / L7-221 に claim 矛盾があれば supersedes 宣言で訂正 (上書き禁止)。

## AC

- [x] 非 main base PR を除外しない trigger が U-CIPOL-001 の構文 oracle で固定される。
- [x] main 限定 trigger への mutation が U-CIPOL-002 で red になる。
- [x] `branches-ignore` / trigger 欠落が U-CIPOL-003 で red になる。
- [x] 不正`pull_request`型とpush main限定欠落が U-CIPOL-004/005 で red になる。
- [x] source template / setup builtinをprofile重複で捨てないことを U-CIPOL-006 で固定する。
- [x] source workflow / source template / Pack template / setup builtinがbase無限定triggerへ同期される。
- [x] job / required context 名 `harness-check` は不変である。
