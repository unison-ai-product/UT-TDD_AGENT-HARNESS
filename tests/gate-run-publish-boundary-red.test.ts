import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { createInterface } from "node:readline";
import {
  buildGateRunEvidence,
  type GateRunEvidence,
  type WrittenGateRunEvidence,
  writeGateRunEvidence,
} from "../src/gate/run-evidence.ts";
import { collectGateRunEvidenceProjection } from "../src/state-db/gate-run-evidence-projection.ts";
import { describe, expect, heavyAfterAll, heavyBeforeAll, it } from "./support/hook-bounds.ts";
import { removeTestTree } from "./support/temp-tree.ts";

const input = {
  gateId: "G0.5",
  status: "passed",
  checkedAt: "2026-11-19T10:00:00.000Z",
  sessionId: "gate-publish-boundary-fixture",
} as const;
const childPath = join(process.cwd(), "tests/support/gate-publish-child.mjs");
const deadline = 20_000;

function directory(root: string) {
  return join(root, ".ut-tdd", "gate_runs");
}

function finals(root: string) {
  return readdirSync(directory(root)).filter((name) => name.endsWith(".json"));
}

function assertPublished(root: string, written: WrittenGateRunEvidence) {
  const final = join(root, written.path);
  expect(dirname(final)).toBe(directory(root));
  expect(finals(root)).toEqual([basename(final)]);
  expect(JSON.parse(readFileSync(final, "utf8"))).toEqual(written.evidence);
}

function inspectStaging(root: string, staged: string, final: string, evidence: GateRunEvidence) {
  expect(dirname(staged)).toBe(directory(root));
  expect(dirname(final)).toBe(directory(root));
  expect(basename(staged)).toMatch(/^\.tmp-/);
  expect(basename(final)).toMatch(/^[0-9a-f]{64}\.json$/);
  expect(existsSync(final)).toBe(false);
  const bytes = readFileSync(staged, "utf8");
  expect(JSON.parse(bytes)).toEqual(evidence);
  return bytes;
}

type ChildReport =
  | { kind: "before-link"; pid: number; staged: string; final: string; evidence: GateRunEvidence }
  | { kind: "published"; pid: number; written: WrittenGateRunEvidence };

async function runCrashFixture(root: string) {
  const child = spawn(process.execPath, [childPath, "hold"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const lines = createInterface({ input: child.stdout });
  child.stderr.resume();
  const closed = once(child, "close", { signal: AbortSignal.timeout(deadline + 5_000) });
  // Spawn errors are checked by the awaited close promise even if no line arrives.
  closed.catch(() => {});
  try {
    const [line] = await once(lines, "line", { signal: AbortSignal.timeout(deadline) });
    const report = JSON.parse(line) as ChildReport;
    expect(report.pid).toBe(child.pid);
    if (report.kind === "published") {
      expect(await closed).toEqual([0, null]);
      assertPublished(root, report.written);
      return "published-before-pause";
    }
    expect(report.kind).toBe("before-link");
    const bytes = inspectStaging(root, report.staged, report.final, report.evidence);
    expect(child.kill("SIGKILL")).toBe(true);
    expect(await closed).toEqual([null, "SIGKILL"]);
    expect(existsSync(report.final)).toBe(false);

    const retry = spawnSync(process.execPath, [childPath, "retry"], {
      cwd: root,
      encoding: "utf8",
      timeout: deadline,
      windowsHide: true,
    });
    expect(retry.error).toBeUndefined();
    expect(retry.signal).toBeNull();
    expect(retry.status, retry.stderr).toBe(0);
    const published = JSON.parse(retry.stdout) as ChildReport;
    if (published.kind !== "published") throw new Error("retry did not report publication");
    expect(published.written.evidence.gate_run_id).not.toBe(report.evidence.gate_run_id);
    expect(readFileSync(report.staged, "utf8")).toBe(bytes);
    assertPublished(root, published.written);

    const projection = collectGateRunEvidenceProjection(root, {
      asString: (value) => (typeof value === "string" && value ? value : null),
    });
    expect(projection.findings).toEqual([]);
    expect(projection.gateRuns.map((row) => row.gate_run_id)).toEqual([
      published.written.evidence.gate_run_id,
    ]);
    return "killed-before-link-and-retried";
  } finally {
    lines.close();
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await closed.catch(() => {});
  }
}

describe("gate-run evidence writer publication boundaries", () => {
  const roots: string[] = [];
  let injectedLinkCalls = 0;
  let beforeLinkCalls = 0;
  let crashResult: Awaited<ReturnType<typeof runCrashFixture>>;
  function fixture() {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-gate-writer-publish-"));
    roots.push(root);
    return root;
  }

  heavyBeforeAll("db", async () => {
    const control = fixture();
    assertPublished(control, writeGateRunEvidence({ ...input, repoRoot: control }));

    const unsupported = fixture();
    const injected = Object.assign(new Error("fixture ENOTSUP"), { code: "ENOTSUP" });
    const unsupportedInput = { ...input, repoRoot: unsupported };
    let successful: WrittenGateRunEvidence | undefined;
    let thrown: unknown;
    try {
      successful = writeGateRunEvidence(unsupportedInput, {
        link(staged, final) {
          injectedLinkCalls++;
          inspectStaging(unsupported, staged, final, buildGateRunEvidence(unsupportedInput));
          throw injected;
        },
      });
    } catch (error) {
      thrown = error;
    }
    if (injectedLinkCalls === 0) {
      expect(thrown).toBeUndefined();
      if (!successful) throw new Error("ordinary writer returned no evidence");
      assertPublished(unsupported, successful);
    } else {
      expect(thrown).toBe(injected);
      expect(finals(unsupported)).toEqual([]);
    }

    const before = fixture();
    const beforeInput = { ...input, repoRoot: before };
    let observedFinal: string | undefined;
    const written = writeGateRunEvidence(beforeInput, {
      beforeLink(staged, final) {
        beforeLinkCalls++;
        inspectStaging(before, staged, final, buildGateRunEvidence(beforeInput));
        observedFinal = final;
      },
    });
    assertPublished(before, written);
    if (observedFinal) expect(join(before, written.path)).toBe(observedFinal);
    crashResult = await runCrashFixture(fixture());
  });

  heavyAfterAll("teardown", () => {
    for (const root of roots) removeTestTree(root);
  });

  it("U-GATEPUB-002: calls the injected hard link exactly once", () => {
    expect(injectedLinkCalls).toBe(1);
  });

  it("U-GATEPUB-003: observes the complete staging JSON before the hard link", () => {
    expect(beforeLinkCalls).toBe(1);
  });

  it("U-GATEPUB-004: terminates the writer before link and projects only retry", () => {
    expect(crashResult).toBe("killed-before-link-and-retried");
  });
});
