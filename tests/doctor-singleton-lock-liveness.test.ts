import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acquireDoctorLock,
  DOCTOR_LOCK_STALE_MS,
  type DoctorLockDeps,
  type DoctorLockRecord,
  defaultDoctorLockDeps,
  defaultDoctorLockIo,
  doctorLockClaimPath,
  doctorLockClaimsPath,
  isStaleDoctorLock,
} from "../src/doctor/singleton-lock.ts";
import { removeTestTree } from "./support/temp-tree.ts";

// #1460: pid 生存 + 同一プロセスなら経過時間にかかわらず回収しない。
// 契約: docs/design/harness/L6-function-design/doctor-singleton-lock.md
// Red は it.fails。Green PR で it に戻す。

const NOW = Date.parse("2026-10-29T12:00:00+09:00");
const OLD = new Date(NOW - DOCTOR_LOCK_STALE_MS - 40 * 60 * 1000).toISOString();
const FRESH = new Date(NOW - 60 * 1000).toISOString();
const HOLDER_START = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();

type LivenessDeps = DoctorLockDeps & {
  processStartTime?: (pid: number) => string | null;
  ownProcessStart?: () => string | null;
};

function deps(overrides: Partial<LivenessDeps> = {}): LivenessDeps {
  return {
    now: () => NOW,
    hostName: () => "host-a",
    isPidAlive: () => true,
    ...overrides,
  };
}

function writeClaim(repoRoot: string, record: DoctorLockRecord & { proc_start?: string }): void {
  defaultDoctorLockIo().mkdirRecursive(doctorLockClaimsPath(repoRoot));
  writeFileSync(
    doctorLockClaimPath(repoRoot, record.lock_id ?? "holder"),
    `${JSON.stringify(record)}\n`,
  );
}

function holderRecord(startedAt: string): DoctorLockRecord & { proc_start: string } {
  return {
    pid: 1111,
    started_at: startedAt,
    host: "host-a",
    lock_id: "holder",
    proc_start: HOLDER_START,
  };
}

describe("doctor singleton lock liveness (#1460)", () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-doctor-lock-live-"));
  });

  afterEach(() => {
    removeTestTree(repoRoot);
  });

  it.fails("U-DOCLOCK-014: a live same-process holder is kept past the TTL and blocks a 2nd doctor", () => {
    const record = holderRecord(OLD);
    writeClaim(repoRoot, record);
    const probed: number[] = [];
    const d = deps({
      processStartTime: (pid) => {
        probed.push(pid);
        return HOLDER_START;
      },
    });
    // 前提: claim が実在し、pid は生存、TTL は実際に超過している。
    expect(existsSync(doctorLockClaimPath(repoRoot, "holder"))).toBe(true);
    expect(d.isPidAlive(record.pid)).toBe(true);
    expect(defaultDoctorLockDeps().isPidAlive(process.pid)).toBe(true);
    expect(NOW - Date.parse(record.started_at)).toBeGreaterThan(DOCTOR_LOCK_STALE_MS);
    // 前提: Green 前でも probe 経路が差し込めること (deps が受け取られる)。
    expect(typeof d.processStartTime).toBe("function");

    expect(isStaleDoctorLock(record, d)).toBe(false);
    const second = acquireDoctorLock(repoRoot, 2222, d);
    expect(second.acquired).toBe(false);
    if (!second.acquired) expect(second.holder.pid).toBe(1111);
    expect(probed.length).toBeGreaterThan(0);
  });

  it.fails("U-DOCLOCK-015: a live pid whose start time differs (pid reuse) is stale even when fresh", () => {
    const record = holderRecord(FRESH);
    writeClaim(repoRoot, record);
    const reusedStart = new Date(Date.parse(HOLDER_START) + 30 * 60 * 1000).toISOString();
    const d = deps({ processStartTime: () => reusedStart });
    expect(existsSync(doctorLockClaimPath(repoRoot, "holder"))).toBe(true);
    expect(d.isPidAlive(record.pid)).toBe(true);
    expect(NOW - Date.parse(record.started_at)).toBeLessThan(DOCTOR_LOCK_STALE_MS);
    expect(Math.abs(Date.parse(reusedStart) - Date.parse(HOLDER_START))).toBeGreaterThan(5000);

    expect(isStaleDoctorLock(record, d)).toBe(true);
  });

  it.fails("U-DOCLOCK-016: acquire records the own process start as proc_start", () => {
    const own = "2026-10-29T08:00:00.000Z";
    const d = deps({ ownProcessStart: () => own });
    expect(typeof d.ownProcessStart).toBe("function");

    const r = acquireDoctorLock(repoRoot, 1111, d);
    expect(r.acquired).toBe(true);
    const dir = doctorLockClaimsPath(repoRoot);
    const names = readdirSync(dir);
    expect(names).toHaveLength(1);
    const claim = JSON.parse(readFileSync(join(dir, names[0] as string), "utf8"));
    expect(claim.pid).toBe(1111);
    expect(claim.proc_start).toBe(own);
  });

  it("U-DOCLOCK-017: without proc_start or a probe result the TTL fallback still reclaims", () => {
    const legacy: DoctorLockRecord = { pid: 1111, started_at: OLD, host: "host-a" };
    expect(isStaleDoctorLock(legacy, deps())).toBe(true);
    const noProbe = holderRecord(OLD);
    expect(isStaleDoctorLock(noProbe, deps({ processStartTime: () => null }))).toBe(true);
    // 前提: fresh な旧 record は回収されない (TTL 判定が効いている)。
    expect(isStaleDoctorLock({ ...legacy, started_at: FRESH }, deps())).toBe(false);
  });

  it("U-DOCLOCK-018: the probe is not called for fresh records or dead pids", () => {
    const calls: number[] = [];
    const d = deps({
      processStartTime: (pid) => {
        calls.push(pid);
        return HOLDER_START;
      },
    });
    expect(isStaleDoctorLock(holderRecord(FRESH), d)).toBe(false);
    expect(isStaleDoctorLock(holderRecord(OLD), deps({ ...d, isPidAlive: () => false }))).toBe(
      true,
    );
    expect(calls).toEqual([]);
  });
});
