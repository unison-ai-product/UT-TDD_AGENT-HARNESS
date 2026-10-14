---
plan_id: PLAN-L6-693-windows-hide-spawn-guard
title: "PLAN-L6-693 (add-design): 子プロセスの windowsHide 検査の契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-14
updated: 2026-10-14
owner: Claude (契約PR) / Codex (契約レビュー) / control (割当)
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - 検査対象の呼び出し、options の判定規則、GUI 例外、baseline の縮小規則を freeze する
  - role: se
    slot_label: SE - 静的解析の入力と出力、merge-base の baseline 読み取り、違反コードを定義する
  - role: qa
    slot_label: QA - 判定不能の形、baseline の増加、merge-base 読み取り失敗の負例を反証可能にする
origin:
  plan_id: PLAN-L6-01-function-spec
  revision: 3
  digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
reentry:
  target_plan_id: PLAN-L6-01-function-spec
  target_revision: 3
  phase: forward_merge
escape_reason: "Issue #693: freeze the static windowsHide guard for child
  process calls as an add-feature design increment."
generates:
  - artifact_path: docs/plans/PLAN-L6-693-windows-hide-spawn-guard.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L6-function-design/windows-hide-spawn-guard.md
    - docs/test-design/harness/L7-windows-hide-spawn-guard-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/693
status: draft
sub_doc: function-spec
github_issue_id: 693
admission_receipt:
  schema_version: v2
  receipt_id: certificate:985acb6dfda67ed5b5ab3c8faf355556
  command_id: plan-draft:issue-693:PLAN-L6-693:r2-20261014
  admitted_at: 2026-10-14T04:00:11.020Z
  source_digest: sha256:02056eaab9af52b88c352a5c9b45fdf37dc3d66c94ee6fd98df8b902c89909b3
  decision_digest: sha256:cf5702a9dde550647d411461c4c5e6573bb52e40404c6417803e84362cd177ff
  receipt_digest: sha256:aff8c4379896a587d3f8ab3261fbf0117864f2f1798c3ef088d3d04c6738f8d7
  binding:
    path: docs/plans/PLAN-L6-693-windows-hide-spawn-guard.md
    plan_id: PLAN-L6-693-windows-hide-spawn-guard
    asset_id: plan:985acb6dfda67ed5b5ab3c8faf355556
    revision: 1
    content_digest: sha256:02056eaab9af52b88c352a5c9b45fdf37dc3d66c94ee6fd98df8b902c89909b3
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 693
    episode_id: issue-693
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 3
    digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  reentry:
    target_plan_id: PLAN-L6-01-function-spec
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #693: freeze the static windowsHide guard for child
    process calls as an add-feature design increment."
---

# PLAN-L6-693 (add-design): 子プロセスの windowsHide 検査の契約

## 上流の設計 revision digest

- `docs/design/harness/L6-function-design/windows-hide-spawn-guard.md@cb22ed4b6e5273f3b1b9d9cf224774bc1962f7fc` sha256:8cae7dd4dd60ddc4cb5ea7bb098cd72cb8fd10deb87f96c4a184bd74a8f57646
- `docs/test-design/harness/L7-windows-hide-spawn-guard-test-design.md@cb22ed4b6e5273f3b1b9d9cf224774bc1962f7fc` sha256:8d0d9636295ac429b0e01babc8c09a4327988400f770d6b242d4b92596507ceb
- `docs/design/harness/L6-function-design/function-spec.md@cb22ed4b6e5273f3b1b9d9cf224774bc1962f7fc` sha256:6735d00e9ce5548bfa8e7af0ea42cb51e3c55d2b969db082e108fb27ae3fcbb8

## 引き渡し物

- `docs/design/harness/L6-function-design/windows-hide-spawn-guard.md` (本 PLAN で凍結する設計文書)
- `docs/test-design/harness/L7-windows-hide-spawn-guard-test-design.md` (対になるテスト設計)
- `docs/test-design/harness/L7-unit-test-design.md` の索引節 (子プロセスの windowsHide 検査)

## 検証の対

- 設計 ↔ テスト設計: 上記の設計文書と専用テスト設計の対 (gate / テストレベル / 検証手法はテスト設計側に書く)

## 完了条件

- [ ] 引き渡し物が上流 digest の revision と整合し、非著者 family の review が PASS
- [ ] `ut-tdd plan lint` exit 0
