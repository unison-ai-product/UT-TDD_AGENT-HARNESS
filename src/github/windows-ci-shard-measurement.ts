interface MeasurementRun {
  id: string;
  attempt: number;
  workflowPath: string;
  conclusion: string;
  headSha: string;
}

interface MeasurementJob {
  id: string;
  name: string;
  runId: string;
  attempt: number;
  conclusion: string;
  headSha: string;
}

interface RegressionStep {
  number: number;
  name: string;
  conclusion: string;
  startedAt: string;
  completedAt: string;
}

export interface WindowsShardMeasurementInput {
  subject: {
    pr: number;
    requestedHeadSha: string;
    headBeforeSha: string;
    headAfterSha: string;
    treeSha: string;
  };
  before: Array<{
    run: MeasurementRun & { event: string; branch: string };
    job: MeasurementJob & { step: RegressionStep };
  }>;
  after: {
    requiredChecks: Array<{
      id: string;
      name: string;
      app: string;
      conclusion: string;
      headSha: string;
      runId: string;
      jobId: string;
    }>;
    run: MeasurementRun;
    aggregateJob: MeasurementJob;
    aggregateAttemptJob: MeasurementJob;
    windowsJobs: Array<{
      job: MeasurementJob;
      step: RegressionStep;
      log: { jobId: string; stepNumber: number; snapshotSha: string };
    }>;
    snapshot: { commitSha: string; parentShas: string[]; treeSha: string };
  };
}

export type WindowsShardMeasurementFailure =
  | "measurement_evidence_invalid"
  | "measurement_binding_mismatch"
  | "measurement_not_successful";

export type WindowsShardMeasurementResult =
  | {
      ok: true;
      beforeSeconds: number[];
      beforeMedianSeconds: number;
      afterElapsedSeconds: number;
      shardSeconds: number[];
    }
  | { ok: false; error: WindowsShardMeasurementFailure };

/** Red-stage fail-closed stub. The contract is exercised by CANDIDATE-U-CISHARD-012. */
export function admitWindowsShardMeasurement(
  _input: WindowsShardMeasurementInput,
): WindowsShardMeasurementResult {
  return { ok: false, error: "measurement_evidence_invalid" };
}
