import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acquireDoctorLock,
  DOCTOR_LOCK_STALE_MS,
  type DoctorLockDeps,
  defaultDoctorLockIo,
  doctorLockBlockedMessage,
  doctorLockPath,
  isStaleDoctorLock,
} from "../src/doctor/singleton-lock";

const NOW = Date.parse("2026-07-16T12:00:00+09:00");

function deps(overrides: Partial<DoctorLockDeps> = {}): DoctorLockDeps {
  return { now: () => NOW, isPidAlive: () => true, ...overrides };
}

describe("doctor singleton lock (PLAN-L7-442)", () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-doctor-lock-"));
  });

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it("U-DOCLOCK-001: first acquisition wins and writes pid/started_at record", () => {
    const r = acquireDoctorLock(repoRoot, 1111, deps());
    expect(r.acquired).toBe(true);
    const record = JSON.parse(readFileSync(doctorLockPath(repoRoot), "utf8"));
    expect(record.pid).toBe(1111);
    expect(record.started_at).toBe(new Date(NOW).toISOString());
  });

  it("U-DOCLOCK-002: second acquisition fail-fasts while the holder is alive and fresh", () => {
    acquireDoctorLock(repoRoot, 1111, deps());
    const r = acquireDoctorLock(repoRoot, 2222, deps({ isPidAlive: (pid) => pid === 1111 }));
    expect(r.acquired).toBe(false);
    if (!r.acquired) {
      expect(r.holder.pid).toBe(1111);
      expect(doctorLockBlockedMessage(r.holder)).toContain("pid=1111");
      expect(doctorLockBlockedMessage(r.holder)).toContain("PLAN-L7-442");
    }
  });

  it("U-DOCLOCK-003: a lock whose holder pid is dead is reclaimed (retry-storm residue)", () => {
    acquireDoctorLock(repoRoot, 1111, deps());
    const r = acquireDoctorLock(repoRoot, 2222, deps({ isPidAlive: () => false }));
    expect(r.acquired).toBe(true);
    const record = JSON.parse(readFileSync(doctorLockPath(repoRoot), "utf8"));
    expect(record.pid).toBe(2222);
  });

  it("U-DOCLOCK-004: a lock older than the stale window is reclaimed even if the pid is alive", () => {
    const stale = {
      pid: 1111,
      started_at: new Date(NOW - DOCTOR_LOCK_STALE_MS - 1000).toISOString(),
      host: "h",
    };
    expect(isStaleDoctorLock(stale, deps())).toBe(true);
    acquireDoctorLock(repoRoot, 1111, deps({ now: () => NOW - DOCTOR_LOCK_STALE_MS - 1000 }));
    const r = acquireDoctorLock(repoRoot, 2222, deps());
    expect(r.acquired).toBe(true);
  });

  it("U-DOCLOCK-005: a corrupt lock file is treated as stale and reclaimed, not a crash", () => {
    acquireDoctorLock(repoRoot, 1111, deps());
    writeFileSync(doctorLockPath(repoRoot), "not-json{{{");
    const r = acquireDoctorLock(repoRoot, 2222, deps());
    expect(r.acquired).toBe(true);
  });

  it("U-DOCLOCK-006: release removes only an owned lock and is idempotent", () => {
    const first = acquireDoctorLock(repoRoot, 1111, deps());
    expect(first.acquired).toBe(true);
    if (first.acquired) {
      first.release();
      first.release();
    }
    expect(() => readFileSync(doctorLockPath(repoRoot), "utf8")).toThrow();
    const second = acquireDoctorLock(repoRoot, 2222, deps({ isPidAlive: (pid) => pid === 1111 }));
    expect(second.acquired).toBe(true);
  });

  it("U-DOCLOCK-007: a fresh lock from another host stays blocked without probing a local pid", () => {
    acquireDoctorLock(repoRoot, 1111, deps({ hostName: () => "host-a" }));
    let probes = 0;
    const r = acquireDoctorLock(
      repoRoot,
      2222,
      deps({
        hostName: () => "host-b",
        isPidAlive: () => {
          probes += 1;
          return false;
        },
      }),
    );
    expect(r.acquired).toBe(false);
    expect(probes).toBe(0);
  });

  it("U-DOCLOCK-008: lock create I/O failure degrades open instead of blocking doctor", () => {
    const baseIo = defaultDoctorLockIo();
    const r = acquireDoctorLock(
      repoRoot,
      1111,
      deps({
        io: {
          ...baseIo,
          createExclusive: () => {
            throw new Error("disk unavailable");
          },
        },
      }),
    );
    expect(r.acquired).toBe(true);
    if (r.acquired) expect("degraded" in r && r.degraded).toBe(true);
  });
});
