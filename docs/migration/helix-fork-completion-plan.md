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

## 1.5 Migration criterion (PO directive 2026-06-17)

Curation/transplant is **requirements-driven, not HELIX-driven**. A HELIX asset
is in scope ONLY if it maps to an existing UT-TDD requirement (`FR-L1-*` / `BR-*`),
drive model (be / fe / fullstack / db / agent), or mode. The UT-TDD
requirement/design is the source of truth; HELIX is at most loose reference,
never the source.

- If a capability is **not** in UT-TDD's requirements / drive models → do **not**
  import it. Un-required HELIX behavior is untraceable scope creep and can only be
  a **degrade** risk.
- If UT-TDD already owns the capability with its **own** design (Scrum / Incident /
  Recovery / Reverse modes etc.), do **not** import the HELIX skill version — it is
  a separate, divergent design and importing it degrades the UT-TDD one. Author the
  UT-TDD skill from the UT-TDD mode/requirement instead.

Net effect: skill curation itself is the requirement (`FR-L1-47` skill-pack正本 +
`FR-L1-12` injection); this criterion scopes WHICH packs (drive/mode/FR-mapped only)
and forbids HELIX-shaped imports. §2 below is read as "which UT-TDD requirement /
drive area lacks a pack, authored from UT-TDD design" — not "which HELIX skills to
port". The §2.1 items stand only where each traces to a drive/mode/FR; the
disciplined curation step re-confirms that trace per pack and drops any that do not.

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

**Resolved (PO 2026-06-17): do NOT import.** `agent-skills/helix-scrum`,
`workflow/incident`, `workflow/postmortem` are mode-duplicates — UT-TDD already
owns Scrum (`FR-L1-23`), Incident (`FR-L1-16`), and Recovery (`FR-L1-10`) with its
own drive-model design in `docs/process/modes/{scrum,incident,recovery}.md`.
Importing the HELIX versions would introduce a divergent design = degrade. If a
skill pack is wanted for these surfaces, it is **authored from the UT-TDD mode/FR**,
with HELIX as at most loose reference — never ported (per §1.5).

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
- **Not needed (PO 2026-06-17): `sessionstart-history-injection` /
  `userpromptsubmit-context-bundle`.** Session continuity is already a UT-TDD
  requirement met by its own design — handover `CURRENT.json` (`FR-L1-42`),
  session-log digest (`FR-L1-07`), layer-context injection (`FR-L1-12`), and the
  memory system. A parallel HELIX per-prompt injection mechanism would duplicate
  that design (and bloat context, which the repo deliberately trims). No distinct
  requirement justifies it → degrade risk; do not transplant.
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

No special "import complete" declaration is needed. The snapshot is just the
read-only reference we kept while rebuilding in UT-TDD; nothing's runtime uses it.
Delete it once the **requirement-backed** work that still references it is done:

1. The §1.5-scoped (drive/mode/FR-mapped) skill packs are curated and the §2.5
   substance pass is green.
2. The §6 pending TS re-implementations that use HELIX libs as reference are
   landed (or explicitly re-scoped as defer/never).
3. `repository-structure.md` updated (drop `vendor/helix-source/` from the tracked
   list + structure tree) and `tracked-canonical` lint stays green.
4. The ~20 historical doc references (migration/archive/audit) are left as
   acknowledged dangling history or updated.

Until then, keep the snapshot — it is the reference source for (1) and (2). After
that, it is dead weight and gets removed in one commit. That is the whole of the
"vendor removal" question; there is no separate gate beyond finishing the
requirement-backed migration.

## 9. Decisions (PO 2026-06-17)

- **Mode-duplicate skills (helix-scrum / incident / postmortem): do NOT import**
  (§2.3) — UT-TDD owns these modes; importing the HELIX versions = degrade.
- **Context auto-injection hooks: do NOT transplant** (§5) — handover + session-log
  + memory already meet the session-continuity requirement; a parallel mechanism
  is duplicate/degrade and bloats context.
- **Vendor removal:** no declaration step; remove when §8 (1)–(2) — the
  requirement-backed migration — is finished. Until then, keep it.

## 10. Next step

Codex authors `PLAN-*` tickets per Phase-1 stream (skills curate batch,
`.claude/commands` transplant, hook re-implementation, task-classify + scrum/reverse
TS modules), each with its V-model pair and review evidence. This document is the
driving gap list; it is not itself a PLAN ticket.

## 11. Execution status (2026-06-17, PO directed Opus to execute — Codex at limit)

The vendor-removal gate (§8) is satisfied and the snapshot is removed this session.

- **§8(1) skill curation + substance: DONE.** `PLAN-L7-70` (confirmed). 54 packs,
  all UT-TDD substance, 0 generic stubs; `§2.1` migrate-now curated; `§1.5` prune of
  4 non-mapped / HELIX-shaped packs (`ai-coding`, `quality-lv5`,
  `source-driven-development`, obsolete `SKILL_MAP-draft`); `SKILL_MAP` rewritten as
  the real catalog index. A pre-existing search-index false-positive secret guard was
  fixed along the way.
- **§4 slash commands: DONE.** `PLAN-L7-71`. `.claude/commands/` created with P0/P1
  (ship, sdd-review, sdd-plan, spec, test, build, code-simplify). `§4` P2
  `innovation-*` deferred (invoke `pdm-*`).
- **§6 P0 task classify: DONE.** `PLAN-L7-72`. `src/task/classify.ts` +
  `ut-tdd task classify` CLI over the existing `scoreTaskComplexity` (FR-L1-39) /
  `classifyDrive` (FR-L1-41) / `inferTaskDifficulty` contracts; module back-filled
  into architecture §3.1.
- **§8(2) re-scope (explicit defer/never), as §8(2) permits:**
  - `§6 P0` scrum / reverse **runtime** commands (`ut-tdd scrum` / `ut-tdd reverse`):
    DEFER. Large mode state machines; the lint surfaces (`scrum-reverse`, `plan lint`,
    `vmodel lint`) already exist and the skill packs are authored from
    `docs/process/modes/`. Land in a later Phase-1 wave.
  - `§6 P0/P1` `ut-tdd task estimate`, audit CLI, guard family, escalation CLI, E2E
    harness: DEFER (W9/W12/W13/W17 wave-gated).
  - `§5` hooks (plan-auto-register projection trigger, design-doc web-search guard):
    DEFER as Phase-1 follow-up; not a vendor-removal blocker. The PO-resolved
    "do-not-transplant" hooks (§5/§9) stay dropped.
  - `§2.2` defer skills (FE/UI + ops packs): DEFER until their wave (central UI
    Phase B / W12) activates, per §2.2.
- **§8(3) repository-structure.md: updated** to drop `vendor/helix-source/` from the
  tracked list and the structure tree.
- **§8(4) doc references: left as acknowledged dangling history.** ~31 tracked docs
  (archive / migration / handover / Discovery PLAN `references:`) mention the snapshot;
  none is a runtime or gating dependency (no `src/**` / `tests/**` reference; no PLAN
  `requires/parent/parent_design`). They remain as historical record per §8(4).
