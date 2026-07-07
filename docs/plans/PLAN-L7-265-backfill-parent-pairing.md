---
plan_id: PLAN-L7-265-backfill-parent-pairing
title: "PLAN-L7-265 (refactor): backfill parent pairing for draft reverse"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Backfill pairing lint の内部表現補正。requires の ready 依存規約は維持し、draft Reverse pairing の表明を dependencies.parent でも読めるようにするだけで、route_mode-kind lint の仕様追加や上位設計変更は行わない。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - backfill parent pairing"
generates:
  - artifact_path: docs/plans/PLAN-L7-265-backfill-parent-pairing.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/backfill-pairing.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\lint\\backfill-pairing.ts"
        output_digest: "sha256:b8ea7e33c71c66ad7fa09f61d1460f516a55c38e8a272d7a0eb2d2cac4657371"
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\backfill-pairing.test.ts"
        output_digest: "sha256:fc0a4545f6c5c76ca411c81958a9d0ac593740068f4b12ea136144f0df8f4266"
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\plan-lint.test.ts"
        output_digest: "sha256:776c92380b6aa95715359be308b7fa9249769030f31f89af797b728443dc5488"
dependencies:
  parent: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  requires: []
  references:
    - src/lint/backfill-pairing.ts
    - src/plan/lint-policy.ts
    - tests/backfill-pairing.test.ts
    - tests/plan-lint.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:05:00+09:00"
    tests_green_at: "2026-07-02T17:05:00+09:00"
    verdict: approve
    scope: "Draft add-impl / Reverse pairing deadlock resolved by reading Reverse dependencies.parent in backfill pairing while keeping requires readiness unchanged."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:05:00+09:00"
        evidence_path: src/lint/backfill-pairing.ts
        output_digest: "sha256:b8ea7e33c71c66ad7fa09f61d1460f516a55c38e8a272d7a0eb2d2cac4657371"
      - kind: unit_test
        command: "bun run vitest run tests\\backfill-pairing.test.ts tests\\plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:05:00+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:fc0a4545f6c5c76ca411c81958a9d0ac593740068f4b12ea136144f0df8f4266"
---

# PLAN-L7-265: backfill parent pairing for draft reverse

## 背景

実走中に、draft の `add-impl` と draft Reverse back-fill PLAN を正規に結ぼうとすると、`requires_not_ready` と `backfill-pairing` が衝突することを確認した。`requires` は ready dependency であり、draft PLAN を指すと plan governance が fail する。一方、従来の backfill-pairing は Reverse 側の `requires` だけを back-fill 証跡として読んでいた。

ここで `READY_DEPENDENCY_STATUSES` を広げると、依存関係全体の意味を緩めてしまう。今回は backfill-pairing の読解だけを補正し、Reverse 側の `dependencies.parent` が対象 L7 PLAN を指す場合も pairing として扱う。

## 変更

- `ParsedPlan` に `parent` を追加し、frontmatter の `dependencies.parent` を読む。
- Reverse PLAN の `requires` に加えて `parent` も backfill reference として集計する。
- Reverse `parent` が対象 add-impl を指す場合は、bidirectional `requires` 欠落として扱わない。
- draft Reverse を `dependencies.requires` で指すと `requires_not_ready` のままになることを test で固定する。

## 検証

- `bunx biome check --write src\\lint\\backfill-pairing.ts tests\\backfill-pairing.test.ts tests\\plan-lint.test.ts`
- `bun run typecheck`
- `bun run vitest run tests\\backfill-pairing.test.ts tests\\plan-lint.test.ts --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `READY_DEPENDENCY_STATUSES` は変更しない。
- [x] draft add-impl / draft Reverse pairing は Reverse `parent` で表明できる。
- [x] Reverse `parent` が別 PLAN を指す場合は従来通り orphan になる。
- [x] route_mode-kind lint 全体実装や GitHub/release 操作には広げない。
