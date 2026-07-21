import type {
  PlanRedesignBundleManifest,
  PlanRevisionManifest,
  PlanAuthoringCommandRunner as RunnerPort,
} from "../cli/plan-revise.js";
import type { AdmissionDecision, PlanAdmissionRequest } from "./policy.js";

type RevisionInput = {
  manifest: PlanRevisionManifest;
  admission: PlanAdmissionRequest;
  decision: Extract<AdmissionDecision, { ok: true }>;
};

export interface RevisionRunner<TResult> {
  run(input: RevisionInput): TResult;
}

export interface RedesignRunner<TResult> {
  run(input: { manifest: PlanRedesignBundleManifest }): TResult;
}

/** manifest discriminatorだけを解釈し、各application runnerへ委譲する。 */
export class PlanAuthoringCommandDispatcher<TRevision, TRedesign>
  implements RunnerPort<TRevision | TRedesign>
{
  constructor(
    private readonly revision: RevisionRunner<TRevision>,
    private readonly redesign: RedesignRunner<TRedesign>,
  ) {}

  run(input: RevisionInput | { manifest: PlanRedesignBundleManifest }): TRevision | TRedesign {
    return input.manifest.version === 2
      ? this.redesign.run({ manifest: input.manifest })
      : this.revision.run(input as RevisionInput);
  }
}
