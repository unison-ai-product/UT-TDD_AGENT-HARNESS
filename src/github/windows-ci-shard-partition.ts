export interface WindowsShardSelection {
  shard: string;
  files: readonly string[];
}

export interface WindowsShardPartitionResult {
  ok: boolean;
  missing: readonly string[];
  unexpected: readonly string[];
  duplicates: readonly string[];
  invalidShards: readonly string[];
}

// #1063 の Red 用。選択集合の照合が入るまでは証跡を受理しない。
export function admitWindowsShardPartition(
  _expectedFiles: readonly string[],
  _selections: readonly WindowsShardSelection[],
): WindowsShardPartitionResult {
  return { ok: false, missing: [], unexpected: [], duplicates: [], invalidShards: [] };
}
