---
plan_id: PLAN-L7-259-pack-github-ci-profile-loader
title: "PLAN-L7-259 (refactor): Pack GitHub CI profile loader"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "既存の GitHub CI policy lint の loader 入力解釈に閉じた修正であり、source/Pack CI gate の要求仕様自体は変更しない。Pack checkout で .github の harness-check が Pack workflow になる配布形状を正しく読むための補正。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - Pack GitHub CI profile loader"
generates:
  - artifact_path: docs/plans/PLAN-L7-259-pack-github-ci-profile-loader.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\lint\\github-ci-policy.ts"
        output_digest: "sha256:0288e613cd5e8177b321cdd915a5334ad08d388b669936b399d687c1634ee0b6"
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\github-ci-policy.test.ts"
        output_digest: "sha256:d887228a5e38dedcae795251d9e7311b987c14c0e075857901c71fb4c57c3ad7"
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-197-github-ops-workflow-hardening.md
  references:
    - src/lint/github-ci-policy.ts
    - tests/github-ci-policy.test.ts
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T16:25:00+09:00"
    tests_green_at: "2026-07-02T16:25:00+09:00"
    verdict: approve
    scope: "Pack checkout の .github harness-check を Pack profile として読み、source template を fallback として読む loader 補正。"
    worker_model: codex
    reviewer_model: codex
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\github-ops-guard.test.ts tests\\github-ci-policy.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:25:00+09:00"
        evidence_path: tests/github-ci-policy.test.ts
        output_digest: "sha256:d887228a5e38dedcae795251d9e7311b987c14c0e075857901c71fb4c57c3ad7"
---

# PLAN-L7-259: Pack GitHub CI profile loader

## 背景

Pack checkout では `.github/workflows/harness-check.yml` が clean Pack repository 用 workflow になる。一方、`loadGithubCiPolicyDocs` は `.github` の workflow を常に source profile として読み込んでいたため、Pack checkout 上で `github-ci-policy.test.ts` を直接実行すると source 必須 step 欠落として失敗する。

これは CI policy の要求仕様ではなく、配布後のファイル配置に対する loader の解釈ミスである。

## 変更

- `.github/workflows/harness-check.yml` の内容から source / pack profile を推定する。
- source template `docs/templates/github/common/harness-check.yml` を fallback として読み込む。
- 同一 profile が複数存在する場合は、先に見つかった実 workflow を優先して重複登録しない。
- Pack checkout 形状を一時ディレクトリで再現する unit test を追加する。

## 検証

- `bunx biome check --write src\\lint\\github-ci-policy.ts tests\\github-ci-policy.test.ts`
- `bun run vitest run tests\\github-ops-guard.test.ts tests\\github-ci-policy.test.ts --reporter=dot`
- `bun run typecheck`
- `bun run src\\cli.ts doctor`

## DoD

- [x] source repo では実 `.github` source workflow と Pack template が検証される。
- [x] Pack repo では実 `.github` Pack workflow と source template が検証される。
- [x] 対象 test が source / Pack の両方で green。
- [x] Pack repo へ sync され、Pack gate が green。
