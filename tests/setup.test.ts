import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyBranchProtection,
  detectProjectScale,
  emitSetup,
  type ProjectScale,
  planSetup,
  recommendPhase,
  recordSetupState,
  runSetup,
  type SetupDeps,
  type SetupState,
  type TemplateSet,
} from "../src/setup/index";

/** in-memory file store + gh 呼び出し記録の mock deps (now 固定で決定論)。 */
function mockDeps(
  over: Partial<SetupDeps> = {},
): SetupDeps & { files: Map<string, string>; ghCalls: string[][] } {
  const files = new Map<string, string>();
  const ghCalls: string[][] = [];
  return {
    files,
    ghCalls,
    repoRoot: "/repo",
    now: () => "2026-06-02T00:00:00.000Z",
    gh: (args) => {
      ghCalls.push(args);
      return { ok: false, stdout: "" }; // 既定: gh 使えない
    },
    readText: (p) => files.get(p) ?? null,
    writeText: (p, c) => files.set(p, c),
    confirm: () => false,
    isInteractive: false,
    templates: {},
    ...over,
  };
}

const codeownersPath = join("/repo", ".github", "CODEOWNERS");
const statePath = join("/repo", ".ut-tdd", "state", "setup.json");

/** org + 4 collaborators + protection あり + admin を返す gh mock。 */
const ghTeam = (args: string[]): { ok: boolean; stdout: string } => {
  const key = args.join(" ");
  if (key === "api repos/{owner}/{repo}")
    return {
      ok: true,
      stdout: JSON.stringify({ owner: { type: "Organization" }, permissions: { admin: true } }),
    };
  if (key === "api repos/{owner}/{repo}/collaborators")
    return { ok: true, stdout: JSON.stringify([{}, {}, {}, {}]) };
  if (key === "api repos/{owner}/{repo}/branches/main/protection")
    return { ok: true, stdout: "{}" };
  if (key === "auth status") return { ok: true, stdout: "logged in" };
  return { ok: false, stdout: "" };
};

const baseTemplates: TemplateSet = {
  "common/harness-check.yml": "name: harness-check\n",
  "common/commitlint.config.js":
    "module.exports = { extends: ['@commitlint/config-conventional'] };\n",
  "common/escalation-stale.yml": "name: escalation-stale\n",
  "common/recovery.md": "# Recovery\n",
  "common/add-feature.md": "# Add-feature\n",
  "common/PULL_REQUEST_TEMPLATE.md": "## 概要\nCloses #\n",
  "team/CODEOWNERS": "* {{TL_TEAM}}\n/docs/ {{PO_TEAM}}\n/tests/ {{QA_TEAM}}\n",
  "team/setup-branch-protection.sh":
    "#!/usr/bin/env bash\ngh api -X PUT repos/{owner}/{repo}/branches/main/protection --input protection.json\n",
};

describe("setup solo/team (PLAN-L7-03 add-impl / U-SETUP)", () => {
  it("U-SETUP-001: detectProjectScale は never-throws / org 検出 / gh 失敗で unknown+null", () => {
    // org + collaborators + protection
    const org = mockDeps({ gh: ghTeam });
    const s = detectProjectScale(org);
    expect(s.ownerType).toBe("Organization");
    expect(s.collaborators).toBe(4);
    expect(s.hasBranchProtection).toBe(true);

    // gh 全失敗 (未認証/不在) → unknown / null、token 非読取、throw しない
    const down = mockDeps(); // 既定 gh = ok:false
    let scale: ProjectScale | undefined;
    expect(() => {
      scale = detectProjectScale(down);
    }).not.toThrow();
    expect(scale).toEqual({
      ownerType: "unknown",
      collaborators: null,
      hasCodeowners: false,
      hasBranchProtection: null,
    });

    // 既存 CODEOWNERS はローカル file で検出 (gh 不要)
    const local = mockDeps();
    local.files.set(codeownersPath, "* @team\n");
    expect(detectProjectScale(local).hasCodeowners).toBe(true);
  });

  it("U-SETUP-002: recommendPhase 純関数 / team・solo・fallback 信号", () => {
    const base: ProjectScale = {
      ownerType: "User",
      collaborators: 1,
      hasCodeowners: false,
      hasBranchProtection: false,
    };
    // team 信号
    expect(recommendPhase({ ...base, ownerType: "Organization" })).toMatchObject({
      phase: "0-B",
      confidence: "high",
    });
    expect(recommendPhase({ ...base, collaborators: 3 })).toMatchObject({ phase: "0-B" });
    expect(recommendPhase({ ...base, hasCodeowners: true })).toMatchObject({ phase: "0-B" });
    expect(recommendPhase({ ...base, hasBranchProtection: true })).toMatchObject({ phase: "0-B" });
    // solo (User + collaborators<=1)
    expect(recommendPhase(base)).toMatchObject({ phase: "0-A", confidence: "high" });
    // 不明信号 → solo low (安全フォールバック)
    expect(
      recommendPhase({
        ownerType: "unknown",
        collaborators: null,
        hasCodeowners: false,
        hasBranchProtection: null,
      }),
    ).toMatchObject({ phase: "0-A", confidence: "low" });
    // null 単独 (User だが collaborators 取得不可) → 0-B にしない
    expect(
      recommendPhase({
        ownerType: "User",
        collaborators: null,
        hasCodeowners: false,
        hasBranchProtection: null,
      }),
    ).toMatchObject({ phase: "0-A", confidence: "low" });
  });

  it("U-SETUP-003: planSetup 0-A=A のみ / 0-B=A+CODEOWNERS+bp script / teams 反映 / applied=false", () => {
    const solo = planSetup("0-A", { dryRun: false });
    expect(solo.files.every((f) => f.category === "A")).toBe(true);
    expect(solo.files.some((f) => f.path.endsWith("CODEOWNERS"))).toBe(false);
    expect(solo.actions).toEqual([]);

    const team = planSetup("0-B", {
      dryRun: false,
      teams: { tl: "@org/tl", qa: "@org/qa", po: "@org/po" },
    });
    expect(team.files.some((f) => f.path.endsWith("CODEOWNERS") && f.category === "B")).toBe(true);
    expect(team.files.some((f) => f.path.includes("setup-branch-protection.sh"))).toBe(true);
    // teams 名が CODEOWNERS GeneratedFile に反映
    const co = team.files.find((f) => f.path.endsWith("CODEOWNERS"));
    expect(co?.purpose).toContain("@org/tl");
    // action は宣言されるが applied=false (適用は別関数)
    expect(team.actions).toEqual([
      {
        kind: "branch-protection",
        script_path: join("scripts", "setup-branch-protection.sh"),
        applied: false,
      },
    ]);
  });

  it("U-SETUP-004: emitSetup dryRun 非書込 / 書込 / token 非埋込 / team 名 render", () => {
    // dryRun → 書かず path 一覧
    const dry = mockDeps({ templates: baseTemplates });
    const plan = planSetup("0-A", { dryRun: true });
    const paths = emitSetup(plan, baseTemplates, dry);
    expect(paths.length).toBe(plan.files.length);
    expect([...dry.files.keys()].length).toBe(0); // 何も書いていない

    // 書込
    const wet = mockDeps({ templates: baseTemplates });
    const teamPlan = planSetup("0-B", {
      dryRun: false,
      teams: { tl: "@org/tl-team", qa: "@org/qa-team", po: "@org/po-team" },
    });
    const written = emitSetup(teamPlan, baseTemplates, wet);
    expect(written).toContain(join(".github", "CODEOWNERS"));
    const co = wet.files.get(join("/repo", ".github", "CODEOWNERS")) as string;
    // team 名 render: プレースホルダ解決 / token 非含
    expect(co).toContain("@org/tl-team");
    expect(co).not.toContain("{{TL_TEAM}}");
    for (const v of wet.files.values()) {
      expect(v.toLowerCase()).not.toMatch(/(ghp_|github_pat_|token=|bearer )/);
    }
  });

  it("U-SETUP-005: recordSetupState signals 4 フィールド strip / 上書き / token 非含", () => {
    const deps = mockDeps();
    const dirty = {
      ownerType: "Organization",
      collaborators: 4,
      hasCodeowners: true,
      hasBranchProtection: true,
      token: "ghp_secret", // 混入を試みる余分フィールド
    } as unknown as ProjectScale;
    recordSetupState(
      { phase: "0-B", decidedAt: "2026-06-02T00:00:00.000Z", decidedBy: "confirm", signals: dirty },
      deps,
    );
    const stored = JSON.parse(deps.files.get(statePath) as string) as SetupState;
    expect(Object.keys(stored.signals).sort()).toEqual([
      "collaborators",
      "hasBranchProtection",
      "hasCodeowners",
      "ownerType",
    ]);
    expect(deps.files.get(statePath)).not.toContain("ghp_secret"); // 余分フィールド strip
    expect(stored.phase).toBe("0-B");

    // 再実行 (phase 変更) → 上書きで最新のみ
    recordSetupState(
      { phase: "0-A", decidedAt: "2026-06-03T00:00:00.000Z", decidedBy: "flag", signals: dirty },
      deps,
    );
    const re = JSON.parse(deps.files.get(statePath) as string) as SetupState;
    expect(re.phase).toBe("0-A"); // append でなく上書き
  });

  it("U-SETUP-006: applyBranchProtection emit-only 既定 / 非対話封鎖 / 非 admin", () => {
    const plan = planSetup("0-B", { dryRun: false });

    // apply≠true → emit-only、gh 呼ばれない
    const d1 = mockDeps({ isInteractive: true, gh: ghTeam });
    expect(applyBranchProtection(plan, d1, { apply: false })).toEqual({
      applied: false,
      reason: "emit-only",
    });
    expect(d1.ghCalls.length).toBe(0);

    // 非対話 + apply=true → non-interactive、gh 呼ばれない (ガバナンス封鎖)
    const d2 = mockDeps({ isInteractive: false, gh: ghTeam, confirm: () => true });
    expect(applyBranchProtection(plan, d2, { apply: true })).toEqual({
      applied: false,
      reason: "non-interactive",
    });
    expect(d2.ghCalls.length).toBe(0);

    // 対話 + 認証ありだが admin でない → not-admin
    const ghNoAdmin = (args: string[]) => {
      const key = args.join(" ");
      if (key === "auth status") return { ok: true, stdout: "" };
      if (key === "api repos/{owner}/{repo}")
        return { ok: true, stdout: JSON.stringify({ permissions: { admin: false } }) };
      return { ok: false, stdout: "" };
    };
    const d3 = mockDeps({ isInteractive: true, gh: ghNoAdmin, confirm: () => true });
    expect(applyBranchProtection(plan, d3, { apply: true })).toEqual({
      applied: false,
      reason: "not-admin",
    });
  });

  it("U-SETUP-007: runSetup 優先順 (flag > confirm > fallback) + 非対話 apply 封鎖", () => {
    // ① フラグあり → フラグ値採用
    const f = mockDeps({ templates: baseTemplates, isInteractive: true });
    expect(
      runSetup(
        {
          phase: "0-B",
          dryRun: true,
          applyBranchProtection: false,
          teams: { tl: "@a", qa: "@b", po: "@c" },
        },
        f,
      ).phase,
    ).toBe("0-B");

    // ② フラグ無し + 対話 + confirm yes → 推奨 phase (ここでは org 検出 → 0-B)
    const c = mockDeps({
      templates: baseTemplates,
      isInteractive: true,
      gh: ghTeam,
      confirm: () => true,
    });
    expect(runSetup({ dryRun: true, applyBranchProtection: false }, c).phase).toBe("0-B");

    // ③ フラグ無し + 非対話 → 0-A fallback
    const nb = mockDeps({ templates: baseTemplates, isInteractive: false, gh: ghTeam });
    const r3 = runSetup({ dryRun: true, applyBranchProtection: false }, nb);
    expect(r3.phase).toBe("0-A");
    expect(JSON.parse(nb.files.get(statePath) as string).decidedBy).toBe("fallback");

    // ④ apply=true + 非対話 → branchProtection.applied=false
    const a = mockDeps({ templates: baseTemplates, isInteractive: false, gh: ghTeam });
    const r4 = runSetup({ phase: "0-B", dryRun: true, applyBranchProtection: true }, a);
    expect(r4.branchProtection.applied).toBe(false);
    expect(r4.branchProtection.reason).toBe("non-interactive");
  });
});
