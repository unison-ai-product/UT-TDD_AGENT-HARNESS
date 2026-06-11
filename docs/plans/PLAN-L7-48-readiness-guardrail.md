---
plan_id: PLAN-L7-48-readiness-guardrail
title: "PLAN-L7-48: harness.db automation-readiness + guardrail-ledger"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-11
updated: 2026-06-11
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "readiness/guardrail span: missing evidence blocks readiness, human-required is not downgraded, self-review/missing signoff becomes guardrail finding."
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — readiness 分類 / guardrail 非降格 invariant のレビュー (別 runtime)"
  - role: qa
    slot_label: "QA — IT-AUTOMATION-01 / GUARDRAIL-01 の観点レビュー"
generates:
  - artifact_path: src/workflow/readiness.ts
    artifact_type: source
  - artifact_path: src/guardrail/ledger.ts
    artifact_type: source
  - artifact_path: tests/readiness-guardrail.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - docs/test-design/harness/L8-integration-test-design.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - .claude/CLAUDE.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-48: harness.db automation-readiness + guardrail-ledger

## §0 PLAN

工程表 PLAN-L7-44 の span ④ (G-L7DB.B → G-L7DB.C、③⑤と並列)。projection (span ②) の上に
workflow 自動化の readiness 分類と guardrail 決定台帳を実装する。安全境界 (human-required) を
DB が黙って降格しないことを機械担保する面。

## §1 Objective

- `evaluateAutomationReadiness()` → ready / blocked / human-required 分類 → `ut-tdd automation readiness`。
- `recordGuardrailDecision()` → agent-guard / review / escalation / human signoff を `guardrail_decisions`
  正規化 → `ut-tdd guardrail status`。

## §2 不変条件 (DbC)

- **missing evidence では ready にできない** (証跡なし ready 禁止、blocked は open findings 参照)。
- **human-required を DB projection が降格できない** (same-model self-review / missing signoff = block)。
- secret / provider transcript body を出力・格納しない。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] IT-AUTOMATION-01 / GUARDRAIL-01 を TDD Red 先行
直列理由: downstream_dependency
`tests/readiness-guardrail.test.ts` に 2 IT の失敗テスト (missing evidence→ready 不可 /
self-review・missing signoff→block) を置く。

### Step 2: [直列] readiness + guardrail-ledger 実装
直列理由: downstream_dependency (span ② projection) + file_conflict (src/workflow, src/guardrail)
evaluateAutomationReadiness / recordGuardrailDecision + CLI 2 本を実装し Green。

### Step 3: [直列] review 前置
直列理由: downstream_dependency
証跡なし ready 不可 / human-required 非降格 / secret 非出力 を review し evidence 記録。

## §3.1 実装計画

- 情報源: `internal-processing.md` (evaluateAutomationReadiness / recordGuardrailDecision DbC)、
  `if-detail.md` (`automation readiness` / `guardrail status` 出力契約)、`physical-data.md`
  (workflow_runs / guardrail_decisions)、`L8` IT-AUTOMATION-01 / GUARDRAIL-01。
- guardrail の human-required 境界は `.claude/CLAUDE.md` の review 前置 / escalation 境界と整合。

## §4 DoD

- [ ] IT-AUTOMATION-01 / GUARDRAIL-01 green。
- [ ] `automation readiness` / `guardrail status` runnable、不変条件維持。
- [ ] 全回帰 + doctor green、review 前置 evidence。

## §6 用語更新

| term | type | definition / delta | L0 back-merge |
|---|---|---|---|
| automation readiness | clarified | workflow/gate/doctor/CI projection を join した ready/blocked/human-required 分類。証跡なしで ready にしない。 | not required; L7 scoped |
| guardrail decision ledger | clarified | agent-guard/review/escalation/human signoff の projection。silent pass を防ぎ human-signoff 境界を保持。 | not required |
