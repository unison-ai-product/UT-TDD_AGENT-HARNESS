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
  readonly expectedPreimage?: ArtifactPreimage;
}

export interface NodeAuthoringArtifactPublisherOptions
  extends Pick<NodeAtomicDraftPublisherOptions, "rootDir" | "injectFault" | "createId"> {
  readonly artifacts: readonly NodeAuthoringArtifact[];
}

/**
 * command-groupの論理memberを実filesystem publishへ束縛するadapter。
 * targetが既に同じcontent digestなら、journal append前のprocess停止からの再送として
 * 同一receiptを返す。未完tokenは同一process内のretryでfinalizeを再開する。
 */
export class NodeAuthoringArtifactPublisher implements AuthoringArtifactPublisher {
  private readonly rootDir: string;
  private readonly atomic: NodeAtomicDraftPublisher;
  private readonly artifacts: ReadonlyMap<string, NodeAuthoringArtifact>;
  private readonly pending = new Map<string, DraftPublishToken>();

  constructor(options: NodeAuthoringArtifactPublisherOptions) {
    this.rootDir = resolve(options.rootDir);
    this.atomic = new NodeAtomicDraftPublisher(options);
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
      sha(artifact.content) !== input.contentDigest
    ) {
      throw new Error("authoring artifact binding invalid");
    }
    const key = `${input.groupId}\0${input.memberId}`;
    const pending = this.pending.get(key);
    if (pending) {
      this.atomic.finalize(pending);
      this.pending.delete(key);
      return { receiptDigest: receipt(input) };
    }
    if (targetHasDigest(this.rootDir, artifact.path, input.contentDigest)) {
      return { receiptDigest: receipt(input) };
    }

    const token = this.atomic.stage([
      {
        path: artifact.path,
        content: artifact.content,
        expectedPreimage: artifact.expectedPreimage,
      },
    ]);
    try {
      this.atomic.publish(token);
      this.pending.set(key, token);
      this.atomic.finalize(token);
      this.pending.delete(key);
      return { receiptDigest: receipt(input) };
    } catch (error) {
      if (!this.pending.has(key)) {
        try {
          this.atomic.restore(token);
          this.atomic.dispose(token);
        } catch (recoveryError) {
          throw new AggregateError(
            [error, recoveryError],
            "authoring artifact publish recovery failed",
          );
        }
      }
      throw error;
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
