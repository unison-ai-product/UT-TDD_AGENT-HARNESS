// Issue #1063: Windows leg の vitest 3 shard 契約 (function-spec.md「Windows leg の vitest 3 shard 契約」決定 2)。
export const WINDOWS_SHARD_TEST_COMMAND = [
  "npm run test:windows -- --shard=$",
  "{{ matrix.shard }}",
].join("");

const WINDOWS_SHARD_STRATEGY = JSON.stringify({
  "fail-fast": false,
  matrix: { shard: ["1/3", "2/3", "3/3"] },
});

/** runtime leg の job キー集合と strategy の違反。strategy は harness-check-windows だけが持つ。 */
export function runtimeLegShapeProblems(name: string, leg: object): string[] {
  const sharded = name === "harness-check-windows";
  const expected = sharded ? ["runs-on", "steps", "strategy"] : ["runs-on", "steps"];
  const actual = Object.keys(leg).sort();
  const problems: string[] = [];
  if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i]))
    problems.push(
      `jobs.${name} must contain only ${sharded ? "runs-on, strategy and steps" : "runs-on and steps"}`,
    );
  if (
    sharded &&
    JSON.stringify((leg as { strategy?: unknown }).strategy) !== WINDOWS_SHARD_STRATEGY
  )
    problems.push(
      `jobs.${name}.strategy must be fail-fast false with matrix.shard exactly 1/3, 2/3, 3/3`,
    );
  return problems;
}
