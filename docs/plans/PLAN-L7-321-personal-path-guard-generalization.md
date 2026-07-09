---
plan_id: PLAN-L7-321-personal-path-guard-generalization
title: "PLAN-L7-321 (refactor): personal absolute path guard generalization"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "既存の個人パス guard を任意ユーザー名へ一般化する局所変更であり、上位要件の追加や公開 CLI contract 変更はない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-233-personal-path-guard-generalization.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - personal path guard generalization"
generates:
  - artifact_path: docs/plans/PLAN-L7-321-personal-path-guard-generalization.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/personal-path.ts
    artifact_type: source_module
  - artifact_path: src/lint/asset-drift.ts
    artifact_type: source_module
  - artifact_path: src/lint/project-hook.ts
    artifact_type: source_module
  - artifact_path: tests/asset-drift.test.ts
    artifact_type: test_code
  - artifact_path: tests/project-hook.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-233-personal-path-guard-generalization.md
  requires: []
  references:
    - docs/plans/PLAN-L7-233-personal-path-guard-generalization.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T12:29:09+09:00"
    tests_green_at: "2026-07-03T12:29:09+09:00"
    verdict: approve
    scope: "asset-drift / project-hook の個人絶対パス検出が特定ユーザー名に依存しないことを確認する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:28:12+09:00"
        evidence_path: src/lint/personal-path.ts
        output_digest: "sha256:a1bffe6a59542a45b64ae6b920c10541d99dd0efd4c66d669f535c313fc49818"
        anchor_commit: e03252d90b8658d18e61bb97a7a9f524589e31e9
      - kind: unit_test
        command: "bun run vitest run tests\\asset-drift.test.ts tests\\project-hook.test.ts tests\\handover.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:28:13+09:00"
        evidence_path: tests/asset-drift.test.ts
        output_digest: "sha256:8dc9a648802491f755a87856cf9353e8ab0fc3edec23b26c4aac5f2d621c5ace"
        anchor_commit: e03252d90b8658d18e61bb97a7a9f524589e31e9
      - kind: unit_test
        command: "bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:29:01+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
        anchor_commit: c18872c85c31a3a316cdcc0290cf55348f11b69d
---

# PLAN-L7-321: personal absolute path guard generalization

## 背景

`asset-drift` と `project-hook` は個人絶対パスを検出する意図を持つが、一部の正規表現が `C:\Users\micro` 固定になっていた。これは自己開発環境には効くが、外部利用者の `C:\Users\<name>` / `/Users/<name>` / `/home/<name>` を検出できず、Pack の汎用性を落とす。

## 変更

- `src/lint/personal-path.ts` を追加し、Windows / macOS / Linux の個人ホーム絶対パス判定を共有する。
- `asset-drift` の legacy source path residue 検出を任意ユーザー名の個人絶対パスへ広げる。
- `project-hook` の forbidden path 検出を `C:\Users\micro` 固定から共有パターンへ置き換える。
- 任意ユーザー名の Windows / POSIX パスを検出する単体テストを追加する。

## 非対象

- handover の username masking fixture から `micro` を除く変更。
- historical docs / migration provenance に残る legacy 文字列の削除。
- Pack 配布先 repo 名の変更。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\asset-drift.test.ts tests\\project-hook.test.ts --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack: `bun run typecheck`
- Pack: `bun run vitest run tests\\asset-drift.test.ts tests\\project-hook.test.ts --reporter=dot`
- Pack: `bun run test:pack`

## DoD

- [x] `asset-drift` が任意ユーザー名の Windows / POSIX 個人絶対パスを検出する。
- [x] `project-hook` が任意ユーザー名の Windows / POSIX 個人絶対パスを検出する。
- [x] source / Pack の検証が green。
