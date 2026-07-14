import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ReservationService } from "../../src/plan-asset/application/reservation-service.js";
import type { ClockPort } from "../../src/plan-asset/ports/clock.js";
import type {
  LeaseTokenContext,
  LeaseTokenKeyRingPort,
  LeaseTokenMaterial,
} from "../../src/plan-asset/ports/lease-token-key-ring.js";
import { PlanLedger } from "../../src/plan-asset/ledger/plan-ledger.js";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
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
      const clock = new SequenceClock([
        "2026-07-14T00:00:00Z",
        "2026-07-14T02:00:00Z",
      ]);
      const service = new ReservationService(new PlanLedger(db), clock, new FakeKeyRing());
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
      const persisted = JSON.stringify({
        events: db.prepare("SELECT * FROM plan_id_reservation_events").all(),
        current: db.prepare("SELECT * FROM plan_id_reservations").all(),
        receipts: db.prepare("SELECT * FROM append_command_receipts").all(),
      });
      expect(persisted).not.toContain(first.leaseToken);
      expect(persisted).toContain(first.leaseTokenHash);
    } finally {
      db.close();
    }
  });
});

class SequenceClock implements ClockPort {
  constructor(private readonly values: string[]) {}
  now(): string {
    const value = this.values.shift();
    if (!value) throw new Error("clock exhausted");
    return value;
  }
}

class FakeKeyRing implements LeaseTokenKeyRingPort {
  issue(context: LeaseTokenContext): LeaseTokenMaterial {
    return material("v2", context);
  }

  recover(context: LeaseTokenContext, expectedHash: string): LeaseTokenMaterial | null {
    return [material("v2", context), material("v1", context)].find(
      (candidate) => candidate.leaseTokenHash === expectedHash,
    ) ?? null;
  }
}

function material(version: string, context: LeaseTokenContext): LeaseTokenMaterial {
  const leaseToken = `${version}.${createHash("sha256").update(JSON.stringify(context)).digest("hex")}`;
  return {
    keyVersion: version,
    leaseToken,
    leaseTokenHash: createHash("sha256").update(leaseToken).digest("hex"),
  };
}
