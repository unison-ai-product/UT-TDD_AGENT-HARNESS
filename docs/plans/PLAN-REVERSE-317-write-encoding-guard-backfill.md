---
plan_id: PLAN-REVERSE-317-write-encoding-guard-backfill
title: "PLAN-REVERSE-317: write encoding guard の設計 backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: confirmed
created: 2026-07-08
updated: 2026-07-08
owner: TL / Codex
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T22:30:24+09:00"
    tests_green_at: "2026-07-08T22:30:24+09:00"
    verdict: approve
    scope: "PLAN-REVERSE-317。write encoding guard を L4/L5/L6/L7 の設計・テスト設計へ back-fill し、PLAN-L7-317 と双方向に接続した。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\write-encoding-guard.test.ts tests\\readability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T22:30:24+09:00"
        evidence_path: tests/write-encoding-guard.test.ts
        output_digest: "sha256:80188b5e3b1add41411d19ab6d1f8d68542f8d89e914f4b2a4a8748767fe0162"
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T22:30:24+09:00"
        evidence_path: src/lint/write-encoding-guard.ts
        output_digest: "sha256:5e26ec8de782c7d97f4ba53797b85f302ffaa9387a3b09baf3fea479d698746b"
backprop_scope:
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/architecture.md
    reason: "lint/runtime 間の逆依存を避ける shared helper module を building block として登録する。"
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    reason: "shared module の責務と配置意図を module inventory に登録する。"
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/governance-enforcement.md
    reason: "PostToolUse 直後の write encoding guard 契約を governance enforcement に登録する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "U-WENC-001..004 で UTF-16/BOM/shell fallback/apply_patch target の oracle を登録する。"
agent_slots:
  - role: tl
    slot_label: "TL - write encoding guard backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-317-write-encoding-guard-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-317-write-encoding-guard.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/governance-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-317-write-encoding-guard.md
  requires:
    - docs/plans/PLAN-L7-317-write-encoding-guard.md
---

# PLAN-REVERSE-317: write encoding guard の設計 backfill

## R0 Evidence

PowerShell の既定 encoding による UTF-8 誤読・UTF-16 書き込み事故は、PLAN-L7-395 の
readability / byte-integrity gate で doctor/CI 検出できる。ただし検出時点は doctor 実行時であり、
PostToolUse 直後に他ランタイムが壊れた artifact を読む連鎖は残っていた。

## R1 Observed Gap

設計上の穴は「write 後即時検査」の不在である。加えて、`lint` と `runtime` の両方が編集 target
抽出を必要とするため、片方から片方を import すると module boundary を破る。

## R2 Alignment

- `src/shared/edit-targets.ts` を低レベル pure helper として追加し、`lint` / `runtime` の逆依存を避ける。
- `governance-enforcement.md` §8 に PostToolUse advisory guard の契約を登録する。
- `L7-unit-test-design.md` に U-WENC-001..004 を登録する。

## R3 / R4 Outcome

PLAN-L7-317 は `src/lint/write-encoding-guard.ts` を実装し、`src/cli.ts hook post-tool-use` から呼び出す。
違反時は stderr warning と `.ut-tdd/logs/encoding-violations.jsonl` を出すが、hook exit は 0 のまま
fail-open とする。最終 fail-close は既存 readability doctor/CI が担う。

## DoD

- [x] L4/L5 に shared module を登録した。
- [x] L6 に write encoding guard 契約を登録した。
- [x] L7 oracle U-WENC-001..004 を登録した。
- [x] PLAN-L7-317 と双方向 requires / generates で接続した。
