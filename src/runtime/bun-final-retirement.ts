import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  collectNodeBanFindings,
  loadNodeBanDocuments,
  type NodeBanAuditReceipt,
  type NodeBanF0cAggregateBinding,
  type NodeBanGenerationBinding,
  verifyNodeBanAuditReceipt,
} from "../lint/bun-permanent-ban.ts";
import {
  admitNodeGenerationAggregate,
  type NodeGenerationCiEvidence,
} from "../lint/node-generation-ci-policy.ts";
import { gitObjectIdSchema } from "../schema/node-slice-admission.ts";
import { assertCompleteGitHistory, NodeSliceAdmissionError } from "./node-slice-admission.ts";
import { classifyRuntimeImageProcess } from "./runtime-image-observer.ts";

const RAW_REVISION = /^[0-9a-f]{40}$/;
const PREFIXED_REVISION = /^git-sha1:([0-9a-f]{40})$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;

export type BunRetirementReason =
  | "f0b_receipt_missing"
  | "f0c_receipt_missing"
  | "q0_receipt_missing"
  | "receipt_schema_invalid"
  | "subject_revision_mismatch"
  | "generation_id_mismatch"
  | "artifact_digest_mismatch"
  | "retirement_subject_mismatch"
  | "predecessor_not_ancestor"
  | "q0_binding_invalid"
  | "reachable_bun_surface"
  | "indeterminate_bun_surface"
  | "history_incomplete";

export class BunRetirementError extends Error {
  readonly reason: BunRetirementReason;
  constructor(reason: BunRetirementReason) {
    super(reason);
    this.name = "BunRetirementError";
    this.reason = reason;
  }
}

export type BunRetirementF0bReceipt = NodeBanGenerationBinding;
export type BunRetirementF0cReceipt = NodeBanF0cAggregateBinding;
export type BunRetirementQ0Receipt = NodeBanAuditReceipt;

export interface BunRetirementSurface {
  readonly path: string;
  readonly symbol: string;
  readonly classification:
    | "reachable_production"
    | "ban_enforcement_guard"
    | "retained_fixture"
    | "non_applicable_false_positive"
    | "indeterminate";
}

export interface BunRetirementInput {
  readonly repoRoot: string;
  readonly f0b: BunRetirementF0bReceipt | null | undefined;
  readonly f0c: BunRetirementF0cReceipt | null | undefined;
  readonly q0: BunRetirementQ0Receipt | null | undefined;
  readonly f0cLanes: readonly NodeGenerationCiEvidence[];
  /** Algorithm-prefixed Git object id of the exact retirement commit. */
  readonly retirementSubject: string;
  readonly surfaces: readonly BunRetirementSurface[];
}

export interface BunRetirementTuple {
  readonly subject_revision: string;
  readonly generation_id: string;
  readonly artifact_digest: string;
  readonly retirement_subject: string;
}

export interface BunRetirementResult {
  readonly ok: true;
  readonly tuple: BunRetirementTuple;
  readonly receipt_digest: string;
}

const FINAL_GUARD_SURFACE_INDEX = [
  ["src/lint/runtime-portability.ts", "BUN_GLOBAL_PATTERN"],
  ["src/lint/bun-permanent-ban.ts", "nodeBanAuditSchemaVersion"],
  ["src/lint/rule-drift.ts", "containsBunExecutionInstruction"],
  ["src/lint/toolchain-pin.ts", "analyzeToolchainPin"],
  ["src/lint/github-ci-policy.ts", "BUN_EXECUTION_PATTERN"],
  ["src/state-db/stop-refresh.ts", "refuseBunStopRefresh"],
  ["src/runtime/runtime-image-observer.ts", "classifyRuntimeImageProcess"],
] as const;

/** Retained deny-only guards. Raw Bun candidates are inventoried separately. */
export function collectFinalGuardSurfaceIndex(): BunRetirementSurface[] {
  return FINAL_GUARD_SURFACE_INDEX.map(([path, symbol]) => ({
    path,
    symbol,
    classification: "ban_enforcement_guard" as const,
  }));
}

function rawRevision(value: string): string | null {
  const prefixed = PREFIXED_REVISION.exec(value);
  if (prefixed) return prefixed[1];
  return RAW_REVISION.test(value) ? value : null;
}

function prefixedRevision(value: string): string {
  const raw = rawRevision(value);
  if (!raw) throw new BunRetirementError("receipt_schema_invalid");
  const candidate = `git-sha1:${raw}`;
  if (!gitObjectIdSchema.safeParse(candidate).success)
    throw new BunRetirementError("receipt_schema_invalid");
  return candidate;
}

function currentHead(repoRoot: string): string {
  try {
    return execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function isAncestor(repoRoot: string, ancestor: string, subject: string): boolean {
  try {
    execFileSync("git", ["-C", repoRoot, "merge-base", "--is-ancestor", ancestor, subject], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function validF0b(receipt: BunRetirementF0bReceipt): boolean {
  return (
    receipt.runtime === "node" &&
    (receipt.lane === "linux" || receipt.lane === "windows") &&
    typeof receipt.generation_id === "string" &&
    receipt.generation_id.length > 0 &&
    rawRevision(receipt.subject_revision) !== null &&
    DIGEST.test(receipt.artifact_digest) &&
    /^[0-9a-f]{64}$/.test(receipt.receipt_digest)
  );
}

function validF0c(receipt: BunRetirementF0cReceipt): boolean {
  return (
    receipt.ok === true &&
    receipt.schema_version === "node-generation-aggregate.v1" &&
    typeof receipt.generation_id === "string" &&
    receipt.generation_id.length > 0 &&
    DIGEST.test(receipt.artifact_digest) &&
    rawRevision(receipt.subject_revision) !== null &&
    rawRevision(receipt.workflow_revision) !== null &&
    typeof receipt.run_id === "string" &&
    receipt.run_id.length > 0 &&
    Number.isSafeInteger(receipt.run_attempt) &&
    receipt.run_attempt > 0
  );
}

function verifySurfaces(surfaces: readonly BunRetirementSurface[]): void {
  if (
    surfaces.length === 0 ||
    surfaces.some((surface) => !surface.path.trim() || !surface.symbol.trim())
  )
    throw new BunRetirementError("indeterminate_bun_surface");
  if (surfaces.some((surface) => surface.classification === "indeterminate"))
    throw new BunRetirementError("indeterminate_bun_surface");
  if (surfaces.some((surface) => surface.classification === "reachable_production"))
    throw new BunRetirementError("reachable_bun_surface");
}

/**
 * Final deletion admission. This is deliberately pure: callers must receive
 * this result before changing package/build/runtime artifacts.
 */
export function admitFinalBunRetirement(input: BunRetirementInput): BunRetirementResult {
  if (!input.f0b) throw new BunRetirementError("f0b_receipt_missing");
  if (!input.f0c) throw new BunRetirementError("f0c_receipt_missing");
  if (!input.q0) throw new BunRetirementError("q0_receipt_missing");
  if (!validF0b(input.f0b) || !validF0c(input.f0c))
    throw new BunRetirementError("receipt_schema_invalid");

  const f0bSubject = rawRevision(input.f0b.subject_revision);
  const f0cSubject = rawRevision(input.f0c.subject_revision);
  const workflowRevision = rawRevision(input.f0c.workflow_revision);
  const retirementSubject = rawRevision(input.retirementSubject);
  if (!f0bSubject || !f0cSubject || !workflowRevision || !retirementSubject)
    throw new BunRetirementError("receipt_schema_invalid");
  if (f0bSubject !== f0cSubject) throw new BunRetirementError("subject_revision_mismatch");
  if (input.f0b.artifact_digest !== input.f0c.artifact_digest)
    throw new BunRetirementError("artifact_digest_mismatch");

  try {
    verifyNodeBanAuditReceipt(input.q0, {
      subjectRevision: f0cSubject,
      f0c: input.f0c,
      node: input.f0b,
      f0cLanes: input.f0cLanes,
      classifyProcess: classifyRuntimeImageProcess,
    });
  } catch {
    throw new BunRetirementError("q0_binding_invalid");
  }
  if (input.q0.qualification !== "qualified") throw new BunRetirementError("q0_binding_invalid");

  const lanes = input.f0cLanes;
  if (
    lanes.length !== 2 ||
    new Set(lanes.map((lane) => lane.lane)).size !== 2 ||
    !lanes.some((lane) => lane.lane === "linux") ||
    !lanes.some((lane) => lane.lane === "windows")
  )
    throw new BunRetirementError("q0_binding_invalid");
  const aggregate = admitNodeGenerationAggregate({
    evidence: lanes,
    expected: {
      workflow_revision: input.f0c.workflow_revision,
      subject_revision: input.f0c.subject_revision,
      run_id: input.f0c.run_id,
      run_attempt: input.f0c.run_attempt,
    },
  });
  if (!aggregate.ok) throw new BunRetirementError("q0_binding_invalid");

  const head = currentHead(input.repoRoot);
  if (!head || head !== retirementSubject)
    throw new BunRetirementError("retirement_subject_mismatch");
  try {
    assertCompleteGitHistory(input.repoRoot, [f0cSubject, retirementSubject]);
  } catch (error) {
    if (error instanceof NodeSliceAdmissionError && error.code === "history_incomplete")
      throw new BunRetirementError("history_incomplete");
    throw new BunRetirementError("predecessor_not_ancestor");
  }
  if (!isAncestor(input.repoRoot, f0cSubject, retirementSubject))
    throw new BunRetirementError("predecessor_not_ancestor");

  verifySurfaces(input.surfaces);
  const tuple: BunRetirementTuple = {
    subject_revision: prefixedRevision(input.f0c.subject_revision),
    generation_id: input.f0b.generation_id,
    artifact_digest: input.f0c.artifact_digest,
    retirement_subject: prefixedRevision(input.retirementSubject),
  };
  return {
    ok: true,
    tuple,
    receipt_digest: `sha256:${createHash("sha256").update(JSON.stringify(tuple)).digest("hex")}`,
  };
}

/** Re-run the existing Q0 document detectors for the physical tree. */
export function collectFinalRetirementFindings(repoRoot: string) {
  return collectNodeBanFindings(loadNodeBanDocuments(repoRoot));
}
