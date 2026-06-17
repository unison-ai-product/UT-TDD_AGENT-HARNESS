---
plan_id: PLAN-L7-70-skill-pack-curation
title: "PLAN-L7-70 (impl): skill pack の UT-TDD substance curate (FR-L1-47 / FR-L1-12)"
kind: impl
layer: L7
drive: agent
parent_design: docs/design/harness/L5-detailed-design/module-decomposition.md
status: confirmed
created: 2026-06-17
updated: 2026-06-17
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-17"
    tests_green_at: "2026-06-17"
    verdict: pass
    scope: "Skill substance curation closed: 54 packs all carry UT-TDD substance (0 generic stubs), valid skill.v1 routing frontmatter, real ut-tdd commands only, 0 legacy terms, readability 0 markers. pmo-tech-docs subagents authored per requirement-mapped batches; PM verified via asset catalog, doctor, readability/asset-drift gates, byte-level U+FFFD scan, and full Vitest (685)."
    worker_model: sonnet
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - skill pack UT-TDD substance curate (catalog frontmatter + body)"
generates:
  - artifact_path: docs/plans/PLAN-L7-70-skill-pack-curation.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/deprecation-cutover.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/ci-gate-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/harness-observability.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/data-migration.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/ci-deploy-and-rollback.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/browser-testing-and-screen-verification.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L5-06-skill.md
  requires:
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/migration/helix-fork-completion-plan.md
  references:
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/plans/PLAN-DISCOVERY-03-skill-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
---

# PLAN-L7-70 (impl): skill pack の UT-TDD substance curate

## 0. Objective

Realize FR-L1-47 (skill pack の UT-TDD curate) and FR-L1-12 (L 単位 文脈注入) by
giving `docs/skills/*.md` packs genuine UT-TDD substance: correct routing
frontmatter (consumed by `src/skills/recommend.ts`) and bodies that describe the
skill **as applied inside the UT-TDD workflow** (real `ut-tdd` commands,
`.ut-tdd/` state, V-model layers, drive models, gates). HELIX vendor sources are
loose reference only (ADR-001, §1.5 of the fork plan); no verbatim copies, no
HELIX/ai-dev-kit terms.

## 1. Problem (verified 2026-06-17)

A four-agent survey confirmed the fork plan §2.5 risk: the ~47 existing curated
packs share an identical generic stub body ("This is a UT-TDD Agent Harness
skill document … Scope … Operating Rules") with no skill-specific procedure. The
recommender (`recommendSkillsForPlan`) still scores on frontmatter
`applies_to.layers` / `applies_to.drive_models`, so injection is mechanically
wired but injects **no useful procedure**. Audit verdict over 47 packs:
0 KEEP-ASIS, 38 NEEDS-SUBSTANCE, 9 PRUNE.

## 2. Scope

Requirements-driven (§1.5): a pack stays only if it maps to an FR-L1-* / drive /
mode. Three operations:

- **Add (new packs):** §2.1 migrate-now topics that UT-TDD lacks (deprecation,
  CI gate design, observability, data migration, deploy/rollback, browser
  verification, runbook, LLM routing, …) — authored from UT-TDD design.
- **Substance pass (existing):** rewrite the 38 NEEDS-SUBSTANCE stub bodies with
  real UT-TDD procedure; fix frontmatter routing tags where wrong.
- **Prune (§1.5):** remove HELIX-shaped / no-requirement / duplicate packs
  (`ai-coding`, `api`, `code-review`, `documentation`, `project-management`,
  `quality-lv5`, `security-and-hardening`, `source-driven-development`,
  `testing` — each re-confirmed before deletion).

Command vocabulary is constrained to the **real** `ut-tdd` surface (status,
doctor, plan lint, plan use, review, handover, skill suggest, team, codex,
claude, gate, vmodel lint, telemetry, metrics, graph, find, db, setup, asset
catalog). Not-yet-implemented commands (`ut-tdd task classify`, `ut-tdd reverse`,
`ut-tdd scrum`, `ut-tdd debt`) are §6 P0/§ pending work and must NOT be cited as
if live; reference the drive/mode and existing lint instead.

## 3. Batches

Multi-batch; `generates` is extended per batch as packs land.

- **Batch 1 (this PLAN):** 6 new high-value packs that reference only real
  commands — `deprecation-cutover`, `ci-gate-design`, `harness-observability`,
  `data-migration`, `ci-deploy-and-rollback`,
  `browser-testing-and-screen-verification`.
- **Batch 2+:** remaining new packs (`incident-runbook`, `llm-agent-routing`,
  …), substance pass over the 38 stubs, and the 9 prunes.

## 4. Acceptance Criteria

- Each landed pack has valid `skill.v1` frontmatter (name, skill_type ∈ the
  existing 7-value set, `applies_to.layers` ∈ L0–L14, `applies_to.drive_models`
  ∈ the 9-value set).
- Each landed pack body is UT-TDD-substantive (real commands/state/gates), not
  the generic stub, and contains no HELIX/ai-dev-kit terms or `HELIX_*` env.
- `ut-tdd asset catalog`, `ut-tdd doctor`, Biome, typecheck, and Vitest stay
  green; readability/asset-drift lints pass on the new packs.
- Review evidence recorded before the accept gate.

## 5. Status

Confirmed 2026-06-17. Substance pass complete across 4 batches:

- Batch 1: 6 new packs (deprecation-cutover, ci-gate-design, harness-observability,
  data-migration, ci-deploy-and-rollback, browser-testing) + search-index SSoT fix.
- Batch 2: 5 substance rewrites (gate-planning, research, documentation-and-adrs,
  design-doc, agent-cost-design).
- Batch 3: 36 substance rewrites (review/security, test/impl, design/api/db,
  agents/context, planning, Reverse series).
- Batch 4: 4 substance rewrites (poc, debt-register, project-management,
  requirements-handover) + 2 new packs (incident-runbook, llm-agent-routing) +
  SKILL_MAP rewritten as the real catalog index + prune of 4 (ai-coding,
  quality-lv5, source-driven-development, SKILL_MAP-draft).

Result: 54 packs, all UT-TDD substance, 0 generic stubs. This satisfies the fork
plan §8(1) skill-curation + substance-pass component of the vendor-removal gate.
