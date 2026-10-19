import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GENERATED_BY as SIDECAR_GENERATED_BY,
  HANDOVER_OUTSTANDING_MARKER as SIDECAR_HANDOVER_OUTSTANDING_MARKER,
  MAX_SAME_DAY_ENTRIES as SIDECAR_MAX_SAME_DAY_ENTRIES,
  MAX_SUMMARY_PLANS as SIDECAR_MAX_SUMMARY_PLANS,
} from "../src/handover/handover-constants.ts";
import type { HandoverDoc as SidecarHandoverDoc } from "../src/handover/handover-types.ts";
import {
  buildPointer,
  capWithBreadcrumb,
  checkHandoverBypass,
  checkHandoverDiscipline,
  checkHandoverOutstandingAnchor,
  countHandoverEntries,
  dedupeDigests,
  GENERATED_BY,
  HANDOVER_OUTSTANDING_MARKER,
  type HandoverDeps,
  type HandoverPointer,
  type HandoverScope,
  handoverStale,
  inferPlanFromCommit,
  latestSessionId,
  MAX_SAME_DAY_ENTRIES,
  MAX_SUMMARY_PLANS,
  type PlanDigestRef,
  readPointer,
  renderHandoverScaffold,
  resolveHandoverScope,
  runHandover,
  sameFamilyPlan,
  scaffoldFromDigests,
  setActivePlan,
} from "../src/handover/index.ts";
import { resolveActivePlan, type SessionLogDeps } from "../src/runtime/session-log.ts";

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

describe("PLAN-L7-173 handover sidecars", () => {
  it("re-exported constants and sidecar document type stay aligned", () => {
    expect(SIDECAR_GENERATED_BY).toBe(GENERATED_BY);
    expect(SIDECAR_HANDOVER_OUTSTANDING_MARKER).toBe(HANDOVER_OUTSTANDING_MARKER);
    expect(SIDECAR_MAX_SAME_DAY_ENTRIES).toBe(MAX_SAME_DAY_ENTRIES);
    expect(SIDECAR_MAX_SUMMARY_PLANS).toBe(MAX_SUMMARY_PLANS);

    const doc: SidecarHandoverDoc = scaffoldFromDigests([digest()], [], "2026-06-24");
    expect(doc.plans[0]?.plan_id).toBe("PLAN-L7-04-handover-mechanism");
  });
});

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
    const p = buildPointer({
      scope,
      latestDoc: "docs/handover/x.md",
      status: "in_progress",
      now: NOW,
    });
    expect(p.digest_summary).toEqual({ commits: 2, files: 1, failures: 1 });
    expect(p.updated_at).toBe(NOW);
  });

  it("edge: active_plan=null だが digests 非空 → digest_summary は集計値 (null にしない)", () => {
    const scope: HandoverScope = { active_plan: null, digests: [digest()] };
    const p = buildPointer({ scope, latestDoc: null, status: "in_progress", now: NOW });
    expect(p.active_plan).toBeNull();
    expect(p.digest_summary).toEqual({ commits: 1, files: 1, failures: 0 });
  });

  it("digests 空 → digest_summary=null", () => {
    const p = buildPointer({
      scope: { active_plan: "P", digests: [] },
      latestDoc: null,
      status: "in_progress",
      now: NOW,
    });
    expect(p.digest_summary).toBeNull();
  });
});

// PLAN-L7-98 (Q1): §5 未了 PO 判断 を outstanding surface (機械事実) で seed + fail-close anchor。
describe("U-HOVER-017 §5 outstanding seed + anchor gate (PLAN-L7-98)", () => {
  const outstanding = {
    nonTerminalPlansByLayer: { L7: 2 },
    nonTerminalPlansTotal: 2,
    versionUpParked: 0,
    activeDraftTotal: 2,
    openDefers: 1,
  };

  it("outstanding 指定で §5 に機械集計 marker + 件数を出力する", () => {
    const doc = scaffoldFromDigests([digest()], [], "2026-06-04");
    const md = renderHandoverScaffold(doc, { outstanding });
    expect(md).toContain(HANDOVER_OUTSTANDING_MARKER);
    expect(md).toContain("non-terminal PLANs=2");
    expect(md).toContain("open defers=1");
  });

  it("outstanding 未指定なら従来の §5 TODO (後方互換、marker なし)", () => {
    const md = renderHandoverScaffold(scaffoldFromDigests([digest()], [], "2026-06-04"));
    expect(md).not.toContain(HANDOVER_OUTSTANDING_MARKER);
    expect(md).toContain("§5 未了 PO 判断");
  });

  function withDoc(md: string | null): ReturnType<typeof mockDeps> {
    const deps = mockDeps();
    deps.files.set(pointerPath, JSON.stringify({ latest_doc: "docs/handover/h.md" }));
    if (md != null) deps.files.set(join("/repo", "docs", "handover", "h.md"), md);
    return deps;
  }

  it("pointer 不在は skip (ok)", () => {
    expect(checkHandoverOutstandingAnchor(mockDeps()).ok).toBe(true);
  });

  it("§5 に marker があれば ok", () => {
    const md = `# Session Handover — 2026-06-04\n\n## §5 未了 PO 判断\n\n> ${HANDOVER_OUTSTANDING_MARKER}: non-terminal PLANs=0; open defers=1\n\n## §6 x\n`;
    expect(checkHandoverOutstandingAnchor(withDoc(md)).ok).toBe(true);
  });

  it("§5 に marker が無ければ fail-close (前任 prose 転記の false-state 防止)", () => {
    const md = `# Session Handover — 2026-06-04\n\n## §5 未了 PO 判断\n\n- DISCOVERY-03 PO サインオフ待ち\n\n## §6 x\n`;
    const r = checkHandoverOutstandingAnchor(withDoc(md));
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toContain("機械集計行");
  });

  it("複数 entry は最後の entry の §5 を見る (古い entry の marker では通さない)", () => {
    const md = `# Session Handover — 2026-06-04\n\n## §5 未了 PO 判断\n\n> ${HANDOVER_OUTSTANDING_MARKER}: x\n\n---\n\n# Session Handover — 2026-06-04\n\n## §5 未了 PO 判断\n\n- 待ち prose のみ\n\n## §6 x\n`;
    expect(checkHandoverOutstandingAnchor(withDoc(md)).ok).toBe(false);
  });
});

// PLAN-L7-88: 1 エントリの §1/§2 に載せる PLAN 件数の上限 (注入コントロール / 圧縮)。
describe("U-HOVER-016 capWithBreadcrumb + renderHandoverScaffold summary cap (PLAN-L7-88)", () => {
  const cb = {
    renderItem: (x: string) => [`- ${x}`],
    breadcrumb: (n: number) => `- (+ ${n} more)`,
  };

  it("capWithBreadcrumb: 上限超は先頭 N + breadcrumb 1 行 (no silent cap)、件数は残数を明示", () => {
    const out = capWithBreadcrumb(["a", "b", "c", "d", "e"], 2, cb);
    expect(out).toEqual(["- a", "- b", "- (+ 3 more)"]);
  });

  it("capWithBreadcrumb: 上限以下は全件・breadcrumb なし / max<=0 は無制限", () => {
    const items = ["a", "b"];
    expect(capWithBreadcrumb(items, 5, cb)).toEqual(["- a", "- b"]);
    expect(capWithBreadcrumb(items, 0, cb)).toEqual(["- a", "- b"]);
  });

  function bigDoc(planCount: number) {
    const digests: PlanDigestRef[] = [];
    const meta: { plan_id: string; kind: string; title: string }[] = [];
    for (let i = 0; i < planCount; i++) {
      const id = `PLAN-CAP-${String(i).padStart(2, "0")}-x`;
      digests.push(digest({ plan_id: id, commits: [`c${i}`], files_touched: [`src/f${i}.ts`] }));
      meta.push({ plan_id: id, kind: "impl", title: `title ${i}` });
    }
    return scaffoldFromDigests(digests, meta, "2026-06-22");
  }

  it("renderHandoverScaffold: PLAN 数が上限超 (= scope fallback で全 registry) なら §1/§2 が cap + breadcrumb", () => {
    const doc = bigDoc(MAX_SUMMARY_PLANS + 8);
    const md = renderHandoverScaffold(doc);
    // §1 breadcrumb に残数 8 が出る (full registry はダンプしない)。
    expect(md).toContain("+ 8 more PLAN");
    expect(md).toContain("ut-tdd status");
    // 末尾 (上限外) の PLAN id は本文に出ない = 肥大しない。
    const lastId = `PLAN-CAP-${String(MAX_SUMMARY_PLANS + 7).padStart(2, "0")}-x`;
    expect(md).not.toContain(lastId);
    // 先頭 PLAN は残る。
    expect(md).toContain("PLAN-CAP-00-x");
  });

  it("renderHandoverScaffold: session-scope が効いた通常時 (PLAN 少) は cap 不発・全件・breadcrumb なし", () => {
    const doc = bigDoc(3);
    const md = renderHandoverScaffold(doc);
    expect(md).not.toContain("more PLAN");
    for (let i = 0; i < 3; i++) expect(md).toContain(`PLAN-CAP-0${i}-x`);
  });

  it("renderHandoverScaffold: maxSummaryPlans=0 は cap 無効 (後方互換 escape hatch)", () => {
    const doc = bigDoc(MAX_SUMMARY_PLANS + 5);
    const md = renderHandoverScaffold(doc, { maxSummaryPlans: 0 });
    expect(md).not.toContain("more PLAN");
    const lastId = `PLAN-CAP-${String(MAX_SUMMARY_PLANS + 4).padStart(2, "0")}-x`;
    expect(md).toContain(lastId);
  });

  // reviewer I-1: slimSummary と cap の合成 — slim は §1/§2 を stub 化するので cap は不発
  // (plan list 自体を描かない)。branch 順が将来反転しても回帰で検知できるよう明示する。
  it("renderHandoverScaffold: slimSummary=true は plans > 上限でも stub・cap 不発・header 1 個", () => {
    const doc = bigDoc(MAX_SUMMARY_PLANS + 5);
    const md = renderHandoverScaffold(doc, { slimSummary: true });
    expect(md).toContain("同日 first entry 参照");
    expect(md).not.toContain("more PLAN");
    expect(md).not.toContain("PLAN-CAP-00-x");
    expect(countHandoverEntries(md)).toBe(1);
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

describe("U-HOVER-008 sameFamilyPlan / dedupeDigests (IMP-048)", () => {
  it("sameFamilyPlan: 同一 / bare ⊂ slug (- 境界) は true、無関係は false", () => {
    expect(sameFamilyPlan("PLAN-L7-04", "PLAN-L7-04")).toBe(true);
    expect(sameFamilyPlan("PLAN-L7-04", "PLAN-L7-04-handover-mechanism")).toBe(true);
    expect(sameFamilyPlan("PLAN-L7-04-handover-mechanism", "PLAN-L7-04")).toBe(true);
    expect(sameFamilyPlan("PLAN-L7-04", "PLAN-L7-05")).toBe(false);
    // prefix だが - 境界でない (誤マッチ防止)
    expect(sameFamilyPlan("PLAN-L7-0", "PLAN-L7-04")).toBe(false);
  });

  it("dedupeDigests: bare/slug ゴーストを最長 id へ union 集約", () => {
    const out = dedupeDigests([
      digest({ plan_id: "PLAN-L7-04", commits: ["c1"], files_touched: ["f1"], sessions: ["s1"] }),
      digest({
        plan_id: "PLAN-L7-04-handover-mechanism",
        commits: ["c2"],
        files_touched: ["f1", "f2"],
        sessions: ["s2"],
      }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].plan_id).toBe("PLAN-L7-04-handover-mechanism");
    expect(out[0].commits).toEqual(["c1", "c2"]);
    expect(out[0].files_touched).toEqual(["f1", "f2"]); // 重複除去
    expect(out[0].sessions).toEqual(["s1", "s2"]);
  });

  it("dedupeDigests: 無関係な PLAN は別 group のまま残す", () => {
    const out = dedupeDigests([
      digest({ plan_id: "PLAN-L7-04-handover-mechanism" }),
      digest({ plan_id: "PLAN-L7-05-biome-debt" }),
    ]);
    expect(out).toHaveLength(2);
  });

  it("dedupeDigests: bare 無しで slug 2 種 + bare が来ても推移的に 1 group へ収束 (I-1, 順序非依存)", () => {
    const out = dedupeDigests([
      digest({ plan_id: "PLAN-L7-04-aaa", commits: ["a"] }),
      digest({ plan_id: "PLAN-L7-04-bbb", commits: ["b"] }),
      digest({ plan_id: "PLAN-L7-04", commits: ["bare"] }), // bare が最後でも全部畳む
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].commits.sort()).toEqual(["a", "b", "bare"]);
  });
});

describe("U-HOVER-009 resolveHandoverScope scopeToActive (IMP-048)", () => {
  function seededMulti(): ReturnType<typeof mockDeps> {
    const deps = mockDeps();
    deps.files.set(currentPlanPath, "PLAN-L7-04-handover-mechanism");
    deps.files.set(
      join(digestDir, "PLAN-L7-04.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-04", commits: ["bare"] })),
    );
    deps.files.set(
      join(digestDir, "PLAN-L7-04-handover-mechanism.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-04-handover-mechanism", commits: ["slug"] })),
    );
    deps.files.set(
      join(digestDir, "PLAN-L7-05-biome-debt.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-05-biome-debt" })),
    );
    return deps;
  }

  it("既定 (scopeToActive 無し): dedup のみ → bare/slug は 1 件に畳まれ別 PLAN は残る", () => {
    const scope = resolveHandoverScope(seededMulti());
    expect(scope.digests).toHaveLength(2); // L7-04 family (1) + L7-05 (1)
  });

  it("scopeToActive: active family の digest のみへ絞る", () => {
    const scope = resolveHandoverScope(seededMulti(), { scopeToActive: true });
    expect(scope.digests).toHaveLength(1);
    expect(scope.digests[0].plan_id).toBe("PLAN-L7-04-handover-mechanism");
  });

  it("scopeToActive だが active family が digest に無い → 全件 fallback (空 handover 回避)", () => {
    const deps = mockDeps();
    deps.files.set(currentPlanPath, "PLAN-L9-99-nonexistent");
    deps.files.set(
      join(digestDir, "PLAN-L7-05-biome-debt.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-05-biome-debt" })),
    );
    const scope = resolveHandoverScope(deps, { scopeToActive: true });
    expect(scope.digests).toHaveLength(1);
  });
});

describe("U-HOVER-010 readPointer / checkHandoverDiscipline (IMP-047)", () => {
  function pointer(over: Partial<HandoverPointer> = {}): HandoverPointer {
    return {
      active_plan: "PLAN-L7-04-handover-mechanism",
      status: "in_progress",
      latest_doc: "docs/handover/x.md",
      digest_summary: { commits: 1, files: 1, failures: 0 },
      updated_at: NOW,
      ...over,
    };
  }
  function withActivity(): ReturnType<typeof mockDeps> {
    const deps = mockDeps();
    deps.files.set(currentPlanPath, "PLAN-L7-04-handover-mechanism");
    deps.files.set(
      join(digestDir, "PLAN-L7-04-handover-mechanism.digest.json"),
      JSON.stringify(digest()),
    );
    return deps;
  }

  it("readPointer: 不在→null / 壊れ→null / 正常→object", () => {
    const deps = mockDeps();
    expect(readPointer(deps)).toBeNull();
    deps.files.set(pointerPath, "{not json");
    expect(readPointer(deps)).toBeNull();
    deps.files.set(pointerPath, JSON.stringify(pointer()));
    expect(readPointer(deps)?.active_plan).toBe("PLAN-L7-04-handover-mechanism");
  });

  it("活動なし (digest 空) → 規律対象外で警告ゼロ", () => {
    expect(checkHandoverDiscipline(mockDeps())).toEqual([]);
  });

  it("活動あり + CURRENT.json 不在 → 未生成 warn", () => {
    const w = checkHandoverDiscipline(withActivity());
    expect(w).toHaveLength(1);
    expect(w[0]).toContain("handover 未生成");
  });

  it("活動あり + fresh pointer (同 family) → 警告ゼロ", () => {
    const deps = withActivity();
    deps.files.set(pointerPath, JSON.stringify(pointer()));
    expect(checkHandoverDiscipline(deps)).toEqual([]);
  });

  it("活動あり + stale pointer → stale warn", () => {
    const deps = withActivity();
    deps.files.set(
      pointerPath,
      JSON.stringify(pointer({ updated_at: "2026-06-01T00:00:00.000Z" })),
    );
    const w = checkHandoverDiscipline(deps);
    expect(w.some((m) => m.includes("stale"))).toBe(true);
  });

  it("活動あり + pointer が別 plan を指す → drift warn", () => {
    const deps = withActivity();
    deps.files.set(pointerPath, JSON.stringify(pointer({ active_plan: "PLAN-L7-05-biome-debt" })));
    const w = checkHandoverDiscipline(deps);
    expect(w.some((m) => m.includes("drift"))).toBe(true);
  });

  it("活動あり + fresh pointer だが active_plan=null (完了済正常形) → drift 無音 (I-2)", () => {
    const deps = withActivity();
    deps.files.set(pointerPath, JSON.stringify(pointer({ active_plan: null })));
    expect(checkHandoverDiscipline(deps)).toEqual([]);
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

  // IMP-078 gap①: runHandover は generated_by 署名 + doc_entry_count を刻む。
  it("gap①: runHandover が CURRENT.json に generated_by + doc_entry_count を刻む", () => {
    const deps = seeded();
    const r = runHandover({ date: "2026-06-08", complete: true }, deps);
    expect(r.pointer.generated_by).toBe(GENERATED_BY);
    expect(r.pointer.doc_entry_count).toBe(1); // 新規 md = entry 1
  });
});

describe("U-HOVER-015 runHandover marker reconcile (drift 恒久解消、PLAN-L7-83)", () => {
  function seededMarker(plan = "PLAN-L7-04-handover-mechanism"): ReturnType<typeof mockDeps> {
    const deps = mockDeps();
    deps.files.set(currentPlanPath, plan);
    deps.files.set(
      join(digestDir, "PLAN-L7-04-handover-mechanism.digest.json"),
      JSON.stringify(digest()),
    );
    return deps;
  }

  it("complete=true → marker を clear し checkHandoverDiscipline が drift を出さない", () => {
    const deps = seededMarker();
    runHandover(
      { date: "2026-06-04", complete: true, planId: "PLAN-L7-04-handover-mechanism" },
      deps,
    );
    // marker は空 = clear (resolveActivePlan → null)。
    const sdeps: SessionLogDeps = {
      repoRoot: "/repo",
      now: () => NOW,
      appendLine: () => {},
      readText: (p) => deps.files.get(p) ?? null,
      writeText: () => {},
      currentBranch: () => null,
      listDir: () => [],
    };
    expect(resolveActivePlan(sdeps)).toBeNull();
    // 完了後は active plan 無し → discipline は drift を含む警告ゼロ。
    expect(checkHandoverDiscipline(deps).some((w) => w.includes("drift"))).toBe(false);
  });

  it("in_progress + --plan X → marker を X へ同期 (override drift 解消)", () => {
    const deps = seededMarker("PLAN-L7-04-handover-mechanism");
    runHandover({ date: "2026-06-04", planId: "PLAN-L7-99-other" }, deps);
    expect((deps.files.get(currentPlanPath) ?? "").split("\n")[0]).toBe("PLAN-L7-99-other");
  });

  it("plain in_progress (--plan 無し) → marker 無変更 (無駄書きしない)", () => {
    const deps = seededMarker("PLAN-L7-04-handover-mechanism");
    runHandover({ date: "2026-06-04" }, deps);
    expect(deps.files.get(currentPlanPath)).toBe("PLAN-L7-04-handover-mechanism");
  });

  it("dryRun → marker を書かない (非破壊不変)", () => {
    const deps = seededMarker("PLAN-L7-04-handover-mechanism");
    runHandover(
      { date: "2026-06-04", complete: true, planId: "PLAN-L7-04-handover-mechanism", dryRun: true },
      deps,
    );
    expect(deps.files.get(currentPlanPath)).toBe("PLAN-L7-04-handover-mechanism");
  });
});

describe("U-HOVER-011 checkHandoverBypass 署名照合 (IMP-078 gap①、state-channel-consolidation §5.2)", () => {
  function pointerJson(over: Record<string, unknown> = {}): string {
    return JSON.stringify({
      active_plan: "P",
      status: "completed",
      digest_summary: null,
      updated_at: NOW,
      ...over,
    });
  }

  it("generated_by 無し pointer → 手書き bypass warn", () => {
    const deps = mockDeps();
    deps.files.set(pointerPath, pointerJson()); // generated_by 欠落
    const w = checkHandoverBypass(deps);
    expect(w.some((m) => m.includes("bypass"))).toBe(true);
  });

  it("generated_by 一致の pointer → 警告ゼロ", () => {
    const deps = mockDeps();
    deps.files.set(pointerPath, pointerJson({ generated_by: GENERATED_BY }));
    expect(checkHandoverBypass(deps)).toEqual([]);
  });

  it("pointer 不在 → 警告ゼロ (discipline 担当)", () => {
    expect(checkHandoverBypass(mockDeps())).toEqual([]);
  });
});

describe("U-HOVER-012 session scope + latestSessionId (IMP-078 gap④)", () => {
  const sessionDir = join("/repo", ".ut-tdd", "logs", "session");

  it("scopeToSession: 指定 session が触れた digest のみへ絞る", () => {
    const deps = mockDeps();
    deps.files.set(
      join(digestDir, "PLAN-L7-16-module-drift.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-16-module-drift", sessions: ["s2"] })),
    );
    deps.files.set(
      join(digestDir, "PLAN-L7-05-biome-debt.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-05-biome-debt", sessions: ["s1"] })),
    );
    const scope = resolveHandoverScope(deps, { scopeToSession: "s2" });
    expect(scope.digests).toHaveLength(1);
    expect(scope.digests[0].plan_id).toBe("PLAN-L7-16-module-drift");
  });

  it("scopeToSession: 該当 digest 無し → 全件 fallback (空 handover 回避)", () => {
    const deps = mockDeps();
    deps.files.set(
      join(digestDir, "PLAN-L7-05-biome-debt.digest.json"),
      JSON.stringify(digest({ plan_id: "PLAN-L7-05-biome-debt", sessions: ["s1"] })),
    );
    expect(resolveHandoverScope(deps, { scopeToSession: "sX" }).digests).toHaveLength(1);
  });

  it("latestSessionId: 最新 event ts の session を返す / 不在→null", () => {
    const deps = mockDeps();
    expect(latestSessionId(deps)).toBeNull();
    deps.files.set(
      join(sessionDir, "s1.jsonl"),
      '{"ts":"2026-06-08T01:00:00Z","session_id":"s1"}\n',
    );
    deps.files.set(
      join(sessionDir, "s2.jsonl"),
      '{"ts":"2026-06-08T05:00:00Z","session_id":"s2"}\n',
    );
    expect(latestSessionId(deps)).toBe("s2");
  });
});
