import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type {
  ArtifactPreimage,
  DraftArtifact,
  DraftPublisherPort,
  DraftPublishToken,
} from "./plan-draft-service";

export type DraftPublisherFaultPoint =
  | "stage:before-write"
  | "stage:after-write"
  | "publish:after-backup-rename"
  | "publish:before-preimage-restore"
  | "publish:after-target-link"
  | "publish:after-target-rename"
  | "restore:before-artifact"
  | "restore:after-target-remove"
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
  parentIdentity: DirectoryIdentity;
  expectedPreimage: ArtifactPreimage;
  postimageDigest: `sha256:${string}`;
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
          parentIdentity: DirectoryIdentity.capture(dirname(targetPath), artifact.path),
          expectedPreimage:
            artifact.expectedPreimage ?? this.currentPreimage(targetPath, artifact.path),
          postimageDigest: sha256(artifact.content),
          backupMoved: false,
          targetPublished: false,
          restored: false,
          finalized: false,
        };
        validatePreimage(item.expectedPreimage, artifact.path);
        this.assertAuxiliaryPathsAbsent(item);
        staged.push(item);
        this.injectFault("stage:before-write", artifact.path);
        writeFileSync(item.temporaryPath, artifact.content, { encoding: "utf8", flag: "wx" });
        syncFile(item.temporaryPath);
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
      item.parentIdentity.assertCurrent(item.logicalPath);
      this.assertPublishTarget(item);
      if (item.expectedPreimage.kind === "sha256" && !item.backupMoved) {
        renameSync(item.targetPath, item.rollbackPath);
        item.backupMoved = true;
        syncDirectory(dirname(item.targetPath));
        if (
          !regularFile(item.rollbackPath) ||
          !digestEqual(sha256File(item.rollbackPath), item.expectedPreimage.digest)
        ) {
          this.injectFault("publish:before-preimage-restore", item.logicalPath);
          item.parentIdentity.assertCurrent(item.logicalPath);
          restoreRollbackNoClobber(item);
          throw new Error(`artifact preimage mismatch: ${item.logicalPath}`);
        }
        this.injectFault("publish:after-backup-rename", item.logicalPath);
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      linkSync(item.temporaryPath, item.targetPath);
      item.targetPublished = true;
      this.injectFault("publish:after-target-link", item.logicalPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      rmSync(item.temporaryPath);
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
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (item.targetPublished) {
        if (
          !regularFile(item.targetPath) ||
          !digestEqual(sha256File(item.targetPath), item.postimageDigest)
        ) {
          throw new Error(`artifact postimage mismatch: ${item.logicalPath}`);
        }
        rmSync(item.targetPath);
        item.targetPublished = false;
        this.injectFault("restore:after-target-remove", item.logicalPath);
        item.parentIdentity.assertCurrent(item.logicalPath);
      }
      if (item.backupMoved) {
        restoreRollbackNoClobber(item);
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      rmSync(item.temporaryPath, { force: true });
      item.parentIdentity.assertCurrent(item.logicalPath);
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
      item.parentIdentity.assertCurrent(item.logicalPath);
      rmSync(item.temporaryPath, { force: true });
      item.parentIdentity.assertCurrent(item.logicalPath);
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

  private currentPreimage(targetPath: string, logicalPath: string): ArtifactPreimage {
    if (!existsSync(targetPath)) return { kind: "absent" };
    if (!regularFile(targetPath))
      throw new Error(`regular file以外の成果物は拒否されました: ${logicalPath}`);
    return { kind: "sha256", digest: sha256File(targetPath) };
  }

  private assertPublishTarget(item: StagedArtifact): void {
    const current = this.resolveTarget(item.logicalPath);
    if (current !== item.targetPath) throw new Error(`artifact parent drift: ${item.logicalPath}`);
    if (item.expectedPreimage.kind === "absent") {
      if (existsSync(item.targetPath))
        throw new Error(`artifact preimage mismatch: ${item.logicalPath}`);
      return;
    }
    if (!existsSync(item.targetPath) || !regularFile(item.targetPath)) {
      throw new Error(`artifact preimage mismatch: ${item.logicalPath}`);
    }
  }

  private assertAuxiliaryPathsAbsent(item: StagedArtifact): void {
    if (existsSync(item.temporaryPath) || existsSync(item.rollbackPath)) {
      throw new Error(`stage補助pathが既に存在します: ${item.logicalPath}`);
    }
  }

  private removeStageFiles(item: StagedArtifact): void {
    item.parentIdentity.assertCurrent(item.logicalPath);
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

/** Filesystem pathだけでなく、stage時に解決したdirectory objectを固定する。 */
class DirectoryIdentity {
  private constructor(
    private readonly path: string,
    private readonly canonicalPath: string,
    private readonly device: bigint,
    private readonly inode: bigint,
  ) {}

  static capture(path: string, logicalPath: string): DirectoryIdentity {
    try {
      const canonicalPath = realpathSync.native(path);
      const stat = statSync(canonicalPath, { bigint: true });
      if (!stat.isDirectory()) throw new Error("not directory");
      return new DirectoryIdentity(path, canonicalPath, stat.dev, stat.ino);
    } catch {
      throw new Error(`artifact parent unavailable: ${logicalPath}`);
    }
  }

  assertCurrent(logicalPath: string): void {
    try {
      const canonicalPath = realpathSync.native(this.path);
      const stat = statSync(canonicalPath, { bigint: true });
      if (
        canonicalPath !== this.canonicalPath ||
        !stat.isDirectory() ||
        stat.dev !== this.device ||
        stat.ino !== this.inode
      ) {
        throw new Error("identity mismatch");
      }
    } catch {
      throw new Error(`artifact parent drift: ${logicalPath}`);
    }
  }
}

function assertWithin(root: string, candidate: string, logicalPath: string): void {
  const rel = relative(root, candidate);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return;
  throw new Error(`repository root外の成果物pathは拒否されました: ${logicalPath}`);
}

function validatePreimage(preimage: ArtifactPreimage, logicalPath: string): void {
  if (
    preimage.kind !== "absent" &&
    (preimage.kind !== "sha256" || !/^sha256:[a-f0-9]{64}$/.test(preimage.digest))
  ) {
    throw new Error(`artifact preimage invalid: ${logicalPath}`);
  }
}

function regularFile(path: string): boolean {
  const stat = lstatSync(path);
  return stat.isFile() && !stat.isSymbolicLink();
}

function sha256File(path: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

function sha256(content: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function digestEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function restoreRollbackNoClobber(item: StagedArtifact): void {
  item.parentIdentity.assertCurrent(item.logicalPath);
  if (existsSync(item.targetPath)) {
    if (!sameFile(item.targetPath, item.rollbackPath)) {
      throw new Error(`artifact postimage mismatch: ${item.logicalPath}`);
    }
  } else {
    linkSync(item.rollbackPath, item.targetPath);
    syncDirectory(dirname(item.targetPath));
  }
  item.parentIdentity.assertCurrent(item.logicalPath);
  rmSync(item.rollbackPath);
  item.backupMoved = false;
  syncDirectory(dirname(item.targetPath));
}

function sameFile(left: string, right: string): boolean {
  const a = lstatSync(left, { bigint: true });
  const b = lstatSync(right, { bigint: true });
  return a.dev === b.dev && a.ino === b.ino;
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
