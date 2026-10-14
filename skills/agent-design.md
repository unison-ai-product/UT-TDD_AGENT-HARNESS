---
schema_version: skill.v1
name: agent-design
skill_type: design-contract
applies_to:
  layers:
    - L2
    - L3
    - L4
    - L5
  drive_models:
    - Forward
    - Add-feature
    - Discovery
    - Refactor
decision_points:
  - when: "defining a new .claude/agents/<name>.md and choosing whether model can be left blank"
    choose: "set model explicitly, even if it would match the parent"
    over: "omitting model and relying on inheritance"
    because: "the guard blocks omitted model — it does NOT silently inherit the parent, so an omission is a hard failure, not a convenience"
  - when: "a subagent is needed for a role that has no harness definition"
    choose: "use a generic subagent_type (general-purpose / Explore / Plan) with an explicit, recognised, non-fable model, and keep closing review on the ut-tdd claude|codex --role path"
    over: "adding a new .claude/agents definition or a new allowlist entry"
    because: "#1002 retires the hand-written definitions; the generic route passes with an explicit model and has no closing authority"
  - when: "assigning a model tier to a new agent's capability class"
    choose: "assign the minimum capable tier for that class (e.g., fast/cheap for research, primary-equivalent for adversarial review)"
    over: "defaulting every new agent to the primary model for safety"
    because: "the taxonomy exists precisely to avoid over-provisioning cost to roles that don't need primary-tier judgement"
  - when: "the guard rejects an Agent call and the cause is unclear"
    choose: "check model presence, model normalization (recognised family, not fable on the generic route), and, for a defined subagent, the frontmatter floor, in that order before assuming a bug"
    over: "reaching for UT_TDD_ALLOW_RAW_AGENT=1 as the first fix"
    because: "bypass is for a diagnosed emergency only, not a default troubleshooting step"
  - when: "UT_TDD_ALLOW_RAW_AGENT=1 is used to unblock a spawn"
    choose: "write an audit entry to .ut-tdd/audit/ recording who, which call, and why"
    over: "using the bypass silently and moving on once the call succeeds"
    because: "bypass without audit evidence leaves the emergency undocumented and unreviewable"
---

# agent design

How to define a single subagent in UT-TDD: capability class, model-family
assignment, and guard-allowlist registration (FR-L1-46 subagent roster). Apply
when introducing a new agent role, changing a model family, or auditing whether
an existing agent definition matches its actual use.

## When to load this skill

- Authoring or editing a `.claude/agents/<name>.md` frontmatter definition.
- A `PreToolUse(Agent)` guard rejection requires diagnosing which rule failed.
- A Discovery or Add-feature PLAN needs a specialist role (use the generic route;
  do not add a definition, #1002).
- Refactoring an existing agent definition whose model is below its intended floor.

## Anatomy of a subagent definition

Every `.claude/agents/<name>.md` must carry:

| Field | Purpose | Enforcement |
|---|---|---|
| `name` (frontmatter) | Must match the kebab filename | `agent-guard.ts` key lookup |
| `model` | Explicit model string (no omission) | Guard blocks omitted model (`src/runtime/agent-guard.ts:137`) |
| `description` | One-line capability summary | Used by `ut-tdd skill suggest` |
| `tools` | Declared tool list | (operational; not guard-checked) |

A `subagent_type` in `SUBAGENT_ALLOWLIST` (`src/runtime/agent-guard-policy.ts:2`; the
list is not copied here — it drifts) is a defined subagent and keeps its frontmatter floor.
Any other `subagent_type` (or none) takes the generic route: it passes only with an
explicit, recognised, non-fable model and has no closing authority (#1002, PO 2026-10-14).
Do not add new definitions; #1002 retires the existing ones.

## Capability class taxonomy

| Class | Typical roles | Right model tier |
|---|---|---|
| Research / summarisation | `pmo-haiku`, `pmo-tech-news` | Fast / cheap |
| Repo-state judgement | `pmo-project-explorer`, `pmo-sonnet` | Mid-tier |
| Design review / adversarial | `code-reviewer`, `security-audit` | Primary / equivalent |
| QA / trace verification | `qa-test` | Mid-tier |
| Innovation / market analysis | `pdm-*` | Mid-tier |

Assign the minimum capable tier (an omitted `model` is rejected, see above).

## Guard bypass

`UT_TDD_ALLOW_RAW_AGENT=1` bypasses the guard (`src/runtime/agent-guard.ts:100`).
Use only in a diagnosed emergency. Bypassing must leave an audit entry in `.ut-tdd/audit/` recording:
who set the flag, which agent call was made, and why the normal path was
unsuitable.

## Self-review checklist

- [ ] `name` in frontmatter matches the filename (kebab-case, no spaces).
- [ ] `model` field is explicit — no blank, no placeholder.
- [ ] A defined `subagent_type` matches an allowlist entry exactly; any other type takes the generic route.
- [ ] Capability class justified: the chosen model tier is the minimum needed.
- [ ] No new definition or allowlist entry is added (#1002); new roles use the generic route.
- [ ] Bypass evidence written to `.ut-tdd/audit/` when `UT_TDD_ALLOW_RAW_AGENT=1`
      was set.
