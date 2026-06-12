import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkAgentSlots,
  checkHandover,
  checkHandoverDisciplineMessages,
  type DoctorDeps,
  runDoctor,
} from "../src/doctor/index";
import type { AgentSlotsDeps, Slot } from "../src/runtime/agent-slots";

const NOW = "2026-06-04T00:00:00.000Z";
const pointerPath = join("/repo", ".ut-tdd", "handover", "CURRENT.json");
const slotStatePath = join("/repo", ".ut-tdd", "state", "agent-slots.json");
const currentPlanPath = join("/repo", ".ut-tdd", "state", "current-plan");
const digestDir = join("/repo", ".ut-tdd", "logs", "plan");

function deps(over: Partial<DoctorDeps> & { files?: Map<string, string> } = {}): DoctorDeps {
  const files = over.files ?? new Map<string, string>();
  return {
    repoRoot: "/repo",
    now: NOW,
    readText: (p) => files.get(p) ?? null,
    listDir: (dir) =>
      [...files.keys()]
        .filter((k) => k.startsWith(`${dir}/`) || k.startsWith(`${dir}\\`))
        .map((k) => k.slice(dir.length + 1)),
    ...over,
  };
}

describe("checkHandover (doctor handover staleness surface)", () => {
  it("CURRENT.json なし → 生成を促す message (ok は落とさない)", () => {
    expect(checkHandover(deps())).toContain("CURRENT.json なし");
  });

  it("fresh pointer → OK + active 表示", () => {
    const files = new Map([
      [
        pointerPath,
        JSON.stringify({
          active_plan: "PLAN-X",
          status: "in_progress",
          latest_doc: null,
          digest_summary: null,
          updated_at: "2026-06-03T18:00:00.000Z",
        }),
      ],
    ]);
    const msg = checkHandover(deps({ files }));
    expect(msg).toContain("OK");
    expect(msg).toContain("PLAN-X");
  });

  it("24h 超 → stale 警告", () => {
    const files = new Map([
      [pointerPath, JSON.stringify({ updated_at: "2026-06-01T00:00:00.000Z" })],
    ]);
    expect(checkHandover(deps({ files }))).toContain("stale");
  });

  it("壊れ JSON → 再生成を促す (throw しない)", () => {
    const files = new Map([[pointerPath, "{not json"]]);
    expect(() => checkHandover(deps({ files }))).not.toThrow();
    expect(checkHandover(deps({ files }))).toContain("壊れて");
  });
});

describe("checkHandoverDisciplineMessages", () => {
  it("fresh CURRENT 縺ｧ繧・current-plan/digest 縺ｨ active_plan 縺後★繧後※縺・ｌ縺ｰ drift 繧・surface", () => {
    const files = new Map([
      [currentPlanPath, "PLAN-L5-08-harness-db-feedback\n2026-06-03T23:50:00.000Z"],
      [
        join(digestDir, "PLAN-L5-08-harness-db-feedback.digest.json"),
        JSON.stringify({
          plan_id: "PLAN-L5-08-harness-db-feedback",
          sessions: ["s1"],
          commits: [],
          files_touched: ["docs/plans/PLAN-L5-08-harness-db-feedback.md"],
          failures: [],
          updated_at: "2026-06-03T23:55:00.000Z",
        }),
      ],
      [
        pointerPath,
        JSON.stringify({
          active_plan: "PLAN-L5-00-master",
          status: "completed",
          latest_doc: null,
          digest_summary: { commits: 0, files: 0, failures: 0 },
          updated_at: "2026-06-03T23:59:00.000Z",
          generated_by: "ut-tdd-handover",
          doc_entry_count: 0,
        }),
      ],
    ]);
    const messages = checkHandoverDisciplineMessages(deps({ files }));
    expect(messages.some((m) => m.includes("drift"))).toBe(true);
  });

  it("runDoctor 縺・handover discipline 繧・warning-only 縺ｧ蜷梧凾 surface 縺吶ｋ", () => {
    const files = new Map([
      [currentPlanPath, "PLAN-L5-08-harness-db-feedback\n2026-06-03T23:50:00.000Z"],
      [
        join(digestDir, "PLAN-L5-08-harness-db-feedback.digest.json"),
        JSON.stringify({
          plan_id: "PLAN-L5-08-harness-db-feedback",
          sessions: ["s1"],
          commits: [],
          files_touched: ["docs/plans/PLAN-L5-08-harness-db-feedback.md"],
          failures: [],
          updated_at: "2026-06-03T23:55:00.000Z",
        }),
      ],
    ]);
    const r = runDoctor(deps({ files }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("handover-discipline"))).toBe(true);
    expect(r.messages.some((m) => m.includes("verification group lint could not run"))).toBe(true);
  });
});

describe("checkAgentSlots (doctor agent-slots surface, IMP-050)", () => {
  function slotDeps(slots: Slot[] | null, now = "2026-06-04T00:10:00.000Z"): AgentSlotsDeps {
    const files = new Map<string, string>();
    if (slots !== null) files.set(slotStatePath, JSON.stringify(slots));
    return {
      repoRoot: "/repo",
      now: () => now,
      readText: (p) => files.get(p) ?? null,
      writeText: () => {
        throw new Error("doctor は read-only であるべき (writeText 呼び出し禁止)");
      },
      newId: () => "x",
    };
  }
  function slot(over: Partial<Slot>): Slot {
    return {
      slot_id: "s",
      agent_kind: "pmo-sonnet",
      role: null,
      slot_source: "agent_guard",
      fired_at: "2026-06-04T00:00:00.000Z",
      released_at: null,
      status: "running",
      exit_code: null,
      ...over,
    };
  }

  it("記録なし → 記録なし message", () => {
    expect(checkAgentSlots(slotDeps(null))).toContain("記録なし");
  });

  it("stale slot (5分超 release なし) → stale 警告", () => {
    const msg = checkAgentSlots(slotDeps([slot({ slot_id: "old" })])); // fired 00:00, now 00:10
    expect(msg).toContain("stale");
    expect(msg).toContain("old");
  });

  it("released 済のみ → OK + peak 表示 (read-only、writeText を呼ばない)", () => {
    const msg = checkAgentSlots(
      slotDeps([slot({ status: "completed", released_at: "2026-06-04T00:02:00.000Z" })]),
    );
    expect(msg).toContain("OK");
    expect(msg).toContain("peak_parallel");
  });
});

describe("runDoctor", () => {
  it("ok=true で handover + agent-slots surface を含む (warning、ok を落とさない)", () => {
    const r = runDoctor(deps());
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("handover"))).toBe(true);
    expect(r.messages.some((m) => m.includes("agent-slots"))).toBe(true);
    expect(r.messages.some((m) => m.includes("verification group lint could not run"))).toBe(true);
    // hard-fail lints も surface に出る (合成 repoRoot は docs 不在で skip note、wiring 存在を確認)
    expect(r.messages.some((m) => m.includes("scrum-reverse"))).toBe(true);
    expect(r.messages.some((m) => m.includes("propagation"))).toBe(true);
    expect(r.messages.some((m) => m.includes("coding-rules"))).toBe(true);
  });

  it("includes asset-drift hard gate in doctor output", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: asset-drift") && m.includes("OK"))).toBe(
      true,
    );
  });

  it("includes skill-assignment hard gate in doctor output", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: skill-assignment - OK"))).toBe(true);
  });

  it("surfaces dependency-drift and regression expansion instead of scaffold stub", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: dependency-drift —"))).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: regression-expansion —"))).toBe(true);
    expect(r.messages.some((m) => m.includes("scaffold stub"))).toBe(false);
  });

  it("surfaces roadmap-rollup as a warning-first summary line", () => {
    const r = runDoctor();
    // roadmap.messages は runDoctor 内で `doctor: ${m}` へ変換されるため "doctor: " prefix を期待する。
    const rollupLines = r.messages.filter((m) => m.startsWith("doctor: roadmap-rollup —"));

    expect(r.ok).toBe(true);
    expect(rollupLines).toHaveLength(1);
    expect(rollupLines[0]).toContain("bands ");
    expect(rollupLines[0]).toContain("gates ");
    expect(rollupLines[0]).toContain("spans ");
    expect(rollupLines[0]).toContain("frontier:");
  });

  it("surfaces Cycle P4 closure audit as a hard gate", () => {
    const r = runDoctor();

    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: cycle-p4-verification - OK"))).toBe(true);
  });
});
