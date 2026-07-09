---
plan_id: PLAN-REVERSE-396-encoding-byte-integrity-backfill
title: "PLAN-REVERSE-396: encoding byte-integrity 検出能力の設計 back-fill (fullback)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-07-08
updated: 2026-07-08
owner: PM (Opus)
route_signal: drift
route_mode: reverse
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T21:12:55+09:00"
    tests_green_at: "2026-07-08T21:12:55+09:00"
    verdict: approve
    scope: "PLAN-REVERSE-396。byte-level integrity 検出能力を L6 governance-enforcement と L7 U-READ oracle へ back-fill し、PLAN-L7-395 と双方向に接続した。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\readability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:fbf9f70d81ef7a721267b30a823682cab012a9a64f9ee0f023864693cc812184"
        anchor_commit: 9f8a3d399f56c0e0a4be5518b97371b8f1ba9075
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T21:12:00+09:00"
        evidence_path: docs/design/harness/L6-function-design/governance-enforcement.md
        output_digest: "sha256:6df7a9705f3666525864d6d6072f5962321d5c1c277b64d1269bae693942b3a0"
        anchor_commit: 9f8a3d399f56c0e0a4be5518b97371b8f1ba9075
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/governance-enforcement.md
    reason: "byte-level integrity 検出 (BOM / strict-UTF8 / 制御文字 / JSON escape) を readability gate 能力の設計として登録する。"
  - layer: requirements
    decision: not_impacted
    reason: "PLAN frontmatter / V-model 工程の要件は不変。harness 内部の検出信号強化であり外部 requirement 契約を変えない。"
  - layer: L4-basic-design
    decision: not_impacted
    reason: "外部ランタイム機能設計は不変。lint gate の検出信号のみ拡張。"
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "詳細データ / モジュール設計は不変。既存 readability モジュール内の追加関数のみ。"
agent_slots:
  - role: tl
    slot_label: "TL - fullback 設計 back-fill レビュー"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-396-encoding-byte-integrity-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-395-byte-integrity-readability-guard.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/governance-enforcement.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-395-byte-integrity-readability-guard.md
  requires:
    - docs/plans/PLAN-L7-395-byte-integrity-readability-guard.md
---

# PLAN-REVERSE-396: encoding byte-integrity 検出能力の設計 back-fill (fullback)

## R0 Evidence

byte-level integrity 検出 (BOM / strict-UTF8 / NUL・C0/C1 制御文字 / JSON escape 化 U+FFFD) は
PLAN-L7-395 で実装 (`src/lint/readability.ts` の `analyzeByteIntegrity`) されたが、その検出能力を
readability gate 設計 (L6 governance-enforcement) の一部として明示登録する上流成果が欠けていた。
先行する encoding-corruption guard (PLAN-L7-69) は string-level marker denylist のみを設計に持ち、
byte-level positive validation 層は設計に不在だった。

## R1 Observed Gap

これはソースコードのバグではなく、設計 (L6) の盲点である:

- readability gate の設計は string-level marker denylist を前提にしており、`readFileSync(...,"utf8")` の
  lossy decode でバイト真実が失われる点 (BOM 素通り / NUL blind spot / JSON escape 漏れ) を能力として
  記述していなかった。
- IMP-086 (C0/C1 制御文字検出) は observed のまま未クローズで、設計に紐付いていなかった。

## R2 Alignment

修正は readability lint の検出信号強化に留まり (`analyzeByteIntegrity` 追加、既存 `analyzeReadability`
は不変)、外部ランタイム機能 (L4/L5) は変えない。設計 back-fill は L6 governance-enforcement に
byte-level integrity 能力を追記するのみ。

## R3 / R4 Outcome

`docs/design/harness/L6-function-design/governance-enforcement.md` に byte-level integrity 検出能力を
登録した。readability gate は「string-level marker denylist」+「byte-level positive validation
(BOM / strict-UTF8 / 制御文字 / JSON escape)」の多層防御として設計上明示される。denylist は
double-encode 型 (valid UTF-8 だが意味的ゴミ) の唯一の防波堤として残す。

## DoD

- [x] Root cause (設計盲点) を記録した。
- [x] L6 governance-enforcement に byte-level integrity 能力を追記した。
- [x] PLAN-L7-395 が実装・テスト成果を記録し、本 Reverse と双方向 requires で対を成す。
