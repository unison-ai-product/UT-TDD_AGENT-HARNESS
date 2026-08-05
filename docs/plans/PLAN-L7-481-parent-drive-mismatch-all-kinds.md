---
plan_id: PLAN-L7-481-parent-drive-mismatch-all-kinds
title: "PLAN-L7-481 (impl): parent_drive_mismatch の全 kind 適用と ratchet baseline"
kind: impl
layer: L7
sub_doc: function-spec
drive: db
status: confirmed
route_signal: forward
route_mode: forward
created: 2026-08-05
updated: 2026-08-05
owner: PO / TL
parent_design: docs/design/harness/L4-basic-design/architecture.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - kind 絞り込みの除去・ratchet baseline・stale 検出を実装する"
  - role: qa
    slot_label: "QA - impl kind 検出 / baseline WARN / stale 再通知の oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-481-parent-drive-mismatch-all-kinds.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/parent-drive-mismatch-baseline.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-54-merged-plan-status-gate.md
  requires: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/262
    - src/plan/lint.ts
    - tests/plan-lint.test.ts
github_issue_id: 262
review_evidence:
  - reviewer: claude-fable-5
    review_kind: cross_agent
    reviewed_at: "2026-08-05T17:55:00+09:00"
    tests_green_at: "2026-08-05T17:15:00+09:00"
    verdict: approve
    scope: >-
      PR #265 (issue #262) の cross-review。author family=codex (spark tier、PO 申告 2026-08-05
      により frontier 停止中) / reviewer family=claude。初回 FLAG 2 件 (parent_missing=11 未処置 /
      新規 baseline モジュールの PLAN ownership 欠落) は 82e7991e (parent 参照の実修正) と本 PLAN
      起票で解消。追加是正 1 件: IMPL_PLAN_TRACE_BASELINE への新規追加 (9 件化) は「縮小のみ可」
      契約違反のため revert し、trace は本 PLAN の generates で持つ (9fd3ea32)。設計面は
      kind 絞り込み除去 + 39 件 ratchet + parent_drive_mismatch_debt_stale (直した債務の
      baseline 降ろし忘れを再通知) を確認し、stale 検出は #258 型「腐る baseline」への機械解
      として妥当。U-PLANGOV-003a/b/c が新挙動を、U-IPT-005 が baseline 非混入の負の回帰網を
      それぞれ固定している。
    worker_model: gpt-5.3-codex-spark
    reviewer_model: claude-fable-5
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-05T17:15:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:80232540375a07850edbe6e46a794969e75dee23f91e9f8b16bf5a8b0d9df9ec"
        anchor_commit: 9fd3ea3279b4191c6e56463bd22977e24d01d4a7
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/impl-plan-trace.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-05T17:15:00+09:00"
        evidence_path: tests/impl-plan-trace.test.ts
        output_digest: "sha256:affecc57fa85b271e773a8280d98e690d9847e248c9b6adbfd18b8c9b821e8a1"
        anchor_commit: 9fd3ea3279b4191c6e56463bd22977e24d01d4a7
---

# PLAN-L7-481: parent_drive_mismatch の全 kind 適用と ratchet baseline

## 0. 起票理由 (issue #262)

`parent_drive_mismatch` は `kind` が `add-design` / `add-impl` のときしか評価されず、
`kind: impl` の子 PLAN は親と drive が食い違っても素通りしていた (2026-08-05 実測:
`PLAN-L7-473` (add-impl, be != agent) は PR #226 で fail-close したが、同系統の
`PLAN-L7-479` (impl, be != agent) は PR #260 で green のまま main へ merge された)。

## 1. 実装 (PR #265)

- `src/plan/lint.ts`: `kind` 絞り込みを外し、`deps.parent` を持つ全 PLAN に
  `parent_missing` / `parent_drive_mismatch` を適用する。`parentDrive === "fullstack"` の
  免除は維持。parent が PLAN ref でない場合は path 実在で判定する。
- `src/plan/parent-drive-mismatch-baseline.ts` (本 PLAN の generates): 適用拡大で可視化された
  既存債務 **39 件**の ratchet baseline。**縮小のみ可・新規追加禁止**。
- **stale 検出**: baseline 収載 PLAN の mismatch が解消された (親へ揃えた / 親が fullstack 化
  した) のに baseline に残っている場合、`parent_drive_mismatch_debt_stale` として fail-close
  する。直した債務を降ろし忘れて baseline が腐る型 (#258 の指摘) への機械解。
- 適用拡大で同時に可視化された `parent_missing` 11 件は、baseline ではなく**親参照の実修正**
  (`82e7991e`、PLAN-L7-61〜67 ほか) で解消した。存在しない親は債務ではなく誤記だからである。

## 2. 検証

- `U-PLANGOV-003a`: impl kind の子にも mismatch が発火する (適用拡大の正の oracle)。
- `U-PLANGOV-003b`: baseline 収載 39 件は violation にならない (ratchet)。
- `U-PLANGOV-003c`: 解消済み債務の baseline 残置は `parent_drive_mismatch_debt_stale`。
- `U-IPT-005`: 本 PLAN の generates モジュールが `IMPL_PLAN_TRACE_BASELINE` に**居ない**こと
  (縮小のみ可契約の負の回帰網。9 件化の再発防止)。

## 3. 残債

- baseline 39 件の実修正 (親へ drive を揃える / 親子関係の見直し) は本 PLAN の scope 外。
  stale 検出があるため、修正のたびに baseline 縮小が機械強制される。
- `PLAN-L7-479` (be != agent、merge 済み) も 39 件に含まれる。訂正は #262 の残作業。
