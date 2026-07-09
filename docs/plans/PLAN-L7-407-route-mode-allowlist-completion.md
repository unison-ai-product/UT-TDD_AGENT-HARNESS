---
plan_id: PLAN-L7-407-route-mode-allowlist-completion
title: "PLAN-L7-407 (add-impl): route_mode allowed-kinds completion"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - route_mode allowlist completion"
generates:
  - artifact_path: docs/plans/PLAN-L7-407-route-mode-allowlist-completion.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-407-route-mode-allowlist-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  requires:
    - docs/plans/PLAN-REVERSE-407-route-mode-allowlist-backfill.md
    - docs/design/harness/L4-basic-design/function.md
  references:
    - .ut-tdd/memory/project-2026-07-09-9-codex.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T17:22:00+09:00"
    tests_green_at: "2026-07-09T17:20:00+09:00"
    verdict: approve
    scope: "route_mode allowed-kinds / layer-band の設計正本追従、全 mode 登録 oracle、未知 route_mode 誤扱い防止。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T17:17:00+09:00"
        evidence_path: src/plan/lint-policy.ts
        output_digest: "sha256:1c23d30c875ba13e964dc23d0f5c36a9bf07aa274bbd3747ff5d4cbbac7d3228"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T17:17:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:535fa6746109d3b09bd11d96488301a579b97b00aadc02f2400e7ffb15f5eb77"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T17:20:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:535fa6746109d3b09bd11d96488301a579b97b00aadc02f2400e7ffb15f5eb77"
---

# PLAN-L7-407: route_mode allowed-kinds completion

## 背景

HARNESS メモリ監査で、`ROUTE_MODE_ALLOWED_KINDS` が L4 §3.1 の 11 駆動モデル全体を覆わず、
`discovery` / `scrum` / `retrofit` / `research` / `design-bottomup` を未知 `route_mode` として
fail-close することが分かった。fail-open ではないため silent 誤受理はないが、設計正本に存在する mode を
実装が未知扱いするのは、駆動モデル選択厳格化の片肺状態である。

## 実装スコープ

1. `ROUTE_MODE_ALLOWED_KINDS` を L4 §3.1 に合わせ、全 11 駆動モデル + Verify を登録する。
2. `ROUTE_MODE_LAYER_BANDS` も同じ mode universe に揃え、kind だけでなく V-model 層の片肺化も防ぐ。
3. 全 route mode の kind / layer band 登録を unit test で固定する。
4. 新規登録 mode が未知 route_mode として扱われないことを unit test で固定する。

## DoD

- [x] `tests/plan-lint.test.ts` の route_mode governance tests が green。
- [x] `bun run tsc --noEmit` / `bun run lint` が green。
- [x] `bun run src\cli.ts plan lint docs\plans\PLAN-L7-407-route-mode-allowlist-completion.md docs\plans\PLAN-REVERSE-407-route-mode-allowlist-backfill.md` が green。
- [x] `bun run src\cli.ts doctor` が green。

## 残リスク

既存の landed / draft debt allowlist は今回削らない。これは履歴改ざんを避けるためであり、個別 burn-down は
`route-mode-kind-debt-audit-2026-07-02.md` の台帳に従う。
