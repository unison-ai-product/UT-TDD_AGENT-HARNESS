---
plan_id: PLAN-REVERSE-362-pack-update-check-advisory-backfill
title: "PLAN-REVERSE-362: Pack update-check advisory の設計 back-fill"
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
    slot_label: "TL - update-check advisory back-fill review"
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
    scope: "PLAN-L7-362 実装 (update-check advisory) からの L6 setup-solo-team §8 back-fill。TL 初回 request-changes (remote の origin 継承誤読) を受けて §8 の remote 契約を repository.url 正 + hasOwnGit 限定 fallback へ更新し、実装・オラクル (U-UPDCHK-001〜017) と 1:1 一致することを再レビューで確認 (追認 approve)。"
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
---

# PLAN-REVERSE-362: Pack update-check advisory の設計 back-fill

## R0 Evidence

PLAN-L7-362 が導入済み consumer 向けのバージョンアップ通知 (update-check advisory) を実装した:
`src/setup/update-check.ts` (fail-open / harness-root 基準 / TTL 24h キャッシュ) と
`ut-tdd status` の additive 表示 (`update:` 行 + `--json` の `update` フィールド)、
CLI `--version` の package.json 同期。設計正本 (L6 setup-solo-team.md) にこの契約が
無い gap を back-fill する。

## R1 Observed Gap

- v0.1.4 release (A-184) で tag-pin 更新運用は成立したが、導入済み consumer が新 release の
  存在を知る機構の設計が L6 に存在しなかった (setup-guide §4 の prose のみ)。
- CLI `--version` が commander の固定文字列 (0.1.0) で package.json (0.1.4) と乖離しており、
  version 表示の正本ソースが設計上未定義だった。

## R2 Alignment

setup-solo-team.md の既存契約群 (§6 wrapper 契約 = consumer cwd と harness checkout の分離、
§7 setup-smoke 契約 = fail-close な導入検査) と同じ軸に整列する。update-check は §7 と対照的に
**fail-open な advisory** であり、gate へ昇格させないことを不変条件として明記する。

## R3 / R4 Outcome

setup-solo-team.md へ **§8 update-check advisory 契約** を追加 (contract marker:
`checkForUpdate`、oracle U-UPDCHK-001〜017)。不変条件 = advisory 非 gate / harness-root 基準 /
remote の正 = package.json `repository.url` (origin fallback は自身の `.git` 保有時のみ、
TL review 所見1) / TTL 24h キャッシュ (remote キー付き) / status additive 表示 /
GitHub Watch (Releases) は doc 契約として並置。
forward_routing は gap-only (要件レベルの変更なし。配布運用 (A-184) の物理設計精緻化)。

## DoD

- [x] L7 実装 (update-check.ts / status 配線 / --version 同期) と L6 §8 の契約が一致する。
- [x] fail-open 不変条件 (gate 非昇格) が設計正本に載る。
- [x] harness-root 基準 (consumer cwd 非依存) + remote の正 (repository.url) が設計正本に載る。
