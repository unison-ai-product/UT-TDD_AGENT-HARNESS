import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  transformCleanDistributionArtifact,
} from "../src/setup/distribution.ts";
import {
  digestConsumerRuntimeBytes,
  digestMaterializedReleaseEntries,
} from "../src/setup/index.ts";

// L7 §2: no source line may match the email shape, so addresses are joined at runtime.
const at = "@";
const mail = (local: string, domain: string) => [local, domain].join(at);
const P = mail("alice", "mail-provider.jp");
const D = "example-private-repo";
const BASELINE_PATH = "docs/governance/privacy-scan-baseline.json";
const DENYLIST = [".ut-tdd", "privacy-denylist.txt"];
const TAG = "v0.0.0-test";

let authorRoot = "";
let scratchRoot = "";

function git(cwd: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", env, windowsHide: true }).trim();
}

function write(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text, "utf8");
}

function makeHome(label: string, denylist: string | null): string {
  const home = join(scratchRoot, label);
  mkdirSync(join(home, DENYLIST[0]), { recursive: true });
  if (denylist !== null) writeFileSync(join(home, ...DENYLIST), denylist, "utf8");
  return home;
}

function walkFiles(root: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!existsSync(root)) return out;
  const visit = (directory: string, prefix: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = join(directory, entry.name);
      if (entry.isDirectory()) visit(abs, rel);
      else out.set(rel, readFileSync(abs, "latin1"));
    }
  };
  visit(root, "");
  return out;
}

function changedFiles(
  before: Map<string, string>,
  after: Map<string, string>,
): Map<string, string> {
  return new Map([...after].filter(([path, text]) => before.get(path) !== text));
}

/** A v2 release manifest whose only release points at `artifactSourceCommit` (both channels). */
function releaseManifest(artifactSourceCommit: string): Record<string, unknown> {
  const content = Buffer.from("export const fixture = true;\n", "utf8");
  const artifacts = [
    {
      sourcePath: "src/artifact.ts",
      destinationPath: "src/artifact.ts",
      mode: "100644" as const,
      size: content.length,
      contentDigest: digestConsumerRuntimeBytes(content),
    },
  ];
  const artifactSetDigest = digestMaterializedReleaseEntries([
    { path: "src/artifact.ts", mode: "100644", content },
  ]);
  const base = {
    materializerVersion: "1",
    artifactSourceCommit,
    artifactSetDigest,
    artifactInventoryDigest: deriveArtifactInventoryDigest(artifacts),
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    artifacts,
  };
  const releaseId = deriveReleaseId("1", artifactSourceCommit, artifactSetDigest);
  return {
    schema_version: "v2",
    releases: { [releaseId]: { ...base, releaseRecordDigest: deriveReleaseRecordDigest(base) } },
    channels: { canary: releaseId, stable: releaseId },
    channelOrder: ["canary", "stable"],
  };
}

/**
 * Copies the clean Pack artifact set of the execution snapshot into a temp git repository.
 * The artifacts are commit c1; c2 adds a release manifest bound to c1 and carries TAG, so
 * `package` scans the tag snapshot (L6 §2 / §11) and `sync-pack` scans the HEAD tree.
 */
function cleanSource(label: string, readmeSuffix: string): string {
  const root = join(scratchRoot, label);
  const sourcePaths = git(authorRoot, ["ls-files"]).split(/\r?\n/).filter(Boolean);
  const plan = buildCleanDistributionPlan({ paths: sourcePaths, sourceTag: TAG });
  for (const rel of plan.artifactPaths) {
    const from = join(authorRoot, cleanDistributionSourcePath(rel, sourcePaths));
    const to = join(root, rel);
    mkdirSync(dirname(to), { recursive: true });
    if (rel === "package.json") {
      writeFileSync(to, transformCleanDistributionArtifact(rel, readFileSync(from, "utf8")));
    } else {
      cpSync(from, to, { recursive: true });
    }
  }
  const readme = join(root, "README.md");
  writeFileSync(readme, `${readFileSync(readme, "utf8")}\n${readmeSuffix}\n`, "utf8");
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["config", "user.email", mail("test", "example.invalid")]);
  git(root, ["config", "user.name", "Privacy Scan Test"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "clean artifacts"]);
  const artifactSource = git(root, ["rev-parse", "HEAD"]);
  write(root, "release/manifest.yaml", stringify(releaseManifest(artifactSource)));
  git(root, ["add", "--", "release/manifest.yaml"]);
  git(root, ["commit", "-q", "-m", "release manifest"]);
  git(root, ["tag", TAG]);
  return root;
}

function runDistribution(cwd: string, home: string, args: string[]) {
  return spawnSync(process.execPath, [join(authorRoot, "src", "cli.ts"), "distribution", ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, HOME: home, USERPROFILE: home },
    timeout: 300_000,
    windowsHide: true,
  });
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type ScanJson = { ok: boolean; findings: Record<string, unknown>[] };
const privacyJson = (stdout: string) => (parseJson(stdout)?.privacyScan ?? null) as ScanJson | null;
const kinds = (scan: ScanJson | null) => (scan?.findings ?? []).map((finding) => finding.kind);

beforeAll(() => {
  authorRoot = process.cwd();
  scratchRoot = mkdtempSync(join(tmpdir(), "privacy-scan-integration-"));
});

afterAll(() => {
  if (scratchRoot) rmSync(scratchRoot, { recursive: true, force: true });
});

describe("privacy scan candidate oracles (distribution)", () => {
  it("U-PRIVSCAN-014: distribution stops before writing when the Pack scan fails", () => {
    const denyHome = makeHome("d-home", `${D}\n`);
    const emailSource = cleanSource("d-email", P);
    const packDir = join(scratchRoot, "d-pack");
    mkdirSync(packDir, { recursive: true });
    const sync = runDistribution(emailSource, denyHome, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--json",
    ]);
    expect(sync.status).toBe(1);
    expect(readdirSync(packDir)).toEqual([]);
    const scan = privacyJson(sync.stdout);
    expect(scan?.ok).toBe(false);
    expect(kinds(scan)).toContain("privacy-email-hit");
    for (const finding of scan?.findings ?? []) {
      expect(
        Object.keys(finding).every((key) => ["location", "line", "kind", "reason"].includes(key)),
      ).toBe(true);
    }
    const releaseDir = join(scratchRoot, "d-release");
    const pkg = runDistribution(emailSource, denyHome, [
      "package",
      "--tag",
      TAG,
      "--out",
      releaseDir,
      "--json",
    ]);
    expect(pkg.status).toBe(1);
    expect(existsSync(join(releaseDir, `${TAG}.tar.gz`))).toBe(false);
    expect(privacyJson(pkg.stdout)?.ok).toBe(false);

    const plainSource = cleanSource("d-plain", "plain line");
    const absentHome = makeHome("d-absent", null);
    for (const command of [
      ["sync-pack", "--repo-dir", packDir],
      ["package", "--tag", TAG, "--out", releaseDir],
    ]) {
      const absent = runDistribution(plainSource, absentHome, [...command, "--json"]);
      expect(absent.status).toBe(1);
      expect(privacyJson(absent.stdout)?.findings).toContainEqual(
        expect.objectContaining({ kind: "privacy-denylist-unavailable", reason: "absent" }),
      );
      const text = runDistribution(plainSource, absentHome, command);
      expect(`${text.stdout}${text.stderr}`).toContain("~/.ut-tdd/privacy-denylist.txt");
    }
    const empty = runDistribution(plainSource, makeHome("d-empty", ""), [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--json",
    ]);
    expect(privacyJson(empty.stdout)?.findings).toContainEqual(
      expect.objectContaining({ kind: "privacy-denylist-unavailable", reason: "empty" }),
    );
    const denySource = cleanSource("d-deny", `mentions ${D}`);
    const deny = runDistribution(denySource, denyHome, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--json",
    ]);
    expect(deny.status).toBe(1);
    expect(kinds(privacyJson(deny.stdout))).toContain("privacy-denylist-hit");
    const clean = runDistribution(plainSource, denyHome, [
      "sync-pack",
      "--repo-dir",
      packDir,
      "--json",
    ]);
    expect(clean.status).toBe(0);
    expect(privacyJson(clean.stdout)?.ok).toBe(true);
    const stage = runDistribution(plainSource, absentHome, [
      "sync-stage",
      "--tag",
      TAG,
      "--out",
      join(scratchRoot, "d-stage"),
      "--json",
    ]);
    expect(stage.status).toBe(0);
    write(emailSource, BASELINE_PATH, '["README.md"]\n');
    git(emailSource, ["add", "--", BASELINE_PATH]);
    git(emailSource, ["commit", "-q", "-m", "baseline"]);
    const baselined = runDistribution(emailSource, denyHome, [
      "sync-pack",
      "--repo-dir",
      join(scratchRoot, "d-pack-baseline"),
      "--json",
    ]);
    expect(baselined.status).toBe(1);
    expect(kinds(privacyJson(baselined.stdout))).toContain("privacy-email-hit");
  }, 600_000);

  it("U-PRIVSCAN-018: never leaks denylist contents into output, evidence, or source", () => {
    const commentMarker = "unique-comment-marker-1391";
    const invalidEntry = "unclosed-group-entry(";
    const home = makeHome("l-home", `# ${commentMarker}\n${D}\n${invalidEntry}\n`);
    const source = cleanSource("l-source", `mentions ${D}`);
    const packDir = join(scratchRoot, "l-pack");
    const releaseDir = join(scratchRoot, "l-release");
    mkdirSync(packDir, { recursive: true });
    const forbidden = [D, commentMarker, "unclosed-group-entry"];
    const runAll = () => {
      const sourceBefore = walkFiles(source);
      const outputs: string[] = [];
      for (const json of [true, false]) {
        for (const command of [
          ["sync-pack", "--repo-dir", packDir],
          ["package", "--tag", TAG, "--out", releaseDir],
        ]) {
          const result = runDistribution(source, home, json ? [...command, "--json"] : command);
          expect(result.status).toBe(1);
          outputs.push(result.stdout, result.stderr);
        }
      }
      const written = [...walkFiles(packDir).values(), ...walkFiles(releaseDir).values()];
      const sourceChanged = changedFiles(sourceBefore, walkFiles(source));
      for (const value of forbidden.slice(1)) {
        for (const text of [...outputs, ...written, ...sourceChanged.values()]) {
          expect(text).not.toContain(value);
        }
      }
      for (const text of [...outputs, ...written, ...sourceChanged.values()]) {
        expect(text).not.toContain(D);
      }
      expect(readFileSync(join(source, "README.md"), "utf8")).toContain(`mentions ${D}`);
      for (const path of [...walkFiles(source).keys(), ...walkFiles(packDir).keys()]) {
        expect(path.endsWith("privacy-denylist.txt"), path).toBe(false);
      }
      return outputs;
    };
    const invalidOutputs = runAll();
    expect(invalidOutputs.join("\n")).toContain("privacy-denylist-invalid");
    writeFileSync(join(home, ...DENYLIST), `# ${commentMarker}\n${D}\n`, "utf8");
    const hitOutputs = runAll();
    expect(hitOutputs.join("\n")).toContain("privacy-denylist-hit");
  }, 600_000);
});
