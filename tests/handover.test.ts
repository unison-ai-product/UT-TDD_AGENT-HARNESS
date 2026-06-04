import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPointer,
  type HandoverDeps,
  type HandoverScope,
  handoverStale,
  inferPlanFromCommit,
  type PlanDigestRef,
  renderHandoverScaffold,
  resolveHandoverScope,
  runHandover,
  scaffoldFromDigests,
  setActivePlan,
} from "../src/handover/index";
import { resolveActivePlan, type SessionLogDeps } from "../src/runtime/session-log";

const NOW = "2026-06-04T00:00:00.000Z";

/** in-memory file store の mock HandoverDeps (now 固定で決定論)。 */
function mockDeps(over: Partial<HandoverDeps> = {}): HandoverDeps & { files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    files,
    repoRoot: "/repo",
    now: () => NOW,
    readText: (p) => files.get(p) ?? null,
    writeText: (p, c) => files.set(p, c),
    listDir: (dir) =>
      [...files.keys()]
        .filter((k) => k.startsWith(`${dir}/`) || k.startsWith(`${dir}\\`))
        .map((k) => k.slice(dir.length + 1)),
    ...over,
  };
}

/** session-log の current-plan を共有 file store で扱う mock SessionLogDeps。 */
function mockSessionDeps(files: Map<string, string>): SessionLogDeps & { removed: string[] } {
  const removed: string[] = [];
  return {
    removed,
    repoRoot: "/repo",
    now: () => NOW,
    appendLine: () => {},
    readText: (p) => files.get(p) ?? null,
    writeText: (p, c) => files.set(p, c),
    currentBranch: () => null,
    listDir: () => [],
    removeFile: (p) => {
      files.delete(p);
      removed.push(p);
    },
  };
}

const digestDir = join("/repo", ".ut-tdd", "logs", "plan");
const currentPlanPath = join("/repo", ".ut-tdd", "state", "current-plan");
const pointerPath = join("/repo", ".ut-tdd", "handover", "CURRENT.json");

function digest(over: Partial<PlanDigestRef> = {}): PlanDigestRef {
  return {
    plan_id: "PLAN-L7-04-handover-mechanism",
    sessions: ["s1"],
    commits: ["a413d25"],
    files_touched: ["src/handover/index.ts"],
    failures: [],
    updated_at: NOW,
    ...over,
  };
}

describe("U-HOVER-001 resolveHandoverScope", () => {
  it("current-plan 有 → active_plan 解決 / digest 群を集約", () => {
    const deps = mockDeps();
    deps.files.set(currentPlanPath, "PLAN-L7-04-handover-mechanism");
    deps.files.set(
      join(digestDir, "PLAN-L7-04-handover-mechanism.digest.json"),
      JSON.stringify(digest()),
    );
    const scope = resolveHandoverScope(deps);
    expect(scope.active_plan).toBe("PLAN-L7-04-handover-mechanism");
    expect(scope.digests).toHaveLength(1);
  });

  it("壊れ JSON は skip / 何も無ければ {null, []} (never throw)", () => {
    const deps = mockDeps();
    deps.files.set(join(digestDir, "broken.digest.json"), "{not json");
    expect(() => resolveHandoverScope(deps)).not.toThrow();
    const scope = resolveHandoverScope(deps);
    expect(scope.active_plan).toBeNull();
    expect(scope.digests).toEqual([]);
  });
});

describe("U-HOVER-002 buildPointer", () => {
  it("digests 非空 → 件数集計 / updated_at=now", () => {
    const scope: HandoverScope = {
      active_plan: "P",
      digests: [
        digest({
          commits: ["c1", "c2"],
          files_touched: ["f1"],
          failures: [{ ts: NOW, summary: "x" }],
        }),
      ],
    };
    const p = buildPointer(scope, "docs/handover/x.md", "in_progress", NOW);
    expect(p.digest_summary).toEqual({ commits: 2, files: 1, failures: 1 });
    expect(p.updated_at).toBe(NOW);
  });

  it("edge: active_plan=null だが digests 非空 → digest_summary は集計値 (null にしない)", () => {
    const scope: HandoverScope = { active_plan: null, digests: [digest()] };
    const p = buildPointer(scope, null, "in_progress", NOW);
    expect(p.active_plan).toBeNull();
    expect(p.digest_summary).toEqual({ commits: 1, files: 1, failures: 0 });
  });

  it("digests 空 → digest_summary=null", () => {
    const p = buildPointer({ active_plan: "P", digests: [] }, null, "in_progress", NOW);
    expect(p.digest_summary).toBeNull();
  });
});

describe("U-HOVER-003 scaffoldFromDigests", () => {
  it("digest→deliverables / planMeta→summary / ③-⑥ は空配列", () => {
    const doc = scaffoldFromDigests(
      [digest()],
      [{ plan_id: "PLAN-L7-04-handover-mechanism", kind: "add-impl", title: "handover 実装" }],
      "2026-06-04",
    );
    expect(doc.deliverables[0].commits).toEqual(["a413d25"]);
    expect(doc.plans[0].summary).toBe("handover 実装");
    expect(doc.next_actions).toEqual([]);
    expect(doc.carry).toEqual([]);
    expect(doc.po_decisions).toEqual([]);
    expect(doc.do_not_break).toEqual([]);
  });
});

describe("U-HOVER-004 renderHandoverScaffold", () => {
  it("6 セクション + ③-⑥ TODO placeholder", () => {
    const doc = scaffoldFromDigests([digest()], [], "2026-06-04");
    const md = renderHandoverScaffold(doc);
    for (const s of [
      "§1 PLAN サマリ",
      "§2 成果物",
      "§3 Next Action",
      "§4 carry",
      "§5 未了 PO 判断",
      "§6 壊さない",
    ]) {
      expect(md).toContain(s);
    }
    expect(md).toContain("TODO(human)");
  });

  it("sanitize defense-in-depth: summary の token=secret123 が出力に出ず ***", () => {
    const doc = scaffoldFromDigests(
      [digest()],
      [
        {
          plan_id: "PLAN-L7-04-handover-mechanism",
          kind: "add-impl",
          title: "token=secret123 を含む",
        },
      ],
      "2026-06-04",
    );
    const md = renderHandoverScaffold(doc);
    expect(md).not.toContain("secret123");
    expect(md).toContain("token=***");
  });
});

describe("U-HOVER-005 handoverStale", () => {
  it("null → true / 24h 超 → true / 以内 → false / 境界(=24h) は stale でない", () => {
    expect(handoverStale(null, NOW)).toBe(true);
    expect(handoverStale("2026-06-02T00:00:00.000Z", NOW)).toBe(true); // 48h
    expect(handoverStale("2026-06-03T12:00:00.000Z", NOW)).toBe(false); // 12h
    expect(handoverStale("2026-06-03T00:00:00.000Z", NOW)).toBe(false); // ちょうど 24h → > 判定で false
    expect(handoverStale("not-a-date", NOW)).toBe(true); // parse 不能
  });
});

describe("U-HOVER-006 setActivePlan + inferPlanFromCommit", () => {
  it("setActivePlan → resolveActivePlan round-trip", () => {
    const files = new Map<string, string>();
    const sdeps = mockSessionDeps(files);
    setActivePlan("PLAN-L7-04-handover-mechanism", sdeps);
    expect(resolveActivePlan(sdeps)).toBe("PLAN-L7-04-handover-mechanism");
  });

  it("null + removeFile 有 → file 削除で clear", () => {
    const files = new Map<string, string>();
    const sdeps = mockSessionDeps(files);
    setActivePlan("PLAN-L7-04-handover-mechanism", sdeps);
    setActivePlan(null, sdeps);
    expect(sdeps.removed).toContain(currentPlanPath);
    expect(resolveActivePlan(sdeps)).toBeNull();
  });

  it("null + removeFile 無 → 空文字書込 → resolveActivePlan が null 相当に落とす", () => {
    const files = new Map<string, string>();
    const sdeps = mockSessionDeps(files);
    sdeps.removeFile = undefined;
    setActivePlan("PLAN-L7-04-handover-mechanism", sdeps);
    setActivePlan(null, sdeps);
    expect(files.get(currentPlanPath)).toBe("");
    expect(resolveActivePlan(sdeps)).toBeNull();
  });

  it("inferPlanFromCommit: 抽出 / 非該当→null / heredoc 様→null", () => {
    expect(inferPlanFromCommit("feat: 実装 (PLAN-L7-04-handover-mechanism)")).toBe(
      "PLAN-L7-04-handover-mechanism",
    );
    expect(inferPlanFromCommit("PLAN-DISCOVERY-01")).toBe("PLAN-DISCOVERY-01");
    expect(inferPlanFromCommit("docs: 修正のみ")).toBeNull();
    expect(inferPlanFromCommit("git commit -F -")).toBeNull(); // heredoc は本文が乗らない
  });
});

describe("U-HOVER-007 runHandover", () => {
  function seeded(): ReturnType<typeof mockDeps> {
    const deps = mockDeps();
    deps.files.set(currentPlanPath, "PLAN-L7-04-handover-mechanism");
    deps.files.set(
      join(digestDir, "PLAN-L7-04-handover-mechanism.digest.json"),
      JSON.stringify(digest()),
    );
    return deps;
  }

  it("dryRun → 何も書かず content を返す (written=[]、非破壊)", () => {
    const deps = seeded();
    const before = new Map(deps.files);
    const r = runHandover({ date: "2026-06-04", dryRun: true }, deps);
    expect(r.written).toEqual([]);
    expect(r.content).toContain("§1 PLAN サマリ");
    expect(deps.files).toEqual(before); // 非破壊
  });

  it("通常 → md 追記 (既存上書きしない) + CURRENT.json 更新", () => {
    const deps = seeded();
    const docRel = join("docs", "handover", "session-handover-2026-06-04.md");
    deps.files.set(join("/repo", docRel), "# 既存 entry\n");
    const r = runHandover({ date: "2026-06-04" }, deps);
    const md = deps.files.get(join("/repo", docRel)) ?? "";
    expect(md).toContain("# 既存 entry"); // 既存を残す
    expect(md).toContain("§3 Next Action"); // 追記される
    expect(r.written).toContain(join(".ut-tdd", "handover", "CURRENT.json"));
  });

  it("complete=true → CURRENT.json status=completed かつ active_plan=planId", () => {
    const deps = seeded();
    runHandover(
      { date: "2026-06-04", complete: true, planId: "PLAN-L7-04-handover-mechanism" },
      deps,
    );
    const pointer = JSON.parse(deps.files.get(pointerPath) ?? "{}");
    expect(pointer.status).toBe("completed");
    expect(pointer.active_plan).toBe("PLAN-L7-04-handover-mechanism");
  });
});
