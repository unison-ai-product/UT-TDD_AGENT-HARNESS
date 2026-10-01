import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { createCanaryFixture, isolatedCanaryEnv } from "./support/pack-internal-canary.ts";

interface AcceptanceModule {
  CANARY_ASSETS: readonly string[];
  CANARY_TAG: string;
  buildInstallerInvocation(releaseDirectory: string, anchorDigest: string, tag?: string): string[];
  canaryAssetsForTag(tag: string): readonly string[];
  createConsumerPlan(consumerRoot: string): void;
  parsePublishRecord(
    value: unknown,
    commentUrl: string,
    options?: { expectedTag?: string },
  ): {
    assetDigests: Record<string, string>;
    consumerAnchorDigest: string;
    commentUrl: string;
    value: Record<string, unknown>;
  };
  verifyReleaseDirectory(
    releaseDir: string,
    record: ReturnType<AcceptanceModule["parsePublishRecord"]>,
  ): {
    actualDigests: Record<string, string>;
  };
  verifyInstallEvidence(evidence: unknown, consumerRoot: string, removedPaths: string[]): void;
}

const acceptance = (await import(
  pathToFileURL(join(process.cwd(), "scripts", "pack-canary-acceptance.mjs")).href
)) as AcceptanceModule;
const {
  buildInstallerInvocation,
  CANARY_ASSETS,
  CANARY_TAG,
  canaryAssetsForTag,
  createConsumerPlan,
  parsePublishRecord,
  verifyReleaseDirectory,
  verifyInstallEvidence,
} = acceptance;

const tempRoots: string[] = [];
const commentUrl =
  "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418#issuecomment-5907911175";
const sha = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function record() {
  const assetBytes = Object.fromEntries(CANARY_ASSETS.map((name) => [name, `bytes:${name}`]));
  const pair = (value: string) => ({ producer_sha256: sha(value), independent_sha256: sha(value) });
  return {
    value: {
      tag: CANARY_TAG,
      release_url: `https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/releases/tag/${CANARY_TAG}`,
      c1_commit: "a".repeat(40),
      c2_commit: "b".repeat(40),
      recorded_by: "publisher",
      recorded_at: "2026-09-30T10:00:00.000Z",
      assets: Object.fromEntries(CANARY_ASSETS.map((name) => [name, pair(assetBytes[name])])),
      consumer_anchor_digest: pair("anchor"),
    },
    assetBytes,
  };
}

function releaseDir(assetBytes: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "ut-canary-release-"));
  tempRoots.push(root);
  for (const name of CANARY_ASSETS) writeFileSync(join(root, name), assetBytes[name]);
  return root;
}

describe("manual canary acceptance publish-record boundary", () => {
  it("U-ST-PACKCANARY-010: restart evidence binds consumer and removed Release root", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-canary-evidence-"));
    tempRoots.push(root);
    const consumer = join(root, "consumer");
    const release = join(root, "release");
    const source = join(root, "source");
    const evidence = {
      schema_version: "ut-tdd.pack-canary-acceptance/v1",
      phase: "installed-awaiting-clean-restart",
      setup_exit_code: 0,
      tag: CANARY_TAG,
      consumer_root: consumer,
      release_directory: release,
    };
    expect(() => verifyInstallEvidence(evidence, consumer, [source, release])).not.toThrow();
    expect(() => verifyInstallEvidence(evidence, join(root, "other"), [source, release])).toThrow(
      "install-evidence-not-verifiable",
    );
    expect(() => verifyInstallEvidence(evidence, consumer, [source, join(root, "other")])).toThrow(
      "verify-removed-paths-not-bound-to-install",
    );
    expect(() => verifyInstallEvidence(evidence, consumer, [source, release, consumer])).toThrow(
      "verify-removed-paths-not-bound-to-install",
    );
  });

  it("U-ST-PACKCANARY-009: runner loads without source node_modules", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-canary-standalone-"));
    tempRoots.push(root);
    const script = join(root, "runner.mjs");
    copyFileSync(join(process.cwd(), "scripts", "pack-canary-acceptance.mjs"), script);
    const child = spawnSync(process.execPath, [script, "--phase", "invalid"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      env: { PATH: "", ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}) },
    });
    expect(child.status).toBe(1);
    expect(child.stderr).toContain("usage: install");
    expect(child.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
  });

  it("U-ST-PACKCANARY-009: authoring input is derived from the shipped template", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-canary-template-"));
    tempRoots.push(root);
    const template = join(root, "docs", "templates", "plan", "design", "template.md");
    mkdirSync(join(root, "docs", "templates", "plan", "design"), { recursive: true });
    copyFileSync(
      join(process.cwd(), "docs", "templates", "plan", "design", "template.md"),
      template,
    );
    createConsumerPlan(root);
    const manifest = JSON.parse(readFileSync(join(root, "canary-plan-draft.json"), "utf8"));
    const match = /^---\n([\s\S]*?)\n---\n/.exec(manifest.source.content);
    expect(match).not.toBeNull();
    expect(parseYaml(match?.[1] ?? "")).toMatchObject({
      plan_id: "PLAN-L2-999-canary-authoring",
      drive: "agent",
      route_signal: "forward",
      route_mode: "forward",
      sub_doc: "screen-list",
      generates: [],
      related_docs: [],
    });
    expect(manifest.source.content).toContain("配布された PLAN テンプレート");
  });

  it("U-ST-PACKCANARY-005/006/009: accepts only exact canary.2 record, comment and 5 digests", () => {
    const input = record();
    const parsed = parsePublishRecord(input.value, commentUrl);
    const dir = releaseDir(input.assetBytes);
    const verified = verifyReleaseDirectory(dir, parsed);
    expect(Object.keys(verified.actualDigests).sort()).toEqual([...CANARY_ASSETS].sort());
    expect(parsed.commentUrl).toBe(commentUrl);
  });

  it("U-ST-PACKCANARY-005/006/009: binds five bytes from the real offline distribution producer", async () => {
    const fixture = await createCanaryFixture();
    tempRoots.push(fixture.root);
    const names = canaryAssetsForTag("v0.0.0-canary.0");
    const assets = Object.fromEntries(
      names.map((name: string) => {
        const bytes = readFileSync(join(fixture.releaseDir, name));
        const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
        return [name, { producer_sha256: digest, independent_sha256: digest }];
      }),
    );
    const anchorBytes = readFileSync(join(fixture.releaseDir, "v0.0.0-canary.0.consumer.sha256"));
    const anchor = `sha256:${createHash("sha256").update(anchorBytes).digest("hex")}`;
    expect(anchor).toBe(fixture.anchor);
    const digestPair = { producer_sha256: anchor, independent_sha256: anchor };
    const publish = parsePublishRecord(
      {
        tag: "v0.0.0-canary.0",
        release_url:
          "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/releases/tag/v0.0.0-canary.0",
        c1_commit: "a".repeat(40),
        c2_commit: "b".repeat(40),
        recorded_by: "offline fixture",
        recorded_at: "2026-09-30T10:00:00.000Z",
        assets,
        consumer_anchor_digest: digestPair,
      },
      commentUrl,
      { expectedTag: "v0.0.0-canary.0" },
    );
    expect(verifyReleaseDirectory(fixture.releaseDir, publish).actualDigests).toEqual(
      Object.fromEntries(names.map((name: string) => [name, assets[name].producer_sha256])),
    );

    const before = readdirSync(fixture.consumerRoot);
    const denied = spawnSync(
      process.execPath,
      [
        fixture.wrapper,
        "setup",
        "--solo",
        "--consumer-runtime-release",
        fixture.releaseDir,
        "--expected-consumer-digest",
        `sha256:${"0".repeat(64)}`,
      ],
      {
        cwd: fixture.consumerRoot,
        encoding: "utf8",
        env: isolatedCanaryEnv(fixture.root),
        windowsHide: true,
        timeout: 120_000,
      },
    );
    expect(`${denied.stdout}\n${denied.stderr}`).toContain("consumer_runtime_anchor_mismatch");
    expect(readdirSync(fixture.consumerRoot)).toEqual(before);
  }, 600_000);

  it.each([
    ["wrong tag", (value: ReturnType<typeof record>["value"]) => ({ ...value, tag: "latest" })],
    ["wrong comment", (value: ReturnType<typeof record>["value"]) => value],
  ])("U-ST-PACKCANARY-006/009: denies %s before setup", (label, mutate) => {
    const input = record();
    if (label === "wrong comment")
      expect(() => parsePublishRecord(mutate(input.value), "https://example.com")).toThrow(
        "publish-record-comment-url-invalid",
      );
    else
      expect(() => parsePublishRecord(mutate(input.value), commentUrl)).toThrow(
        "publish-record-tag-not-exact",
      );
  });

  it("U-ST-PACKCANARY-005: denies missing, extra, or disagreeing publish digests", () => {
    const input = record();
    const missing = structuredClone(input.value);
    delete missing.assets[CANARY_ASSETS[0]];
    expect(() => parsePublishRecord(missing, commentUrl)).toThrow(
      "publish-record-asset-set-not-exact",
    );

    const extra = structuredClone(input.value);
    extra.assets["unexpected.bin"] = extra.assets[CANARY_ASSETS[0]];
    expect(() => parsePublishRecord(extra, commentUrl)).toThrow(
      "publish-record-asset-set-not-exact",
    );

    const disagreement = structuredClone(input.value);
    disagreement.assets[CANARY_ASSETS[0]].independent_sha256 = sha("other");
    expect(() => parsePublishRecord(disagreement, commentUrl)).toThrow(
      "publish-record-digest-disagreement",
    );
  });

  it("U-ST-PACKCANARY-005: checks downloaded bytes against the independent publish record", () => {
    const input = record();
    const dir = releaseDir(input.assetBytes);
    writeFileSync(join(dir, CANARY_ASSETS[0]), "tampered");
    expect(() => verifyReleaseDirectory(dir, parsePublishRecord(input.value, commentUrl))).toThrow(
      `release-asset-digest-mismatch:${CANARY_ASSETS[0]}`,
    );
  });

  it("U-ST-PACKCANARY-005/006: denies extra files rather than subset-matching the release", () => {
    const input = record();
    const dir = releaseDir(input.assetBytes);
    writeFileSync(join(dir, "README.txt"), "extra");
    expect(() => verifyReleaseDirectory(dir, parsePublishRecord(input.value, commentUrl))).toThrow(
      "release-asset-set-not-exact",
    );
  });

  it("U-ST-PACKCANARY-008/009: uses only the canonical record anchor and Release-assets input", () => {
    const input = record();
    const parsed = parsePublishRecord(input.value, commentUrl);
    const invocation = buildInstallerInvocation("C:/release-dir", parsed.consumerAnchorDigest);
    expect(invocation).toContain("--consumer-runtime-release");
    expect(invocation).not.toContain("--consumer-runtime-input");
    expect(invocation.slice(-1)[0]).toBe(parsed.consumerAnchorDigest);
    expect(() =>
      buildInstallerInvocation("C:/release-dir", parsed.consumerAnchorDigest, "latest"),
    ).toThrow("acceptance-tag-not-canary-2");
  });
});
