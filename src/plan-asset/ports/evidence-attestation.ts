import type { EvidenceAttestation, EvidenceProducer } from "../domain/evidence-types.js";

export interface EvidenceAttestationInput {
  readonly producer: EvidenceProducer;
  readonly recordDigest: string;
}

export interface EvidenceAttestationIssuerPort {
  issue(input: EvidenceAttestationInput): EvidenceAttestation;
}

export interface EvidenceAttestationVerifierPort {
  verify(input: EvidenceAttestationInput, attestation: EvidenceAttestation): boolean;
}

export type CapturedEvidenceAttestationVerifier = (
  input: EvidenceAttestationInput,
  attestation: EvidenceAttestation,
) => boolean;

const trustedVerifierCaptures = new WeakMap<object, CapturedEvidenceAttestationVerifier>();

export function registerEvidenceAttestationVerifier(
  verifier: EvidenceAttestationVerifierPort,
  canonicalVerify: EvidenceAttestationVerifierPort["verify"],
): void {
  if (trustedVerifierCaptures.has(verifier)) {
    throw new Error("evidence-attestation-verifier-duplicate");
  }
  trustedVerifierCaptures.set(verifier, canonicalVerify.bind(verifier));
}

export function captureEvidenceAttestationVerifier(
  verifier: EvidenceAttestationVerifierPort,
): CapturedEvidenceAttestationVerifier | null {
  return trustedVerifierCaptures.get(verifier) ?? null;
}
