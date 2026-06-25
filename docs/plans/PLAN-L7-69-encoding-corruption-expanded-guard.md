---
plan_id: PLAN-L7-69-encoding-corruption-expanded-guard
title: "PLAN-L7-69 (troubleshoot): expanded encoding-corruption guard"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-16
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: Codex TL (ticket) / PM (Opus) implementation 2026-06-19
review_evidence:
  - reviewer: claude-code-reviewer (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "PLAN-L7-69 §2-3 残スコープ (.ut-tdd/audit/**/*.md + .ut-tdd/handover/**/*.json provider cross-agent payload) の mojibake guard 実装をレビュー。verdict=pass-with-nits・Critical 0・changes-required なし。4 設計論点を確認: ①raw JSON text を MOJIBAKE_MARKERS で走査 (parse でなく) は JSON.stringify 産物に対し健全 (mojibake 文字は stringify が出さない・clean ASCII/UTF-8 に false-positive なし) ②空/不在 .ut-tdd の fail-open (checked>0 不要) は generated state ゆえ妥当・prose band の checked>0 非対称は意図的で安全 ③walkFiles リファクタは walkMarkdown 既存呼出に behavior-preserving ④doctor hard-gate 配線は invocation/ok-chain/messages の 3 点完備。nit disposition: walkFiles の statSync skip は元 walkMarkdown 継承・read 経路は readFileSync→catch で fail-close 維持 (明確化コメント追記済); 残 nit (catch message の言語/live fixture/audit json 除外) は既存パターン整合 or PLAN scoping 意図ゆえ受容。typecheck/Biome/Vitest 785/doctor EXIT=0。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: tl
    slot_label: "TL - encoding corruption guard expansion"
generates:
  - artifact_path: docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/readability.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/readability.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  requires:
    - docs/improvement-backlog.md
    - .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md
---

# PLAN-L7-69: expanded encoding-corruption guard

## 0. Objective

Expand mojibake / encoding-corruption detection beyond the current freeze-readability slice so handover, audit, provider JSON, and governance-facing documents cannot silently become unreadable.

## 1. Problem

The latest session exposed unreadable handover and skill/core text. Existing readability checks are scoped to selected freeze documents and do not prove that generated handover or audit artifacts are readable.

## 2. Scope

Future implementation must cover:

- `docs/handover/**/*.md`
- `.ut-tdd/audit/**/*.md`
- `.ut-tdd/handover/**/*.json`
- `docs/plans/**/*.md`
- governance docs that are used as session-start Core Reads

Detection signals:

- U+FFFD replacement characters;
- known UTF-8/CP932 mojibake markers;
- suspicious mixed marker density in mostly Japanese documents;
- JSON string fields containing known mojibake markers.

## 3. Acceptance Criteria

- A negative test fixture with unreadable handover text fails.
- A negative test fixture with provider JSON containing mojibake fails.
- Clean ASCII handover and audit files pass.
- `doctor` surfaces the expanded guard with actionable file paths.
- The guard is scoped enough to avoid treating historical vendor snapshots as product-owned failures.

## 4. Status

Implemented 2026-06-19. The broader §2-3 scope is now closed by a dedicated
runtime-artifact readability guard. See §6 Implementation.

## 5. Partial Implementation Note (2026-06-16, superseded by §6)

2026-06-16 cleanup implemented a narrower first slice for active internal assets:

- `src/lint/asset-drift.ts` now rejects legacy runtime command/name residue in enrolled agent, skill, and prompt assets.
- `src/assets/catalog.ts` uses the same drift signal for catalog findings.
- `.claude/agents/*.md`, `docs/skills/*.md`, and `docs/templates/prompts/effort-classify.md` were normalized so active runtime assets are readable and current.
- `tests/asset-drift.test.ts`, `tests/asset-catalog.test.ts`, and `tests/doctor.test.ts` cover the detector and doctor surfaces touched by this cleanup.

The 2026-06-17 readability expansion (`loadSystemReadabilityDocs`) then extended
the prose band to the whole `docs/` tree (handover, plans, governance .md). That
closed §2's `docs/handover/**` and `docs/plans/**` markdown coverage, but left
two surfaces open until §6: `.ut-tdd/audit/**/*.md` (outside `docs/`) and
`.ut-tdd/handover/**/*.json` provider cross-agent payloads (JSON never scanned).

## 6. Implementation (2026-06-19)

A dedicated runtime-artifact readability guard closes the remaining §2-3 scope
without disturbing the prose band:

- `loadRuntimeArtifactReadabilityDocs` (`src/lint/readability.ts`) collects
  `.ut-tdd/audit/**/*.md` and `.ut-tdd/handover/**/*.json` (provider cross-agent
  payloads included) via a shared `walkFiles(dir, ctx)` helper. The same
  `MOJIBAKE_MARKERS` (U+FFFD / em-space-before-ASCII / halfwidth-katakana /
  curated CP932 tokens) run against raw JSON text, so a corrupted-unparseable
  JSON is still flagged. `.ut-tdd/` is product-owned runtime state — vendor
  source snapshots and `legacy local state/` live elsewhere and stay excluded
  (§3 scoping AC).
- `runtimeReadabilityMessages` formats a distinct `runtime-readability` doctor
  line with actionable `path:line:marker` samples.
- `checkRuntimeReadability` (`src/doctor/index.ts`) is wired as a hard gate:
  fail-open on absence (a fresh repo has no runtime artifacts to corrupt),
  fail-close on any marker, fail-close on unreadable repo root.
- Negative fixtures in `tests/readability.test.ts` prove unreadable handover/audit
  markdown fails, provider JSON with a mojibake marker fails, a U+FFFD in
  provider JSON fails, and clean ASCII JSON + fullwidth-only Japanese audit text
  pass. `tests/doctor.test.ts` asserts the gate is wired into the hard-gate
  aggregation and fails closed on a missing repo root.

### Acceptance Criteria — met

- [x] Negative fixture with unreadable handover text fails.
- [x] Negative fixture with provider JSON containing mojibake fails.
- [x] Clean ASCII handover and audit files pass.
- [x] `doctor` surfaces the expanded guard (`runtime-readability`) with file paths.
- [x] Scoped to `.ut-tdd/` product state; vendor snapshots excluded.
