---
plan_id: PLAN-L7-132-green-command-digest-integrity
title: "PLAN-L7-132 (impl): green_command digest 実体検査 — fake substance 可視化 advisory"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: se
    slot_label: "SE - green-command digest integrity advisory"
  - role: tl
    slot_label: "TL - non-breaking advisory review"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
parent_design: docs/design/harness/L6-function-design/function-spec.md
generates:
  - artifact_path: docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/green-command-digest.ts
    artifact_type: source_module
  - artifact_path: tests/green-command-digest.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
dependencies:
  parent: null
  requires:
    - PLAN-L7-108-review-green-command-evidence
review_evidence:
  - reviewer: code-reviewer (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23"
    tests_green_at: "2026-06-23"
    verdict: approve
    scope: "green-command digest integrity advisory: pure auditGreenCommandDigests + node deps + fail-safe doctor advisory (non-blocking). code-reviewer (sonnet) VERDICT=pass, Critical 0; Important (actual==='' test, case-normalization comment) reflected. green_command digests below are REAL sha256 of evidence_path (this gate dogfoods its own rule — no fake placeholder digests)."
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/green-command-digest.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: tests/green-command-digest.test.ts
        output_digest: "sha256:4c10eca9258ffe560b0eb420d9ecac699ad0e7423b519f09cdf6db81e0000018"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: src/lint/green-command-digest.ts
        output_digest: "sha256:898a7a236a2873fdbd0df6b380331fcd70774334af71abd3bd6fb721d721a7f4"
---

# PLAN-L7-132 (impl): green_command digest 実体検査

## 0. Objective (PO 指示 2026-06-23「すべて」)

green-command-evidence gate (PLAN-L7-108) は `output_digest` の **形式** しか見ず、それが
`evidence_path` の **実ファイル hash** かを照合しない。よって `sha256:110feedbac000001` のような
fake/プレースホルダ digest が gate を通り、「substance を強制する gate」が fake substance で満たせる
穴がある (coverage ≠ substance のメタ再発、[[feedback_coverage_not_substance]])。本 PLAN はその穴を
**可視化** する検査を追加する。

## 1. 実測 (実 repo)

`checkGreenCommandDigests(repoRoot)` を実 repo で実行 → **90 件 / 約 45 PLAN** の `output_digest` が
`evidence_path` の実 hash と不一致 (= 全 green_command digest が fake/stale) を検出。green-command
evidence 制度が実質ゼロ substance で稼働していたことを実証した。

## 2. 実装 (本 PLAN で着地済)

- `src/lint/green-command-digest.ts`:
  - `auditGreenCommandDigests(plans, deps)` — 各 green_command の `output_digest` が `evidence_path`
    の実 sha256 と一致するか照合し不一致 (digest-mismatch / file-missing) を返す純関数 (I/O 注入)。
  - `nodeDigestAuditDeps` / `greenCommandDigestMessages` (cap 8 + breadcrumb) / `checkGreenCommandDigests`
    (fail-safe ラッパ)。
- `src/doctor/index.ts`: **advisory (非ブロック)** として配線 (ok に含めない note 行)。

## 3. 非破壊の理由 (warn-first)

既存 committed PLAN (L7-108〜131, REVERSE-*) が fake digest を持つため、hard-fail にすると doctor を
一斉赤化させ他ランタイムの committed 状態をデグレさせる。よって本検査は note で可視化に留める。
**hard 化は全 fake digest 是正後** (coordinated cleanup) に昇格する。

## 4. AC (acceptance / substance)

- `tests/green-command-digest.test.ts` (5 ケース): 実 hash 一致=pass / fake=digest-mismatch /
  file 不在=file-missing / 空 skip / message 整形。実証 = `bun run vitest run` 5/5 green、`tsc` EXIT=0。
- 実 repo で 90 件検出 (§1) = prose でなく機械事実。

## 5. carry / 次工程

1. **本 PLAN 自身の confirm は実 sha256 で行う** (fake digest を使わない = 本 gate の趣旨を自ら遵守)。
2. **90 件の fake digest 是正** (coordinated): Codex の committed PLAN 群の digest を実 hash へ。完了後に
   本検査を hard-fail へ昇格。
3. **evidence_path の意味論確定** (source file か command-output capture か) を L6 設計で明文化。

## 6. 壊さない / 再発させない

- green_command の substance は **digest=evidence_path 実 hash** で機械照合する。形式 gate だけに頼らない。
- 是正前に hard 化するな (committed 状態の一斉デグレを招く)。
