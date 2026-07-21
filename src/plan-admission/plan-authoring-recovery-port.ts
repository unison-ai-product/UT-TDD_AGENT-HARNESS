export interface PlanAuthoringRecoveryRunner {
  status(commandId: string): unknown;
  list(unresolvedOnly: boolean): unknown;
  recover(input: {
    commandId: string;
    strategy: "rollback" | "roll_forward" | "finalize";
    expectedAssessmentDigest?: string;
    execute: boolean;
  }): unknown;
}
