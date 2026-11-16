import { describe, expect, it } from "vitest";
import {
  runSnapshotRunnerMain,
  type SnapshotRunnerMainDeps,
} from "../scripts/run-vitest-snapshot.ts";
import type { SnapshotLockAcquisition } from "../src/runtime/snapshot-runner-lock.ts";
import { rec } from "./support/snapshot-lock-fake.ts";

describe("snapshot runner lock: block C entrypoint", () => {
  const acquiredAcq = (log: string[]): SnapshotLockAcquisition => ({
    kind: "acquired",
    lockId: "L1",
    generation: 1,
    release: () => {
      log.push("handle.release");
    },
  });
  const makeDeps = (over: Partial<SnapshotRunnerMainDeps> = {}) => {
    const log: string[] = [];
    const err: string[] = [];
    const marker = { MARK: "stage-env" } as NodeJS.ProcessEnv;
    const runArgs: unknown[][] = [];
    const deps: SnapshotRunnerMainDeps = {
      acquire: () => {
        log.push("acquire");
        return acquiredAcq(log);
      },
      release: () => {
        log.push("release");
      },
      run: (...args) => {
        log.push("run");
        runArgs.push(args);
      },
      parseWaitMs: () => {
        log.push("parseWaitMs");
        return { ok: true, ms: 0 };
      },
      stageEnv: () => {
        log.push("stageEnv");
        return marker;
      },
      getuid: () => 1000,
      write: (line) => {
        err.push(line);
      },
      ...over,
    };
    return { deps, log, err, marker, runArgs };
  };
  const call = (argv: string[], deps: SnapshotRunnerMainDeps): number | "threw" => {
    try {
      return runSnapshotRunnerMain(argv, {}, deps);
    } catch {
      return "threw";
    }
  };

  it.fails("CANDIDATE-U-SNAPLOCK-026: nothing is acquired before argv, root and wait value checks", () => {
    for (const argv of [["--help"], ["--not-an-option"], ["--watch"]]) {
      const h = makeDeps();
      call(argv, h.deps);
      expect(h.log).not.toContain("acquire");
    }
    const root = makeDeps({ getuid: () => 0 });
    call(["tests/x.test.ts"], root.deps);
    expect(root.log).not.toContain("acquire");

    const badWait = makeDeps({
      parseWaitMs: () => {
        badWait.log.push("parseWaitMs");
        return { ok: false, message: "bad" };
      },
    });
    expect(call(["tests/x.test.ts"], badWait.deps)).toBe(1);
    expect(badWait.log.filter((s) => s === "parseWaitMs")).toHaveLength(1);
    expect(badWait.log).not.toContain("acquire");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-027: acquire, stage env, run, release in order, release even when run throws", () => {
    const ok = makeDeps();
    call(["tests/x.test.ts"], ok.deps);
    expect(ok.log.filter((s) => s !== "parseWaitMs")).toEqual([
      "acquire",
      "stageEnv",
      "run",
      "release",
    ]);
    expect(ok.runArgs).toHaveLength(1);
    expect(ok.runArgs[0]?.[2]).toBe(ok.marker);

    const boom = new Error("boom");
    const bad = makeDeps({
      run: () => {
        bad.log.push("run");
        throw boom;
      },
    });
    let thrown: unknown;
    try {
      runSnapshotRunnerMain(["tests/x.test.ts"], {}, bad.deps);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBe(boom);
    expect(bad.log.filter((s) => s !== "parseWaitMs")).toEqual([
      "acquire",
      "stageEnv",
      "run",
      "release",
    ]);
  });

  const afterAcquire = (log: string[]): string[] =>
    log.includes("acquire")
      ? log.slice(log.indexOf("acquire") + 1).filter((x) => x !== "parseWaitMs")
      : ["acquire-not-called"];

  it.fails("CANDIDATE-U-SNAPLOCK-028: busy exits 2 and unavailable exits 3 without running", () => {
    const busy = makeDeps({
      acquire: () => {
        busy.log.push("acquire");
        return {
          kind: "busy",
          holder: rec("H", { pid: 4242, gen: 3 }),
          waitedMs: 0,
          lockDir: "D",
        };
      },
    });
    expect(call(["tests/x.test.ts"], busy.deps)).toBe(2);
    expect(afterAcquire(busy.log)).toEqual([]);
    expect(busy.err.join("\n")).toContain("holder_pid=4242");
    expect(busy.err.join("\n")).toContain("lock=D");

    const unavailable = makeDeps({
      acquire: () => {
        unavailable.log.push("acquire");
        return { kind: "unavailable", reason: "EPERM", lockDir: "D" };
      },
    });
    expect(call(["tests/x.test.ts"], unavailable.deps)).toBe(3);
    expect(afterAcquire(unavailable.log)).toEqual([]);
    expect(unavailable.err.join("\n")).toContain("reason=EPERM");
    expect(unavailable.err.join("\n")).toContain("lock=D");
  });
});
