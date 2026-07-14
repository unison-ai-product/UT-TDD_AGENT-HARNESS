import { createHmac, timingSafeEqual } from "node:crypto";
import type { EvidenceAttestation, EvidenceProducer } from "../domain/evidence-types.js";
import type {
  EvidenceAttestationInput,
  EvidenceAttestationIssuerPort,
  EvidenceAttestationVerifierPort,
} from "../ports/evidence-attestation.js";

export interface EvidenceAuthorityKeyMaterial {
  readonly version: string;
  readonly secret: Uint8Array;
  readonly producers: readonly EvidenceProducer[];
}

export class HmacEvidenceAttestationAuthority
  implements EvidenceAttestationIssuerPort, EvidenceAttestationVerifierPort
{
  readonly #authorityId: string;
  readonly #currentVersion: string;
  readonly #keys: ReadonlyMap<
    string,
    { readonly secret: Buffer; readonly producers: ReadonlySet<EvidenceProducer> }
  >;

  constructor(
    authorityId: string,
    currentVersion: string,
    keyMaterial: readonly EvidenceAuthorityKeyMaterial[],
  ) {
    if (!validIdentifier(authorityId) || !validIdentifier(currentVersion)) {
      throw new Error("evidence-attestation-authority-invalid");
    }
    const keys = new Map<
      string,
      { readonly secret: Buffer; readonly producers: ReadonlySet<EvidenceProducer> }
    >();
    for (const item of keyMaterial) {
      if (
        !validIdentifier(item.version) ||
        item.secret.byteLength < 32 ||
        item.producers.length === 0 ||
        new Set(item.producers).size !== item.producers.length ||
        keys.has(item.version)
      ) {
        throw new Error("evidence-attestation-key-material-invalid");
      }
      keys.set(item.version, {
        secret: Buffer.from(item.secret),
        producers: new Set(item.producers),
      });
    }
    if (!keys.has(currentVersion)) throw new Error("evidence-attestation-current-key-missing");
    this.#authorityId = authorityId;
    this.#currentVersion = currentVersion;
    this.#keys = keys;
    Object.freeze(this);
  }

  issue(input: EvidenceAttestationInput): EvidenceAttestation {
    const key = this.#keys.get(this.#currentVersion);
    if (!key?.producers.has(input.producer)) {
      throw new Error("evidence-attestation-producer-not-authorized");
    }
    return Object.freeze({
      schemaVersion: "evidence-attestation/v1",
      algorithm: "hmac-sha256",
      authorityId: this.#authorityId,
      keyVersion: this.#currentVersion,
      signature: this.#mac(input, this.#currentVersion, key.secret).toString("base64url"),
    });
  }

  verify(input: EvidenceAttestationInput, attestation: EvidenceAttestation): boolean {
    if (
      attestation.schemaVersion !== "evidence-attestation/v1" ||
      attestation.algorithm !== "hmac-sha256" ||
      attestation.authorityId !== this.#authorityId ||
      !/^[A-Za-z0-9_-]{43}$/.test(attestation.signature)
    ) {
      return false;
    }
    const key = this.#keys.get(attestation.keyVersion);
    if (!key?.producers.has(input.producer)) return false;
    const actual = Buffer.from(attestation.signature, "base64url");
    const expected = this.#mac(input, attestation.keyVersion, key.secret);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  #mac(input: EvidenceAttestationInput, keyVersion: string, secret: Buffer): Buffer {
    return createHmac("sha256", secret)
      .update(
        frame([
          "ut-tdd-evidence-attestation/v1",
          "evidence-attestation/v1",
          "hmac-sha256",
          this.#authorityId,
          keyVersion,
          input.producer,
          input.recordDigest,
        ]),
      )
      .digest();
  }
}

function frame(fields: readonly string[]): Buffer {
  const parts: Buffer[] = [];
  for (const field of fields) {
    const value = Buffer.from(field, "utf8");
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(value.length);
    parts.push(length, value);
  }
  return Buffer.concat(parts);
}

function validIdentifier(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}
