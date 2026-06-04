import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type AgentSlotsDeps,
  DEFAULT_MAX_PARALLEL,
  exceedsParallelLimit,
  fireSlot,
  listActiveSlots,
  listStaleSlots,
  loadSlots,
  peakParallel,
  recordGuardFire,
  releaseSlot,
  type Slot,
} from "../src/runtime/agent-slots";

const statePath = join("/repo", ".ut-tdd", "state", "agent-slots.json");

/** in-memory + 単調 clock の mock deps (決定論)。now は呼ぶたび 1 分進む。 */
function mockDeps(over: Partial<AgentSlotsDeps> = {}): AgentSlotsDeps & {
  files: Map<string, string>;
  setNow: (iso: string) => void;
} {
  const files = new Map<string, string>();
  let seq = 0;
  let nowIso = "2026-06-04T00:00:00.000Z";
  return {
    files,
    setNow: (iso) => {
      nowIso = iso;
    },
    repoRoot: "/repo",
    now: () => nowIso,
    readText: (p) => files.get(p) ?? null,
    writeText: (p, c) => files.set(p, c),
    newId: () => `slot-${seq++}`,
    ...over,
  };
}

describe("U-SLOT-001 loadSlots", () => {
  it("不在 → [] / 壊れ → [] / 非配列 → [] (never throw)", () => {
    const deps = mockDeps();
    expect(loadSlots(deps)).toEqual([]);
    deps.files.set(statePath, "{not json");
    expect(loadSlots(deps)).toEqual([]);
    deps.files.set(statePath, JSON.stringify({ not: "array" }));
    expect(loadSlots(deps)).toEqual([]);
  });
});

describe("U-SLOT-002 fireSlot / releaseSlot", () => {
  it("fire → running slot 追記 + state 永続化", () => {
    const deps = mockDeps();
    const s = fireSlot({ agent_kind: "pmo-sonnet", role: "tl", slot_source: "agent_guard" }, deps);
    expect(s.status).toBe("running");
    expect(s.released_at).toBeNull();
    expect(s.role).toBe("tl");
    expect(loadSlots(deps)).toHaveLength(1);
  });

  it("release → terminal status + released_at 記録 / 返り true", () => {
    const deps = mockDeps();
    const s = fireSlot({ agent_kind: "codex-se", slot_source: "team_runner" }, deps);
    deps.setNow("2026-06-04T00:05:00.000Z");
    expect(releaseSlot(s.slot_id, "completed", 0, deps)).toBe(true);
    const after = loadSlots(deps)[0];
    expect(after.status).toBe("completed");
    expect(after.exit_code).toBe(0);
    expect(after.released_at).toBe("2026-06-04T00:05:00.000Z");
  });

  it("release: 対象なし / 既 release → false (idempotent)", () => {
    const deps = mockDeps();
    expect(releaseSlot("nope", "completed", 0, deps)).toBe(false);
    const s = fireSlot({ agent_kind: "x", slot_source: "manual" }, deps);
    releaseSlot(s.slot_id, "completed", 0, deps);
    expect(releaseSlot(s.slot_id, "failed", 1, deps)).toBe(false); // 二重 release 不可
  });

  it("role 省略 → null", () => {
    const deps = mockDeps();
    const s = fireSlot({ agent_kind: "x", slot_source: "manual" }, deps);
    expect(s.role).toBeNull();
  });
});

describe("U-SLOT-003 listActiveSlots / listStaleSlots", () => {
  it("active = running かつ未 release のみ", () => {
    const deps = mockDeps();
    const a = fireSlot({ agent_kind: "a", slot_source: "manual" }, deps);
    fireSlot({ agent_kind: "b", slot_source: "manual" }, deps);
    releaseSlot(a.slot_id, "completed", 0, deps);
    const active = listActiveSlots(deps);
    expect(active).toHaveLength(1);
    expect(active[0].agent_kind).toBe("b");
  });

  it("stale = active かつ fired_at が閾値超のみ", () => {
    const deps = mockDeps();
    fireSlot({ agent_kind: "old", slot_source: "manual" }, deps); // fired 00:00
    deps.setNow("2026-06-04T00:03:00.000Z");
    fireSlot({ agent_kind: "fresh", slot_source: "manual" }, deps); // fired 00:03
    deps.setNow("2026-06-04T00:07:00.000Z"); // now: old=7分, fresh=4分
    const stale = listStaleSlots(deps, 5);
    expect(stale).toHaveLength(1);
    expect(stale[0].agent_kind).toBe("old");
  });
});

describe("U-SLOT-004 peakParallel", () => {
  function slot(over: Partial<Slot>): Slot {
    return {
      slot_id: "s",
      agent_kind: "x",
      role: null,
      slot_source: "manual",
      fired_at: "2026-06-04T00:00:00.000Z",
      released_at: null,
      status: "running",
      exit_code: null,
      ...over,
    };
  }

  it("重なる 3 slot → peak 3 / 重ならない → peak 1", () => {
    const overlap = [
      slot({ fired_at: "2026-06-04T00:00:00.000Z", released_at: "2026-06-04T00:10:00.000Z" }),
      slot({ fired_at: "2026-06-04T00:02:00.000Z", released_at: "2026-06-04T00:08:00.000Z" }),
      slot({ fired_at: "2026-06-04T00:04:00.000Z", released_at: "2026-06-04T00:06:00.000Z" }),
    ];
    expect(peakParallel(overlap)).toBe(3);
    const serial = [
      slot({ fired_at: "2026-06-04T00:00:00.000Z", released_at: "2026-06-04T00:01:00.000Z" }),
      slot({ fired_at: "2026-06-04T00:02:00.000Z", released_at: "2026-06-04T00:03:00.000Z" }),
    ];
    expect(peakParallel(serial)).toBe(1);
  });

  it("released_at=null は実行中として peak に算入", () => {
    const running = [
      slot({ fired_at: "2026-06-04T00:00:00.000Z", released_at: null }),
      slot({ fired_at: "2026-06-04T00:01:00.000Z", released_at: null }),
    ];
    expect(peakParallel(running)).toBe(2);
  });
});

describe("U-SLOT-005 exceedsParallelLimit", () => {
  it("active < max → false / active >= max → true", () => {
    const deps = mockDeps();
    for (let i = 0; i < DEFAULT_MAX_PARALLEL - 1; i++) {
      fireSlot({ agent_kind: `a${i}`, slot_source: "manual" }, deps);
    }
    expect(exceedsParallelLimit(deps)).toBe(false);
    fireSlot({ agent_kind: "last", slot_source: "manual" }, deps);
    expect(exceedsParallelLimit(deps)).toBe(true);
    expect(exceedsParallelLimit(deps, 100)).toBe(false); // max override
  });
});

describe("U-SLOT-006 recordGuardFire", () => {
  it("active < max → exceeded=false / active == max (上限到達) → exceeded=true (>= 統一)", () => {
    const deps = mockDeps();
    let last = { activeCount: 0, exceeded: false };
    for (let i = 0; i < DEFAULT_MAX_PARALLEL - 1; i++) {
      last = recordGuardFire(`pmo-sonnet-${i}`, deps);
    }
    expect(last.exceeded).toBe(false); // active = max-1
    last = recordGuardFire("at-limit", deps); // active = max
    expect(last.activeCount).toBe(DEFAULT_MAX_PARALLEL);
    expect(last.exceeded).toBe(true);
  });

  it("stale な agent_guard slot は自動失効し active から外れる (持続汚染防止)", () => {
    const deps = mockDeps();
    recordGuardFire("old", deps, DEFAULT_MAX_PARALLEL, 5); // fired 00:00
    deps.setNow("2026-06-04T00:10:00.000Z"); // 10 分後 = stale
    const r = recordGuardFire("fresh", deps, DEFAULT_MAX_PARALLEL, 5);
    // old は cancelled、fresh のみ active。
    expect(r.activeCount).toBe(1);
    const slots = loadSlots(deps);
    expect(slots.find((s) => s.agent_kind === "old")?.status).toBe("cancelled");
  });
});
