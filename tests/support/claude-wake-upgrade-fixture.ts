export interface ClaudeWakeUpgradeFixtureIdentity {
  readonly projectId: string;
  readonly memoryId: string;
  readonly operationId: string;
  readonly producerProvider: "codex";
  readonly consumerProvider: "claude";
  readonly sessionId: string;
  readonly exactHead: string;
  readonly reviewRevision: string;
}

export function fixtureIdentityMatches(
  actual: ClaudeWakeUpgradeFixtureIdentity,
  expected: ClaudeWakeUpgradeFixtureIdentity,
): boolean {
  return (Object.keys(expected) as (keyof ClaudeWakeUpgradeFixtureIdentity)[]).every(
    (key) => actual[key] === expected[key],
  );
}
