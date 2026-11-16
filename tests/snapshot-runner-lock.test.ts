import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runSnapshotRunnerMain } from "../scripts/run-vitest-snapshot.ts";
import {
  acquireSnapshotLock,
  classifySnapshotLockClaim,
  decideSnapshotLockStep,
  identityProbeDue,
  interpretSnapshotLockRead,
  parseSnapshotLockWaitMs,
  presenceFromKill,
  resolveSnapshotLockMode,
  type SnapshotLockAcquisition,
  type SnapshotLockRecord,
  snapshotLockDir,
  snapshotStageEnv,
} from "../src/runtime/snapshot-runner-lock.ts";
import {
  FakeLockFs,
  LOCK_DIR,
  LOCK_TMP_ROOT,
  lockPath,
  rec,
  stubDecide,
  stubInterpretRead,
} from "./support/snapshot-lock-fake.ts";

const T1 = "2026-11-16T09:00:00.000Z";
const T2 = "2026-11-16T09:00:05.000Z";
const T3 = "2026-11-16T08:59:00.000Z";
const claim = (startToken = "T1"): SnapshotLockRecord => ({
  schema: 1,
  lockId: "L",
  runner: { pid: 100, startToken },
  repoRoot: "/r",
  queuedAt: T1,
  generation: 1,
  acquiredAt: T1,
});
const waiter = (lockId: string, queuedAt: string, state: "live" | "stale" = "live") => ({
  lockId,
  queuedAt,
  state,
});

describe("snapshot runner lock: fixture preconditions", () => {
  it("exposes the contract-shaped module surface and a working fake io", () => {
    for (const fn of [
      resolveSnapshotLockMode,
      parseSnapshotLockWaitMs,
      presenceFromKill,
      snapshotLockDir,
      interpretSnapshotLockRead,
      classifySnapshotLockClaim,
      decideSnapshotLockStep,
      identityProbeDue,
      snapshotStageEnv,
      acquireSnapshotLock,
      runSnapshotRunnerMain,
    ]) {
      expect(typeof fn).toBe("function");
    }
    const fs = new FakeLockFs();
    fs.seedGen(1, rec("A", { gen: 1 }));
    fs.io.writeFile(lockPath("tmp/x.json"), "{}");
    fs.io.link(lockPath("tmp/x.json"), lockPath("gen-2.json"));
    expect(() => fs.io.link(lockPath("tmp/x.json"), lockPath("gen-2.json"))).toThrow("EEXIST");
    expect(fs.io.readdir(lockPath("tmp"))).toEqual(["x.json"]);
    expect(stubInterpretRead({ kind: "error", code: "ENOENT" })).toEqual({ kind: "absent" });
    expect(
      stubDecide({
        self: { lockId: "s", queuedAt: T1 },
        current: null,
        waiters: [],
        waitedMs: 0,
        maxWaitMs: 0,
      }),
    ).toEqual({ action: "attempt", generation: 1 });
    expect(LOCK_DIR).toBe(`${LOCK_TMP_ROOT}/ut-tdd-snapshot-runner-lock`);
  });
});

describe("snapshot runner lock: block A pure functions", () => {
  it.fails("CANDIDATE-U-SNAPLOCK-001: CI=true skips and other values acquire", () => {
    const mode = (CI?: string) =>
      resolveSnapshotLockMode({
        env: CI === undefined ? {} : { CI },
        current: null,
        currentPresence: null,
      });
    expect(mode("true")).toBe("skip_ci");
    expect(mode("false")).toBe("acquire");
    expect(mode("1")).toBe("acquire");
    expect(mode("")).toBe("acquire");
    expect(mode(undefined)).toBe("acquire");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-002: nested needs a matching live unreleased token", () => {
    const current = (released = false) => ({ record: rec("L3", { gen: 3 }), released });
    const mode = (
      token: string | undefined,
      presence: true | false | "unknown",
      released = false,
    ) =>
      resolveSnapshotLockMode({
        env: token === undefined ? {} : { UT_TDD_SNAPSHOT_LOCK_TOKEN: token },
        current: current(released),
        currentPresence: presence,
      });
    expect(mode("L3", true)).toBe("nested");
    expect(mode("L9", true)).toBe("acquire");
    expect(mode("L3", false)).toBe("acquire");
    expect(mode("L3", true, true)).toBe("acquire");
    expect(mode(undefined, true)).toBe("acquire");
    expect(mode("L3", "unknown")).toBe("nested");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-003: wait ms accepts only unset, empty and decimal digits", () => {
    expect(parseSnapshotLockWaitMs(undefined)).toEqual({ ok: true, ms: 0 });
    expect(parseSnapshotLockWaitMs("")).toEqual({ ok: true, ms: 0 });
    expect(parseSnapshotLockWaitMs("0")).toEqual({ ok: true, ms: 0 });
    expect(parseSnapshotLockWaitMs("120000")).toEqual({ ok: true, ms: 120000 });
    for (const bad of ["-1", "1.5", " 5", "5s", "9007199254740992"]) {
      expect(parseSnapshotLockWaitMs(bad).ok).toBe(false);
    }
  });

  it.fails("CANDIDATE-U-SNAPLOCK-004: presence from kill and unknown stays live", () => {
    expect(presenceFromKill(null)).toBe(true);
    expect(presenceFromKill("EPERM")).toBe(true);
    expect(presenceFromKill("ESRCH")).toBe(false);
    expect(presenceFromKill("EINVAL")).toBe("unknown");
    expect(classifySnapshotLockClaim(claim(), "unknown", "not_observed")).toBe("live");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-005: absent process is stale (K1)", () => {
    const same = { pid: 100, startToken: "T1" };
    expect(classifySnapshotLockClaim(claim(), false, "not_observed")).toBe("stale");
    expect(classifySnapshotLockClaim(claim(), false, same)).toBe("stale");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-006: identity observation decides stale only on a proven mismatch (K2-K4)", () => {
    const at = (startToken: string | null) => ({ pid: 100, startToken });
    expect(classifySnapshotLockClaim(claim("T1"), true, at("T2"))).toBe("stale");
    expect(classifySnapshotLockClaim(claim("T1"), true, "query_failed")).toBe("live");
    expect(classifySnapshotLockClaim(claim("T1"), true, null)).toBe("stale");
    expect(classifySnapshotLockClaim(claim("T1"), true, at("T1"))).toBe("live");
    expect(classifySnapshotLockClaim(claim("T1"), true, at(null))).toBe("live");
    expect(classifySnapshotLockClaim(claim("T1"), true, "not_observed")).toBe("live");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-007: read interpretation separates absent, unavailable and ok (R1-R4)", () => {
    const text = (o: unknown) =>
      interpretSnapshotLockRead({ kind: "text", text: JSON.stringify(o) });
    const valid = claim();
    expect(interpretSnapshotLockRead({ kind: "error", code: "ENOENT" })).toEqual({
      kind: "absent",
    });
    expect(interpretSnapshotLockRead({ kind: "error", code: "EACCES" })).toEqual({
      kind: "unavailable",
      reason: "EACCES",
    });
    expect(interpretSnapshotLockRead({ kind: "error", code: "EIO" })).toEqual({
      kind: "unavailable",
      reason: "EIO",
    });
    expect(interpretSnapshotLockRead({ kind: "error", code: null })).toEqual({
      kind: "unavailable",
      reason: "UNKNOWN",
    });
    expect(interpretSnapshotLockRead({ kind: "text", text: "{" })).toEqual({
      kind: "unavailable",
      reason: "malformed",
    });
    const malformed = { kind: "unavailable", reason: "malformed" };
    expect(text({ ...valid, runner: { pid: 100, startToken: null } })).toEqual(malformed);
    expect(text({ ...valid, runner: { pid: 100, startToken: "" } })).toEqual(malformed);
    expect(text({ ...valid, runner: { pid: 0, startToken: "T1" } })).toEqual(malformed);
    expect(text({ ...valid, lockId: undefined })).toEqual(malformed);
    expect(text({ ...valid, schema: 2 })).toEqual(malformed);
    expect(text(valid)).toEqual({ kind: "ok", record: valid });
  });

  it.fails("CANDIDATE-U-SNAPLOCK-008: only the earliest live waiter may attempt", () => {
    const step = (
      current: "free" | "stale" | null,
      w: { lockId: string; queuedAt: string },
      self: { lockId: string; queuedAt: string },
    ) =>
      decideSnapshotLockStep({
        self,
        current: current === null ? null : { generation: 3, state: current },
        waiters: [{ ...w, state: "live" }],
        waitedMs: 0,
        maxWaitMs: 600000,
      }).action;
    expect(step(null, { lockId: "a", queuedAt: T1 }, { lockId: "s", queuedAt: T2 })).toBe("wait");
    expect(step("stale", { lockId: "a", queuedAt: T1 }, { lockId: "s", queuedAt: T2 })).toBe(
      "wait",
    );
    expect(step("free", { lockId: "a", queuedAt: T1 }, { lockId: "b", queuedAt: T1 })).toBe("wait");
    expect(step("free", { lockId: "b", queuedAt: T1 }, { lockId: "a", queuedAt: T1 })).toBe(
      "attempt",
    );
    expect(step("free", { lockId: "a", queuedAt: T2 }, { lockId: "z", queuedAt: T1 })).toBe(
      "attempt",
    );
  });

  it.fails("CANDIDATE-U-SNAPLOCK-009: stale waiters do not count and the next generation is current + 1", () => {
    const base = { self: { lockId: "s", queuedAt: T1 }, waitedMs: 0, maxWaitMs: 600000 };
    const stale = [waiter("S", T3, "stale")];
    expect(decideSnapshotLockStep({ ...base, current: null, waiters: stale }).action).toBe(
      "attempt",
    );
    expect(decideSnapshotLockStep({ ...base, current: null, waiters: [] })).toEqual({
      action: "attempt",
      generation: 1,
    });
    expect(
      decideSnapshotLockStep({ ...base, current: { generation: 7, state: "free" }, waiters: [] }),
    ).toEqual({
      action: "attempt",
      generation: 8,
    });
    expect(
      decideSnapshotLockStep({ ...base, current: { generation: 7, state: "stale" }, waiters: [] }),
    ).toEqual({
      action: "attempt",
      generation: 8,
    });
  });

  it.fails("CANDIDATE-U-SNAPLOCK-010: give up only when the wait limit is reached and nothing is attemptable", () => {
    const step = (state: "free" | "live", waitedMs: number, maxWaitMs: number) =>
      decideSnapshotLockStep({
        self: { lockId: "s", queuedAt: T1 },
        current: { generation: 2, state },
        waiters: [],
        waitedMs,
        maxWaitMs,
      }).action;
    expect(step("live", 59999, 60000)).toBe("wait");
    expect(step("live", 60000, 60000)).toBe("give_up");
    expect(step("live", 0, 0)).toBe("give_up");
    expect(step("free", 70000, 60000)).toBe("attempt");
  });

  it.fails("CANDIDATE-U-SNAPLOCK-011: identity probe is due on first sight and after 300000 ms", () => {
    expect(identityProbeDue(null, 0)).toBe(true);
    expect(identityProbeDue(1000, 300999)).toBe(false);
    expect(identityProbeDue(1000, 301000)).toBe(true);
    expect(identityProbeDue(1000, 1000)).toBe(false);
  });

  it.fails("CANDIDATE-U-SNAPLOCK-012: only an acquired runner adds the token to the stage env", () => {
    const acquired: SnapshotLockAcquisition = {
      kind: "acquired",
      lockId: "L5",
      generation: 5,
      release: () => undefined,
    };
    for (const base of [{ PATH: "p" }, { PATH: "p", UT_TDD_SNAPSHOT_LOCK_TOKEN: "old" }]) {
      expect(snapshotStageEnv(base, acquired)).toEqual({
        PATH: "p",
        UT_TDD_SNAPSHOT_LOCK_TOKEN: "L5",
      });
      expect(snapshotStageEnv(base, { kind: "nested", generation: 2 })).toEqual(base);
      expect(snapshotStageEnv(base, { kind: "skipped_ci" })).toEqual(base);
    }
  });

  it.fails("CANDIDATE-U-SNAPLOCK-013: lock dir is derived from tmpRoot and avoids the vitest root names", () => {
    for (const tmpRoot of ["/t", "C:\\t"]) {
      const dir = snapshotLockDir(tmpRoot);
      expect(dir).toBe(join(tmpRoot, "ut-tdd-snapshot-runner-lock"));
      const name = dir.split(/[\\/]/).pop() ?? "";
      expect(name.startsWith("ut-tdd-vitest-")).toBe(false);
      expect(/^ut-tdd-vitest-(head-|cache-)?\d+-\d+/.test(name)).toBe(false);
    }
  });
});
