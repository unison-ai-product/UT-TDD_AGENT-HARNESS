---
plan_id: PLAN-L7-92-plan-body-substance-gate
title: "PLAN-L7-92 (troubleshoot): PLAN 本文 substance gate — 本文 0 行・declare のみの hollow PLAN を AP-13 で fail-close"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO「入れて」(2026-06-22) を受け PLAN-L7-91 §6 で follow-up としていた『PLAN 本文の空 (AP-13)』機械強制を実装。concept §3.6 AP-13『本文 0 行・成果物 declare のみの PLAN は無効』を deliverable hollow ([[PLAN-L7-91]]) の PLAN 版として fail-close。新規 lint plan-body-substance: frontmatter を除いた本文に『先頭 h1 タイトル / 空行 / HTML コメントを除く実体行が 0』の PLAN を violation。countSubstantiveBodyLines (純関数、CRLF 対応、先頭 h1 のみ skip) + loader (archived 除外) + doctor hard gate。閾値は AP-13 literal bright-line (本文 0 行) ゆえ terse PLAN を罰しない: 実リポ最小は PLAN-REVERSE-45 の 6 実体行 = blast radius 0 を scan で確認、repo green 維持。test 10 ケース (count 6: title-only/comment-only/empty/CRLF/2nd-h1 + analyze 2 + loader/check 2)。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - PLAN body substance gate (AP-13 hollow-plan enforcement)"
generates:
  - artifact_path: docs/plans/PLAN-L7-92-plan-body-substance-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/plan-body-substance.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/plan-body-substance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-91-hollow-deliverable-detection.md
  requires: []
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-92 (troubleshoot): PLAN body substance gate (AP-13)

## 0. Objective

「本文 0 行・成果物 declare のみの PLAN は無効」(concept §3.6 AP-13) を機械強制する。
deliverable の hollow 検出 ([[PLAN-L7-91]]) の **PLAN 本文版** = declare-only な hollow PLAN を塞ぐ。

## 1. Problem

AP-13 は「frontmatter (declare) だけで本文が無い PLAN は無効」と謳うが、これを強制する機械
チェックが無かった。PLAN は進め方/設計/根拠を持つ実体であるべきで、frontmatter + タイトルのみの
declare-only PLAN は coverage (登録) のみ substance (中身) 不在の hollow ([[feedback_coverage_not_substance]])。

## 2. Fix

`src/lint/plan-body-substance.ts` (新規) + doctor 配線:

- `countSubstantiveBodyLines(content)`: frontmatter を除いた本文の「実体行」数 (純関数)。
  実体行 = 空行でなく / HTML コメントでなく / 先頭 h1 タイトル (1 回のみ skip) でない行。CRLF 対応。
- `analyzePlanBodySubstance`: 実体行 0 の PLAN を violation。
- `loadPlanBodySubstanceInput`: docs/plans を読み archived を除外して各 PLAN の実体行を算出。
- `checkPlanBodySubstance`: doctor hard gate (ok 連動、I/O 失敗は fail-close)。

## 3. Acceptance Criteria — met

- [x] frontmatter + タイトルのみ / 本文空 / コメントのみ の PLAN を fail-close。
- [x] 先頭 h1 のみ skip (2 個目以降の見出し・§ 節・prose は実体に数える)。
- [x] CRLF frontmatter 対応。archived 除外。閾値は AP-13 literal (本文 0 行)。
- [x] blast radius 0 (実リポ最小 6 実体行、scan 確認、repo green 維持)。
- [x] test 10 ケース。typecheck / Biome / Vitest / doctor green。

## 4. Out of scope

- 本文の「量」や「質」の評価 (terse-but-real を罰しない、bright-line は 0 行のみ)。
- DB row の field-null substance / prose 真偽 (機械化不能、[[PLAN-L7-89]] と同じ境界)。
