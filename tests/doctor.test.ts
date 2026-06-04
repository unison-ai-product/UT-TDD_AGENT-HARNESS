import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkHandover, type DoctorDeps, runDoctor } from "../src/doctor/index";

const NOW = "2026-06-04T00:00:00.000Z";
const pointerPath = join("/repo", ".ut-tdd", "handover", "CURRENT.json");

function deps(over: Partial<DoctorDeps> & { files?: Map<string, string> } = {}): DoctorDeps {
  const files = over.files ?? new Map<string, string>();
  return { repoRoot: "/repo", now: NOW, readText: (p) => files.get(p) ?? null, ...over };
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

describe("runDoctor", () => {
  it("ok=true で handover surface を含む (staleness は warning、ok を落とさない)", () => {
    const r = runDoctor(deps());
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("handover"))).toBe(true);
  });
});
