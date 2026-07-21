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
  | "stage:after-write-before-pin"
  | "stage:after-write"
  | "publish:after-backup-rename"
  | "publish:before-preimage-restore"
  | "publish:after-target-link"
  | "publish:after-target-link-before-pin"
  | "publish:after-target-compensation-remove"
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
  readonly contentCas: "same-volume-generation-hardlink-pin-with-pre-post-name-binding";
}

export const NODE_PATH_MUTATION_SAFETY: NodePathMutationSafety = Object.freeze({
  dirfdRelativeMutation: false,
  strategy: "pre-post-identity-cas-with-verified-compensation",
  detectedDrift: "fail-close",
  syscallInstantRaceClosure: "not-provable-with-node-fs",
  contentCas: "same-volume-generation-hardlink-pin-with-pre-post-name-binding",
});

interface StagedArtifact {
  artifactIndex: number;
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
 * N個の成果物を同一filesystem上のrenameで公開するNode adapter。
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
    if (
      artifacts.length === 0 ||
      new Set(artifacts.map((item) => item.path)).size !== artifacts.length
    ) {
      throw new Error("draft publisherは1個以上の相異なる成果物を要求します");
    }
    const id = this.createId();
    if (!/^[A-Za-z0-9_-]+$/.test(id))
      throw new Error("draft token idが安全なpath componentではありません");
    const staged: StagedArtifact[] = [];
    try {
      for (const [artifactIndex, artifact] of artifacts.entries()) {
        const targetPath = this.resolveTarget(artifact.path);
        const suffix = `.ut-tdd-draft-${id}`;
        const item: StagedArtifact = {
          artifactIndex,
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
        this.injectFault("stage:after-write-before-pin", artifact.path);
        item.temporaryIdentity = FileIdentity.capture({
          path: item.temporaryPath,
          pinPath: this.identityPinPath(id, artifactIndex, "temporary"),
          digest: item.postimageDigest,
          logicalPath: artifact.path,
          role: "temporary",
        });
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
        item.rollbackIdentity = FileIdentity.capture({
          path: item.rollbackPath,
          pinPath: this.identityPinPath(token.id, item.artifactIndex, "rollback"),
          digest: item.expectedPreimage.digest,
          logicalPath: item.logicalPath,
          role: "rollback",
        });
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
      this.injectFault("publish:after-target-link-before-pin", item.logicalPath);
      item.publishedIdentity = FileIdentity.capture({
        path: item.targetPath,
        pinPath: this.identityPinPath(token.id, item.artifactIndex, "published"),
        digest: item.postimageDigest,
        logicalPath: item.logicalPath,
        role: "published target",
      });
      this.injectFault("publish:after-target-link", item.logicalPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      try {
        assertTemporary(item);
        assertPublishedIdentity(item);
        assertPublishedTarget(item);
      } catch (cause) {
        // Nodeはdirfd/linkatを公開しないためassert→syscall間のparent交換を完全には
        // 消せない。操作後に同一file objectと確認できる場合だけcompensateする。
        let compensationFailure: unknown;
        if (safeSameFile(item.targetPath, item.temporaryPath)) {
          let removed = false;
          try {
            rmSync(item.targetPath);
            removed = true;
            this.injectFault("publish:after-target-compensation-remove", item.logicalPath);
            item.parentIdentity.assertCurrent(item.logicalPath);
            if (existsSync(item.targetPath))
              throw new Error(`artifact target compensation race: ${item.logicalPath}`);
            syncDirectory(dirname(item.targetPath));
          } catch (error) {
            compensationFailure = error;
          } finally {
            if (removed) {
              item.targetPublished = false;
              item.publishedIdentity?.release();
            }
          }
        }
        throw new AggregateError(
          compensationFailure === undefined ? [cause] : [cause, compensationFailure],
          `artifact publish postcondition failed: ${item.logicalPath}`,
        );
      }
      rmSync(item.temporaryPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.temporaryPath))
        throw new Error(`artifact temporary removal race: ${item.logicalPath}`);
      item.temporaryIdentity?.release();
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
        item.publishedIdentity?.release();
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
        item.temporaryIdentity?.release();
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
        item.temporaryIdentity?.release();
      }
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (item.backupMoved) {
        assertRollback(item);
        rmSync(item.rollbackPath);
        if (existsSync(item.rollbackPath))
          throw new Error(`artifact rollback removal race: ${item.logicalPath}`);
        item.rollbackIdentity?.release();
        item.backupMoved = false;
      } else if (existsSync(item.rollbackPath)) {
        throw new Error(`unexpected rollback artifact: ${item.logicalPath}`);
      }
      syncDirectory(dirname(item.targetPath));
      item.publishedIdentity?.release();
      item.finalized = true;
      this.injectFault("finalize:after-artifact", item.logicalPath);
    }
    this.tokens.delete(token.id);
    this.finalizedTokens.add(token);
  }

  dispose(portToken: DraftPublishToken): void {
    if (this.isFinalizedToken(portToken)) return;
    const token = this.requireToken(portToken);
    const errors = releaseArtifactIdentities(token.artifacts);
    this.tokens.delete(token.id);
    if (errors.length > 0)
      throw new AggregateError(errors, `token resource release failed: ${token.id}`);
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
      assertRegularDigest({
        path: targetPath,
        digest: artifact.postimage,
        logicalPath: artifact.path,
        role: "postimage",
      });
      if (existsSync(artifact.temporaryPath)) {
        assertRegularDigest({
          path: artifact.temporaryPath,
          digest: artifact.postimage,
          logicalPath: artifact.path,
          role: "temporary",
        });
        rmSync(artifact.temporaryPath);
        parent.assertCurrent(artifact.path);
        if (existsSync(artifact.temporaryPath))
          throw new Error(`artifact temporary removal race: ${artifact.path}`);
      }
      if (existsSync(artifact.rollbackPath)) {
        if (artifact.preimage.kind !== "sha256") {
          throw new Error(`unexpected rollback artifact: ${artifact.path}`);
        }
        assertRegularDigest({
          path: artifact.rollbackPath,
          digest: artifact.preimage.digest,
          logicalPath: artifact.path,
          role: "rollback",
        });
        rmSync(artifact.rollbackPath);
        parent.assertCurrent(artifact.path);
        if (existsSync(artifact.rollbackPath))
          throw new Error(`artifact rollback removal race: ${artifact.path}`);
      }
      syncDirectory(dirname(targetPath));
    }
  }

  /** command-groupの1 memberをprocess再起動後にfinalizeする限定recovery surface。 */
  recoverSingleArtifactPublication(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }): boolean {
    if (!/^[A-Za-z0-9_-]+$/.test(input.tokenId)) throw new Error("invalid authoring token id");
    validatePreimage(input.preimage, input.path);
    validateDigest(input.postimage, "authoring postimage");
    const targetPath = this.resolveTarget(input.path);
    const suffix = `.ut-tdd-draft-${input.tokenId}`;
    const temporaryPath = `${targetPath}${suffix}.tmp`;
    const rollbackPath = `${targetPath}${suffix}.rollback`;
    const temporaryPin = this.identityPinPath(input.tokenId, 0, "temporary");
    const rollbackPin = this.identityPinPath(input.tokenId, 0, "rollback");
    const publishedPin = this.identityPinPath(input.tokenId, 0, "published");
    const auxiliaries = [temporaryPath, rollbackPath, temporaryPin, rollbackPin, publishedPin];
    if (!auxiliaries.some(existsSync)) return false;
    const parent = DirectoryIdentity.capture(dirname(targetPath), input.path);
    parent.assertCurrent(input.path);
    if (existsSync(temporaryPath)) {
      assertRegularDigest({
        path: temporaryPath,
        digest: input.postimage,
        logicalPath: input.path,
        role: "temporary",
      });
      ensureIdentityPin({
        source: temporaryPath,
        pin: temporaryPin,
        digest: input.postimage,
        logicalPath: input.path,
        role: "temporary",
      });
    } else if (existsSync(temporaryPin)) {
      assertRegularDigest({
        path: temporaryPin,
        digest: input.postimage,
        logicalPath: input.path,
        role: "temporary identity pin",
      });
    }
    if (existsSync(rollbackPath)) {
      if (input.preimage.kind !== "sha256")
        throw new Error(`unexpected rollback artifact: ${input.path}`);
      assertRegularDigest({
        path: rollbackPath,
        digest: input.preimage.digest,
        logicalPath: input.path,
        role: "rollback",
      });
      ensureIdentityPin({
        source: rollbackPath,
        pin: rollbackPin,
        digest: input.preimage.digest,
        logicalPath: input.path,
        role: "rollback",
      });
    }
    if (regularDigest(targetPath, input.postimage)) {
      if (existsSync(temporaryPath) && !sameFile(targetPath, temporaryPath))
        throw new Error(`artifact target custody mismatch: ${input.path}`);
      ensureIdentityPin({
        source: targetPath,
        pin: publishedPin,
        digest: input.postimage,
        logicalPath: input.path,
        role: "published",
      });
      return true;
    }
    if (!existsSync(temporaryPath))
      throw new Error(`artifact recovery temporary missing: ${input.path}`);
    if (input.preimage.kind === "sha256") {
      if (existsSync(targetPath)) {
        assertRegularDigest({
          path: targetPath,
          digest: input.preimage.digest,
          logicalPath: input.path,
          role: "preimage",
        });
        if (!existsSync(rollbackPath)) linkSync(targetPath, rollbackPath);
        ensureIdentityPin({
          source: rollbackPath,
          pin: rollbackPin,
          digest: input.preimage.digest,
          logicalPath: input.path,
          role: "rollback",
        });
        rmSync(targetPath);
      } else if (!existsSync(rollbackPath)) {
        throw new Error(`artifact recovery preimage custody missing: ${input.path}`);
      }
    } else if (existsSync(targetPath)) {
      throw new Error(`artifact recovery unexpected target: ${input.path}`);
    }
    linkSync(temporaryPath, targetPath);
    ensureIdentityPin({
      source: targetPath,
      pin: publishedPin,
      digest: input.postimage,
      logicalPath: input.path,
      role: "published",
    });
    syncDirectory(dirname(targetPath));
    return true;
  }

  /** DirectoryIdentity CASを再利用し、単一memberをpreimageへ安全に復元する。 */
  verifySingleArtifactRestoreReadiness(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }): void {
    const paths = this.singleArtifactPaths(input);
    const targetHasPostimage = regularDigest(paths.target, input.postimage);
    const targetHasPreimage =
      input.preimage.kind === "sha256" && regularDigest(paths.target, input.preimage.digest);
    if (input.preimage.kind === "absent") {
      if (existsSync(paths.rollback) || existsSync(paths.rollbackPin))
        throw new Error(`artifact rollback custody unexpected: ${input.path}`);
      if (existsSync(paths.target) && !targetHasPostimage)
        throw new Error(`artifact rollback unexpected target: ${input.path}`);
    } else {
      if (existsSync(paths.rollback))
        assertRegularDigest({
          path: paths.rollback,
          digest: input.preimage.digest,
          logicalPath: input.path,
          role: "rollback",
        });
      if (
        targetHasPostimage &&
        input.preimage.digest !== input.postimage &&
        !existsSync(paths.rollback)
      )
        throw new Error(`artifact rollback custody missing: ${input.path}`);
      if (!targetHasPostimage && !targetHasPreimage && !existsSync(paths.rollback))
        throw new Error(`artifact preimage custody missing: ${input.path}`);
    }
    this.verifyExistingSingleArtifactAuxiliaries(input, paths);
  }

  /** recovery mutation前に単一memberのroll-forward custodyをread-onlyで検証する。 */
  verifySingleArtifactRecoveryReadiness(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }): void {
    const paths = this.singleArtifactPaths(input);
    this.verifyExistingSingleArtifactAuxiliaries(input, paths);
    if (regularDigest(paths.target, input.postimage)) {
      if (existsSync(paths.temporary) && !sameFile(paths.target, paths.temporary))
        throw new Error(`artifact target custody mismatch: ${input.path}`);
      if (existsSync(paths.publishedPin) && !sameFile(paths.target, paths.publishedPin))
        throw new Error(`artifact published custody mismatch: ${input.path}`);
      return;
    }
    if (!existsSync(paths.temporary))
      throw new Error(`artifact recovery temporary missing: ${input.path}`);
    if (input.preimage.kind === "sha256") {
      if (existsSync(paths.target))
        assertRegularDigest({
          path: paths.target,
          digest: input.preimage.digest,
          logicalPath: input.path,
          role: "preimage",
        });
      else if (!existsSync(paths.rollback))
        throw new Error(`artifact recovery preimage custody missing: ${input.path}`);
    } else if (existsSync(paths.target)) {
      throw new Error(`artifact recovery unexpected target: ${input.path}`);
    }
  }

  restoreSingleArtifactPublication(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }): void {
    if (!/^[A-Za-z0-9_-]+$/.test(input.tokenId)) throw new Error("invalid authoring token id");
    validatePreimage(input.preimage, input.path);
    validateDigest(input.postimage, "authoring postimage");
    const targetPath = this.resolveTarget(input.path);
    const suffix = `.ut-tdd-draft-${input.tokenId}`;
    const temporaryPath = `${targetPath}${suffix}.tmp`;
    const rollbackPath = `${targetPath}${suffix}.rollback`;
    const parent = DirectoryIdentity.capture(dirname(targetPath), input.path);
    parent.assertCurrent(input.path);
    const unchangedPreimage =
      input.preimage.kind === "sha256" && input.preimage.digest === input.postimage;
    const targetHasPostimage = regularDigest(targetPath, input.postimage);
    const targetHasPreimage =
      input.preimage.kind === "sha256" && regularDigest(targetPath, input.preimage.digest);
    const rollbackExists = existsSync(rollbackPath);
    if (rollbackExists) {
      if (input.preimage.kind !== "sha256")
        throw new Error(`artifact rollback custody unexpected: ${input.path}`);
      assertRegularDigest({
        path: rollbackPath,
        digest: input.preimage.digest,
        logicalPath: input.path,
        role: "rollback",
      });
    }
    if (
      input.preimage.kind === "sha256" &&
      targetHasPostimage &&
      !unchangedPreimage &&
      !rollbackExists
    )
      throw new Error(`artifact rollback custody missing: ${input.path}`);
    if (
      input.preimage.kind === "sha256" &&
      !targetHasPostimage &&
      !targetHasPreimage &&
      !rollbackExists
    )
      throw new Error(`artifact preimage custody missing: ${input.path}`);
    if (input.preimage.kind === "absent" && existsSync(targetPath) && !targetHasPostimage)
      throw new Error(`artifact rollback unexpected target: ${input.path}`);
    for (const [path, digest, role] of [
      [temporaryPath, input.postimage, "temporary"],
      [
        this.identityPinPath(input.tokenId, 0, "temporary"),
        input.postimage,
        "temporary identity pin",
      ],
      [
        this.identityPinPath(input.tokenId, 0, "published"),
        input.postimage,
        "published identity pin",
      ],
      ...(input.preimage.kind === "sha256"
        ? [
            [
              this.identityPinPath(input.tokenId, 0, "rollback"),
              input.preimage.digest,
              "rollback identity pin",
            ] as const,
          ]
        : []),
    ] as const) {
      if (existsSync(path)) assertRegularDigest({ path, digest, logicalPath: input.path, role });
    }
    const plan = Object.freeze({
      targetHasPostimage,
      targetHasPreimage,
      rollbackExists,
      removePublishedTarget: targetHasPostimage && !unchangedPreimage,
    });
    parent.assertCurrent(input.path);
    if (plan.removePublishedTarget) {
      rmSync(targetPath);
      parent.assertCurrent(input.path);
    }
    if (input.preimage.kind === "sha256") {
      if (plan.rollbackExists) {
        if (regularDigest(targetPath, input.preimage.digest)) {
          // preimage == postimage のmemberはpublish後もtargetが正しいため、
          // 既存targetを上書きせずcustodyだけ検証してrollback auxiliaryを除去する。
          parent.assertCurrent(input.path);
        } else {
          if (existsSync(targetPath))
            throw new Error(`artifact rollback occupied target: ${input.path}`);
          linkSync(rollbackPath, targetPath);
          assertRegularDigest({
            path: targetPath,
            digest: input.preimage.digest,
            logicalPath: input.path,
            role: "restored preimage",
          });
          if (!sameFile(rollbackPath, targetPath))
            throw new Error(`artifact rollback link CAS mismatch: ${input.path}`);
          parent.assertCurrent(input.path);
        }
      } else {
        assertRegularDigest({
          path: targetPath,
          digest: input.preimage.digest,
          logicalPath: input.path,
          role: "preimage",
        });
      }
    } else if (existsSync(targetPath)) {
      throw new Error(`artifact rollback unexpected target: ${input.path}`);
    }
    removeRecoveryArtifact({
      path: temporaryPath,
      expected: input.postimage,
      logicalPath: input.path,
      role: "temporary",
      parent,
    });
    if (existsSync(rollbackPath) && input.preimage.kind === "sha256")
      removeRecoveryArtifact({
        path: rollbackPath,
        expected: input.preimage.digest,
        logicalPath: input.path,
        role: "rollback",
        parent,
      });
    for (const [role, digest] of [
      ["temporary", input.postimage],
      ["published", input.postimage],
      ...(input.preimage.kind === "sha256" ? [["rollback", input.preimage.digest] as const] : []),
    ] as const)
      removeRecoveryArtifact({
        path: this.identityPinPath(input.tokenId, 0, role),
        expected: digest,
        logicalPath: input.path,
        role: `${role} identity pin`,
        parent,
      });
    if (input.preimage.kind === "absent") {
      if (existsSync(targetPath))
        throw new Error(`artifact rollback restore mismatch: ${input.path}`);
    } else {
      assertRegularDigest({
        path: targetPath,
        digest: input.preimage.digest,
        logicalPath: input.path,
        role: "restored preimage",
      });
    }
    if ([temporaryPath, rollbackPath].some(existsSync))
      throw new Error(`artifact rollback auxiliary remains: ${input.path}`);
    syncDirectory(dirname(targetPath));
  }

  /** command-groupの1 memberをprocess再起動後にfinalizeする限定recovery surface。 */
  verifySingleArtifactCustody(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }): void {
    if (!/^[A-Za-z0-9_-]+$/.test(input.tokenId)) throw new Error("invalid authoring token id");
    validatePreimage(input.preimage, input.path);
    validateDigest(input.postimage, "authoring postimage");
    const targetPath = this.resolveTarget(input.path);
    const pin = this.identityPinPath(input.tokenId, 0, "published");
    assertRegularDigest({
      path: targetPath,
      digest: input.postimage,
      logicalPath: input.path,
      role: "postimage",
    });
    assertRegularDigest({
      path: pin,
      digest: input.postimage,
      logicalPath: input.path,
      role: "published identity pin",
    });
    if (!sameFile(targetPath, pin))
      throw new Error(`artifact published custody mismatch: ${input.path}`);
  }

  /** command-groupの1 memberをprocess再起動後にfinalizeする限定recovery surface。 */
  resumeSingleArtifactCleanup(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }): void {
    if (!/^[A-Za-z0-9_-]+$/.test(input.tokenId)) throw new Error("invalid authoring token id");
    validatePreimage(input.preimage, input.path);
    validateDigest(input.postimage, "authoring postimage");
    const targetPath = this.resolveTarget(input.path);
    const suffix = `.ut-tdd-draft-${input.tokenId}`;
    const temporaryPath = `${targetPath}${suffix}.tmp`;
    const rollbackPath = `${targetPath}${suffix}.rollback`;
    const parent = DirectoryIdentity.capture(dirname(targetPath), input.path);
    parent.assertCurrent(input.path);
    assertRegularDigest({
      path: targetPath,
      digest: input.postimage,
      logicalPath: input.path,
      role: "postimage",
    });
    removeRecoveryArtifact({
      path: temporaryPath,
      expected: input.postimage,
      logicalPath: input.path,
      role: "temporary",
      parent,
    });
    if (existsSync(rollbackPath)) {
      if (input.preimage.kind !== "sha256") {
        throw new Error(`unexpected rollback artifact: ${input.path}`);
      }
      removeRecoveryArtifact({
        path: rollbackPath,
        expected: input.preimage.digest,
        logicalPath: input.path,
        role: "rollback",
        parent,
      });
    }
    const identityPins: Array<[string, `sha256:${string}`]> = [
      ["temporary", input.postimage],
      ["published", input.postimage],
    ];
    if (input.preimage.kind === "sha256") identityPins.push(["rollback", input.preimage.digest]);
    for (const [role, expected] of identityPins) {
      removeRecoveryArtifact({
        path: this.identityPinPath(input.tokenId, 0, role),
        expected,
        logicalPath: input.path,
        role: `${role} identity pin`,
        parent,
      });
    }
    syncDirectory(dirname(targetPath));
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

  private singleArtifactPaths(input: {
    readonly tokenId: string;
    readonly path: string;
    readonly preimage: ArtifactPreimage;
    readonly postimage: `sha256:${string}`;
  }) {
    if (!/^[A-Za-z0-9_-]+$/.test(input.tokenId)) throw new Error("invalid authoring token id");
    validatePreimage(input.preimage, input.path);
    validateDigest(input.postimage, "authoring postimage");
    const target = this.resolveTarget(input.path);
    const suffix = `.ut-tdd-draft-${input.tokenId}`;
    return {
      target,
      temporary: `${target}${suffix}.tmp`,
      rollback: `${target}${suffix}.rollback`,
      temporaryPin: this.identityPinPath(input.tokenId, 0, "temporary"),
      rollbackPin: this.identityPinPath(input.tokenId, 0, "rollback"),
      publishedPin: this.identityPinPath(input.tokenId, 0, "published"),
    };
  }

  private verifyExistingSingleArtifactAuxiliaries(
    input: {
      readonly path: string;
      readonly preimage: ArtifactPreimage;
      readonly postimage: `sha256:${string}`;
    },
    paths: ReturnType<NodeAtomicDraftPublisher["singleArtifactPaths"]>,
  ): void {
    const auxiliaries: Array<readonly [string, `sha256:${string}`, string]> = [
      [paths.temporary, input.postimage, "temporary"],
      [paths.temporaryPin, input.postimage, "temporary identity pin"],
      [paths.publishedPin, input.postimage, "published identity pin"],
    ];
    if (input.preimage.kind === "sha256")
      auxiliaries.push(
        [paths.rollback, input.preimage.digest, "rollback"],
        [paths.rollbackPin, input.preimage.digest, "rollback identity pin"],
      );
    for (const [path, digest, role] of auxiliaries) {
      if (existsSync(path)) assertRegularDigest({ path, digest, logicalPath: input.path, role });
    }
  }

  private identityPinPath(tokenId: string, artifactIndex: number, role: string): string {
    return resolve(this.rootDir, `.ut-tdd-draft-${tokenId}-${artifactIndex}-${role}.identity`);
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
      item.temporaryIdentity?.release();
    }
    if (existsSync(item.rollbackPath)) {
      if (!item.backupMoved) throw new Error(`unexpected rollback artifact: ${item.logicalPath}`);
      assertRollback(item);
      rmSync(item.rollbackPath);
      item.parentIdentity.assertCurrent(item.logicalPath);
      if (existsSync(item.rollbackPath))
        throw new Error(`artifact rollback removal race: ${item.logicalPath}`);
      item.rollbackIdentity?.release();
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
      } finally {
        item.temporaryIdentity?.release();
        item.rollbackIdentity?.release();
        item.publishedIdentity?.release();
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
  private readonly path: string;
  private readonly canonicalPath: string;
  private readonly device: bigint;
  private readonly inode: bigint;

  private constructor(input: {
    path: string;
    canonicalPath: string;
    device: bigint;
    inode: bigint;
  }) {
    this.path = input.path;
    this.canonicalPath = input.canonicalPath;
    this.device = input.device;
    this.inode = input.inode;
  }

  static capture(path: string, logicalPath: string): DirectoryIdentity {
    try {
      const canonicalPath = realpathSync.native(path);
      const stat = statSync(canonicalPath, { bigint: true });
      if (!stat.isDirectory()) throw new Error("not directory");
      return new DirectoryIdentity({ path, canonicalPath, device: stat.dev, inode: stat.ino });
    } catch (cause) {
      const error = new Error(`artifact parent unavailable: ${logicalPath}`, { cause });
      throw error;
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
    } catch (cause) {
      const error = new Error(`artifact parent drift: ${logicalPath}`, { cause });
      throw error;
    }
  }
}

/** Path nameではなくstage時のregular-file objectと内容CASを固定する。 */
class FileIdentity {
  private released = false;

  private readonly path: string;
  private readonly pinPath: string;
  private readonly device: bigint;
  private readonly inode: bigint;
  private readonly digest: `sha256:${string}`;

  private constructor(input: {
    path: string;
    pinPath: string;
    device: bigint;
    inode: bigint;
    digest: `sha256:${string}`;
  }) {
    this.path = input.path;
    this.pinPath = input.pinPath;
    this.device = input.device;
    this.inode = input.inode;
    this.digest = input.digest;
  }

  static capture(input: {
    path: string;
    pinPath: string;
    digest: `sha256:${string}`;
    logicalPath: string;
    role: string;
  }): FileIdentity {
    const { path, pinPath, digest, logicalPath, role } = input;
    let pinned = false;
    let sourceIdentity: { device: bigint; inode: bigint } | undefined;
    try {
      const source = lstatSync(path, { bigint: true });
      if (!source.isFile() || source.isSymbolicLink()) throw new Error("identity mismatch");
      sourceIdentity = { device: source.dev, inode: source.ino };
      linkSync(path, pinPath);
      pinned = true;
      const named = lstatSync(path, { bigint: true });
      const pin = lstatSync(pinPath, { bigint: true });
      const actualDigest = sha256File(pinPath);
      const namedAfter = lstatSync(path, { bigint: true });
      const pinAfter = lstatSync(pinPath, { bigint: true });
      if (
        !named.isFile() ||
        !pin.isFile() ||
        named.isSymbolicLink() ||
        pin.isSymbolicLink() ||
        pin.dev !== source.dev ||
        pin.ino !== source.ino ||
        named.dev !== pin.dev ||
        named.ino !== pin.ino ||
        namedAfter.dev !== pin.dev ||
        namedAfter.ino !== pin.ino ||
        pinAfter.dev !== pin.dev ||
        pinAfter.ino !== pin.ino ||
        !digestEqual(actualDigest, digest)
      ) {
        throw new Error("identity mismatch");
      }
      return new FileIdentity({
        path,
        pinPath,
        device: pin.dev,
        inode: pin.ino,
        digest,
      });
    } catch (cause) {
      if (pinned && sourceIdentity && pinMatches(pinPath, sourceIdentity)) rmSync(pinPath);
      throw new Error(`artifact ${role} CAS mismatch: ${logicalPath}`, { cause });
    }
  }

  assertCurrent(logicalPath: string, role: string): void {
    try {
      if (this.released) throw new Error("identity released");
      const named = lstatSync(this.path, { bigint: true });
      const pin = lstatSync(this.pinPath, { bigint: true });
      const actualDigest = sha256File(this.pinPath);
      const namedAfter = lstatSync(this.path, { bigint: true });
      const pinAfter = lstatSync(this.pinPath, { bigint: true });
      if (
        !named.isFile() ||
        !pin.isFile() ||
        named.isSymbolicLink() ||
        pin.isSymbolicLink() ||
        pin.dev !== this.device ||
        pin.ino !== this.inode ||
        named.dev !== pin.dev ||
        named.ino !== pin.ino ||
        namedAfter.dev !== pin.dev ||
        namedAfter.ino !== pin.ino ||
        pinAfter.dev !== pin.dev ||
        pinAfter.ino !== pin.ino ||
        !digestEqual(actualDigest, this.digest)
      ) {
        throw new Error("identity mismatch");
      }
    } catch (cause) {
      const error = new Error(`artifact ${role} CAS mismatch: ${logicalPath}`, { cause });
      throw error;
    }
  }

  release(): void {
    if (this.released) return;
    const pin = lstatSync(this.pinPath, { bigint: true });
    if (
      !pin.isFile() ||
      pin.isSymbolicLink() ||
      pin.dev !== this.device ||
      pin.ino !== this.inode
    ) {
      throw new Error("identity pin mismatch");
    }
    rmSync(this.pinPath);
    if (existsSync(this.pinPath)) throw new Error("identity pin removal race");
    this.released = true;
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

function releaseArtifactIdentities(artifacts: readonly StagedArtifact[]): Error[] {
  const errors: Error[] = [];
  for (const item of artifacts) {
    for (const identity of [
      item.temporaryIdentity,
      item.rollbackIdentity,
      item.publishedIdentity,
    ]) {
      try {
        identity?.release();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  return errors;
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
  item.rollbackIdentity?.release();
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

function assertRegularDigest(input: {
  path: string;
  digest: `sha256:${string}`;
  logicalPath: string;
  role: string;
}): void {
  const { path, digest, logicalPath, role } = input;
  if (!existsSync(path) || !regularFile(path) || !digestEqual(sha256File(path), digest)) {
    throw new Error(`artifact ${role} CAS mismatch: ${logicalPath}`);
  }
}

function removeRecoveryArtifact(input: {
  readonly path: string;
  readonly expected: `sha256:${string}`;
  readonly logicalPath: string;
  readonly role: string;
  readonly parent: DirectoryIdentity;
}): void {
  if (!existsSync(input.path)) return;
  assertRegularDigest({
    path: input.path,
    digest: input.expected,
    logicalPath: input.logicalPath,
    role: input.role,
  });
  rmSync(input.path);
  input.parent.assertCurrent(input.logicalPath);
  if (existsSync(input.path))
    throw new Error(`artifact ${input.role} removal race: ${input.logicalPath}`);
}

function regularDigest(path: string, digest: `sha256:${string}`): boolean {
  return existsSync(path) && regularFile(path) && digestEqual(sha256File(path), digest);
}

function ensureIdentityPin(input: {
  readonly source: string;
  readonly pin: string;
  readonly digest: `sha256:${string}`;
  readonly logicalPath: string;
  readonly role: string;
}): void {
  if (existsSync(input.pin)) {
    assertRegularDigest({
      path: input.pin,
      digest: input.digest,
      logicalPath: input.logicalPath,
      role: `${input.role} identity pin`,
    });
    if (!sameFile(input.source, input.pin))
      throw new Error(`artifact ${input.role} identity pin mismatch: ${input.logicalPath}`);
    return;
  }
  FileIdentity.capture({
    path: input.source,
    pinPath: input.pin,
    digest: input.digest,
    logicalPath: input.logicalPath,
    role: input.role,
  });
}

function safeSameFile(left: string, right: string): boolean {
  try {
    return sameFile(left, right);
  } catch {
    return false;
  }
}

function pinMatches(path: string, identity: { device: bigint; inode: bigint }): boolean {
  try {
    const stat = lstatSync(path, { bigint: true });
    return (
      stat.isFile() &&
      !stat.isSymbolicLink() &&
      stat.dev === identity.device &&
      stat.ino === identity.inode
    );
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
