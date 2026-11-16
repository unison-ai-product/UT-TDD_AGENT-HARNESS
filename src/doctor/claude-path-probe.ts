export type PathClaudeProbe = { kind: "not_found" } | { kind: "found"; version: string | null };

// 契約形の stub (L7 claude-version-floor §4、design-protection-diff-gate §10.3 手順 1')。何も実行しない。
export function probePathClaude(
  _env: NodeJS.ProcessEnv = process.env,
  _platform: NodeJS.Platform = process.platform,
): PathClaudeProbe {
  return { kind: "found", version: null };
}
