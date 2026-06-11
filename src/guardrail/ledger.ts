import type { HarnessDb } from "../state-db/index";
import { upsertRow } from "../state-db/index";

export type GuardrailDecisionValue = "allow" | "block" | "human-required";

export interface GuardrailDecisionInput {
  plan_id: string;
  session_id: string;
  guardrail: string;
  decision: GuardrailDecisionValue;
  mode: string;
  human_signoff_required?: boolean;
  evidence_path: string;
  reviewer_model?: string;
  worker_model?: string;
}

export interface GuardrailDecisionRow {
  guardrail_decision_id: string;
  plan_id: string;
  session_id: string;
  guardrail: string;
  decision: GuardrailDecisionValue;
  mode: string;
  human_signoff_required: number;
  evidence_path: string;
  decided_at: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function decisionId(input: GuardrailDecisionInput): string {
  return `${input.plan_id}:${input.session_id}:${input.guardrail}`.replace(
    /[^A-Za-z0-9._:-]+/g,
    "-",
  );
}

function containsSecret(value: string): boolean {
  return /(sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/.test(value);
}

function normalizeDecision(input: GuardrailDecisionInput): GuardrailDecisionValue {
  const sameModel =
    input.reviewer_model !== undefined &&
    input.worker_model !== undefined &&
    input.reviewer_model === input.worker_model;
  if (sameModel) return "block";
  if (input.decision === "human-required" && !input.evidence_path) return "block";
  if (input.human_signoff_required && !input.evidence_path) return "block";
  return input.decision;
}

export function recordGuardrailDecision(
  db: HarnessDb,
  input: GuardrailDecisionInput,
): GuardrailDecisionRow {
  if (containsSecret(input.evidence_path)) {
    throw new Error("guardrail evidence_path must not contain secret-like values");
  }
  const decision = normalizeDecision(input);
  const row: GuardrailDecisionRow = {
    guardrail_decision_id: decisionId(input),
    plan_id: input.plan_id,
    session_id: input.session_id,
    guardrail: input.guardrail,
    decision,
    mode: input.mode,
    human_signoff_required: input.human_signoff_required || decision === "human-required" ? 1 : 0,
    evidence_path: input.evidence_path,
    decided_at: nowIso(),
  };
  upsertRow(db, {
    table: "guardrail_decisions",
    primaryKey: "guardrail_decision_id",
    row: { ...row },
  });
  if (decision === "block") {
    upsertRow(db, {
      table: "findings",
      primaryKey: "finding_id",
      row: {
        finding_id: `finding:guardrail:${row.guardrail_decision_id}`,
        kind: "guardrail-block",
        severity: "warn",
        subject_id: input.plan_id,
        source: "guardrail-ledger",
        status: "open",
        evidence_path: input.evidence_path,
      },
    });
  }
  return row;
}
