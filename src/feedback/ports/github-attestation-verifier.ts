/**
 * GitHub Artifact Attestation の検証 port (PLAN-L7-465 §D3c freeze「既存実装との所有境界」)。
 *
 * 既存 `src/plan-asset/ports/evidence-attestation.ts` は同期 boolean + `hmac-sha256` 固定であり、
 * GitHub の信頼根にも provider family の証明にも使えない。あちらは変更せず、GitHub を
 * **唯一の artifact provenance verifier** として application port に隔離する。
 *
 * この port が証明できるのは artifact digest と GitHub が検証した
 * repository / workflow / run / issuer の provenance、および発行後の非改竄だけである。
 * payload 内の `reviewerFamily` の真実性は証明しない。
 */

export interface GitHubAttestationQuery {
  /** 完成 receipt artifact bytes から一方向計算した 64 lowerhex。 */
  readonly artifactDigest: string;
  readonly repository: string;
  readonly expectedWorkflowRef: string;
  readonly expectedIssuer: string;
}

export interface GitHubAttestationFacts {
  readonly repository: string;
  readonly workflowRef: string;
  readonly workflowSha: string;
  readonly runId: string;
  readonly runAttempt: number;
  readonly issuer: string;
}

export type GitHubAttestationVerification =
  | { readonly ok: true; readonly facts: GitHubAttestationFacts }
  | {
      readonly ok: false;
      readonly reason: "missing" | "signature_unverified" | "signer_mismatch" | "audit_unavailable";
    };

export interface GitHubAttestationVerifierPort {
  verify(query: GitHubAttestationQuery): Promise<GitHubAttestationVerification>;
}
