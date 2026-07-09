---
plan_id: PLAN-REVERSE-362-pack-update-check-advisory-backfill
title: "PLAN-REVERSE-362: Pack update-check advisory design backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - update-check advisory backfill review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-362-pack-update-check-advisory-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-362-pack-update-check-advisory.md
  requires: []
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T21:02:00+09:00"
    tests_green_at: "2026-07-03T20:53:30+09:00"
    verdict: approve
    scope: "PLAN-L7-362 からの L6 setup-solo-team §8 backfill。remote 正本を override / repository.url とし、origin fallback を harness root .git 保有時だけに限定する TL finding を設計へ反映。CI skip と consumer cwd 実走 oracle を含む U-UPDCHK-001..020 と一致することを確認。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/update-check.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T20:48:37+09:00"
        evidence_path: tests/update-check.test.ts
        output_digest: "sha256:0cb6b915706f3ec1d9f8f31c41ae3ff354eb3a07ac4f5adc3d9bbfaaeb5f1b1f"
        anchor_commit: d215c9f6d3965d4bd2a2f78859af2ac2f46830e0
---

# PLAN-REVERSE-362: Pack update-check advisory design backfill

## R0 Evidence

`PLAN-L7-362` は導入済み consumer に新 release を知らせる update-check advisory を実装した。実装 surface は `src/setup/update-check.ts`、`ut-tdd status` の `update:` line / JSON `update` field、CLI `--version` の package version 同期である。

## R1 Observed Gap

L6 `setup-solo-team.md` は setup / wrapper / setup-smoke の導入契約を持っていたが、release update 通知の契約を持っていなかった。特に consumer cwd と harness checkout root の分離、vendored install で consumer origin を誤読しないこと、fail-open advisory であることが設計に未反映だった。

## R2 Alignment

update-check は setup-smoke と同じ consumer 導入後 surface だが、gate ではなく advisory である。したがって L6 には以下の不変条件を追加する。

- status / doctor を赤にしない fail-open advisory。
- local version は harness root `package.json`。
- remote 正本は明示 override、次に harness root `package.json.repository.url`。
- `origin` fallback は harness root 自身が `.git` を持つ場合のみ。
- `UT_TDD_SKIP_UPDATE_CHECK=1` と `CI=true` は deterministic execution 用に remote 問い合わせを止める。
- cache は harness root 側 `.ut-tdd/state/update-check.json` に remote key 付きで保存。
- text / JSON surface は status への additive 追加。

## R3 / R4 Outcome

`docs/design/harness/L6-function-design/setup-solo-team.md` に §8 update-check advisory 契約を追加した。forward routing は gap-only。上位要求の意味変更はなく、Pack consumer 導入品質の設計精緻化で閉じる。

## DoD

- [x] L7 実装と L6 §8 の契約が一致する。
- [x] fail-open / non-gate の不変条件が L6 に載る。
- [x] harness-root 基準、override / repository.url 正本、consumer origin 誤読防止が L6 に載る。
