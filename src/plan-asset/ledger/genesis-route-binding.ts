import { createHash } from "node:crypto";

interface GenesisRouteOrigin {
  readonly planId: string;
  readonly revision: number;
  readonly digest: string;
}

interface GenesisRouteReentry {
  readonly targetPlanId: string;
  readonly targetRevision: number;
  readonly phase: "forward_merge";
}

export interface GenesisRouteBinding {
  readonly origin: GenesisRouteOrigin;
  readonly reentry: GenesisRouteReentry;
}

/** Genesis採用のoff-Forward経路を既存PlanAdmissionのcanonical規約で束縛する。 */
export function deriveGenesisRouteTupleDigest(binding: GenesisRouteBinding): string {
  const route = {
    routeSignal: "redesign",
    routeMode: "redesign",
    origin: binding.origin,
    reentry: binding.reentry,
  };
  return sha(stableJson(route));
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
