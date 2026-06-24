---
plan_id: PLAN-L7-93-plan-completion-drift-gate
title: "PLAN-L7-93 (troubleshoot): PLAN completion-drift gate — DoD 全消化なのに status 非終端の bookkeeping drift を fail-close"
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
    scope: "PO『2 はそもそも通過してないとおかしい段階だろ。ただの記載ミスか運用ミスだろ。再発防止に努めろ』(2026-06-22) を受け、PLAN-RECOVERY-02 が freeze-ready (Phase 1-3 完了 + gated downstream L1-*/L3-* 全 confirmed + 機械 trace green) なのに status=draft 放置で毎 session 再報告された完了 bookkeeping drift の再発防止を実装。誘因 = 既存 merged-plan-status gate は src/tests/scripts/.claude の出荷物しか見ず、deliverable が自分の md だけの recovery PLAN を構造的に見逃す。新規 lint plan-completion-drift = plan-dod の欠けた逆方向 (DoD 全消化 ⇒ status 終端) を全 layer に fail-close: dodChecklistState (純関数、checked/unchecked 独立カウント、日本語『完了条件』対応、次 ## で節打切、CRLF 対応) + analyze (checked≥1 かつ unchecked=0 かつ非終端 → violation) + loader (archived 除外) + doctor hard gate。部分チェック WIP (DISCOVERY-03 = S1 のみ消化) / DoD 無し PLAN は false positive を出さない。実リポ非終端 PLAN は RECOVERY-02 (本 session で completed 化) と DISCOVERY-03 (部分チェック) のみ = 修正後 repo green (blast radius 0)。RECOVERY-02 に DoD 節を追加し本 gate の被覆下に置いた。test 16 ケース (dodChecklistState 6 + analyze 5 + loader/check 3 + archived/fail-close 2)。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - PLAN completion-drift gate (DoD↔status bidirectional consistency)"
generates:
  - artifact_path: docs/plans/PLAN-L7-93-plan-completion-drift-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/plan-completion-drift.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/plan-completion-drift.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-87-merged-plan-status-kind-independent.md
  requires: []
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-93 (troubleshoot): PLAN completion-drift gate

## 0. Objective

「DoD/完了条件チェックリストを全消化したのに status が非終端 (draft/in_progress) のまま」放置される
**完了 bookkeeping drift** を機械検出する。merged-plan-status ([[PLAN-L7-87]]) が見られない
「自分の md だけが deliverable」な recovery/poc PLAN の status 前進忘れを fail-close で塞ぐ。

## 1. Problem

PLAN-RECOVERY-02 (V-model 正規式 recovery) は Phase 1-3 完了 + gated downstream (L1-*/L3-* PLAN) が
全 confirmed + 機械 trace green = **freeze-ready** だったのに、recovery PLAN 自身の status だけが
draft に取り残され、毎 session「PO 判断待ちの未了」として再報告される false-state を生んでいた
(PO 指摘 = 「そもそも通過してないとおかしい段階」「ただの記載ミス / 運用ミス」)。

機械で surface されなかった根因:

- **merged-plan-status の盲点**: 出荷物ルート (src/tests/scripts/.claude) の deliverable 実在を
  drift シグナルにするが、RECOVERY-02 の `generates` は自分の markdown だけ (実際の成果は既存
  governance/design doc への編集で、`generates` 非記載 + 元から実在)。よって構造的に検出不能。
- **plan-dod の片肺**: status=confirmed/completed なのに DoD 未チェック → violation は見るが、
  逆 (DoD 完了なのに status 非終端) を見ない。かつ L7-* 限定。

= 「作業は完了したが status を前進させ忘れる」運用ミス ([[feedback_verify_carry_status_against_code]])
が absence-blind で埋もれ、人手 PLAN 読みでしか発見できなかった。

## 2. Fix

`src/lint/plan-completion-drift.ts` (新規) + doctor 配線:

- `dodChecklistState(content)`: DoD/完了条件/Definition of Done 節のチェックリスト消化状態を
  checked (`- [x]`) / unchecked (`- [ ]`) で独立カウント (純関数)。節検出は plan-dod と同一規則
  (日本語『完了条件』対応 / 次 `## ` で節打切 / CRLF 対応)。
- `analyzePlanCompletionDrift`: checked≥1 かつ unchecked=0 かつ status 非終端 (confirmed/completed/
  accepted 以外) → violation。
- `loadPlanCompletionDriftInput`: docs/plans を読み archived を除外。
- `checkPlanCompletionDrift`: doctor hard gate (ok 連動、I/O 失敗は fail-close)。

加えて **PLAN-RECOVERY-02 を是正**: PO サインオフ (freeze 通過は既済の運用ミス) を review_evidence に
記録 + DoD 節を追加 (Phase 1-3 + freeze 全 [x]) + status draft→completed。これで本 gate の被覆下に入る。

## 3. Acceptance Criteria — met

- [x] DoD 全消化 + 非終端 → fail-close。DoD 全消化 + 終端 (completed/confirmed/accepted) → ok。
- [x] 部分チェック (`- [ ]` 残) の WIP は素通り (DISCOVERY-03 = S1 のみ消化を false positive にしない)。
- [x] DoD 節無し / チェックリスト項目ゼロは対象外 (過剰検出しない)。archived 除外。
- [x] prose の「freeze-ready」等を真偽判定しない (構造化 checklist 消化状態のみがシグナル)。
- [x] 実リポ非終端 PLAN は RECOVERY-02 (completed 化) / DISCOVERY-03 (部分チェック) のみ = blast radius 0。
- [x] test 16 ケース。typecheck / Biome / Vitest / doctor green。

## 4. Out of scope

- DoD 節を持たない PLAN への DoD 必須化 (presence gate) — 既存多数 PLAN を flag し blast radius 非 0
  ゆえ別案件。本 gate は「checklist が完了シグナルを出している」場合のみ。
- 「未了の正の集計シグナル」(層別非終端 PLAN 数 / open defer 数) の status/handover surface
  = IMP-139 (相補だが別 PLAN、informational additive surface)。
