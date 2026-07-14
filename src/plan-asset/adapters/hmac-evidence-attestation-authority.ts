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

type StoredKey = {
  readonly secret: Buffer;
  readonly producers: ReadonlySet<EvidenceProducer>;
};

/** Signing capability. Never pass this object to policy evaluation code. */
export class HmacEvidenceAttestationIssuer implements EvidenceAttestationIssuerPort {
  readonly #authorityId: string;
  readonly #currentVersion: string;
  readonly #keys: ReadonlyMap<string, StoredKey>;

  constructor(
    authorityId: string,
    currentVersion: string,
    keyMaterial: readonly EvidenceAuthorityKeyMaterial[],
  ) {
    this.#authorityId = validAuthority(authorityId);
    this.#currentVersion = validVersion(currentVersion);
    this.#keys = buildKeys(keyMaterial);
    if (!this.#keys.has(currentVersion))
      throw new Error("evidence-attestation-current-key-missing");
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
      signature: mac(this.#authorityId, this.#currentVersion, input, key.secret).toString(
        "base64url",
      ),
    });
  }
}

/** Verify-only capability with no signing surface and immutable private custody. */
export class HmacEvidenceAttestationVerifier implements EvidenceAttestationVerifierPort {
  readonly #authorityId: string;
  readonly #keys: ReadonlyMap<string, StoredKey>;

  constructor(authorityId: string, keyMaterial: readonly EvidenceAuthorityKeyMaterial[]) {
    if (new.target !== HmacEvidenceAttestationVerifier) {
      throw new Error("evidence-attestation-verifier-subclass-forbidden");
    }
    this.#authorityId = validAuthority(authorityId);
    this.#keys = buildKeys(keyMaterial);
    Object.freeze(this);
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
    const expected = mac(this.#authorityId, attestation.keyVersion, input, key.secret);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

Object.freeze(HmacEvidenceAttestationVerifier.prototype);

function buildKeys(
  keyMaterial: readonly EvidenceAuthorityKeyMaterial[],
): ReadonlyMap<string, StoredKey> {
  const keys = new Map<string, StoredKey>();
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
  if (keys.size === 0) throw new Error("evidence-attestation-key-material-invalid");
  return keys;
}

function mac(
  authorityId: string,
  keyVersion: string,
  input: EvidenceAttestationInput,
  secret: Buffer,
): Buffer {
  return createHmac("sha256", secret)
    .update(
      frame([
        "ut-tdd-evidence-attestation/v1",
        "evidence-attestation/v1",
        "hmac-sha256",
        authorityId,
        keyVersion,
        input.producer,
        input.recordDigest,
      ]),
    )
    .digest();
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

function validAuthority(value: string): string {
  if (!validIdentifier(value)) throw new Error("evidence-attestation-authority-invalid");
  return value;
}

function validVersion(value: string): string {
  if (!validIdentifier(value)) throw new Error("evidence-attestation-authority-invalid");
  return value;
}

function validIdentifier(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}
