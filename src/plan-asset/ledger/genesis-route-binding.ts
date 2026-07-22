import { sha, stableJson } from "../../plan-admission/plan-revision-command-assembler.js";
import type { PlanAdmissionRequest } from "../../plan-admission/policy.js";

export interface GenesisRouteBinding {
  readonly origin: NonNullable<PlanAdmissionRequest["origin"]>;
  readonly reentry: NonNullable<PlanAdmissionRequest["reentry"]>;
}

/** Genesis採用のoff-Forward経路を既存PlanAdmissionのcanonical規約で束縛する。 */
export function deriveGenesisRouteTupleDigest(binding: GenesisRouteBinding): string {
  const route: Pick<PlanAdmissionRequest, "routeSignal" | "routeMode" | "origin" | "reentry"> = {
    routeSignal: "redesign",
    routeMode: "redesign",
    origin: binding.origin,
    reentry: binding.reentry,
  };
  return sha(stableJson(route));
}
