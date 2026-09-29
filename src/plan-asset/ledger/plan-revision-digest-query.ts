/** PLAN-L7-722 rev3: Red 検証用の公開 API scaffold。DB を開かない。 */
export interface PlanRevisionDigestSelector {
  readonly alias: string;
  readonly assetId: string;
  readonly revision: number;
}

export type PlanRevisionDigestQueryResult =
  | Readonly<{
      ok: true;
      alias: string;
      assetId: string;
      revision: number;
      canonicalPayloadDigest: string;
    }>
  | Readonly<{
      ok: false;
      reason:
        | "invalid_input"
        | "alias_binding_mismatch"
        | "revision_not_found"
        | "ledger_unavailable"
        | "ledger_integrity_mismatch";
    }>;

export function readPlanRevisionCanonicalPayloadDigest(
  _selector: PlanRevisionDigestSelector,
): PlanRevisionDigestQueryResult {
  throw new Error("PLAN-L7-722: read-only query is not implemented (Red scaffold)");
}
