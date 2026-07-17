import type { LegacyPlanRevisionBootstrapTransaction } from "../plan-asset/ledger/plan-revision-bootstrap.js";
import type { PlanRevisionLedgerTransaction } from "../plan-asset/ledger/plan-revision-ledger.js";
import type {
  DraftLedgerPort,
  DraftReceiptBinding,
  PlanDraftCommand,
} from "./plan-draft-service.js";
import type { PlanRevisionExecutionPayload } from "./plan-revision-command-assembler.js";

export interface PlanRevisionReceipt extends DraftReceiptBinding {
  certificateDigest?: string;
}

/** adopted/legacyの永続化方式を一つのSaga portへ束縛する。 */
export class PlanRevisionLedgerAdapter
  implements DraftLedgerPort<PlanRevisionExecutionPayload, PlanRevisionReceipt>
{
  constructor(
    private readonly adopted: PlanRevisionLedgerTransaction,
    private readonly legacy: LegacyPlanRevisionBootstrapTransaction,
  ) {}

  transact(
    command: PlanDraftCommand<PlanRevisionExecutionPayload>,
    onPrepared: (receipt: PlanRevisionReceipt) => void,
  ): PlanRevisionReceipt {
    const input = command.payload.ledgerInput;
    const result = command.payload.legacy
      ? this.legacy.transact(
          input as Parameters<LegacyPlanRevisionBootstrapTransaction["transact"]>[0],
          onPrepared,
        )
      : this.adopted.transact(
          input as Parameters<PlanRevisionLedgerTransaction["transact"]>[0],
          onPrepared,
        );
    if (!result.ok) throw new Error(result.ruleId);
    if (result.commandPayloadDigest !== command.commandPayloadDigest)
      throw new Error("plan-revision-command-digest-mismatch");
    return result;
  }
}
