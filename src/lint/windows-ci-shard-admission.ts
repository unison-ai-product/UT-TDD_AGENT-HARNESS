export interface WindowsShardAggregateInput {
  expected: {
    run_id: string;
    run_attempt: number;
    head_sha: string;
  };
  changedPaths: readonly string[] | null;
  laneEvidence: readonly unknown[];
  shardEvidence: readonly unknown[];
}

type WindowsShardAggregateRejection =
  | "malformed_evidence"
  | "attempt_binding_mismatch"
  | "lane_evidence_mismatch"
  | "windows_shard_set_mismatch"
  | "invalid_windows_shard_outcome";

export type WindowsShardAggregateResult =
  | { ok: true; lane: "full" | "doc" }
  | { ok: false; reason: WindowsShardAggregateRejection; affected: readonly string[] };

// #1063 の Red 用。契約を判定する Green が入るまでは証跡を拒否する。
export function admitWindowsShardAggregate(
  _input: WindowsShardAggregateInput,
): WindowsShardAggregateResult {
  return { ok: false, reason: "malformed_evidence", affected: [] };
}
