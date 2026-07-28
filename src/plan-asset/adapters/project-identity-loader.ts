import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const projectPath = "ut-tdd.project.json";
type ObjectFormat = "sha1" | "sha256";
type RuleId =
  | "plan-repository-identity-missing"
  | "plan-project-config-invalid"
  | "plan-repository-identity-invalid"
  | "plan-repository-identity-provenance-invalid";
type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly ruleId: RuleId; readonly message: string } };

export interface ProjectIdentityReceipt {
  readonly path: string;
  readonly blobOid: string;
  readonly contentDigest: string;
  readonly sourceCommit: string;
  readonly objectFormat: ObjectFormat;
}

export interface TrackedProjectIdentity {
  readonly schemaVersion: "ut-tdd.project/v1";
  readonly repositoryIdentity: string;
  readonly provenance: ProjectIdentityReceipt & { readonly receiptDigest: string };
}

export function loadTrackedProjectIdentity(input: {
  bytes: Uint8Array;
  receipt: ProjectIdentityReceipt;
  expectedRepositoryIdentity?: string;
}): Result<TrackedProjectIdentity> {
  if (!validReceipt(input.bytes, input.receipt)) {
    return failed("plan-repository-identity-provenance-invalid", "HEAD blob receipt mismatch");
  }
  const decoded = decodeConfig(input.bytes);
  if (!decoded.ok) return decoded;
  if (!validIdentity(decoded.value.repository_identity)) {
    return failed("plan-repository-identity-invalid", "repository identity grammar invalid");
  }
  if (
    input.expectedRepositoryIdentity &&
    decoded.value.repository_identity !== input.expectedRepositoryIdentity
  ) {
    return failed("plan-repository-identity-missing", "expected repository identity mismatch");
  }
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: "ut-tdd.project/v1",
      repositoryIdentity: decoded.value.repository_identity,
      provenance: Object.freeze({
        ...input.receipt,
        receiptDigest: sha256(Buffer.from(canonicalReceipt(input.receipt))),
      }),
    }),
  };
}

export function loadProjectIdentityFromHead(input: {
  repoRoot: string;
  expectedRepositoryIdentity?: string;
}): Result<TrackedProjectIdentity> {
  try {
    const objectFormat = gitText(input.repoRoot, ["rev-parse", "--show-object-format"]).trim();
    if (objectFormat !== "sha1" && objectFormat !== "sha256") {
      return failed("plan-repository-identity-provenance-invalid", "unsupported object format");
    }
    const sourceCommit = gitText(input.repoRoot, ["rev-parse", "HEAD"]).trim();
    const entry = gitText(input.repoRoot, ["ls-tree", "HEAD", "--", projectPath]).trim();
    const match = new RegExp(
      `^100644 blob ([a-f0-9]{${objectFormat === "sha1" ? 40 : 64}})\\t${projectPath}$`,
    ).exec(entry);
    if (!match) return failed("plan-repository-identity-missing", "tracked HEAD config missing");
    const bytes = execFileSync("git", ["-C", input.repoRoot, "show", `HEAD:${projectPath}`], {
      windowsHide: true,
    });
    return loadTrackedProjectIdentity({
      bytes,
      receipt: {
        path: projectPath,
        blobOid: match[1],
        contentDigest: sha256(bytes),
        sourceCommit,
        objectFormat,
      },
      expectedRepositoryIdentity: input.expectedRepositoryIdentity,
    });
  } catch {
    return failed("plan-repository-identity-missing", "tracked HEAD config unavailable");
  }
}

function decodeConfig(bytes: Uint8Array): Result<{ repository_identity: string }> {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (
      occurrences(text, "schema_version") !== 1 ||
      occurrences(text, "repository_identity") !== 1
    ) {
      return failed("plan-project-config-invalid", "duplicate or missing config key");
    }
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    const config = value as Record<string, unknown>;
    if (
      Object.keys(config).sort().join(",") !== "repository_identity,schema_version" ||
      config.schema_version !== "ut-tdd.project/v1" ||
      typeof config.repository_identity !== "string"
    ) {
      throw new Error();
    }
    return { ok: true, value: { repository_identity: config.repository_identity } };
  } catch {
    return failed("plan-project-config-invalid", "project config is not strict v1 JSON");
  }
}

function validReceipt(bytes: Uint8Array, receipt: ProjectIdentityReceipt): boolean {
  const width = receipt.objectFormat === "sha1" ? 40 : 64;
  return (
    receipt.path === projectPath &&
    new RegExp(`^[a-f0-9]{${width}}$`).test(receipt.sourceCommit) &&
    receipt.blobOid === gitBlobOid(bytes, receipt.objectFormat) &&
    receipt.contentDigest === sha256(bytes)
  );
}

function validIdentity(value: string): boolean {
  return (
    value === value.trim() &&
    value === value.normalize("NFC") &&
    !value.endsWith(".git") &&
    /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})$/.test(value)
  );
}

function gitBlobOid(bytes: Uint8Array, format: ObjectFormat): string {
  return createHash(format)
    .update(Buffer.from(`blob ${bytes.byteLength}\0`))
    .update(bytes)
    .digest("hex");
}

function canonicalReceipt(receipt: ProjectIdentityReceipt): string {
  return JSON.stringify([
    receipt.path,
    receipt.objectFormat,
    receipt.sourceCommit,
    receipt.blobOid,
    receipt.contentDigest,
  ]);
}

function occurrences(text: string, key: string): number {
  return text.match(new RegExp(`"${key}"\\s*:`, "g"))?.length ?? 0;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitText(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", repoRoot, ...args], { windowsHide: true, encoding: "utf8" });
}

function failed(ruleId: RuleId, message: string): Result<never> {
  return { ok: false, error: { ruleId, message } };
}
