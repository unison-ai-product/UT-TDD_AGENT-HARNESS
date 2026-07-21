import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  AuthoringArtifactPublisher,
  AuthoringCommandGroupMember,
} from "../plan-asset/ledger/authoring-command-group.js";
import {
  NodeAtomicDraftPublisher,
  type NodeAtomicDraftPublisherOptions,
} from "./node-atomic-draft-publisher.js";
import type { ArtifactPreimage, DraftPublishToken } from "./plan-draft-service.js";

export interface NodeAuthoringArtifact {
  readonly memberId: string;
  readonly path: string;
  readonly content: string;
  readonly expectedPreimage: ArtifactPreimage;
}

export interface NodeAuthoringArtifactPublisherOptions
  extends Pick<NodeAtomicDraftPublisherOptions, "rootDir" | "injectFault"> {
  readonly artifacts: readonly NodeAuthoringArtifact[];
}

/**
 * command-groupの論理memberを実filesystem publishへ束縛するadapter。
 * targetが既に同じcontent digestなら、journal append前のprocess停止からの再送として
 * 同一receiptを返す。未完tokenは同一process内のretryでfinalizeを再開する。
 */
export class NodeAuthoringArtifactPublisher implements AuthoringArtifactPublisher {
  private readonly rootDir: string;
  private readonly injectFault: NodeAtomicDraftPublisherOptions["injectFault"];
  private readonly artifacts: ReadonlyMap<string, NodeAuthoringArtifact>;
  private readonly pending = new Map<
    string,
    { readonly atomic: NodeAtomicDraftPublisher; readonly token: DraftPublishToken }
  >();

  constructor(options: NodeAuthoringArtifactPublisherOptions) {
    this.rootDir = resolve(options.rootDir);
    this.injectFault = options.injectFault;
    const artifacts = new Map(options.artifacts.map((artifact) => [artifact.memberId, artifact]));
    if (artifacts.size !== options.artifacts.length) {
      throw new Error("authoring artifact member id duplicated");
    }
    this.artifacts = artifacts;
  }

  publish(input: AuthoringCommandGroupMember & { readonly groupId: string }): {
    readonly receiptDigest: string;
  } {
    const artifact = this.artifacts.get(input.memberId);
    if (
      !artifact ||
      artifact.path !== input.artifactPath ||
      sha(artifact.content) !== input.contentDigest ||
      stableJson(artifact.expectedPreimage) !== stableJson(input.expectedPreimage)
    ) {
      throw new Error("authoring artifact binding invalid");
    }
    const key = `${input.groupId}\0${input.memberId}`;
    const tokenId = `authoring-${sha(key).slice(0, 32)}`;
    const pending = this.pending.get(key);
    if (pending) {
      return { receiptDigest: receipt(input) };
    }
    const atomic = new NodeAtomicDraftPublisher({
      rootDir: this.rootDir,
      injectFault: this.injectFault,
      createId: () => tokenId,
    });
    const recovery = {
      tokenId,
      path: artifact.path,
      preimage: artifact.expectedPreimage,
      postimage: `sha256:${input.contentDigest}` as const,
    };
    if (atomic.recoverSingleArtifactPublication(recovery)) {
      // receipt 再構成時点で publish は完了しているため、同じ呼出し内で
      // durable custody を解放する。後続 acknowledge は冪等に再検証する。
      atomic.resumeSingleArtifactCleanup(recovery);
      return { receiptDigest: receipt(input) };
    }
    const unchangedPreimage =
      artifact.expectedPreimage.kind === "sha256" &&
      artifact.expectedPreimage.digest === `sha256:${input.contentDigest}`;
    if (targetHasDigest(this.rootDir, artifact.path, input.contentDigest) && !unchangedPreimage) {
      atomic.verifySingleArtifactCustody({
        tokenId,
        path: artifact.path,
        preimage: artifact.expectedPreimage,
        postimage: `sha256:${input.contentDigest}`,
      });
      return { receiptDigest: receipt(input) };
    }

    let token: DraftPublishToken | undefined;
    try {
      token = atomic.stage([
        {
          path: artifact.path,
          content: artifact.content,
          expectedPreimage: artifact.expectedPreimage,
        },
      ]);
      atomic.publish(token);
      this.pending.set(key, { atomic, token });
      return { receiptDigest: receipt(input) };
    } catch (error) {
      if (token && !this.pending.has(key)) {
        try {
          atomic.restore(token);
          atomic.dispose(token);
        } catch (recoveryError: unknown) {
          const recovery = new AggregateError(
            [error, recoveryError],
            "authoring artifact publish recovery failed",
          );
          throw recovery;
        }
      }
      throw new AggregateError([error], "authoring artifact publish failed");
    }
  }

  acknowledge(input: AuthoringCommandGroupMember & { readonly groupId: string }): void {
    const artifact = this.artifacts.get(input.memberId);
    if (
      !artifact ||
      artifact.path !== input.artifactPath ||
      sha(artifact.content) !== input.contentDigest ||
      stableJson(artifact.expectedPreimage) !== stableJson(input.expectedPreimage)
    )
      throw new Error("authoring artifact binding invalid");
    const key = `${input.groupId}\0${input.memberId}`;
    const tokenId = `authoring-${sha(key).slice(0, 32)}`;
    const pending = this.pending.get(key);
    if (pending) {
      pending.atomic.finalize(pending.token);
      this.pending.delete(key);
      return;
    }
    const atomic = new NodeAtomicDraftPublisher({ rootDir: this.rootDir, createId: () => tokenId });
    atomic.resumeSingleArtifactCleanup({
      tokenId,
      path: artifact.path,
      preimage: artifact.expectedPreimage,
      postimage: `sha256:${input.contentDigest}`,
    });
  }

  rollback(inputs: readonly (AuthoringCommandGroupMember & { readonly groupId: string })[]): void {
    for (const input of inputs) {
      const artifact = this.artifacts.get(input.memberId);
      if (!artifact) throw new Error("authoring rollback artifact missing");
      const tokenId = `authoring-${sha(`${input.groupId}\0${input.memberId}`).slice(0, 32)}`;
      new NodeAtomicDraftPublisher({ rootDir: this.rootDir }).restoreSingleArtifactPublication({
        tokenId,
        path: artifact.path,
        preimage: artifact.expectedPreimage,
        postimage: `sha256:${input.contentDigest}`,
      });
      const target = resolve(this.rootDir, artifact.path);
      if (artifact.expectedPreimage.kind === "absent") {
        if (existsSync(target)) throw new Error("authoring rollback absent preimage mismatch");
      } else if (
        !targetHasDigest(this.rootDir, artifact.path, artifact.expectedPreimage.digest.slice(7))
      ) {
        throw new Error("authoring rollback preimage digest mismatch");
      }
      for (const custody of [
        `${target}.ut-tdd-draft-${tokenId}.tmp`,
        `${target}.ut-tdd-draft-${tokenId}.rollback`,
        resolve(this.rootDir, `.ut-tdd-draft-${tokenId}-0-temporary.identity`),
        resolve(this.rootDir, `.ut-tdd-draft-${tokenId}-0-rollback.identity`),
        resolve(this.rootDir, `.ut-tdd-draft-${tokenId}-0-published.identity`),
      ])
        if (existsSync(custody)) throw new Error("authoring rollback custody remains");
    }
  }
}

function targetHasDigest(rootDir: string, logicalPath: string, digest: string): boolean {
  const target = resolve(rootDir, logicalPath);
  const rel = relative(rootDir, target);
  if (rel.startsWith("..") || isAbsolute(rel) || !existsSync(target)) return false;
  const stat = lstatSync(target);
  return stat.isFile() && !stat.isSymbolicLink() && sha(readFileSync(target)) === digest;
}

function receipt(input: AuthoringCommandGroupMember & { readonly groupId: string }): string {
  return sha(`${input.groupId}\0${input.memberId}\0${input.artifactPath}\0${input.contentDigest}`);
}

function sha(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
