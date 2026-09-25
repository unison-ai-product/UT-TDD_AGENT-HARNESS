# HELIX to UT-TDD Porting Map

> **Superseded (ADR-001, 2026-05-27)**: 本 map は HELIX Python コードの file 単位 port 計画だが、実装方針が **TypeScript で全面再実装 (HELIX は概念のみ取り込み)** に変更されたため、**code-port 計画としては superseded**。本書は **HELIX 能力インベントリ / TS 再実装時の機能参照**として残置する。既存の `src/ut_tdd/*.py` (W1-W3a port) も TS 再実装で置換予定。正本は `../adr/ADR-001-ut-tdd-harness-redesign-and-language.md` / `concept_v3.1` / `requirements_v1.2`。

## Purpose

This document is the execution map for turning the HELIX snapshot into UT-TDD-owned assets.

The source snapshot remains in `vendor/helix-source/` as read-only material. UT-TDD functionality is created by copying selected assets into UT-TDD-owned paths, renaming them, removing HELIX/local assumptions, and connecting tests.

## Porting Rule

| Rule | Requirement |
|---|---|
| Source is read-only | Do not edit `vendor/helix-source/` while productizing. |
| Target owns behavior | Runtime code must live under UT-TDD-owned paths such as `src/ut_tdd/`, `scripts/`, `.ut-tdd/`, `.claude/`, `.github/`, `docs/skills/`. |
| Tests move with code | Each porting unit must include corresponding tests or a new UT-TDD fixture. |
| Names are replaced | `helix`, `.helix`, `HELIX`, and absolute local paths become `ut-tdd`, `.ut-tdd`, `UT-TDD`, and repo-relative paths. |
| OS assumptions are normalized | Linux/WSL-only shell behavior must gain Windows PowerShell and POSIX entrypoints. |
| External provider assumptions are isolated | Provider SDK/auth-dependent behavior stays optional, not part of the default path. |

## Reuse Classes

| Class | Meaning |
|---|---|
| `copy-with-rename` | Mostly filename, command, and path replacement. |
| `adapt` | Core logic remains useful, but enums, paths, state layout, or command names must change. |
| `harden` | Useful but requires security, path, OS, and failure-mode review before enabling. |
| `redesign-wrapper` | Keep internal pieces, but expose them through new UT-TDD command/workflow boundaries. |
| `curate` | Knowledge source; convert into UT-TDD documentation/skill pack, not executable code. |

## Wave Plan

| Wave | Goal | Primary command/output | Reuse class | Priority |
|---|---|---|---|---|
| W1 | PLAN schema and lint | `ut-tdd plan lint` | adapt | P0 |
| W2 | V-model trace lint | `ut-tdd vmodel lint` | adapt | P0 |
| W3 | Task/effort/skill routing | `ut-tdd task classify`, `task estimate`, `skill suggest` | adapt | P0 |
| W4 | Team orchestration | `ut-tdd team run`, `.ut-tdd/teams/*.yaml` | adapt | P1 |
| W5 | Handover/session recovery | `ut-tdd handover`, session summary | copy-with-rename + adapt | P1 |
| W6 | Setup/doctor/runtime detection | `ut-tdd setup`, `ut-tdd doctor`, `ut-tdd status` | adapt | P0 |
| W7 | Claude Code hooks/agents | `.claude/settings.json`, `.claude/hooks/*`, `.claude/agents/*` | harden | P1 |
| W8 | GitHub and git hooks | `harness-check`, commitlint, branch-kind-check | redesign-wrapper | P1 |
| W9 | Scrum/Reverse routing | Scrum x Reverse, R4, `promotion_strategy` | adapt | P2 |
| W10 | Skill packs | `docs/skills/*.md` | curate | P1 |
| W11 | Builder and workflow generation | workflow/task/agent builders | adapt | P2 |
| W12 | Audit, metrics, and dashboard | audit inventory, metrics, dashboard summaries | adapt | P2 |
| W13 | Security, guardrails, and redaction | LLM guard, research guard, redaction, security checks | harden | P1 |
| W14 | Learning and replay | learning engine, shadow replay, recipe metrics | redesign-wrapper | P3 |
| W15 | Local HTTP/API bridge | optional local API for hooks/telemetry | redesign-wrapper | P3 |
| W16 | Asset/code catalog | asset templates, code catalog, code edges | adapt | P2 |
| W17 | Lock/job/rollback/cutover | lock, job queue, rollback, cutover rehearsals | harden | P2 |

## Detailed Map

| Wave | HELIX source | UT-TDD target | Required edits | Tests / verification |
|---|---|---|---|---|
| W1 | `cli/lib/plan_frontmatter.py` | `src/ut_tdd/plan_frontmatter.py` | Replace `.helix` defaults, normalize path handling. | Port `cli/lib/tests/test_plan_frontmatter.py`. |
| W1 | `cli/lib/plan_parser.py` | `src/ut_tdd/plan_parser.py` | Replace HELIX frontmatter names with UT-TDD §1 enums. | Port `test_plan_parser.py`. |
| W1 | `cli/lib/plan_schema.py` | `src/ut_tdd/plan_schema.py` | Sync with `requirements_v1.1.md` VALID_* tables. | Port `test_plan_schema.py`; add enum drift fixture. |
| W1 | `cli/lib/plan_validator.py`, `plan_lint.py` | `src/ut_tdd/plan_validator.py`, `src/ut_tdd/plan_lint.py` | Add `promotion_strategy`, `skill_doc`, task commands, branch exceptions. | Port `test_plan_validator.py`, `test_plan_deps_helper.py`. |
| W1 | `cli/templates/plan/*/template.md` | `docs/templates/plan/*/template.md` | Rename HELIX wording, add UT-TDD artifact/role fields. | `ut-tdd plan lint` over all templates. |
| W2 | `cli/lib/vmodel_loader.py`, `vmodel_lint.py` | `src/ut_tdd/vmodel_loader.py`, `src/ut_tdd/vmodel_lint.py` | Align with 4 artifact + mandatory 8 directed edge + G3.8. | Port `test_vmodel_loader.py`, `test_vmodel_lint.py`, `test_vmodel_multi_drive.py`. |
| W2 | `cli/templates/state/vmodel.json` | `docs/templates/state/vmodel.json` | Add L3.8 and L6 QA doc-first trace. | Fixture validation via `ut-tdd vmodel lint`. |
| W3 | `cli/lib/effort_classifier.py` | `src/ut_tdd/task/effort_classifier.py` | Rename role/model references; expose JSON contract from §7.2. | Port `test_effort_classifier.py`. |
| W3 | `cli/lib/task_type_inference.py`, `task_dispatcher.py` | `src/ut_tdd/task/classifier.py`, `src/ut_tdd/task/dispatcher.py` | Map to UT-TDD kind/drive/size/complexity. | Port `test_task_type_inference.py`, `test_task_dispatcher.py`. |
| W3 | `cli/lib/skill_catalog.py`, `skill_recommender.py`, `skill_classifier.py` | `src/ut_tdd/skills/catalog.py`, `src/ut_tdd/skills/recommender.py`, `src/ut_tdd/skills/classifier.py` | Use `docs/skills/*.md` as canonical, vendor as candidate only. | Port `test_skill_catalog.py`, `test_skill_recommender.py`, `test_skill_classifier.py`. |
| W3 | `cli/templates/prompts/effort-classify.md`, `skill-search.md`, `skill-classify.md` | `docs/templates/prompts/*.md` | Remove HELIX model-specific assumptions; route by capability class. | Prompt fixture smoke. |
| W4 | `cli/lib/team_runner.py` | `src/ut_tdd/team_runner.py` | Enforce `frontier-reviewer` / `worker` / `fast-checker`; forbid same model approval. | Port `test_team_runner.py`, `test_axis_14_orchestration.py`. |
| W4 | `cli/lib/model_registry.py`, `model_fallback.py`, `budget.py` | `src/ut_tdd/orchestration/*` | Replace fixed model names with capability class and local override. | Port `test_model_fallback.py`, `test_budget.py`, `test_budget_cli.py`. |
| W4 | `cli/templates/teams/*` | `.ut-tdd/teams/*.yaml` templates or `docs/templates/teams/*` | Split tracked default templates from ignored `local*.yaml`. | YAML parser + budget sum = 100. |
| W5 | `cli/lib/handover.py`, `handover_auto_dump.py` | `src/ut_tdd/handover.py`, `src/ut_tdd/handover_auto_dump.py` | Move state to `.ut-tdd/handover/`; remove `.helix` DB assumption. | Port `test_handover.py`. |
| W5 | `cli/lib/transcript_summary.py` | `src/ut_tdd/transcript_summary.py` | Make provider/runtime optional. | Add local fixture summary test. |
| W5 | `cli/templates/handover-current.*.template` | `docs/templates/handover/*` | Rename fields to UT-TDD runtime modes. | Template render smoke. |
| W6 | `cli/lib/setup_helper.py`, `init_helpers.py` | `src/ut_tdd/setup.py`, `src/ut_tdd/init_helpers.py` | Windows/macOS/Linux first-class; no WSL requirement. | Port `test_init_helpers.py`; run PowerShell/POSIX smoke. |
| W6 | `cli/lib/doctor_plan_checks.py`, `doctor_recovery_check.py` | `src/ut_tdd/doctor/*` | Check `.ut-tdd`, not `.helix`; local state ignored. | Port `test_doctor_plan_checks.py`, `test_doctor_recovery_check.py`. |
| W6 | `cli/lib/compatibility_adapter.py`, `paths.py` | `src/ut_tdd/runtime/*` | Implement `standalone` / `claude-only` / `codex-only` / `hybrid`. | Add runtime fixture matrix. |
| W7 | `.claude/settings.json` | `.claude/settings.json` | Replace absolute hook commands with repo-local `ut-tdd`; verify Windows paths. | Hook config smoke; no absolute path grep. |
| W7 | `.claude/hooks/*` | `.claude/hooks/*` | Route through UT-TDD guards; remove HELIX DB writes. | Port hook tests where shell-compatible; add PowerShell wrappers as needed. |
| W7 | `.claude/agents/*` | `.claude/agents/*` or `docs/templates/agents/*` | Rename roles into UT-TDD role/capability classes. | Markdown lint + role enum validation. |
| W8 | `.github/workflows/*` | `.github/workflows/harness-check.yml`, `escalation-stale.yml` | Collapse branch-specific workflows into one required check. | GitHub workflow syntax check; branch matrix fixture. |
| W8 | `scripts/git-hooks/*`, `cli/templates/hooks/*` | `scripts/git-hooks/*`, `scripts/install-hooks.*` | Add PowerShell installer, fail-close only where specified. | Shell syntax + PowerShell smoke. |
| W8 | `.commitlintrc.json`, `.github/pull_request_template.md`, `CODEOWNERS` | same UT-TDD paths | Replace owners and UT-TDD PR sections. | commitlint fixture, CODEOWNERS syntax check. |
| W9 | `cli/lib/scrum_local.py`, `scrum_reverse_matrix.py`, `scrum_to_reverse_routing.py` | `src/ut_tdd/scrum/*`, `src/ut_tdd/reverse/*` | Add `promotion_strategy`, R4 forward routing, PoC no direct merge. | Port `test_scrum_*`, `test_reverse_*`. |
| W9 | `skills/workflow/reverse-*`, `skills/workflow/poc` | `docs/skills/reverse-pack.md`, `docs/skills/planning-pack.md` | Curate into UT-TDD skill pack docs. | `ut-tdd skill suggest` fixture. |
| W10 | `skills/common/testing`, `workflow/verification`, `quality-lv5` | `docs/skills/test-pack.md` | Tie to G3.8, L6 QA doc-first, vmodel lint. | skill schema + suggestion fixture. |
| W10 | `skills/workflow/design-doc`, `api-contract`, `db`, `ui` | `docs/skills/design-pack.md` | Tie to add-design/add-impl and Pair freeze. | skill schema + PLAN fixture. |
| W10 | `skills/common/code-review`, `coding`, `error-fix`, `refactoring` | `docs/skills/implementation-pack.md` | Tie to worker/reviewer split and G4. | skill schema + review fixture. |
| W10 | `skills/workflow/runbook`, `incident`, `postmortem`, `debt-register` | `docs/skills/operations-pack.md` | Tie to recovery and escalation. | recovery PLAN fixture. |
| W11 | `cli/lib/builders/*` | `src/ut_tdd/builders/*` | Replace HELIX registry names, emit UT-TDD templates and verify scripts. | Port `test_builders.py`, `test_builders_concrete.py`. |
| W11 | `docs/adr/ADR-002-builder-system-foundations.md`, `ADR-008-builder-abstraction.md`, `docs/design/L2-builder-system.md` | `docs/design/builder-system.md` or ADR references | Curate architecture into UT-TDD builder design. | Documentation consistency check. |
| W12 | `cli/lib/audit_*.py`, `audit_validator.py`, `audit_inventory.py`, `audit_hash.py` | `src/ut_tdd/audit/*` | Store team audit in CI artifacts, not local git state. | Port `test_audit_*.py`; verify no `.ut-tdd/audit/*.jsonl` tracked. |
| W12 | `cli/helix-dashboard`, `docs/commands/dashboard.md`, `docs/metrics/*` | `ut-tdd dashboard` or CI job summary renderer | Avoid mandatory local server; prefer static summary/JSON. | Port `test_dashboard_aggregation.py`. |
| W12 | `docs/v2/A-audit/*` | `docs/migration/audit-findings/*` | Curate as historical evidence and regression ideas. | Link check only. |
| W13 | `cli/lib/llm_guard.py`, `research_guard.py`, `research_tool_guard.py`, `redaction.py`, `context_guard.py` | `src/ut_tdd/guards/*` | Fail-close only for secrets/destructive actions; external research stays policy-gated. | Port `test_llm_guard.py`, `test_research_guard.py`, `test_research_tool_guard.py`, `test_skill_dispatcher_redaction.py`. |
| W13 | `skills/common/security`, `skills/agent-skills/security-and-hardening`, `docs/security-guidelines.md` | `docs/skills/security-pack.md`, `docs/security/` | Curate OWASP/secret/auth guidance into UT-TDD skill pack. | security checklist fixture. |
| W14 | `cli/lib/learning_engine.py`, `cli/lib/learning/*`, `docs/design/L2-learning-engine.md`, `ADR-003-learning-engine.md` | `src/ut_tdd/learning/*` or later package | Keep optional; do not make Phase 0 depend on persistent DB. | Port `test_learning_engine.py`, `test_learning_package.py` when enabled. |
| W14 | `cli/lib/shadow_replay.py`, replay tests | `src/ut_tdd/replay/*` | Use as CI regression replay, not local mandatory hook. | Port `test_shadow_replay_unit.py`, `test_replay_integration.py`. |
| W15 | `cli/lib/http_api/*` | `src/ut_tdd/http_api/*` | Optional local bridge only; auth required; no default open server. | Port `test_http_api_*.py`. |
| W15 | `cli/lib/event_envelope.py`, `hook_payload.py` | `src/ut_tdd/events/*` | Normalize hook/CI event envelope. | Port `test_event_envelope_unit.py`, `test_hook_payload.py`. |
| W16 | `cli/lib/code_catalog.py`, `code_edges.py`, `code_recommender.py` | `src/ut_tdd/code_index/*` | Use for trace hints and code ownership, not as merge gate initially. | Port `test_code_catalog.py`, `test_code_edges.py`, `test_code_recommender.py`. |
| W16 | `cli/helix-asset`, `cli/templates/assets/*`, `docs/generated-assets.yaml` | `ut-tdd asset` or docs asset catalog | Optional; useful for generated docs/assets governance. | Port `test-helix-asset.bats` as later smoke. |
| W17 | `cli/lib/lock_helper.py`, `concurrent_lock.py` | `src/ut_tdd/lock/*` | Cross-platform file lock; avoid stale locks blocking forever. | Port `test_lock_skill.py`, `test_lock_critical_path.py`, `test_concurrent_lock.py`, `test_stale_lock_cleanup.py`. |
| W17 | `cli/lib/job_queue_helper.py`, `job_p0_guard.py` | `src/ut_tdd/jobs/*` | Optional local queue; no background daemon required in Phase 0. | Port `test_job_queue_helper.py`, `test_job_p0_guard.py`. |
| W17 | `rollback_orchestrator.py`, `cutover_orchestrator.py`, rollback/cutover docs | `src/ut_tdd/release/*`, `docs/release/` | Treat as release hardening, not default developer path. | Port `test_rollback_orchestrator_unit.py`, `test_cutover_orchestrator_unit.py`. |

## Cross-Cutting Replacement Checklist

- [ ] `helix` command names are changed to `ut-tdd`.
- [ ] `.helix/` state paths are changed to `.ut-tdd/`.
- [ ] `HELIX` product naming is changed to `UT-TDD Agent Harness` except in migration/history docs.
- [ ] Absolute local paths such as `C:\Users\micro` are removed from runtime files.
- [ ] Linux-only shell calls have PowerShell or Python equivalents.
- [ ] Runtime-generated files are ignored (`.ut-tdd/state/*`, `.ut-tdd/cache/*`, `.ut-tdd/audit/*`, `.ut-tdd/teams/local*.yaml`).
- [ ] Vendor candidate references are not used as canonical runtime inputs.
- [ ] Ported tests pass on Windows and POSIX, or are marked as POSIX-only with a tracked follow-up.

## Acceptance Per Wave

Each wave is complete only when:

- The UT-TDD target files exist outside `vendor/`.
- Matching tests or fixtures exist outside `vendor/`.
- `git diff --check` passes.
- The relevant smoke command is documented.
- The porting row in this file can be marked implemented in a future PLAN.
