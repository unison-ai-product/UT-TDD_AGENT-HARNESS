import type {
  EpisodeViolation,
  ExecutionEpisodeState,
  ExecutionEpisodeSnapshot,
  ExecutionTransitionCommand,
  RequestForwardEscape,
} from "../domain/execution-episode.js";

export interface EpisodeWriteCustody {
  readonly runtime: string;
  readonly model: string;
}

export type EpisodeRepositoryResult =
  | {
      readonly ok: true;
      readonly status: "created" | "replayed";
      readonly eventIds: readonly string[];
      readonly outboxIds: readonly string[];
      readonly snapshot: ExecutionEpisodeSnapshot | EpisodeTransitionSnapshot;
    }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] };

export interface EpisodeRepositoryPort {
  request(command: RequestForwardEscape, custody: EpisodeWriteCustody): EpisodeRepositoryResult;
  transition(
    command: ExecutionTransitionCommand,
    custody: EpisodeWriteCustody,
  ): EpisodeRepositoryResult;
  rebuildProjections(): number;
}

export interface EpisodeTransitionSnapshot {
  readonly episodeId: string;
  readonly state: ExecutionEpisodeState;
  readonly eventSequence: number;
  readonly lastEventDigest: string;
  readonly nextLegalCommands: readonly string[];
}
