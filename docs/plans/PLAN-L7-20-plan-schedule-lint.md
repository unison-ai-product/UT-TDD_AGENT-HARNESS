---
plan_id: PLAN-L7-20-plan-schedule-lint
title: "PLAN-L7-20 (add-impl): plan lint §工程表 最小強制 実装 (IMP-081)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM / Codex TL
agent_slots:
  - role: tl
    slot_label: "TL - src/plan/lint.ts 最小実装と doctor warn-first 配線"
  - role: qa
    slot_label: "QA - U-PLANSCH oracle と実 repo self-check を確認"
generates:
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-19-plan-schedule-lint.md
  requires:
    - docs/plans/PLAN-REVERSE-19-plan-schedule-lint.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:58:00+09:00"
    reviewed_at: "2026-06-09T17:00:00+09:00"
    verdict: approve
    scope: "Plan-schedule lint implementation already shipped; lint/typecheck/vitest/doctor green before confirmation; reverse pairing edge added."
---

# PLAN-L7-20 (add-impl): plan lint §工程表 最小強制 実装 (IMP-081)

## §0 位置づけ

PLAN-L6-19 の機能設計を `src/plan/lint.ts` に実装する。今回の範囲は §1.10.G.4 最小スライスであり、full engine は後続 carry とする。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] plan lint 実装
直列理由: file_conflict
`src/plan/lint.ts` を stub から analyzer/loader/messages へ拡張する。

### Step 2: [直列] doctor 配線
直列理由: downstream_dependency
doctor に plan-schedule surface を warn-first で追加し、`runDoctor.ok` には連動させない。

### Step 3: [直列] tests 実装
直列理由: downstream_dependency
missing mode / missing serial reason / missing review Step / missing §3.1 の oracle を追加する。

### Step 4: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で §1.10.G.4 最小スライスと既存 PLAN への過検知を確認する。

## §3.1 実装計画

- 情報源: PLAN-L6-19、requirements §1.10.G.4、IMP-081。
- add-impl back-fill は PLAN-REVERSE-19 で受ける。

## §6 用語更新

新規 glossary term は追加しない。

## §8 DoD

- [x] `src/plan/lint.ts` が scaffold stub ではなく最小 analyzer を持つ
- [x] tests/plan-lint.test.ts が oracle を持つ
- [x] PLAN-REVERSE-19 が本 PLANを requires している
