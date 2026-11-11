import { describe, expect, it } from "vitest";
import { parseSnapshotRunnerArgs } from "../scripts/run-vitest-snapshot.ts";

describe("snapshot runner test path arguments", () => {
  it.fails("rejects a tests/*.test.ts path after the separator", () => {
    const args = ["--", "tests/x.test.ts"];

    expect(parseSnapshotRunnerArgs(args)).toMatchObject({
      kind: "unknown-option",
      token: "tests/x.test.ts",
      message: expect.stringContaining("before --"),
    });
  });

  it.fails("rejects a tests/ path after the separator", () => {
    const args = ["--", "tests/nested/runner-arg.txt"];

    expect(parseSnapshotRunnerArgs(args)).toMatchObject({
      kind: "unknown-option",
      token: "tests/nested/runner-arg.txt",
      message: expect.stringContaining("before --"),
    });
  });

  it.fails("rejects a .test.ts path after the separator", () => {
    const args = ["--", "nested/runner-arg.test.ts"];

    expect(parseSnapshotRunnerArgs(args)).toMatchObject({
      kind: "unknown-option",
      token: "nested/runner-arg.test.ts",
      message: expect.stringContaining("before --"),
    });
  });

  it("accepts a test path before the separator", () => {
    const args = ["tests/runner-arg.test.ts"];

    expect(parseSnapshotRunnerArgs(args)).toEqual({ kind: "run", args });
  });

  it("forwards Vitest options after the separator", () => {
    const args = ["tests/runner-arg.test.ts", "--", "--reporter=dot", "-t", "parser"];

    expect(parseSnapshotRunnerArgs(args)).toEqual({ kind: "run", args });
  });
});
