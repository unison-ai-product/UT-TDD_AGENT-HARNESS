# HELIX → UT-TDD Fork Completion Plan

## 0. Purpose

Consolidate the in-house agent infrastructure into UT-TDD Agent Harness so the
`vendor/helix-source/` snapshot becomes purely historical and can eventually be
removed. This plan inventories what is still reusable in the snapshot (skills,
subagents, slash commands, hooks, CLI tools) and sequences the remaining fork
work. It is a planning artifact: per-stream `PLAN-*` tickets are authored
separately (Codex) from this gap list.

Inventory was gathered by three parallel repository surveys reconciled against
`helix-source-inventory.md`, `helix-porting-map.md`, `v2-import-ledger.md`, and
`internal-asset-inventory.md`, then key load-bearing claims were re-verified
against the working tree (`.claude/commands` absence, roll-up pack absence,
agent HELIX-reference cleanliness).

## 1. Coverage Summary (verified 2026-06-17)

| Stream | Source total | Already in UT-TDD | Reusable / pending | Obsolete (HELIX-specific) |
|---|---:|---:|---:|---:|
| Skills (`skills/**/SKILL.md`) | 107 | 57 curated | 32 (20 migrate-now + 12 defer) | 18 |
| Subagents (`.claude/agents`) | 19 | 17 transplanted | 0 new (5 body-polish) | 2 (`pmo-helix-*`) |
| Slash commands (`.claude/commands`) | 10 | 0 (dir absent) | 10 | 0 |
| Hooks (`.claude/hooks`) | 13 active | 4 TS-replaced | 5 (transplant/redesign) | 3 |
| CLI capabilities (`cli/helix-*`) | 28 | 17 re-implemented | 9 | 2 |
| Verify harness (`verify/`) | 5 groups | unit-smoke covered | E2E flow gap | — |

Repository runtime has **no** load-bearing dependency on `vendor/helix-source/`
(no `src/**` or `tests/**` reference it). Removal is functionally safe; the only
hard coupling is the tracked-canonical SSoT (`repository-structure.md`).

## 2. Skills — complete the migration

### 2.1 Migrate-now (20) — UT-TDD-relevant, not yet curated

Curate these vendor skills into `docs/skills/*.md` (re-authored UT-TDD packs,
not verbatim copies, per ADR-001 / concept_v3.1 §"skill pack"):

- `advanced/ai-integration` — LLM integration / RAG / agent routing (orchestration core)
- `advanced/migration` — ETL / data-integrity / Strangler-Fig (TS cutover)
- `agent-skills/browser-testing-with-devtools` — real-browser test (central UI / L10)
- `agent-skills/ci-cd-and-automation` — `harness-check` CI gate design
- `agent-skills/deprecation-and-migration` — active HELIX→TS cutover
- `agent-skills/technical-writing` — V-model design docs / ADR quality baseline
- `agent-skills/using-agent-skills` — skill discovery/trigger protocol (SKILL_MAP is index-only)
- `automation/observability` — FR-38 telemetry / harness.db observability
- `common/coding` — foundational implementation quality baseline
- `design-tools/diagram` — Mermaid/D2 for ADR/architecture/data docs
- `tools/ai-search` — Haiku research-delegation pattern (pmo-haiku)
- `tools/web-search` — WebSearch/WebFetch primary-source protocol
- `workflow/deploy` — CI deploy / rollback discipline
- `workflow/dev-policy` — DoD / dev-rules (maps to gate-design.md)
- `workflow/runbook` — recovery/incident runbook discipline
- `workflow/schedule-wbs` — PLAN schedule-steps / WBS generation
- (+ re-confirm: `agent-skills/frontend-ui-engineering`, `agent-skills/mock-driven-development`,
  `automation/job-queue`, `automation/lock` straddle migrate-now/defer; see §2.2)

### 2.2 Defer (12) — relevant but Phase-B / later-wave

FE/UI packs (`project/fe-*`, `project/ui`, `design-tools/web-system`,
`agent-skills/frontend-ui-engineering`, `agent-skills/mock-driven-development`,
`agent-skills/performance-optimization`) gate on central UI Phase B (ADR-005,
backend-first). Ops packs (`workflow/observability-sre`, `agent-skills/shipping-and-launch`,
`automation/job-queue`, `automation/lock`, `advanced/external-api`,
`advanced/legacy`) gate on W12/W17. Curate when their wave activates.

### 2.3 Out-of-scope (18) — do not migrate

HELIX personal-project / web-product specific: `advanced/i18n`,
`advanced/innovation-mgr`, `advanced/marketing-innovation`, `advanced/tech-innovation`,
`automation/flow-optimize`, `automation/init-setup`, `automation/scheduler`,
`automation/site-mapping`, `common/design`, `common/infrastructure`,
`common/performance`, `common/visual-design`, `design-tools/{character,graphic,pptx}`,
`tools/ide-tools`, `workflow/{compliance,dev-setup}`, `writing/{explain,japanese,presentation,social}`.

Nuance to confirm with PO: `agent-skills/helix-scrum`, `workflow/incident`,
`workflow/postmortem` are tagged out-of-scope because UT-TDD already owns
`docs/process/modes/{scrum,incident,recovery}.md`, but a UT-TDD-adapted skill
pack (e.g. `ut-tdd-scrum.md`) would be migrate-now if the process-mode doc is
treated as the trigger surface. **Decision needed.**

### 2.4 Doc-drift fix (skills)

`helix-porting-map.md` W10 rows name roll-up pack targets
(`test-pack.md` / `design-pack.md` / `implementation-pack.md` /
`operations-pack.md` / `security-pack.md`) that were **superseded by
individual-file curation** and do not exist. Update W10 to record the
individual-file approach and flag the not-curated rows as the §2.1 gap.

### 2.5 Substance pass (coverage ≠ substance)

The 57 "curated" packs are confirmed by name/capability match only; curation
**depth is unverified**. Add a substance-review pass that reads each curated
pack against its vendor source and confirms the procedure was actually adapted,
not just name-stubbed. (Aligns with the recorded coverage-not-substance risk.)

## 3. Subagents — finish polish, retire 2

- **Transplanted (17):** all HELIX-reference-clean (verified 0 HELIX/ai-dev-kit
  mentions). No portability action needed.
- **Body polish (low priority, NOT a leak):** `pmo-project-scout`, `pmo-sonnet`,
  `pmo-tech-docs`, `pmo-tech-fork`, `pmo-tech-news` carry original Japanese prose
  without a UT-TDD-specific output contract / memory section like
  `pmo-project-explorer`/`pmo-haiku` have. Optional consistency upgrade; no
  HELIX path leak. (Corrects an over-stated "HELIX text" finding during survey.)
- **Retire (2):** `pmo-helix-explorer`, `pmo-helix-scout` exist only in the
  vendor snapshot and target `~/ai-dev-kit-vscode/`. Not transplant candidates;
  no UT-TDD route. No action (they vanish when vendor is removed).

## 4. Slash commands — net-new stream (highest leverage)

`.claude/commands/` does not exist in UT-TDD; **0 of 10** vendor commands are
transplanted. Create the directory and transplant (adapt HELIX names → UT-TDD,
reference allowlisted agents):

| Priority | Command | Why |
|---|---|---|
| P0 | `ship` | Fan-out orchestrator → `code-reviewer`/`security-audit`/`qa-test`, synthesize go/no-go. Directly implements the UT-TDD review gate; nothing replicates it today. |
| P0 | `sdd-review` / `sdd-plan` | 5-axis review + verifiable-task breakdown; reinforce plan-per-requirement + review-tier discipline. |
| P1 | `spec` / `test` / `build` | spec-first → TDD → incremental impl; supports the strict-verification pillar. |
| P1 | `code-simplify` | language-agnostic refactor entry point. |
| P2 | `innovation-{tech,marketing,synthesize}` | invoke the already-allowlisted `pdm-*` agents. |

## 5. Hooks — transplant the substance/absence-blindness guards

- **Covered (4):** agent-guard, post-tool-use, stop, session-start → TS in
  `.claude/hooks` + `src/cli.ts hook ...`. No action.
- **Transplant / redesign (5):**
  - `posttooluse-plan-auto-register` + `posttooluse-helix-job-enqueue` → re-implement
    as a PLAN-edit → `harness.db` projection trigger (projection-writer exists; the
    PostToolUse wiring does not). Closes a recorded descent-absence-blindness gap.
  - `pretooluse-design-doc-web-search-guard` + its revert companion → TS rewrite;
    enforce research-before-design-doc (substance gate).
  - `pretooluse-opus-repo-block` → guard PM/Opus from direct repo code edits
    (matches the "implement via Codex, not Opus" directive); transplant if Opus
    direct-edit recurs.
  - `sessionstart-history-injection` / `userpromptsubmit-context-bundle` →
    context auto-injection; **design decision** vs the existing handover
    `CURRENT.json` model before transplanting.
- **Obsolete (3):** `pretooluse-askuserquestion` (UT-TDD bans AskUserQuestion),
  `pretooluse-codex-slot-check` (helix.db slots), HTTP-API job slots. Drop.

## 6. CLI tools / TS re-implementation — 9 pending capabilities

17 of 28 HELIX CLI capabilities are already `ut-tdd` commands. Pending (concept
reusable, TS impl absent — reference logic in the cited HELIX libs):

| Priority | Capability | Target | HELIX reference |
|---|---|---|---|
| P0 | Task classify / effort | `ut-tdd task classify`/`estimate`, `src/task/` | `task_type_inference.py`, `effort_classifier.py`, `task_dispatcher.py` |
| P0 | Scrum / Reverse runtime cmds | `ut-tdd scrum`, `ut-tdd reverse` (only lint exists) | `scrum_local.py`, `reverse_local.py`, `scrum_to_reverse_routing.py` |
| P1 | E2E CLI integration harness | temp-dir full-flow tests (verify/ `h101`/`h401` class) | `verify/h1xx`, `verify/h401` |
| P1 | Audit CLI | `ut-tdd audit` inventory/hash | `audit_validator.py`, `audit_inventory.py`, `audit_hash.py` |
| P1 | LLM / research guard / redaction | `ut-tdd guard` family | `llm_guard.py`, `research_guard.py`, `redaction.py`, `context_guard.py` |
| P2 | Escalation / debt CLI | `ut-tdd escalation` (DB tables exist, no CLI) | `escalation_engine.py`, `deferred_findings.py` |
| Defer | Dashboard / metrics render | extend `ut-tdd metrics` | `helix-dashboard`, `helix-observe` |
| Defer | Learning engine / shadow replay | — (W14) | `helix-learn`, `helix-recipe`, `helix-retro` |
| Defer | Lock / job-queue / scheduler | — (W17, not needed in solo/standalone) | `helix-lock`, `helix-job`, `helix-scheduler` |

Obsolete (no UT-TDD need): HTTP API bridge, HELIX statusline / mode-state-machine /
PR automation (UT-TDD uses `ut-tdd status` + `gh`).

## 7. Phasing

- **Phase 1 (fork-now):** §2.1 skills (20), §4 P0/P1 commands, §5 plan-auto-register
  + design-doc guards, §6 P0 (task-classify, scrum/reverse). Closes the
  highest-value gaps and the recorded absence-blindness/substance gaps.
- **Phase 2 (wave-gated):** §2.2 defer skills, §4 P2 commands, §6 P1/P2 (audit,
  guard family, escalation, E2E harness) as their waves (W9/W12/W13/W17) activate.
- **Never:** §2.3 out-of-scope skills, §3 retired agents, §5/§6 obsolete items.

## 8. Vendor-removal readiness gate

`vendor/helix-source/` may be removed once **all** hold:

1. Phase 1 migrate-now items landed and the §2.5 substance pass is green.
2. PO confirms §2.3 out-of-scope (and §2.2 defer) skills + obsolete tools are
   genuinely not needed going forward (explicit "import complete" decision).
3. `repository-structure.md` updated (drop `vendor/helix-source/` from the
   tracked list + structure tree) and `tracked-canonical` lint stays green.
4. The ~20 historical doc references (migration/archive/audit) are either left as
   acknowledged dangling history or updated.

Until then, keep the snapshot: it is the reference for the pending §6 TS
re-implementations and the §2 skill curation.

## 9. Open decisions for PO

- §2.3 nuance: adapt `helix-scrum` / `incident` / `postmortem` to UT-TDD packs, or
  leave the process-mode docs as the only surface?
- §5: context auto-injection hooks vs the existing handover model — adopt or skip?
- §8.2: declare HELIX import complete (enables vendor removal) or keep phased?

## 10. Next step

Codex authors `PLAN-*` tickets per Phase-1 stream (skills curate batch,
`.claude/commands` transplant, hook re-implementation, task-classify + scrum/reverse
TS modules), each with its V-model pair and review evidence. This document is the
driving gap list; it is not itself a PLAN ticket.
