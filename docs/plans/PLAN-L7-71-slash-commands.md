---
plan_id: PLAN-L7-71-slash-commands
title: "PLAN-L7-71 (impl): .claude/commands slash-command transplant (FR-L1-12)"
kind: impl
layer: L7
drive: agent
parent_design: docs/design/harness/L5-detailed-design/module-decomposition.md
status: confirmed
created: 2026-06-17
updated: 2026-06-19
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "Phase-1 slash command transplant (.claude/commands/{ship,sdd-review,sdd-plan,spec,test,build,code-simplify}.md、commit 7305fe7) の status drift (draft のまま放置) を解消し confirmed 化。AC を機械再検証: ①7 ファイル全て実在・description frontmatter 有 ②legacy-term scan (helix/HELIX_/ai-dev-kit) = 0 hit ③全ファイルが実在 ut-tdd command (review/gate/status/plan lint/doctor) を参照 ④allowlisted subagent のみ参照。typecheck/Biome/Vitest 785/doctor EXIT=0。P2 (innovation-{tech,marketing,synthesize}) は §4 で明示 defer (本 confirmed の scope 外)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - slash command transplant (UT-TDD adaptation)"
generates:
  - artifact_path: docs/plans/PLAN-L7-71-slash-commands.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/ship.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/sdd-review.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/sdd-plan.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/spec.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/test.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/build.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/code-simplify.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-70-skill-pack-curation.md
  requires:
    - docs/migration/helix-fork-completion-plan.md
    - docs/skills/SKILL_MAP.md
  references:
    - .claude/CLAUDE.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-71 (impl): .claude/commands slash-command transplant

## 0. Objective

Realize the fork plan §4 (slash commands, highest-leverage net-new stream) by
creating `.claude/commands/` — absent in UT-TDD — with Claude Code slash commands
that operationalize the UT-TDD review/spec/TDD/impl gates. These are the
"recommended command" element of FR-L1-12 layer-context injection.

## 1. Adaptation rule (§1.5)

Commands are re-authored for UT-TDD, HELIX as loose reference only:

- Reference the **real** `ut-tdd` command surface (review --uncommitted, gate,
  status, plan lint, doctor) — never `helix` commands.
- Reference UT-TDD allowlisted subagents only (code-reviewer, security-audit,
  qa-test, pmo-*, pdm-*); the `PreToolUse(Agent)` guard enforces this.
- Reference the curated UT-TDD skill packs in `docs/skills/`, not legacy skill ids.
- No legacy terms (`helix`, `HELIX_`, ai-dev-kit paths).

## 2. Scope (Phase-1)

- **P0:** ship (fan-out orchestrator → code-reviewer/security-audit/qa-test →
  go/no-go), sdd-review (5-axis review), sdd-plan (verifiable task breakdown).
- **P1:** spec (spec-first), test (TDD), build (incremental impl), code-simplify
  (refactor).
- **P2 (defer):** innovation-{tech,marketing,synthesize} (invoke pdm-* agents)
  — deferred to a later batch.

## 3. Acceptance Criteria

- `.claude/commands/*.md` exist with a `description` frontmatter and a UT-TDD
  prompt body.
- No legacy terms; only real ut-tdd commands and allowlisted agents referenced.
- `ut-tdd doctor`, Biome, typecheck, Vitest stay green.

## 4. Status

Confirmed 2026-06-19. Phase-1 commands (P0+P1: ship, sdd-review, sdd-plan,
spec, test, build, code-simplify) were authored and committed 2026-06-17
(`7305fe7`); the PLAN status had drifted at `draft` despite the work being
complete and the commands being live. Re-verified against §3 acceptance criteria
(all 7 files exist with a `description` frontmatter, zero legacy terms, only real
`ut-tdd` commands and allowlisted agents referenced) and flipped to confirmed.

**Explicit deferral (formal carry):** the P2 innovation commands
(`innovation-tech`, `innovation-marketing`, `innovation-synthesize`, invoking the
`pdm-*` agents) are intentionally out of this PLAN's scope.

- owner: PM (Opus) / PO (人間)
- condition: author the P2 innovation commands in a later batch when the
  innovation-agent workflow surface (pdm-* invocation contract) is exercised.
  Until then this is a recorded deferral, not an under-design gap.
