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
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type {
  ArtifactPreimage,
  DraftArtifact,
  DraftCleanupArtifact,
  DraftCleanupOperation,
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

/**
 * Node fsにはdirfd相対のlinkat/renameat/unlinkatがない。そのためpath mutationは
 * 前後identity CASと、安全な同一file objectを証明できる場合のcompensationで閉じる。
 * 検出したdriftは必ずfail-closeするが、未検出のsyscall瞬間raceをatomicとは称さない。
 */
export interface NodePathMutationSafety {
  readonly dirfdRelativeMutation: false;
  readonly strategy: "pre-post-identity-cas-with-verified-compensation";
  readonly detectedDrift: "fail-close";
  readonly syscallInstantRaceClosure: "not-provable-with-node-fs";
}

export const NODE_PATH_MUTATION_SAFETY: NodePathMutationSafety = Object.freeze({
  dirfdRelativeMutation: false,
  strategy: "pre-post-identity-cas-with-verified-compensation",
  detectedDrift: "fail-close",
  syscallInstantRaceClosure: "not-provable-with-node-fs",
});

interface StagedArtifact {
  logicalPath: string;
  targetPath: string;
  temporaryPath: string;
  rollbackPath: string;
  parentIdentity: DirectoryIdentity;
  expectedPreimage: ArtifactPreimage;
  postimageDigest: `sha256:${string}`;
  temporaryIdentity?: FileIdentity;
  rollbackIdentity?: FileIdentity;
  publishedIdentity?: FileIdentity;
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
    if (!/^[A-Za-z0-9_-]+$/.test(id))
      throw new Error("draft token idが安全なpath componentではありません");
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
        item.temporaryIdentity = FileIdentity.capture(
          item.temporaryPath,
          item.postimageDigest,
          artifact.path,
          "temporary",
        );
        syncDirectory(dirname(item.targetPath));
        this.injectFault("stage:after-write", artifact.path);
      }
    } catch (cause) {
      const cleanupErrors = this.removeAllStageFiles(staged);
      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [cause, ...cleanupErrors],
          "stage失敗後の全artifact cleanupに失敗しました",
        );
      }
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
      assertTemporary(item);
      this.assertPublishTarget(item);
      if (item.expectedPreimage.kind === "sha256" && !item.backupMoved) {
        // rename(target, rollback) はPOSIXでrollbackを上書きできる。hard-linkの
        // EEXIST fail-closeを利用して、補助pathもCAS/no-clobberにする。
        linkSync(item.targetPath, item.rollbackPath);
        item.backupMoved = true;
        item.rollbackIdentity = FileIdentity.capture(
          item.rollbackPath,
          item.expectedPreimage.digest,
          item.logicalPath,
          "rollback",
        );
        item.parentIdentity.assertCurrent(item.logicalPath);
        if (!sameFile(item.targetPath, item.rollbackPath)) {
          throw new Error(`artifact rollback identity mismatch: ${item.logicalPath}`);
        }
        rmSync(item.targetPath);
        if (existsSync(item.targetPath))
          throw new Error(`artifact target removal race: ${item.logicalPath}`);
        syncDirectory(dirname(item.targetPath));
        try {
          item.parentIdentity.assertCurrent(item.logicalPath);
          item.rollbackIdentity.assertCurrent(item.logicalPath, "rollback");
        } catch {
          this.injectFault("publish:before-preimage-restore", item.logicalPath);
          restoreRollbackNoClobber(item);
          throw new Error(`artifact preimage mismatch: ${item.logicalPath}`);
        }
        this.injectFault("publish:after-backup-rename", item.logicalPath);
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      linkSync(item.temporaryPath, item.targetPath);
      item.targetPublished = true;
      item.publishedIdentity = FileIdentity.capture(
        item.targetPath,
        item.postimageDigest,
        item.logicalPath,
        "published target",
      );
      this.injectFault("publish:after-target-link", item.logicalPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      try {
        assertTemporary(item);
        assertPublishedIdentity(item);
        assertPublishedTarget(item);
      } catch (cause) {
        // Nodeはdirfd/linkatを公開しないためassert→syscall間のparent交換を完全には
        // 消せない。操作後に同一file objectと確認できる場合だけcompensateする。
        if (safeSameFile(item.targetPath, item.temporaryPath)) {
          rmSync(item.targetPath);
          item.parentIdentity.assertCurrent(item.logicalPath);
          if (existsSync(item.targetPath))
            throw new Error(`artifact target compensation race: ${item.logicalPath}`);
          item.targetPublished = false;
          syncDirectory(dirname(item.targetPath));
        }
        throw new AggregateError(
          [cause],
          `artifact publish postcondition failed: ${item.logicalPath}`,
        );
      }
      rmSync(item.temporaryPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.temporaryPath))
        throw new Error(`artifact temporary removal race: ${item.logicalPath}`);
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
        assertPublishedIdentity(item);
        if (
          !regularFile(item.targetPath) ||
          !digestEqual(sha256File(item.targetPath), item.postimageDigest)
        ) {
          throw new Error(`artifact postimage mismatch: ${item.logicalPath}`);
        }
        rmSync(item.targetPath);
        if (existsSync(item.targetPath))
          throw new Error(`artifact target removal race: ${item.logicalPath}`);
        item.targetPublished = false;
        this.injectFault("restore:after-target-remove", item.logicalPath);
        item.parentIdentity.assertCurrent(item.logicalPath);
      }
      if (item.backupMoved) {
        restoreRollbackNoClobber(item);
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.temporaryPath)) {
        assertTemporary(item);
        rmSync(item.temporaryPath);
        if (existsSync(item.temporaryPath))
          throw new Error(`artifact temporary removal race: ${item.logicalPath}`);
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.rollbackPath)) {
        throw new Error(`unexpected rollback artifact: ${item.logicalPath}`);
      }
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
      assertPublishedTarget(item);
      assertPublishedIdentity(item);
      if (existsSync(item.temporaryPath)) {
        assertTemporary(item);
        rmSync(item.temporaryPath);
        if (existsSync(item.temporaryPath))
          throw new Error(`artifact temporary removal race: ${item.logicalPath}`);
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (item.backupMoved) {
        assertRollback(item);
        rmSync(item.rollbackPath);
        if (existsSync(item.rollbackPath))
          throw new Error(`artifact rollback removal race: ${item.logicalPath}`);
        item.backupMoved = false;
      } else if (existsSync(item.rollbackPath)) {
        throw new Error(`unexpected rollback artifact: ${item.logicalPath}`);
      }
      syncDirectory(dirname(item.targetPath));
      item.finalized = true;
      this.injectFault("finalize:after-artifact", item.logicalPath);
    }
    this.tokens.delete(token.id);
    this.finalizedTokens.add(token);
  }

  describeCleanup(
    portToken: DraftPublishToken,
    requestDigest: `sha256:${string}`,
  ): DraftCleanupOperation {
    const token = this.requireToken(portToken);
    validateDigest(requestDigest, "cleanup request");
    if (!token.published || token.restored) {
      throw new Error(`cleanup capabilityは公開済みtokenだけ記述できます: ${token.id}`);
    }
    const artifacts = token.artifacts.map(
      (item): DraftCleanupArtifact => ({
        path: item.logicalPath,
        temporaryPath: item.temporaryPath,
        rollbackPath: item.rollbackPath,
        preimage: item.expectedPreimage,
        postimage: item.postimageDigest,
      }),
    );
    if (artifacts.length !== 2) throw new Error("cleanup capabilityは2成果物を要求します");
    const [source, projection] = artifacts;
    if (!source || !projection) throw new Error("cleanup capabilityは2成果物を要求します");
    return {
      operation: "finalize",
      tokenId: token.id,
      requestDigest,
      artifacts: [source, projection],
    };
  }

  resumeCleanup(operation: DraftCleanupOperation): void {
    if (
      operation.operation !== "finalize" ||
      !/^[A-Za-z0-9_-]+$/.test(operation.tokenId) ||
      !validDigest(operation.requestDigest) ||
      operation.artifacts.length !== 2 ||
      new Set(operation.artifacts.map((artifact) => artifact.path)).size !== 2
    ) {
      throw new Error("invalid durable cleanup capability");
    }
    for (const artifact of operation.artifacts) {
      validatePreimage(artifact.preimage, artifact.path);
      const targetPath = this.resolveTarget(artifact.path);
      const expectedSuffix = `.ut-tdd-draft-${operation.tokenId}`;
      if (
        artifact.temporaryPath !== `${targetPath}${expectedSuffix}.tmp` ||
        artifact.rollbackPath !== `${targetPath}${expectedSuffix}.rollback`
      ) {
        throw new Error(`cleanup補助pathがtoken/rootと一致しません: ${artifact.path}`);
      }
      const parent = DirectoryIdentity.capture(dirname(targetPath), artifact.path);
      parent.assertCurrent(artifact.path);
      assertRegularDigest(targetPath, artifact.postimage, artifact.path, "postimage");
      if (existsSync(artifact.temporaryPath)) {
        assertRegularDigest(artifact.temporaryPath, artifact.postimage, artifact.path, "temporary");
        rmSync(artifact.temporaryPath);
        parent.assertCurrent(artifact.path);
        if (existsSync(artifact.temporaryPath))
          throw new Error(`artifact temporary removal race: ${artifact.path}`);
      }
      if (existsSync(artifact.rollbackPath)) {
        if (artifact.preimage.kind !== "sha256") {
          throw new Error(`unexpected rollback artifact: ${artifact.path}`);
        }
        assertRegularDigest(
          artifact.rollbackPath,
          artifact.preimage.digest,
          artifact.path,
          "rollback",
        );
        rmSync(artifact.rollbackPath);
        parent.assertCurrent(artifact.path);
        if (existsSync(artifact.rollbackPath))
          throw new Error(`artifact rollback removal race: ${artifact.path}`);
      }
      syncDirectory(dirname(targetPath));
    }
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
    if (!digestEqual(sha256File(item.targetPath), item.expectedPreimage.digest)) {
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
    if (existsSync(item.temporaryPath)) {
      assertTemporary(item);
      rmSync(item.temporaryPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.temporaryPath))
        throw new Error(`artifact temporary removal race: ${item.logicalPath}`);
    }
    if (existsSync(item.rollbackPath)) {
      if (!item.backupMoved) throw new Error(`unexpected rollback artifact: ${item.logicalPath}`);
      assertRollback(item);
      rmSync(item.rollbackPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.rollbackPath))
        throw new Error(`artifact rollback removal race: ${item.logicalPath}`);
    }
    syncDirectory(dirname(item.targetPath));
  }

  private removeAllStageFiles(staged: readonly StagedArtifact[]): Error[] {
    const errors: Error[] = [];
    for (const item of [...staged].reverse()) {
      try {
        this.removeStageFiles(item);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
    return errors;
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

/** Path nameではなくstage時のregular-file objectと内容CASを固定する。 */
class FileIdentity {
  private constructor(
    private readonly path: string,
    private readonly device: bigint,
    private readonly inode: bigint,
    private readonly digest: `sha256:${string}`,
  ) {}

  static capture(
    path: string,
    digest: `sha256:${string}`,
    logicalPath: string,
    role: string,
  ): FileIdentity {
    if (!regularFile(path) || !digestEqual(sha256File(path), digest)) {
      throw new Error(`artifact ${role} CAS mismatch: ${logicalPath}`);
    }
    const stat = lstatSync(path, { bigint: true });
    return new FileIdentity(path, stat.dev, stat.ino, digest);
  }

  assertCurrent(logicalPath: string, role: string): void {
    try {
      const stat = lstatSync(this.path, { bigint: true });
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        stat.dev !== this.device ||
        stat.ino !== this.inode ||
        !digestEqual(sha256File(this.path), this.digest)
      ) {
        throw new Error("identity mismatch");
      }
    } catch {
      throw new Error(`artifact ${role} CAS mismatch: ${logicalPath}`);
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

function validDigest(digest: string): digest is `sha256:${string}` {
  return /^sha256:[a-f0-9]{64}$/.test(digest);
}

function validateDigest(digest: string, role: string): void {
  if (!validDigest(digest)) throw new Error(`${role} digest invalid`);
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
  assertRollback(item);
  if (existsSync(item.targetPath)) {
    if (!sameFile(item.targetPath, item.rollbackPath)) {
      throw new Error(`artifact postimage mismatch: ${item.logicalPath}`);
    }
  } else {
    linkSync(item.rollbackPath, item.targetPath);
    syncDirectory(dirname(item.targetPath));
  }
  item.parentIdentity.assertCurrent(item.logicalPath);
  assertRollback(item);
  rmSync(item.rollbackPath);
  if (existsSync(item.rollbackPath))
    throw new Error(`artifact rollback removal race: ${item.logicalPath}`);
  item.backupMoved = false;
  syncDirectory(dirname(item.targetPath));
}

function assertRollback(item: StagedArtifact): void {
  if (!item.rollbackIdentity) {
    throw new Error(`artifact rollback identity unavailable: ${item.logicalPath}`);
  }
  item.rollbackIdentity.assertCurrent(item.logicalPath, "rollback");
  if (item.expectedPreimage.kind !== "sha256") {
    throw new Error(`unexpected rollback artifact: ${item.logicalPath}`);
  }
}

function assertTemporary(item: StagedArtifact): void {
  if (!item.temporaryIdentity) {
    throw new Error(`artifact temporary identity unavailable: ${item.logicalPath}`);
  }
  item.temporaryIdentity.assertCurrent(item.logicalPath, "temporary");
}

function assertPublishedTarget(item: StagedArtifact): void {
  if (
    !regularFile(item.targetPath) ||
    !digestEqual(sha256File(item.targetPath), item.postimageDigest)
  ) {
    throw new Error(`artifact postimage mismatch: ${item.logicalPath}`);
  }
}

function assertPublishedIdentity(item: StagedArtifact): void {
  if (!item.publishedIdentity) {
    throw new Error(`artifact published target identity unavailable: ${item.logicalPath}`);
  }
  item.publishedIdentity.assertCurrent(item.logicalPath, "published target");
}

function assertRegularDigest(
  path: string,
  digest: `sha256:${string}`,
  logicalPath: string,
  role: string,
): void {
  if (!existsSync(path) || !regularFile(path) || !digestEqual(sha256File(path), digest)) {
    throw new Error(`artifact ${role} CAS mismatch: ${logicalPath}`);
  }
}

function safeSameFile(left: string, right: string): boolean {
  try {
    return sameFile(left, right);
  } catch {
    return false;
  }
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
