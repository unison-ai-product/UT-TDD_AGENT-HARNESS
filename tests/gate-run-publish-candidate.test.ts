import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { describe, expect, it } from "vitest";

const writerModuleUrl = new URL("../src/gate/run-evidence.ts", import.meta.url).href;
const syntheticPid = 271_828;
const input = {
  gateId: "G4",
  planId: null,
  status: "passed" as const,
  checkedAt: "2026-10-29T00:00:00.000Z",
  sessionId: "candidate-u-gate-009-cross-process-race",
};

interface ChildRecord {
  kind: "ready" | "result";
  actualPid?: number;
  syntheticPid?: number;
  gateRunId?: string;
  relativePath?: string;
  published?: boolean;
  errorCode?: string;
  error?: string;
}

interface ChildHandle {
  child: ChildProcessWithoutNullStreams;
  nextLine: () => Promise<string | null>;
  close: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
  stderr: () => string;
}

interface PublishObservation {
  ready: ChildRecord[];
  results: ChildRecord[];
  directoryEntries: string[];
  artifacts: Array<{
    relativePath: string;
    exists: boolean;
    parsed: boolean;
    gateRunId?: string;
  }>;
  setupReady: boolean;
  executionComplete: boolean;
  cleanupComplete: boolean;
  diagnostics: string[];
}

function startPublisher(repoRoot: string): ChildHandle {
  const childProgram = `
    import { writeGateRunEvidence, buildGateRunEvidence } from ${JSON.stringify(writerModuleUrl)};
    const actualPid = process.pid;
    Object.defineProperty(process, "pid", { configurable: true, value: ${syntheticPid} });
    const input = ${JSON.stringify(input)};
    const evidence = buildGateRunEvidence({ repoRoot: ${JSON.stringify(repoRoot)}, ...input });
    console.log(JSON.stringify({ kind: "ready", actualPid, syntheticPid: process.pid, gateRunId: evidence.gate_run_id }));
    await new Promise((resolve) => process.stdin.once("data", resolve));
    try {
      const written = writeGateRunEvidence({ repoRoot: ${JSON.stringify(repoRoot)}, ...input });
      console.log(JSON.stringify({ kind: "result", published: true, gateRunId: written.evidence.gate_run_id, relativePath: written.path }));
    } catch (error) {
      console.log(JSON.stringify({ kind: "result", published: false, errorCode: error && typeof error === "object" && "code" in error ? error.code : undefined, error: String(error) }));
    }
  `;
  const child = spawn(process.execPath, ["--input-type=module", "-e", childProgram], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const lines = createInterface({ input: child.stdout });
  const iterator = lines[Symbol.asyncIterator]();
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });
  const close = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
    child.once("close", (code, signal) => resolve({ code, signal }));
  });

  return {
    child,
    nextLine: async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const next = await Promise.race([
          iterator.next(),
          new Promise<IteratorResult<string>>((resolve) => {
            timer = setTimeout(() => resolve({ done: true, value: "" }), 10_000);
          }),
        ]);
        return next.done ? null : next.value;
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    close,
    stderr: () => stderr,
  };
}

function parseRecord(line: string | null): ChildRecord | null {
  if (!line) return null;
  try {
    const value = JSON.parse(line) as ChildRecord;
    return value && (value.kind === "ready" || value.kind === "result") ? value : null;
  } catch {
    return null;
  }
}

async function runPublishers(count: 1 | 2): Promise<PublishObservation> {
  const diagnostics: string[] = [];
  let repoRoot = "";
  const handles: ChildHandle[] = [];
  const ready: ChildRecord[] = [];
  const results: ChildRecord[] = [];
  let setupReady = false;
  let executionComplete = false;
  let directoryEntries: string[] = [];
  let artifacts: PublishObservation["artifacts"] = [];

  try {
    repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-gate-publish-race-"));
    for (let index = 0; index < count; index += 1) handles.push(startPublisher(repoRoot));

    for (const handle of handles) {
      const record = parseRecord(await handle.nextLine());
      if (!record || record.kind !== "ready") {
        diagnostics.push(`child failed to become ready: ${handle.stderr()}`);
        break;
      }
      ready.push(record);
    }

    if (ready.length === count) {
      const pidsAreDistinct =
        count === 1 ||
        (ready[0]?.actualPid !== undefined &&
          ready[1]?.actualPid !== undefined &&
          ready[0].actualPid !== ready[1].actualPid);
      const syntheticPidsMatch = ready.every((record) => record.syntheticPid === syntheticPid);
      const idIsNonEmpty = typeof ready[0]?.gateRunId === "string" && ready[0].gateRunId.length > 0;
      const idsMatch =
        idIsNonEmpty && ready.every((record) => record.gateRunId === ready[0]?.gateRunId);
      const actualPidsMatchChildHandles = ready.every(
        (record, index) => record.actualPid === handles[index]?.child.pid,
      );
      setupReady = pidsAreDistinct && syntheticPidsMatch && idsMatch && actualPidsMatchChildHandles;

      if (!setupReady) {
        diagnostics.push(
          "barrier preconditions were not established; publish assertions were skipped",
        );
      } else {
        for (const handle of handles) handle.child.stdin.end("publish\n");
        for (const handle of handles) {
          const record = parseRecord(await handle.nextLine());
          if (!record || record.kind !== "result") {
            diagnostics.push(`child did not report a publish result: ${handle.stderr()}`);
            break;
          }
          results.push(record);
        }

        if (results.length === count) {
          const closeResults = await Promise.all(handles.map((handle) => handle.close));
          executionComplete = closeResults.every((result) => result.code === 0);
          if (!executionComplete) {
            diagnostics.push(
              ...closeResults.map(
                (result, index) => `child ${index} exit=${result.code} signal=${result.signal}`,
              ),
              ...handles.map((handle, index) => `child ${index} stderr=${handle.stderr()}`),
            );
          } else {
            const evidenceDirectory = join(repoRoot, ".ut-tdd", "gate_runs");
            if (existsSync(evidenceDirectory))
              directoryEntries = readdirSync(evidenceDirectory).sort();
            const publishedPaths = [
              ...new Set(
                results.filter((result) => result.published).map((result) => result.relativePath),
              ),
            ];
            artifacts = publishedPaths.flatMap((relativePath) => {
              if (!relativePath) return [];
              const absolutePath = join(repoRoot, ...relativePath.split("/"));
              const exists = existsSync(absolutePath);
              if (!exists) return [{ relativePath, exists: false, parsed: false }];
              const text = readFileSync(absolutePath, "utf8");
              try {
                const parsed = JSON.parse(text) as { gate_run_id?: string };
                return [
                  { relativePath, exists: true, parsed: true, gateRunId: parsed.gate_run_id },
                ];
              } catch {
                return [{ relativePath, exists: true, parsed: false }];
              }
            });
          }
        }
      }
    }
  } catch (error) {
    diagnostics.push(`setup/execution error: ${String(error)}`);
  } finally {
    for (const handle of handles) {
      if (handle.child.exitCode === null && handle.child.signalCode === null) handle.child.kill();
    }
    await Promise.all(handles.map((handle) => handle.close));
  }

  let cleanupComplete = false;
  try {
    if (repoRoot && existsSync(repoRoot)) rmSync(repoRoot, { recursive: true, force: true });
    cleanupComplete = !repoRoot || !existsSync(repoRoot);
  } catch (error) {
    diagnostics.push(`fixture cleanup error: ${String(error)}`);
  }

  return {
    ready,
    results,
    directoryEntries,
    artifacts,
    setupReady,
    executionComplete,
    cleanupComplete,
    diagnostics,
  };
}

describe("CANDIDATE-U-GATE-009 independent publish Reds", () => {
  it("CANDIDATE-U-GATE-009: validates the isolated child publisher fixture by itself", async () => {
    const observation = await runPublishers(1);
    expect(observation.setupReady).toBe(true);
    expect(observation.executionComplete).toBe(true);
    expect(observation.cleanupComplete).toBe(true);
    expect(observation.ready).toHaveLength(1);
    expect(observation.ready[0]?.syntheticPid).toBe(syntheticPid);
    expect(observation.results).toHaveLength(1);
    expect(observation.results[0]?.published).toBe(true);
    expect(observation.results[0]?.gateRunId).toBe(observation.ready[0]?.gateRunId);
    expect(observation.results[0]?.relativePath).toBeTruthy();
    expect(observation.artifacts).toEqual([
      {
        relativePath: observation.results[0]?.relativePath,
        exists: true,
        parsed: true,
        gateRunId: observation.ready[0]?.gateRunId,
      },
    ]);
    expect(observation.directoryEntries).toEqual([
      observation.results[0]?.relativePath?.split("/").at(-1),
    ]);
  });

  it.fails("CANDIDATE-U-GATE-009: races two OS processes publishing one synthetic run ID", async () => {
    let observation: PublishObservation;
    try {
      observation = await runPublishers(2);
    } catch {
      return;
    }
    if (
      !observation.setupReady ||
      !observation.executionComplete ||
      !observation.cleanupComplete ||
      observation.ready.length !== 2 ||
      observation.results.length !== 2 ||
      observation.diagnostics.length !== 0
    )
      return;

    const published = observation.results.filter((result) => result.published).length;
    const exclusiveConflicts = observation.results.filter(
      (result) => !result.published && result.errorCode === "EEXIST",
    ).length;
    expect({ published, exclusiveConflicts }).toEqual({ published: 1, exclusiveConflicts: 1 });
    const publishedPaths = observation.results
      .filter((result) => result.published)
      .map((result) => result.relativePath);
    if (publishedPaths.length === 2) expect(publishedPaths[0]).toBe(publishedPaths[1]);
    expect(publishedPaths).toHaveLength(1);
    expect(publishedPaths[0]).toBeTruthy();
    expect(observation.artifacts).toEqual([
      {
        relativePath: publishedPaths[0],
        exists: true,
        parsed: true,
        gateRunId: observation.ready[0]?.gateRunId,
      },
    ]);
    expect(observation.directoryEntries).toEqual([publishedPaths[0]?.split("/").at(-1)]);
    expect(observation.diagnostics).toEqual([]);
  });
});
