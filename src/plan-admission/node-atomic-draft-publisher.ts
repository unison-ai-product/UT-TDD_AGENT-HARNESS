import { randomUUID } from "node:crypto";
import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { DraftArtifact, DraftPublisherPort, DraftPublishToken } from "./plan-draft-service";

export type DraftPublisherFaultPoint =
  | "stage:before-write"
  | "stage:after-write"
  | "publish:after-backup-rename"
  | "publish:after-target-rename"
  | "restore:before-artifact"
  | "finalize:before-artifact"
  | "finalize:after-artifact";

export interface NodeAtomicDraftPublisherOptions {
  rootDir: string;
  injectFault?: (point: DraftPublisherFaultPoint, artifactPath: string) => void;
  createId?: () => string;
}

interface StagedArtifact {
  logicalPath: string;
  targetPath: string;
  temporaryPath: string;
  rollbackPath: string;
  existed: boolean;
  backupMoved: boolean;
  targetPublished: boolean;
  restored: boolean;
  finalized: boolean;
}

interface NodeDraftPublishToken extends DraftPublishToken {
  artifacts: StagedArtifact[];
  published: boolean;
  restored: boolean;
}

/**
 * 2つのDraft成果物を同一filesystem上のrenameで公開するNode adapter。
 * filesystemは複数pathの単一atomic commitを提供しないため、既存版をrollback
 * fileへ退避し、部分公開時にもrestore可能なtokenを維持する。
 */
export class NodeAtomicDraftPublisher implements DraftPublisherPort {
  private readonly rootDir: string;
  private readonly tokens = new Map<string, NodeDraftPublishToken>();
  private readonly finalizedTokens = new WeakSet<NodeDraftPublishToken>();
  private readonly injectFault: NonNullable<NodeAtomicDraftPublisherOptions["injectFault"]>;
  private readonly createId: NonNullable<NodeAtomicDraftPublisherOptions["createId"]>;

  constructor(options: NodeAtomicDraftPublisherOptions) {
    this.rootDir = realpathSync.native(resolve(options.rootDir));
    this.injectFault = options.injectFault ?? (() => undefined);
    this.createId = options.createId ?? randomUUID;
  }

  stage(artifacts: readonly DraftArtifact[]): DraftPublishToken {
    if (artifacts.length !== 2 || new Set(artifacts.map((item) => item.path)).size !== 2) {
      throw new Error("draft publisherは相異なるsource/projectionの2成果物を要求します");
    }
    const id = this.createId();
    const staged: StagedArtifact[] = [];
    try {
      for (const artifact of artifacts) {
        const targetPath = this.resolveTarget(artifact.path);
        const suffix = `.ut-tdd-draft-${id}`;
        const item: StagedArtifact = {
          logicalPath: artifact.path,
          targetPath,
          temporaryPath: `${targetPath}${suffix}.tmp`,
          rollbackPath: `${targetPath}${suffix}.rollback`,
          existed: existsSync(targetPath),
          backupMoved: false,
          targetPublished: false,
          restored: false,
          finalized: false,
        };
        this.assertAuxiliaryPathsAbsent(item);
        staged.push(item);
        this.injectFault("stage:before-write", artifact.path);
        writeFileSync(item.temporaryPath, artifact.content, { encoding: "utf8", flag: "wx" });
        syncFile(item.temporaryPath);
        if (item.existed) {
          copyFileSync(item.targetPath, item.rollbackPath);
          syncFile(item.rollbackPath);
        }
        syncDirectory(dirname(item.targetPath));
        this.injectFault("stage:after-write", artifact.path);
      }
    } catch (cause) {
      for (const item of staged.reverse()) this.removeStageFiles(item);
      throw cause;
    }
    const token: NodeDraftPublishToken = {
      id,
      artifacts: staged,
      published: false,
      restored: false,
    };
    this.tokens.set(id, token);
    return token;
  }

  publish(portToken: DraftPublishToken): void {
    const token = this.requireToken(portToken);
    if (token.restored) throw new Error(`復旧済みtokenはpublishできません: ${token.id}`);
    if (token.published) return;
    for (const item of token.artifacts) {
      if (item.targetPublished) continue;
      if (item.existed && !item.backupMoved) {
        rmSync(item.rollbackPath, { force: true });
        renameSync(item.targetPath, item.rollbackPath);
        item.backupMoved = true;
        syncDirectory(dirname(item.targetPath));
        this.injectFault("publish:after-backup-rename", item.logicalPath);
      }
      renameSync(item.temporaryPath, item.targetPath);
      item.targetPublished = true;
      syncDirectory(dirname(item.targetPath));
      this.injectFault("publish:after-target-rename", item.logicalPath);
    }
    token.published = true;
  }

  restore(portToken: DraftPublishToken): void {
    const token = this.requireToken(portToken);
    if (token.restored) return;
    for (const item of [...token.artifacts].reverse()) {
      if (item.restored) continue;
      this.injectFault("restore:before-artifact", item.logicalPath);
      if (item.backupMoved) {
        rmSync(item.targetPath, { force: true });
        renameSync(item.rollbackPath, item.targetPath);
      } else if (!item.existed && item.targetPublished) {
        rmSync(item.targetPath, { force: true });
      }
      rmSync(item.temporaryPath, { force: true });
      if (!item.backupMoved) rmSync(item.rollbackPath, { force: true });
      syncDirectory(dirname(item.targetPath));
      item.restored = true;
    }
    token.restored = true;
  }

  finalize(portToken: DraftPublishToken): void {
    if (this.isFinalizedToken(portToken)) return;
    const token = this.requireToken(portToken);
    if (!token.published) throw new Error(`未公開tokenはfinalizeできません: ${token.id}`);
    if (token.restored) throw new Error(`復旧済みtokenはfinalizeできません: ${token.id}`);
    for (const item of token.artifacts) {
      if (item.finalized) continue;
      this.injectFault("finalize:before-artifact", item.logicalPath);
      rmSync(item.temporaryPath, { force: true });
      rmSync(item.rollbackPath, { force: true });
      syncDirectory(dirname(item.targetPath));
      item.finalized = true;
      this.injectFault("finalize:after-artifact", item.logicalPath);
    }
    this.tokens.delete(token.id);
    this.finalizedTokens.add(token);
  }

  private resolveTarget(logicalPath: string): string {
    if (isAbsolute(logicalPath))
      throw new Error(`成果物pathはrepository相対である必要があります: ${logicalPath}`);
    const targetPath = resolve(this.rootDir, logicalPath);
    assertWithin(this.rootDir, targetPath, logicalPath);
    const parent = realpathSync.native(dirname(targetPath));
    assertWithin(this.rootDir, parent, logicalPath);
    if (existsSync(targetPath) && lstatSync(targetPath).isSymbolicLink()) {
      throw new Error(`symlink成果物は拒否されました: ${logicalPath}`);
    }
    return targetPath;
  }

  private assertAuxiliaryPathsAbsent(item: StagedArtifact): void {
    if (existsSync(item.temporaryPath) || existsSync(item.rollbackPath)) {
      throw new Error(`stage補助pathが既に存在します: ${item.logicalPath}`);
    }
  }

  private removeStageFiles(item: StagedArtifact): void {
    rmSync(item.temporaryPath, { force: true });
    rmSync(item.rollbackPath, { force: true });
    syncDirectory(dirname(item.targetPath));
  }

  private requireToken(token: DraftPublishToken): NodeDraftPublishToken {
    const owned = this.tokens.get(token.id);
    if (!owned || owned !== token) throw new Error(`未知または別publisherのtokenです: ${token.id}`);
    return owned;
  }

  private isFinalizedToken(token: DraftPublishToken): boolean {
    return (
      typeof token === "object" &&
      token !== null &&
      this.finalizedTokens.has(token as NodeDraftPublishToken)
    );
  }
}

function assertWithin(root: string, candidate: string, logicalPath: string): void {
  const rel = relative(root, candidate);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return;
  throw new Error(`repository root外の成果物pathは拒否されました: ${logicalPath}`);
}

function syncFile(path: string): void {
  // Windows/Bunはread-only handleへのfsyncをEPERMにするため、durable flush可能な
  // writable handleを明示する。stage/rollback fileはいずれも本adapterが所有する。
  const fd = openSync(path, "r+");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function syncDirectory(path: string): void {
  const fd = openSync(path, "r");
  try {
    fsyncSync(fd);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (process.platform !== "win32" || (code !== "EINVAL" && code !== "EPERM")) throw error;
  } finally {
    closeSync(fd);
  }
}
