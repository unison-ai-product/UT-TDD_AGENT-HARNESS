import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  NodeGitCommandPort,
  type TrustedGitBlob,
  TrustedGitBlobResolver,
} from "../../plan-admission/trusted-git-blob-resolver.js";
import { parseLegacyPlanSource } from "../adapters/legacy-plan-inventory.js";
import { loadProjectIdentityFromHead } from "../adapters/project-identity-loader.js";
import {
  type GenesisAdoptionInput,
  type GenesisAdoptionResult,
  GenesisAdoptionTransaction,
  type GenesisCustodyPort,
} from "../ledger/genesis-adoption-transaction.js";
import { openPlanLedger } from "../ledger/schema.js";

export interface GenesisAdoptionManifest {
  readonly version: 1;
  readonly command_id: string;
  readonly repository_identity: string;
  readonly plan_id: string;
  readonly actor: string;
  readonly reason: string;
  readonly route_tuple_digest: string;
  readonly recorded_at: string;
  readonly source: {
    readonly path: string;
    readonly commit: string;
    readonly blob_oid: string;
    readonly content_digest: string;
  };
  readonly issue: {
    readonly number: number;
    readonly episode_id: string;
    readonly drive_model: "redesign";
    readonly branch: string;
    readonly preimage_digest: string;
  };
}

export interface GenesisAdoptionTransactionPort {
  adopt(input: GenesisAdoptionInput): GenesisAdoptionResult;
}

/** local commit後のreceiptをremote GitHub projection sagaへ渡す境界。実装は別slice。 */
export interface GenesisAdoptionProjectionOutboxPort {
  enqueue(input: {
    readonly commandId: string;
    readonly issueNumber: number;
    readonly issuePreimageDigest: string;
    readonly localReceipt: Extract<GenesisAdoptionResult, { ok: true }>;
  }): void;
}

export interface NodeGenesisAdoptionRunnerDeps {
  readonly head: () => string;
  readonly branch: () => string;
  readonly repositoryIdentity: () => string;
  readonly resolveBlob: (commit: string, sourcePath: string) => TrustedGitBlob;
  readonly transaction: GenesisAdoptionTransactionPort;
}

/** strict manifestをtrusted HEADへ束縛してからlocal genesis transactionを呼ぶ。 */
export class NodeGenesisAdoptionRunner {
  constructor(private readonly deps: NodeGenesisAdoptionRunnerDeps) {}

  run(rawManifest: unknown): GenesisAdoptionResult {
    const manifest = parseGenesisAdoptionManifest(rawManifest);
    const head = this.deps.head().trim();
    if (head !== manifest.source.commit) throw new Error("genesis-adoption-head-drift");
    if (this.deps.repositoryIdentity().trim() !== manifest.repository_identity)
      throw new Error("genesis-adoption-repository-mismatch");
    if (this.deps.branch().trim() !== manifest.issue.branch)
      throw new Error("genesis-adoption-branch-mismatch");

    const blob = this.deps.resolveBlob(head, manifest.source.path);
    if (blob.commitOid !== head) throw new Error("genesis-adoption-head-drift");
    if (blob.sourcePath !== manifest.source.path)
      throw new Error("genesis-adoption-source-path-drift");
    if (blob.blobOid !== manifest.source.blob_oid)
      throw new Error("genesis-adoption-source-blob-drift");
    if (sha(blob.bytes) !== manifest.source.content_digest)
      throw new Error("genesis-adoption-source-content-drift");

    const text = decodeUtf8(blob.bytes);
    const source = parseLegacyPlanSource(text);
    if (!source || source.planId !== manifest.plan_id)
      throw new Error("genesis-adoption-source-invalid");
    const canonicalPayloadJson = canonical(source.frontmatter);
    return this.deps.transaction.adopt({
      commandId: manifest.command_id,
      repositoryIdentity: manifest.repository_identity,
      planId: manifest.plan_id,
      sourcePath: manifest.source.path,
      sourceCommit: head,
      sourceBlobOid: blob.blobOid,
      sourceContentDigest: manifest.source.content_digest,
      canonicalPayloadJson,
      canonicalPayloadDigest: sha(canonicalPayloadJson),
      bodyDigest: sha(source.body),
      actor: manifest.actor,
      reason: manifest.reason,
      routeTupleDigest: manifest.route_tuple_digest,
      occurredAt: manifest.recorded_at,
      issue: {
        number: manifest.issue.number,
        episodeId: manifest.issue.episode_id,
        driveModel: manifest.issue.drive_model,
        branch: manifest.issue.branch,
        preimageDigest: manifest.issue.preimage_digest,
      },
    });
  }
}

export function createNodeGenesisAdoptionRunner(
  repoRoot: string,
  custody: GenesisCustodyPort,
): NodeGenesisAdoptionRunner {
  const resolver = new TrustedGitBlobResolver(new NodeGitCommandPort(repoRoot));
  return new NodeGenesisAdoptionRunner({
    head: () => git(repoRoot, ["rev-parse", "HEAD"]),
    branch: () => git(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]),
    repositoryIdentity: () => {
      const identity = loadProjectIdentityFromHead({ repoRoot });
      if (!identity.ok) throw new Error(identity.error.ruleId);
      return identity.value.repositoryIdentity;
    },
    resolveBlob: (commit, sourcePath) => resolver.resolve(commit, sourcePath),
    transaction: {
      adopt(input) {
        const db = openPlanLedger({ repoRoot });
        try {
          return new GenesisAdoptionTransaction(db, custody).adopt(input);
        } finally {
          db.close();
        }
      },
    },
  });
}

export function parseGenesisAdoptionManifest(value: unknown): GenesisAdoptionManifest {
  try {
    const root = exactRecord(value, [
      "version",
      "command_id",
      "repository_identity",
      "plan_id",
      "actor",
      "reason",
      "route_tuple_digest",
      "recorded_at",
      "source",
      "issue",
    ]);
    const source = exactRecord(root.source, ["path", "commit", "blob_oid", "content_digest"]);
    const issue = exactRecord(root.issue, [
      "number",
      "episode_id",
      "drive_model",
      "branch",
      "preimage_digest",
    ]);
    const manifest: GenesisAdoptionManifest = {
      version: literal(root.version, 1),
      command_id: nonempty(root.command_id),
      repository_identity: matching(root.repository_identity, repositoryPattern),
      plan_id: matching(root.plan_id, /^PLAN-L(?:[0-9]|1[0-4])-[A-Za-z0-9][A-Za-z0-9-]*$/),
      actor: nonempty(root.actor),
      reason: nonempty(root.reason),
      route_tuple_digest: digest(root.route_tuple_digest),
      recorded_at: timestamp(root.recorded_at),
      source: {
        path: matching(source.path, /^docs\/plans\/[^/]+\.md$/),
        commit: oid(source.commit),
        blob_oid: oid(source.blob_oid),
        content_digest: digest(source.content_digest),
      },
      issue: {
        number: positiveInteger(issue.number),
        episode_id: matching(issue.episode_id, /^E4-[1-9]\d*$/),
        drive_model: literal(issue.drive_model, "redesign"),
        branch: matching(issue.branch, /^work\/redesign-[A-Za-z0-9._/-]+$/),
        preimage_digest: digest(issue.preimage_digest),
      },
    };
    if (manifest.issue.episode_id !== `E4-${manifest.issue.number}`) throw new Error();
    return manifest;
  } catch {
    throw new Error("genesis-adoption-manifest-invalid");
  }
}

const repositoryPattern =
  /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})$/;

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== [...keys].sort().join(",")) throw new Error();
  return record;
}

function nonempty(value: unknown): string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) throw new Error();
  return value;
}
function matching(value: unknown, pattern: RegExp): string {
  const text = nonempty(value);
  if (!pattern.test(text)) throw new Error();
  return text;
}
function digest(value: unknown): string {
  return matching(value, /^[0-9a-f]{64}$/);
}
function oid(value: unknown): string {
  return matching(value, /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/);
}
function positiveInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new Error();
  return value;
}
function timestamp(value: unknown): string {
  const text = nonempty(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text) || Number.isNaN(Date.parse(text)))
    throw new Error();
  return text;
}
function literal<const T extends string | number>(value: unknown, expected: T): T {
  if (value !== expected) throw new Error();
  return expected;
}
function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("genesis-adoption-source-encoding-invalid");
  }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}
