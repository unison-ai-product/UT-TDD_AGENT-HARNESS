import { describe, expect, it } from "vitest";
import { admitWindowsShardPartition } from "../src/github/windows-ci-shard-partition.ts";

const alpha = "tests/alpha.test.ts";
const beta = "tests/beta.test.ts";
const gamma = "tests/gamma.test.ts";
const skipped = "tests/skipped-file.test.ts";
const expectedFiles = [alpha, beta, gamma, skipped];
const selections = [
  { shard: "1/3", files: [alpha] },
  { shard: "2/3", files: [beta] },
  { shard: "3/3", files: [gamma, skipped] },
];

describe("CANDIDATE-U-CISHARD-009: partition of selected Windows test files", () => {
  it.fails("accepts the exact disjoint selection including a fully skipped file", () => {
    expect(admitWindowsShardPartition(expectedFiles, selections)).toEqual({
      ok: true,
      missing: [],
      unexpected: [],
      duplicates: [],
      invalidShards: [],
    });
  });

  it.fails("reports an extra test when a Windows exclusion is lost", () => {
    const excluded = "tests/doctor.test.ts";
    const observed = [
      { shard: "1/3", files: [alpha, excluded] },
      { shard: "2/3", files: [beta] },
      { shard: "3/3", files: [gamma, skipped] },
    ];

    expect(admitWindowsShardPartition(expectedFiles, observed)).toMatchObject({
      ok: false,
      unexpected: [excluded],
    });
  });

  it.fails("reports every duplicate when shard arguments are lost", () => {
    const unsharded = selections.map(({ shard }) => ({ shard, files: expectedFiles }));
    const result = admitWindowsShardPartition(expectedFiles, unsharded);

    expect(result.ok).toBe(false);
    expect([...result.duplicates].sort()).toEqual([...expectedFiles].sort());
  });

  it.fails("reports a missing test even when every shard selected a file", () => {
    const observed = [
      { shard: "1/3", files: [alpha] },
      { shard: "2/3", files: [beta] },
      { shard: "3/3", files: [gamma] },
    ];

    expect(admitWindowsShardPartition(expectedFiles, observed)).toMatchObject({
      ok: false,
      missing: [skipped],
    });
  });

  it.fails("rejects an invalid shard label even when the file partition is exact", () => {
    const observed = [
      { shard: "1/3", files: [alpha] },
      { shard: "2/3", files: [beta] },
      { shard: "4/3", files: [gamma, skipped] },
    ];
    const result = admitWindowsShardPartition(expectedFiles, observed);

    expect(result.ok).toBe(false);
    expect(result.invalidShards).toContain("4/3");
  });
});
