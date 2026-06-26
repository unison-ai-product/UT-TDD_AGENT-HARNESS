---
plan_id: PLAN-REVERSE-140-forward-convergence-version-up-backfill
title: "PLAN-REVERSE-140: forward-convergence 不変条件 + version-up 駆動モデルの正本 back-merge (DISCOVERY-08/09 S4 fullback)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: be
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "§6.8.8.1 forward-convergence fail-close 不変条件を新設、§7.8.1 に version_deferral signal を追加。"
  - layer: L4-basic-design
    decision: not_impacted
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "forward-convergence / version-up は PLAN frontmatter + lint レベルの統制で、L4 基本設計の機能構造は不変。"
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
    reason: "version_target は frontmatter marker で物理データ schema (harness.db) を変えない。"
agent_slots:
  - role: tl
    slot_label: "TL — forward-convergence/version-up の正本 back-merge fullback レビュー"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-140-forward-convergence-version-up-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/version-up.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-DISCOVERY-08-forward-convergence-invariant.md
    - docs/plans/PLAN-DISCOVERY-09-version-up-mode.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-06-26T15:30:00+09:00"
    tests_green_at: "2026-06-26T15:20:00+09:00"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
    scope: "DISCOVERY-08 (forward-convergence) / DISCOVERY-09 (version-up) の confirmed poc → Forward/governance 正本 back-merge fullback (IMP-064)。設計は別 runtime (Codex gpt-5.5, role=tl) が APPROVE-WITH-CHANGES (証跡 .ut-tdd/review/cross-review-versionup-and-s4-failclose.md、Critical 反映済)。back-merge 後 doctor exit 0 (readability/rule-drift/doc-consistency/scrum-reverse/forward-convergence/forward-convergence-audit 全 green)。"
    green_commands:
      - kind: doctor
        command: "bun src/cli.ts doctor (S4 back-merge 後: readability/rule-drift/doc-consistency/scrum-reverse/forward-convergence green)"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T15:20:00+09:00"
        evidence_path: docs/process/modes/version-up.md
        output_digest: "sha256:c53a3647b66dba5c5e947ca591b04c312b53d974a57ae41fdcd40077fdecd73b"
      - kind: unit_test
        command: "bunx vitest run tests/forward-convergence.test.ts (version-up parked + fail-close + legacy audit)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T15:20:00+09:00"
        evidence_path: tests/forward-convergence.test.ts
        output_digest: "sha256:f069920038d511eb8f00e6aaa1fa6fa223062f237b21e88085e7ba8f13e8e9d5"
---

# PLAN-REVERSE-140: forward-convergence + version-up 正本 back-merge (DISCOVERY-08/09 S4 fullback)

## 0. なぜ (IMP-064: confirmed poc → Reverse 合流)

`PLAN-DISCOVERY-08` (forward-convergence 不変条件) と `PLAN-DISCOVERY-09` (version-up 駆動モデル) を S4 ADOPT
(decision_outcome=confirmed) するに伴い、その成果を Forward/governance 正本へ戻す fullback。確証なき設計を inline
promote しただけで Reverse を起こさない §1.2 違反を避けるための正規合流 (IMP-064、scrum-reverse lint)。

## 1. back-merge した正本 (Codex APPROVE-WITH-CHANGES 反映、最小追補)

- **requirements §6.8.8.1 (新)**: forward-convergence fail-close 不変条件 (spine-外 kind=impl landed 未集約 =
  NEW 違反、legacy allowlist + audit doc 双方向一致、version-up parked は正当 deferred)。
- **requirements §7.8.1 / concept §2.6.1**: `version_deferral` signal → version-up routing。
- **concept §2.5**: version-up を 9-mode 後の追加 mode として追補 (新 kind なし、`version_target` marker、第4の状態)。
- **docs/process/modes/README.md §2/§4 + version-up.md**: version-up mode 台帳 + routing + 定義 doc。

## 2. 不変条件 (壊さない)

- 「9-mode」コア集合は据置き、version-up は後発追加として明示 (count を勝手に振り直さない)。
- version_target は status=draft 限定 (landed 付与禁止 = schema fail-close)。集約逃れを作らない (Codex Critical)。
- forward-convergence は fail-close で NEW のみ gate、legacy 2 件は audit + allowlist 双方向一致で grandfather。
- L4-basic-design / L5-detailed-design は not_impacted (本変更は PLAN frontmatter + lint レベルで設計内部不変)。
