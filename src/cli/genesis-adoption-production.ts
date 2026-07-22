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
  const openDispatcher = deps.openDispatcher ?? openNodeGenesisProjectionDispatcher;
  return {
    run(manifest: GenesisAdoptionManifest): GenesisAdoptionRunResult {
      const projection: GenesisAdoptionProjectionOutboxPort = {
        dispatch(input) {
          const resource = openDispatcher(repoRoot, manifest.repository_identity);
          try {
            return projectionState(resource.dispatcher.dispatchCommand(input.commandId), input);
          } finally {
            resource.close();
          }
        },
      };
      return createRunner(repoRoot, projection).run(manifest);
    },
  };
}

function projectionState(
  summary: GenesisProjectionDispatchSummary,
  input: Parameters<GenesisAdoptionProjectionOutboxPort["dispatch"]>[0],
): ReturnType<GenesisAdoptionProjectionOutboxPort["dispatch"]> {
  if (summary.projected === 1 && summary.recoveryRequired === 0)
    return { durable: true, state: "projected" };
  if (summary.recoveryRequired === 1 && summary.projected === 0)
    return { durable: true, state: "recovery_required" };
  if (summary.scanned === 0 && input.localReceipt.replayed)
    return { durable: true, state: "projected" };
  throw new Error("genesis-adoption-projection-command-state-invalid");
}
