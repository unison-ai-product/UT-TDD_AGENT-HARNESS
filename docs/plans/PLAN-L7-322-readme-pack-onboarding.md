---
plan_id: PLAN-L7-322-readme-pack-onboarding
title: "PLAN-L7-322 (refactor): README Pack-first onboarding wording"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "README の導入例を Pack / PATH 前提へ修正する文書リファクタリングであり、CLI contract や配布 artifact set は変更しない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-321-personal-path-guard-generalization.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - README Pack-first onboarding wording"
generates:
  - artifact_path: docs/plans/PLAN-L7-322-readme-pack-onboarding.md
    artifact_type: markdown_doc
  - artifact_path: README.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-321-personal-path-guard-generalization.md
  requires: []
  references:
    - README.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T12:39:45+09:00"
    tests_green_at: "2026-07-03T12:39:45+09:00"
    verdict: approve
    scope: "README の導入導線が source development repo checkout 前提に見えないことを確認する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "if (rg -n \"UT-TDD-agent-harness/scripts/ut-tdd|C:\\\\path\\\\to\\\\UT-TDD-agent-harness|/path/to/UT-TDD-agent-harness\" README.md) { exit 1 } else { exit 0 }"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:38:41+09:00"
        evidence_path: README.md
        output_digest: "sha256:fce86b2eddab157b9bc057fbdcb6d5b0753bf7e65a211c1e6d90119653d96d01"
        anchor_commit: 4cad95cb8dc6e33562e79a240092200b78b49dce
      - kind: lint
        command: "if (rg -n \"setup harness|harness checkout|harness source|source CLI|setup source\" README.md src\\setup\\templates.ts tests\\setup.test.ts) { exit 1 } else { exit 0 }"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:38:41+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:0c072f0c9731577265bbbf95583c5a0463ae3776efc467e71a4ee570fb8f440f"
        anchor_commit: 4cad95cb8dc6e33562e79a240092200b78b49dce
      - kind: unit_test
        command: "bun run vitest run tests\\readability.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:38:43+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
        anchor_commit: c18872c85c31a3a316cdcc0290cf55348f11b69d
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T12:38:43+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:1f660274902543771978fb7f71407c655dfe9e210229885326e7d34bb59f4447"
        anchor_commit: 4cad95cb8dc6e33562e79a240092200b78b49dce
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:38:46+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:0c072f0c9731577265bbbf95583c5a0463ae3776efc467e71a4ee570fb8f440f"
        anchor_commit: 4cad95cb8dc6e33562e79a240092200b78b49dce
      - kind: unit_test
        command: "bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T12:39:35+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
        anchor_commit: c18872c85c31a3a316cdcc0290cf55348f11b69d
---

# PLAN-L7-322: README Pack-first onboarding wording

## 背景

README の quick start / setup 詳細に `/path/to/UT-TDD-agent-harness/scripts/ut-tdd` や `C:\path\to\UT-TDD-agent-harness\...` が残っていた。さらに wrapper エラー文と setup test 名にも `setup harness source` と読める表現が残っていた。これは source development repo を手元に置く前提に見え、Pack / consumer checkout を正本にする配布方針と相性が悪い。

## 変更

- quick start の setup 例を `ut-tdd setup --solo` にする。
- 詳細導入では Pack checkout / PATH の `ut-tdd` を既定経路として説明する。
- PATH に入れていない場合だけ `<pack-checkout>/scripts/ut-tdd` / Pack PowerShell wrapper を示す。
- setup wrapper のエラー文と setup test 名を Pack-first の表現へ寄せる。

## 非対象

- `distribution sync-pack` や Pack repo 名の変更。
- setup wrapper の解決順序変更。
- Pack artifact set の変更。

## 検証

- `rg -n "UT-TDD-agent-harness/scripts/ut-tdd|C:\\path\\to\\UT-TDD-agent-harness|/path/to/UT-TDD-agent-harness" README.md`
- `rg -n "setup harness|harness checkout|harness source|source CLI|setup source" README.md src\\setup\\templates.ts tests\\setup.test.ts`
- `bun run vitest run tests\\readability.test.ts --reporter=dot`
- `bun run vitest run tests\\setup.test.ts --reporter=dot`
- `bun run typecheck`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack: `bun run vitest run tests\\readability.test.ts --reporter=dot`
- Pack: `bun run vitest run tests\\setup.test.ts --reporter=dot`
- Pack: `bun run test:pack`

## DoD

- [x] README の導入例が source development repo checkout 名に依存しない。
- [x] Pack / PATH の `ut-tdd` が既定導線として読める。
- [x] setup wrapper のエラー文が source checkout 前提に見えない。
- [x] source / Pack の readability と Pack smoke が green。
