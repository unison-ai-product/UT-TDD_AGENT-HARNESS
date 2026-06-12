---
plan_id: PLAN-L7-18-gate-confirm
title: "PLAN-L7-18 (add-impl): gate-confirm coupling lint 実装 (IMP-079)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-12
owner: PM / Codex TL
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-12"
    tests_green_at: "2026-06-12"
    verdict: approve_after_fixes
    scope: "L7 completion audit A-135: U-GCONF artifacts exist, target tests and full npm test green, G4/G7 codex-only checklist review passed with .ut-tdd/audit/A-135-l7-completion-review-checklist.yaml."
agent_slots:
  - role: tl
    slot_label: "TL - gate-confirm analyzer / doctor hard/fail-close 配線"
  - role: qa
    slot_label: "QA - gate park / PASS / parse skip oracle と実 repo guard を確認"
generates:
  - artifact_path: src/lint/gate-confirm.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/gate-confirm.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-17-gate-confirm.md
  requires: []
---

# PLAN-L7-18 (add-impl): gate-confirm coupling lint 実装 (IMP-079)

## §0 位置づけ

PLAN-L6-17 の機能設計を実装する。`gate-design.md` §2 台帳が park/未PASS の layer に confirmed design/test-design doc がある場合、freeze 偽装として hard/fail-close violation を出す。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] lint module 実装
直列理由: file_conflict
`src/lint/gate-confirm.ts` に parser / loader / analyzer / messages を追加する。

### Step 2: [直列] doctor 配線
直列理由: downstream_dependency
`checkGateConfirm` を doctor に hard/fail-close で配線し、`runDoctor.ok` に連動させる。

### Step 3: [直列] tests 実装
直列理由: downstream_dependency
gate park -> violation、PASS -> ok、parse failure -> skip の oracle を追加する。

### Step 4: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で純関数/loader 分離、hard/fail-close、oracle coverage を確認する。

## §3.1 実装計画

- 情報源: PLAN-L6-17、`gate-design.md` §2、既存 `module-drift` / `review-evidence` lint。
- `parseGateStatuses` / `analyzeGateConfirm` / `loadGateConfirmDocs` / `gateConfirmMessages` を実装する。
- add-impl back-fill は PLAN-REVERSE-17 で受ける。

## §6 用語更新

新規 glossary term は追加しない。既存の gate / confirmed / doctor を使う。

## §8 DoD

- [x] lint module / doctor hard/fail-close / tests が実装されている
- [x] typecheck / vitest / doctor が green
- [x] PLAN-REVERSE-17 が本 PLAN を requires している
