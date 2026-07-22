import { defaultHarnessDbPath, openHarnessDb } from "../state-db/index.js";
import type {
  IssueProjectionEvidenceClaim,
  TrustedIssueProjectionEvidence,
} from "./issue-projection-evidence-resolver.js";
import { SqliteIssueProjectionEvidenceResolver } from "./issue-projection-evidence-resolver.js";

/** main HARNESS evidence DBをplan ledgerから分離してE4 receiptを解決する。 */
export class NodeIssueProjectionEvidenceResolver {
  constructor(private readonly repoRoot: string) {}

  resolve(claim: IssueProjectionEvidenceClaim): TrustedIssueProjectionEvidence {
    const db = openHarnessDb(defaultHarnessDbPath(this.repoRoot), { repoRoot: this.repoRoot });
    try {
      return new SqliteIssueProjectionEvidenceResolver(db).resolve(claim);
    } finally {
      db.close();
    }
  }
}
