import type { ForwardEscapeLedgerView } from "../execution/forward-escape.js";
import { committedRevisionPredicate } from "../plan-asset/ledger/revision-visibility.js";
import type { HarnessDb } from "../state-db/index.js";

/** plan revisionはplan ledger、E2 command custodyはmain HARNESS DBから読む合成view。 */
export class NodeForwardEscapeLedgerView implements ForwardEscapeLedgerView {
  constructor(
    private readonly planDb: HarnessDb,
    private readonly evidenceDb: HarnessDb,
  ) {}

  currentRevisionOf(assetId: string): string | undefined {
    const row = this.planDb
      .prepare(
        `SELECT revision FROM plan_revisions revision
         WHERE asset_id = ? AND ${committedRevisionPredicate("revision")}
         ORDER BY revision DESC LIMIT 1`,
      )
      .get(assetId);
    return row ? String(row.revision) : undefined;
  }

  lookupRevision(assetId: string, revisionId: string) {
    const revision = Number(revisionId);
    if (!Number.isSafeInteger(revision) || revision <= 0) return undefined;
    const row = this.planDb
      .prepare(
        `SELECT canonical_payload_json FROM plan_revisions revision
         WHERE asset_id = ? AND revision = ? AND ${committedRevisionPredicate("revision")}`,
      )
      .get(assetId, revision);
    if (!row) return undefined;
    const payload = JSON.parse(String(row.canonical_payload_json)) as Record<string, unknown>;
    const states = Array.isArray(payload.states)
      ? payload.states.filter((value): value is string => typeof value === "string")
      : [payload.status, payload.route_mode].filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        );
    return typeof payload.layer === "string" ? { layer: payload.layer, states } : undefined;
  }

  priorCommand(commandId: string) {
    const row = this.evidenceDb
      .prepare(
        "SELECT payload_digest FROM forward_escape_validation_certificates WHERE command_id = ?",
      )
      .get(commandId);
    return row ? { payload_digest: String(row.payload_digest) } : undefined;
  }
}
