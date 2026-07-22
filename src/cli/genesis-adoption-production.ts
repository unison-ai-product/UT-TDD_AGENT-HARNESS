import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  type ObservedForwardEscapeIssue,
  renderForwardEscapeIssueBody,
} from "../execution/forward-escape.js";
import { NodeGhForwardEscapeIssuePort } from "../github/node-gh-forward-escape-issue-port.js";
import { loadProjectIdentityFromHead } from "../plan-asset/adapters/project-identity-loader.js";
import {
  type GenesisProjectionDispatchSummary,
  openNodeGenesisProjectionDispatcher,
} from "../plan-asset/application/genesis-projection-dispatcher.js";
import {
  createNodeGenesisAdoptionRunner,
  type GenesisAdoptionManifest,
  type GenesisAdoptionProjectionOutboxPort,
  type GenesisAdoptionRunResult,
  type NodeGenesisAdoptionRunner,
} from "../plan-asset/application/node-genesis-adoption-runner.js";
import type { GenesisAdoptionCommandRunner } from "./plan-adopt-genesis-chain.js";

interface CommandDispatcherResource {
  readonly dispatcher: {
    dispatchCommand(commandId: string): GenesisProjectionDispatchSummary;
  };
  close(): void;
}

export interface GenesisAdoptionProductionDeps {
  readonly createRunner?: (
    repoRoot: string,
    projection: GenesisAdoptionProjectionOutboxPort,
  ) => Pick<NodeGenesisAdoptionRunner, "run">;
  readonly openDispatcher?: (repoRoot: string, repository: string) => CommandDispatcherResource;
  readonly observeIssue?: (input: {
    readonly repository: string;
    readonly issue_number: number;
  }) => ObservedForwardEscapeIssue;
  readonly verifyLocalAuthority?: (repoRoot: string, manifest: GenesisAdoptionManifest) => void;
}

/**
 * production CLI composition。
 *
 * remote resourceはtrusted HEAD/repository/branch検証とlocal atomic adoptionが成功するまで
 * 開かない。当該commandだけをdispatchし、成功・失敗の全経路で2 DB resourceをcloseする。
 */
export function createProductionGenesisAdoptionCommandRunner(
  repoRoot: string,
  deps: GenesisAdoptionProductionDeps = {},
): GenesisAdoptionCommandRunner {
  const createRunner = deps.createRunner ?? createNodeGenesisAdoptionRunner;
  const openDispatcher =
    deps.openDispatcher ??
    ((dispatcherRoot: string, repository: string) =>
      openNodeGenesisProjectionDispatcher({ repoRoot: dispatcherRoot, repository }));
  const issuePort = new NodeGhForwardEscapeIssuePort();
  const observeIssue = deps.observeIssue ?? ((input) => issuePort.observeIssue(input));
  const verifyLocalAuthority = deps.verifyLocalAuthority ?? verifyTrustedLocalAuthority;
  return {
    run(manifest: GenesisAdoptionManifest): GenesisAdoptionRunResult {
      verifyLocalAuthority(repoRoot, manifest);
      verifyActualIssue(
        manifest,
        observeIssue({
          repository: manifest.repository_identity,
          issue_number: manifest.issue.number,
        }),
      );
      const projection: GenesisAdoptionProjectionOutboxPort = {
        dispatch(input) {
          const resource = openDispatcher(repoRoot, manifest.repository_identity);
          try {
            return projectionState(resource.dispatcher.dispatchCommand(input.commandId));
          } finally {
            resource.close();
          }
        },
      };
      return createRunner(repoRoot, projection).run(manifest);
    },
  };
}

function verifyActualIssue(
  manifest: GenesisAdoptionManifest,
  observed: ObservedForwardEscapeIssue,
): void {
  const expectedBody = renderForwardEscapeIssueBody(manifest.issue.contract);
  const expectedDigest = digest(expectedBody);
  if (
    observed.repository !== manifest.repository_identity ||
    observed.issue_number !== manifest.issue.number ||
    observed.url !==
      `https://github.com/${manifest.repository_identity}/issues/${manifest.issue.number}` ||
    observed.body !== expectedBody ||
    observed.body_digest !== expectedDigest ||
    digest(observed.body) !== expectedDigest ||
    manifest.issue.preimage_digest !== expectedDigest
  )
    throw new Error("genesis-adoption-actual-issue-mismatch");
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function projectionState(
  summary: GenesisProjectionDispatchSummary,
): ReturnType<GenesisAdoptionProjectionOutboxPort["dispatch"]> {
  if (summary.projected === 1 && summary.recoveryRequired === 0 && summary.claimRejected === 0)
    return { durable: true, state: "projected" };
  if (summary.recoveryRequired === 1 && summary.projected === 0 && summary.claimRejected === 0)
    return { durable: true, state: "recovery_required" };
  throw new Error("genesis-adoption-projection-command-state-invalid");
}

function verifyTrustedLocalAuthority(repoRoot: string, manifest: GenesisAdoptionManifest): void {
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "utf8",
      windowsHide: true,
    }).trim();
  if (git("rev-parse", "HEAD") !== manifest.source.commit)
    throw new Error("genesis-adoption-head-drift");
  if (git("rev-parse", "--abbrev-ref", "HEAD") !== manifest.issue.branch)
    throw new Error("genesis-adoption-branch-mismatch");
  const identity = loadProjectIdentityFromHead({ repoRoot });
  if (!identity.ok || identity.value.repositoryIdentity !== manifest.repository_identity)
    throw new Error("genesis-adoption-repository-mismatch");
}
