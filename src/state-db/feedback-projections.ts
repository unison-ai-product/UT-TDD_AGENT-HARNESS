import type { HarnessDb } from "./index";
import {
  analyzeRefactorCandidates,
  candidateRank,
  isRefactorCandidateDecisionState,
  loadRefactorCandidateInputs,
  REFACTOR_FEEDBACK_LIMIT,
  type RefactorCandidate,
  type RefactorCandidateLifecycleState,
  refactorCandidateKey,
} from "./refactor-candidates";
import { detectorRouteCandidateAction } from "./route-candidate-review";

interface FeedbackProjectionDeps {
  nowIso: () => string;
  stableId: (prefix: string, value: string) => string;
  recordProjectionEvent: (
    db: HarnessDb,
    event: { table: string; id: string; row: Record<string, unknown> },
  ) => void;
}

const refactorCandidateCache = new Map<string, RefactorCandidate[]>();

interface RefactorCandidateLifecycleRecord {
  state: RefactorCandidateLifecycleState;
  linked_plan_id: string;
  first_seen_at: string;
  decided_at: string;
}

function signalSeverity(status: unknown): string {
  const normalized = String(status ?? "warn").toLowerCase();
  if (normalized === "fail" || normalized === "error") return normalized;
  if (normalized === "warn") return "warn";
  return "info";
}

function canReadLifecycle(db: HarnessDb): boolean {
  return typeof (db as { prepare?: unknown }).prepare === "function";
}

function loadRefactorCandidateLifecycle(
  db: HarnessDb,
): Map<string, RefactorCandidateLifecycleRecord> {
  if (!canReadLifecycle(db)) return new Map();
  const rows = db
    .prepare(
      `SELECT candidate_key, state, linked_plan_id, first_seen_at, decided_at
       FROM refactor_candidates`,
    )
    .all();
  return new Map(
    rows.map((row) => [
      String(row.candidate_key ?? ""),
      {
        state: String(row.state ?? "open") as RefactorCandidateLifecycleState,
        linked_plan_id: String(row.linked_plan_id ?? ""),
        first_seen_at: String(row.first_seen_at ?? ""),
        decided_at: String(row.decided_at ?? ""),
      },
    ]),
  );
}

export function decideRefactorCandidate(
  db: HarnessDb,
  input: {
    candidate_key: string;
    state: Exclude<RefactorCandidateLifecycleState, "open">;
    decided_at: string;
    linked_plan_id?: string;
  },
): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  if (!input.candidate_key) findings.push("candidate_key is required");
  if (input.state !== "rejected" && !input.linked_plan_id) {
    findings.push("linked_plan_id is required for accepted or implemented candidates");
  }
  if (!input.decided_at) findings.push("decided_at is required");
  if (findings.length > 0) return { ok: false, findings };
  db.prepare(
    `UPDATE refactor_candidates
     SET state = ?, linked_plan_id = ?, decided_at = ?
     WHERE candidate_key = ?`,
  ).run(input.state, input.linked_plan_id ?? "", input.decided_at, input.candidate_key);
  const updated = db
    .prepare("SELECT candidate_key FROM refactor_candidates WHERE candidate_key = ? AND state = ?")
    .get(input.candidate_key, input.state);
  if (!updated) return { ok: false, findings: ["candidate not found"] };
  return { ok: true, findings: [] };
}

export function projectRefactorCandidateSignals(
  repoRoot: string,
  db: HarnessDb,
  deps: FeedbackProjectionDeps,
): void {
  const computedAt = deps.nowIso();
  const cached = refactorCandidateCache.get(repoRoot);
  const candidates = cached ?? analyzeRefactorCandidates(loadRefactorCandidateInputs(repoRoot));
  refactorCandidateCache.set(repoRoot, candidates);
  const lifecycle = loadRefactorCandidateLifecycle(db);
  const feedbackSubjects = new Set(
    candidates
      .filter((candidate) => candidate.confidence === "high")
      .sort((a, b) => candidateRank(b) - candidateRank(a))
      .slice(0, REFACTOR_FEEDBACK_LIMIT)
      .map((candidate) => `${candidate.kind}:${candidate.subject}`),
  );
  for (const candidate of candidates) {
    const candidateKey = refactorCandidateKey(candidate);
    const existing = lifecycle.get(candidateKey);
    const state =
      existing && isRefactorCandidateDecisionState(existing.state) ? existing.state : "open";
    const linkedPlanId = existing?.linked_plan_id ?? "";
    deps.recordProjectionEvent(db, {
      table: "refactor_candidates",
      id: candidateKey,
      row: {
        candidate_key: candidateKey,
        kind: candidate.kind,
        path: candidate.path,
        subject: candidate.subject,
        confidence: candidate.confidence,
        score: candidate.score,
        threshold: candidate.threshold,
        state,
        linked_plan_id: linkedPlanId,
        reason: candidate.reason,
        first_seen_at: existing?.first_seen_at || computedAt,
        last_seen_at: computedAt,
        decided_at: existing?.decided_at ?? "",
      },
    });
    const signalId = deps.stableId(
      "refactor-candidate",
      `${candidate.kind}:${candidate.subject}:${candidate.reason}`,
    );
    const shouldFeedback =
      state === "open" && feedbackSubjects.has(`${candidate.kind}:${candidate.subject}`);
    deps.recordProjectionEvent(db, {
      table: "quality_signals",
      id: signalId,
      row: {
        signal_id: signalId,
        source: "refactor-candidate-detector",
        subject_id: candidate.subject,
        metric: `refactor_candidate:${candidate.kind}`,
        value: candidate.score,
        threshold: candidate.threshold,
        status: shouldFeedback ? "warn" : "pass",
        computed_at: computedAt,
      },
    });
  }
}

export function projectFeedbackEvents(db: HarnessDb, deps: FeedbackProjectionDeps): void {
  const createdAt = deps.nowIso();
  const detectorCandidates = db
    .prepare(
      `SELECT route_candidate_id, source_table, source_id, finding_kind, severity, subject_id,
              filing_target_id, target_layer, target_sub_doc, candidate_status, reason
       FROM detector_route_candidates
       WHERE candidate_status IN ('non_ready', 'ready', 'open')
       ORDER BY route_candidate_id`,
    )
    .all();
  const detectorCandidateFindingIds = new Set(
    detectorCandidates
      .filter((candidate) => String(candidate.source_table ?? "") === "findings")
      .map((candidate) => String(candidate.source_id ?? ""))
      .filter(Boolean),
  );
  for (const finding of db.prepare("SELECT * FROM findings WHERE status = 'open'").all()) {
    const findingId = String(finding.finding_id ?? "");
    if (detectorCandidateFindingIds.has(findingId)) continue;
    const subject = String(finding.subject_id ?? findingId);
    const id = deps.stableId("feedback:finding", findingId || subject);
    deps.recordProjectionEvent(db, {
      table: "feedback_events",
      id,
      row: {
        feedback_event_id: id,
        finding_id: findingId,
        plan_id: subject.startsWith("PLAN-") ? subject : "",
        source_table: "findings",
        source_id: findingId || subject,
        source_color: "",
        signal_type: String(finding.kind ?? "finding"),
        severity: String(finding.severity ?? "warn"),
        status: "open",
        next_action: `review finding ${findingId || subject}`,
        created_at: createdAt,
      },
    });
  }
  for (const candidate of detectorCandidates) {
    const candidateId = String(candidate.route_candidate_id ?? "");
    const subject = String(candidate.subject_id ?? candidateId);
    const findingKind = String(candidate.finding_kind ?? "detector-route-candidate");
    const severity = signalSeverity(candidate.severity);
    const id = deps.stableId("feedback:detector-route-candidate", candidateId || subject);
    deps.recordProjectionEvent(db, {
      table: "feedback_events",
      id,
      row: {
        feedback_event_id: id,
        finding_id: "",
        plan_id: subject.startsWith("PLAN-") ? subject : "",
        source_table: "detector_route_candidates",
        source_id: candidateId || subject,
        source_color: String(candidate.candidate_status ?? "non_ready"),
        signal_type: `detector_route_candidate:${findingKind}`,
        severity,
        status: "open",
        next_action: detectorRouteCandidateAction(candidate),
        created_at: createdAt,
      },
    });
  }
  for (const signal of db
    .prepare("SELECT * FROM quality_signals WHERE status IN ('fail', 'warn')")
    .all()) {
    const signalId = String(signal.signal_id ?? "");
    const subject = String(signal.subject_id ?? signalId);
    const id = deps.stableId("feedback:signal", signalId || subject);
    deps.recordProjectionEvent(db, {
      table: "feedback_events",
      id,
      row: {
        feedback_event_id: id,
        finding_id: "",
        plan_id: subject.startsWith("PLAN-") ? subject : "",
        source_table: "quality_signals",
        source_id: signalId || subject,
        source_color: "",
        signal_type: String(signal.metric ?? "quality_signal"),
        severity: signalSeverity(signal.status),
        status: "open",
        next_action: `review quality signal ${signalId || subject}`,
        created_at: createdAt,
      },
    });
  }
  for (const progress of db
    .prepare(
      `SELECT artifact_path, color, state, reason, recovery_plan_ids
       FROM artifact_progress
       WHERE color IN ('red', 'yellow')
       ORDER BY CASE color WHEN 'red' THEN 0 ELSE 1 END, artifact_path`,
    )
    .all()) {
    const artifactPath = String(progress.artifact_path ?? "");
    const color = String(progress.color ?? "");
    const state = String(progress.state ?? "");
    const reason = String(progress.reason ?? "");
    const recoveryPlanIds = String(progress.recovery_plan_ids ?? "");
    const id = deps.stableId("feedback:artifact-progress", `${artifactPath}:${color}:${state}`);
    const action =
      color === "red"
        ? `trigger dependency/reverse recovery for ${artifactPath}: ${reason}`
        : recoveryPlanIds
          ? `continue recovery workflow for ${artifactPath}: ${recoveryPlanIds}`
          : `run linked tests or add test evidence for ${artifactPath}: ${reason}`;
    deps.recordProjectionEvent(db, {
      table: "feedback_events",
      id,
      row: {
        feedback_event_id: id,
        finding_id: "",
        plan_id: "",
        source_table: "artifact_progress",
        source_id: artifactPath,
        source_color: color,
        signal_type: `artifact_progress_${color}`,
        severity: color === "red" ? "warn" : "info",
        status: "open",
        next_action: action,
        created_at: createdAt,
      },
    });
  }
}

export function projectTroubleEvents(db: HarnessDb, deps: FeedbackProjectionDeps): void {
  const createdAt = deps.nowIso();
  const hookRows = db
    .prepare(
      `SELECT event_id, plan_id, event_type, digest
       FROM hook_events
       WHERE event_type IN ('forced_stop', 'error', 'failed')
          OR digest LIKE '%fail%'
          OR digest LIKE '%error%'
       ORDER BY occurred_at, event_id`,
    )
    .all();
  for (const row of hookRows) {
    const sourceEventId = String(row.event_id ?? "");
    const category = String(row.event_type ?? "").includes("forced")
      ? "forced_stop"
      : "hook_failure";
    const id = deps.stableId("trouble", sourceEventId);
    deps.recordProjectionEvent(db, {
      table: "trouble_events",
      id,
      row: {
        trouble_event_id: id,
        source_event_id: sourceEventId,
        plan_id: String(row.plan_id ?? ""),
        category,
        severity: "warn",
        summary: String(row.digest ?? category).slice(0, 240),
        status: "open",
        created_at: createdAt,
      },
    });
  }

  for (const signal of db
    .prepare("SELECT * FROM quality_signals WHERE metric = ? AND status IN ('warn', 'fail')")
    .all("trouble_event_rate")) {
    const signalId = String(signal.signal_id ?? "");
    const id = deps.stableId("trouble", signalId);
    deps.recordProjectionEvent(db, {
      table: "trouble_events",
      id,
      row: {
        trouble_event_id: id,
        source_event_id: signalId,
        plan_id: "",
        category: "trouble_rate",
        severity: String(signal.status ?? "warn") === "fail" ? "error" : "warn",
        summary: `trouble_event_rate=${signal.value ?? ""}`,
        status: "open",
        created_at: createdAt,
      },
    });
  }
}

export function projectRetryEvents(db: HarnessDb, deps: FeedbackProjectionDeps): void {
  const createdAt = deps.nowIso();
  const rows = db
    .prepare(
      `SELECT plan_id, workflow, phase, COUNT(*) AS attempt_count
       FROM workflow_runs
       GROUP BY plan_id, workflow, phase
       HAVING COUNT(*) > 1
       ORDER BY plan_id, workflow, phase`,
    )
    .all();
  for (const row of rows) {
    const planId = String(row.plan_id ?? "");
    const workflow = String(row.workflow ?? "");
    const phase = String(row.phase ?? "");
    const id = deps.stableId("retry", `${planId}:${workflow}:${phase}`);
    deps.recordProjectionEvent(db, {
      table: "retry_events",
      id,
      row: {
        retry_event_id: id,
        plan_id: planId,
        workflow,
        phase,
        attempt_count: Number(row.attempt_count ?? 0),
        status: "open",
        created_at: createdAt,
      },
    });
  }
}

export function projectIssueQueue(db: HarnessDb, deps: FeedbackProjectionDeps): void {
  const createdAt = deps.nowIso();
  const issueSignals = new Set([
    "detector_route_candidate",
    "trouble_event_rate",
    "workflow_human_required_rate",
    "workflow_retry_groups",
    "workflow_blocked_rate",
  ]);
  const rows = db
    .prepare(
      `SELECT feedback_event_id, plan_id, signal_type, severity, next_action
       FROM feedback_events
       WHERE signal_type IN ('trouble_event_rate', 'workflow_human_required_rate', 'workflow_retry_groups', 'workflow_blocked_rate')
          OR signal_type LIKE 'detector_route_candidate:%'
       ORDER BY feedback_event_id`,
    )
    .all();
  for (const row of rows) {
    const signalType = String(row.signal_type ?? "");
    const normalizedSignal = signalType.startsWith("detector_route_candidate:")
      ? "detector_route_candidate"
      : signalType;
    if (!issueSignals.has(normalizedSignal)) continue;
    const sourceEventId = String(row.feedback_event_id ?? "");
    const id = deps.stableId("issue-queue", sourceEventId);
    const isDetectorCandidate = normalizedSignal === "detector_route_candidate";
    deps.recordProjectionEvent(db, {
      table: "issue_queue",
      id,
      row: {
        issue_queue_id: id,
        source_event_id: sourceEventId,
        plan_id: String(row.plan_id ?? ""),
        target: "github",
        title: isDetectorCandidate
          ? `[ut-tdd detector candidate] ${signalType}`
          : `[ut-tdd telemetry] ${signalType}`,
        body: isDetectorCandidate
          ? `Dry-run filing candidate from detector route feedback ${sourceEventId}. Human approval is required before external issue creation; routeFiling SSoT evaluation is recorded in the feedback event: ${row.next_action ?? ""}`
          : `Dry-run issue candidate from feedback event ${sourceEventId}: ${row.next_action ?? ""}`,
        status: "queued_dry_run",
        human_approval_required: 1,
        approved_by: "",
        approved_at: "",
        external_issue_id: "",
        external_issue_url: "",
        created_at: createdAt,
      },
    });
  }
}

export function projectIssueApprovalGuardrails(db: HarnessDb, deps: FeedbackProjectionDeps): void {
  const decidedAt = deps.nowIso();
  const rows = db
    .prepare("SELECT * FROM issue_queue WHERE human_approval_required = 1 ORDER BY issue_queue_id")
    .all();
  for (const row of rows) {
    const id = deps.stableId("guardrail", `issue-approval:${row.issue_queue_id ?? ""}`);
    deps.recordProjectionEvent(db, {
      table: "guardrail_decisions",
      id,
      row: {
        guardrail_decision_id: id,
        plan_id: String(row.plan_id ?? ""),
        session_id: "",
        guardrail: "external-github-issue-approval",
        decision: String(row.external_issue_url ?? "")
          ? "approved-created"
          : "requires-human-approval",
        mode: "manual-approval",
        human_signoff_required: String(row.external_issue_url ?? "") ? 0 : 1,
        evidence_path: String(row.issue_queue_id ?? ""),
        decided_at: decidedAt,
      },
    });
  }
}

export function projectImprovementLog(db: HarnessDb, deps: FeedbackProjectionDeps): void {
  const createdAt = deps.nowIso();
  const issueRows = db.prepare("SELECT * FROM issue_queue ORDER BY issue_queue_id").all();
  for (const row of issueRows) {
    const sourceEventId = String(row.source_event_id ?? "");
    const id = deps.stableId("improvement", sourceEventId || String(row.issue_queue_id ?? ""));
    deps.recordProjectionEvent(db, {
      table: "improvement_log",
      id,
      row: {
        improvement_log_id: id,
        source_event_id: sourceEventId,
        plan_id: String(row.plan_id ?? ""),
        category: "issue_queue",
        summary: String(row.title ?? ""),
        next_action: `review queued issue ${row.issue_queue_id ?? ""}`,
        status: "open",
        created_at: createdAt,
      },
    });
  }

  const retryRows = db.prepare("SELECT * FROM retry_events ORDER BY retry_event_id").all();
  for (const row of retryRows) {
    const id = deps.stableId("improvement", String(row.retry_event_id ?? ""));
    deps.recordProjectionEvent(db, {
      table: "improvement_log",
      id,
      row: {
        improvement_log_id: id,
        source_event_id: String(row.retry_event_id ?? ""),
        plan_id: String(row.plan_id ?? ""),
        category: "retry",
        summary: `${row.workflow ?? ""}/${row.phase ?? ""} attempts=${row.attempt_count ?? ""}`,
        next_action: "review retry/bottleneck pattern",
        status: "open",
        created_at: createdAt,
      },
    });
  }
}
