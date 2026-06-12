# A-134 Harness Telemetry / Self-Improvement Audit

Date: 2026-06-12

## Finding

The harness measurement substrate now has a minimal automated loop, and the self-improvement loop is closed for this implementation scope.

Current evidence shows durable rows for workflow, hook, drive, model, findings, skill recommendation, skill invocation, quality signal, feedback event, trouble event, retry event analysis, improvement log, automation asset, guardrail decision, dry-run issue queue data, and project-local hook configuration. Actual GitHub mutation is outside this implementation scope; test coverage proves the queue and externally supplied issue back-reference boundary.

## Evidence Snapshot

| Signal | Current count after latest local DB rebuild/check | Interpretation |
|---|---:|---|
| `drive_runs` | 210 | Drive-model execution lanes are being projected. |
| `workflow_runs` | 7 | Workflow phase rows exist, but retry/bottleneck analysis is not derived. |
| `hook_events` | 3212 | Hook/session telemetry exists. |
| `model_runs` | 84 | AI runtime execution rows exist. |
| `findings` | 1544 | Findings table exists and has rows. |
| `skill_recommendations` | 161 | Dynamic skill recommendation is projected from PLAN layer/drive/kind context and skill assets. |
| `skill_invocations` | 128 | Skill firing telemetry is inferred from accepted review evidence. |
| `quality_signals` | 331 | Skill firing/acceptance, drive firing-rate, trouble, retry, and bottleneck metrics are projected. |
| `feedback_events` | 1533 | Findings and warning/failing quality signals are emitted into feedback events. |
| `issue_queue` | 2 | GitHub dry-run issue candidates are queued with human approval required; this implementation records queue/back-reference evidence only and does not mutate GitHub. |
| `trouble_events` | 23 | Hook failures and trouble-rate signals are normalized into trouble taxonomy rows. |
| `retry_events` | 0 | Duplicate workflow phase attempts are analyzed; zero rows means no duplicate phase group was detected. |
| `improvement_log` | 2 | Issue queue and retry diagnostics are converted into self-improvement log rows. |
| `guardrail_decisions` | 2 | External issue creation approval guardrails are projected for queued dry-run issue candidates. |
| `automation_assets` | 20 | Automation asset catalog telemetry is populated, including YAML skill metadata. |
| `.claude/settings.json` project hooks | 5 | Team-standard project-local hooks are configured for Agent guard, session start, post-tool-use, stop summary, and subagent stop. |

## Telemetry Closure Matrix

| Requirement | Required evidence | Current evidence | Automation owner | Status |
|---|---|---|---|---|
| Skill firing parameters | `ut-tdd skill suggest` writes `skill_recommendations`; actual firing writes `skill_invocations`; metrics can group by plan, layer, drive, skill, source, and acceptance | `skill suggest --plan` returns ranked recommendations; DB rebuild projects `skill_recommendations=161`, `skill_invocations=128`, and skill quality signals | DB projection + CLI + doctor telemetry-closure | `closed` |
| Trouble logs | Session, hook, failure, and trouble events are materialized and classified into findings or feedback rows | Session log files and `hook_events=3212` exist; hook failures and `trouble_event_rate` are projected into `trouble_events` and feedback events | session-log + hook_events + feedback engine + doctor | `closed` |
| GitHub issue creation outside Forward | Non-Forward findings can create or queue GitHub issues with dry-run, human approval, and issue-id back-reference | `issue_queue=2` dry-run candidates exist with `human_approval_required=1`; `guardrail_decisions=2`; `issue mark-created` records externally supplied `external_issue_id` / `external_issue_url` after separate approved creation; `tests/issue-queue.test.ts` covers the boundary | GitHub issue queue + CLI + doctor + test | `closed` |
| Drive model firing-rate measurement | Denominator drive opportunities and numerator completed `drive_runs` become `quality_signals` by drive, mode, layer, and plan | `drive_runs=210`; `drive_firing_rate` quality signals are projected by drive mode | DB projection + metrics CLI + quality_signals + doctor | `closed` |
| Plan/workflow retry detection | Repeated failed attempts, rebuilds, reruns, and retries are grouped by plan, workflow, and session | `workflow_retry_groups` quality signal and `retry_events` projection analyze duplicate workflow phase attempts | hook_events + workflow_runs + feedback engine | `closed` |
| Bottleneck detection | Stale or slow workflow phases become findings or quality signals with owner and next action | `workflow_blocked_rate` and `workflow_human_required_rate` quality signals are projected from `workflow_runs` | doctor + workflow_runs + quality_signals | `closed` |
| Improvement log | Findings and feedback events create tracked improvement backlog rows or approved issue-queue entries | `improvement_log` rows are projected from issue queue and retry diagnostics; docs write-back remains a reporting task, not the source of truth | feedback engine + improvement-backlog + GitHub issue queue | `closed` |
| Measurement-to-feedback loop | Metrics create findings, feedback events, next actions, and doctor-visible closure state | DB rebuild projects `quality_signals=331` and emits `feedback_events=1533`; backlog/issue routing remains separate | feedback engine + DB projection + doctor | `closed` |
| Project hook configuration | TDD team standard project hooks are repository-local, package-local, and drift-checked | `.claude/settings.json` defines 5 project-local hooks; `project-hook` doctor check rejects missing hooks, personal absolute paths, and non-project commands | project-hook + doctor + hook tests | `closed` |

## No-Omission Rule

- A table with 0 operational rows is not a closed implementation.
- A metrics command without upstream event capture is not a closed telemetry loop.
- A design reference to skill injection is not a runtime skill injector.
- A hook log without classification is not a trouble log system.
- A GitHub connector capability is not a product feature until a dry-run queue, approval gate, and back-reference are defined.
- The self-improvement loop is closed only when measurement rows produce findings, feedback events, improvement backlog or issue queue entries, and doctor-visible closure evidence.

## Required Follow-Up

| Follow-up | Required artifact | Target status |
|---|---|---|
| Dynamic L-unit / drive-model skill injection | `ut-tdd skill suggest --plan <id>` plus projection into `skill_recommendations` and `skill_invocations` | minimal closed; expand skill catalog and drive-specific rules |
| Firing-rate and retry analytics | metrics command and `quality_signals` projection for drive firing rate, retries, and bottlenecks | minimal closed; expand per-session attribution |
| Trouble-log taxonomy | classifier from hook/session/failure rows into findings and feedback events | minimal closed; expand categories as new trouble patterns appear |
| Improvement routing | local improvement backlog writer and GitHub issue dry-run queue with human approval | minimal closed in DB and CLI; actual GitHub mutation remains approval-gated |
| Feedback loop closure | doctor check proving nonzero quality signals and feedback events after db rebuild | closed for DB loop; add reporting/export if needed |
