import type {
  EpisodeViolation,
  ExecutionEpisodeSnapshot,
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
      readonly snapshot: ExecutionEpisodeSnapshot;
    }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] };

export interface EpisodeRepositoryPort {
  request(command: RequestForwardEscape, custody: EpisodeWriteCustody): EpisodeRepositoryResult;
}
