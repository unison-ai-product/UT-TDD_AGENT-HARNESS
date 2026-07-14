import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ReservationService } from "../../src/plan-asset/application/reservation-service.js";
import { PlanLedger } from "../../src/plan-asset/ledger/plan-ledger.js";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import type { ClockPort } from "../../src/plan-asset/ports/clock.js";
import type {
  LeaseTokenKeyRingPort,
  LeaseTokenMac,
} from "../../src/plan-asset/ports/lease-token-key-ring.js";
import { openHarnessDb } from "../../src/state-db/index.js";

describe("PLAN reservation service", () => {
  it("U-PA-043: issues a raw lease once, stores only its hash, and recovers the same replay", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
        "plan:a",
        "2026-07-14T00:00:00Z",
        "b".repeat(40),
        "test",
      );
      const clock = new SequenceClock(["2026-07-14T00:00:00Z"]);
      const keyRing = new FakeKeyRing();
      const service = new ReservationService(new PlanLedger(db), clock, keyRing);
      const request = {
        reservationId: "reservation:a",
        namespace: "PLAN-L7",
        ordinal: 418,
        assetId: "plan:a",
        leaseMs: 3_600_000,
        commandId: "command:a",
      };

      const first = service.reserve(request);
      const replay = service.reserve(request);

      expect(first).toMatchObject({ ok: true, replayed: false });
      expect(replay).toEqual({ ...first, replayed: true });
      if (!first.ok) throw new Error("reservation fixture must succeed");
      expect(first.leaseToken).toMatch(/^utl1\.v2\.[A-Za-z0-9_-]+$/);
      expect(clock.calls).toBe(1);
      expect(keyRing.issueCalls).toBe(1);
      expect(keyRing.recoverVersions).toEqual(["v2"]);
      const persisted = JSON.stringify({
        events: db.prepare("SELECT * FROM plan_id_reservation_events").all(),
        current: db.prepare("SELECT * FROM plan_id_reservations").all(),
        receipts: db.prepare("SELECT * FROM append_command_receipts").all(),
      });
      expect(persisted).not.toContain(first.leaseToken);
      expect(persisted).toContain(first.leaseTokenHash);
      expect(persisted).toContain('"lease_key_version":"v2"');
    } finally {
      db.close();
    }
  });

  it("U-PA-043: rejects replay payload drift and never replaces an unavailable historical key", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
        "plan:a",
        "2026-07-14T00:00:00Z",
        "b".repeat(40),
        "test",
      );
      const keyRing = new FakeKeyRing();
      const service = new ReservationService(
        new PlanLedger(db),
        new SequenceClock(["2026-07-14T00:00:00Z"]),
        keyRing,
      );
      const request = {
        reservationId: "reservation:a",
        namespace: "PLAN-L7",
        ordinal: 418,
        assetId: "plan:a",
        leaseMs: 3_600_000,
        commandId: "command:a",
      };
      expect(service.reserve(request)).toMatchObject({ ok: true });
      expect(service.reserve({ ...request, leaseMs: 7_200_000 })).toEqual({
        ok: false,
        ruleId: "plan-id-reservation-command-conflict",
      });
      keyRing.availableVersions.clear();
      expect(service.reserve(request)).toEqual({
        ok: false,
        ruleId: "plan-id-reservation-key-unavailable",
      });
      expect(keyRing.issueCalls).toBe(1);
    } finally {
      db.close();
    }
  });
});

class SequenceClock implements ClockPort {
  calls = 0;
  constructor(private readonly values: string[]) {}
  now(): string {
    this.calls += 1;
    const value = this.values.shift();
    if (!value) throw new Error("clock exhausted");
    return value;
  }
}

class FakeKeyRing implements LeaseTokenKeyRingPort {
  issueCalls = 0;
  readonly recoverVersions: string[] = [];
  readonly availableVersions = new Set(["v2"]);

  issueMac(message: Uint8Array): LeaseTokenMac {
    this.issueCalls += 1;
    return { keyVersion: "v2", mac: mac("v2", message) };
  }

  recoverMac(keyVersion: string, message: Uint8Array): Uint8Array | null {
    this.recoverVersions.push(keyVersion);
    return this.availableVersions.has(keyVersion) ? mac(keyVersion, message) : null;
  }
}

function mac(version: string, message: Uint8Array): Uint8Array {
  return createHash("sha256").update(version).update(message).digest();
}
