import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  type GitCommandPort,
  type GitExecFile,
  NodeGitCommandPort,
  TrustedGitBlobResolver,
} from "../src/git/trusted-git-blob-resolver.js";
import { analyzeDependencyDrift, loadDependencyDriftInput } from "../src/lint/dependency-drift.js";

const root = process.cwd();
const commitOid = "a".repeat(40);
const blobOid = "b".repeat(40);
const sourcePath = "docs/plans/PLAN $(literal);[x].md";

describe("TrustedGitBlobResolver", () => {
  it("U-GITBLOB-001: commitとexact pathをblobへ束縛しcommand順を固定する", () => {
    const bytes = Buffer.from([0, 1, 2, 255]);
    const git: GitCommandPort = {
      run: vi
        .fn()
        .mockReturnValueOnce(Buffer.from(`${commitOid}\n`))
        .mockReturnValueOnce(Buffer.from(`100644 blob ${blobOid}\t${sourcePath}\0`))
        .mockReturnValueOnce(bytes),
    };

    expect(new TrustedGitBlobResolver(git).resolve("HEAD", sourcePath)).toEqual({
      commitOid,
      sourcePath,
      blobOid,
      bytes,
    });
    expect(git.run).toHaveBeenNthCalledWith(1, ["rev-parse", "--verify", "HEAD^{commit}"]);
    expect(git.run).toHaveBeenNthCalledWith(2, ["ls-tree", "-z", commitOid, "--", sourcePath]);
    expect(git.run).toHaveBeenNthCalledWith(3, ["cat-file", "blob", blobOid]);
  });

  it.each([
    ["commit不存在", [new Error("missing")], "trusted-git-commit-not-found"],
    ["commit OID不正", [Buffer.from("not-a-commit\n")], "trusted-git-commit-oid-invalid"],
    [
      "path不存在",
      [Buffer.from(`${commitOid}\n`), Buffer.alloc(0)],
      "trusted-git-source-not-found",
    ],
    [
      "path複数",
      [
        Buffer.from(`${commitOid}\n`),
        Buffer.from(`100644 blob ${blobOid}\t${sourcePath}\0` + `100644 blob ${blobOid}\tother\0`),
      ],
      "trusted-git-source-not-found",
    ],
    [
      "NUL終端欠落",
      [Buffer.from(`${commitOid}\n`), Buffer.from(`100644 blob ${blobOid}\t${sourcePath}`)],
      "trusted-git-source-record-invalid",
    ],
    [
      "blob OID不正",
      [Buffer.from(`${commitOid}\n`), Buffer.from(`100644 blob b\t${sourcePath}\0`)],
      "trusted-git-source-not-blob",
    ],
    [
      "非blob",
      [Buffer.from(`${commitOid}\n`), Buffer.from(`040000 tree ${blobOid}\t${sourcePath}\0`)],
      "trusted-git-source-not-blob",
    ],
    [
      "非regular blob",
      [Buffer.from(`${commitOid}\n`), Buffer.from(`120000 blob ${blobOid}\t${sourcePath}\0`)],
      "trusted-git-source-not-blob",
    ],
    [
      "path差替え",
      [Buffer.from(`${commitOid}\n`), Buffer.from(`100644 blob ${blobOid}\tother.md\0`)],
      "trusted-git-source-path-mismatch",
    ],
    [
      "blob read失敗",
      [
        Buffer.from(`${commitOid}\n`),
        Buffer.from(`100644 blob ${blobOid}\t${sourcePath}\0`),
        new Error("unreadable"),
      ],
      "trusted-git-blob-unreadable",
    ],
  ])("U-GITBLOB-002: %sをfail-closeする", (_case, outputs, error) => {
    const queue = [...outputs];
    const git: GitCommandPort = {
      run: () => {
        const output = queue.shift();
        if (output instanceof Error) throw output;
        return output as Buffer;
      },
    };
    expect(() => new TrustedGitBlobResolver(git).resolve("HEAD", sourcePath)).toThrow(error);
  });

  it("U-GITBLOB-003: metacharacter pathを単一argvで渡しNode adapterを非shell・非表示にする", () => {
    const calls: readonly string[][] = [];
    const mutableCalls = calls as string[][];
    const outputs = [
      Buffer.from(`${commitOid}\n`),
      Buffer.from(`100644 blob ${blobOid}\t${sourcePath}\0`),
      Buffer.from("body"),
    ];
    new TrustedGitBlobResolver({
      run: (args) => {
        mutableCalls.push([...args]);
        return outputs.shift() as Buffer;
      },
    }).resolve("HEAD; echo injected", sourcePath);

    expect(calls[0]).toEqual(["rev-parse", "--verify", "HEAD; echo injected^{commit}"]);
    expect(calls[1]?.at(-1)).toBe(sourcePath);
    const exec = vi.fn(() => Buffer.from("ok")) as GitExecFile;
    expect(new NodeGitCommandPort("C:/repo", exec).run(["status", "$(literal)"])).toEqual(
      Buffer.from("ok"),
    );
    expect(exec).toHaveBeenCalledWith("git", ["status", "$(literal)"], {
      cwd: "C:/repo",
      encoding: "buffer",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  });

  it("U-GITBLOB-004: shared resolverの依存・複製・consumer cycleを禁止する", () => {
    const sources = collectTypeScript(resolve(root, "src"));
    const shared = readFileSync(resolve(root, "src/git/trusted-git-blob-resolver.ts"), "utf8");
    expect(shared).not.toMatch(/from ["']\.\.\/(?:plan-admission|plan-asset)\//);

    const declarations = [...sources.entries()].filter(([, source]) =>
      /class\s+TrustedGitBlobResolver\b/.test(source),
    );
    expect(declarations.map(([path]) => relative(root, path).replaceAll("\\", "/"))).toEqual([
      "src/git/trusted-git-blob-resolver.ts",
    ]);

    const admission = readFileSync(
      resolve(root, "src/plan-admission/trusted-git-blob-resolver.ts"),
      "utf8",
    );
    const asset = readFileSync(
      resolve(root, "src/plan-asset/application/node-genesis-adoption-runner.ts"),
      "utf8",
    );
    expect(admission).toContain('from "../git/trusted-git-blob-resolver.js"');
    expect(asset).toContain('from "../../git/trusted-git-blob-resolver.js"');
    expect(asset).not.toMatch(/from ["']\.\.\/\.\.\/plan-admission\//);
    expect(admission).not.toMatch(/plan-asset/);
    expect(
      analyzeDependencyDrift(loadDependencyDriftInput(root)).findings.filter(
        (finding) => finding.code === "module-cycle",
      ),
    ).toEqual([]);
  });
});

function collectTypeScript(directory: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      for (const item of collectTypeScript(path)) result.set(...item);
    } else if (entry.name.endsWith(".ts")) {
      result.set(path, readFileSync(path, "utf8"));
    }
  }
  return result;
}
