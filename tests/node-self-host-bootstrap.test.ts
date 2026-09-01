import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as bootstrap from "../src/runtime/node-bootstrap.ts";

const root = process.cwd();

// chmodTree が seal した generation は read-only (dirs 0555 / files 0444) のため、
// テスト後始末の rmSync が Linux で EACCES になる。掃除前に書込権を戻す test-only helper。
// production の immutability (chmodTree) には触れない。
function rmTestDist(path: string): void {
  const restoreWritable = (target: string): void => {
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(target);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      chmodSync(target, 0o755);
      for (const entry of readdirSync(target)) restoreWritable(join(target, entry));
    } else {
      chmodSync(target, 0o644);
    }
  };
  restoreWritable(path);
  rmSync(path, { recursive: true, force: true });
}
const candidate = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
let generation: bootstrap.NodeGeneration;
const build = (
  options: {
    nodePath?: string;
    npmCliPath?: string;
    fault?: (barrier: string) => void;
    compileInputs?: Record<string, unknown>;
  } = {},
) =>
  bootstrap.buildNodeGeneration({
    repoRoot: root,
    candidateRevision: candidate,
    nodePath: options.nodePath,
    npmCliPath: options.npmCliPath,
    fault: options.fault,
    compile: async (outfile) => {
      writeFileSync(outfile, "export default 1;\n", "utf8");
      return { inputs: options.compileInputs ?? { "src/cli.ts": {} } };
    },
  });

describe("F0b sealed Node producer candidate oracles", () => {
  beforeAll(async () => {
    rmTestDist(resolve(root, "dist"));
    generation = await build();
  });
  afterAll(() => {
    rmTestDist(resolve(root, "dist"));
  });

  it("CAND-NODEBOOT-001/102 seals and reloads one immutable receipt", () => {
    expect(generation.receipt.subject_revision).toBe(candidate);
    expect(generation.receipt.runtime).toBe("node");
    expect(generation.receipt.builder.policy).toBe("compiled-esm-only");
    expect(Object.isFrozen(generation.receipt)).toBe(true);
    expect(
      bootstrap.verifyNodeGeneration(root, generation.generationPath, candidate).receipt
        .receipt_digest,
    ).toBe(generation.receipt.receipt_digest);
  });
  it("CAND-NODEBOOT-002 missing receipt fails closed", () => {
    expect(() =>
      bootstrap.verifyNodeGeneration(
        root,
        resolve(root, "dist/node-generations/missing"),
        candidate,
      ),
    ).toThrow(/receipt-invalid/);
  });
  it("CAND-NODEBOOT-003 compiled byte drift is rejected", () => {
    chmodSync(generation.compiledCliPath, 0o644);
    writeFileSync(
      generation.compiledCliPath,
      `${readFileSync(generation.compiledCliPath, "utf8")}drift`,
      "utf8",
    );
    expect(() =>
      bootstrap.verifyNodeGeneration(root, generation.generationPath, candidate),
    ).toThrow(/cli-digest-mismatch/);
  });
  it("CAND-NODEBOOT-004/008 invocation stays shell-free and absolute", () => {
    const invocation = bootstrap.createNodeInvocation(generation, ["status"]);
    expect(invocation.options).toEqual({ shell: false, windowsHide: true });
    expect(invocation.args[0]).toBe(generation.compiledCliPath);
    expect(generation.nodePath).toMatch(/^[A-Za-z]:[\\/]|^\//);
    expect(generation.compiledCliPath).toMatch(/^[A-Za-z]:[\\/]|^\//);
  });
  it.each([
    ["CAND-NODEBOOT-005", "publishActivation"],
    ["CAND-NODEBOOT-010", "loadNodeGeneration"],
    ["CAND-NODEBOOT-011", "activateNodeGeneration"],
    ["CAND-NODEBOOT-014", "deleteNodeGeneration"],
    ["CAND-NODEBOOT-015", "rollbackNodeGeneration"],
  ])("%s activation/deletion surface is absent", (_id, name) => {
    expect(name in bootstrap).toBe(false);
  });
  it("CAND-NODEBOOT-006/009 substituted npm path is rejected", async () => {
    await expect(build({ npmCliPath: generation.nodePath })).rejects.toThrow(/npm-path-invalid/);
  });
  it("CAND-NODEBOOT-007 substituted Node executable is rejected", async () => {
    await expect(build({ nodePath: generation.compiledCliPath })).rejects.toThrow(/runtime/);
  });
  it("CAND-NODEBOOT-012/013 lease crash residue blocks the next publisher", async () => {
    rmTestDist(resolve(root, "dist"));
    await expect(
      build({
        fault: (barrier) => {
          if (barrier === "generation-staged") throw new Error("crash");
        },
      }),
    ).rejects.toThrow("crash");
    expect(existsSync(resolve(root, bootstrap.NODE_LEASE))).toBe(true);
    await expect(build()).rejects.toThrow(/publish-lease-busy/);
    rmTestDist(resolve(root, "dist"));
    generation = await build();
  });
  it("CAND-NODEBOOT-016 does not claim unsupported power-loss durability", () => {
    expect("power_loss_durable" in generation.receipt).toBe(false);
  });
  it("CAND-NODEBOOT-018/205 rejects untracked compile input", async () => {
    await expect(build({ compileInputs: { "../untracked.ts": {} } })).rejects.toThrow(
      /source-path-escape|source-untracked/,
    );
  });
});
