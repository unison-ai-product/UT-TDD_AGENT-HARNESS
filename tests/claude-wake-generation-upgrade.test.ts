import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  activateClaudeWakeGeneration,
  CLAUDE_WAKE_CAPABILITY_SCHEMA,
  CLAUDE_WAKE_GENERATION_SCHEMA,
  inspectClaudeWakeGeneration,
  parseClaudeWakeCapability,
  parseClaudeWakeGeneration,
  resolveRequiredClaudeWakeCapability,
  validateClaudeWakeClaimAuthority,
} from "../src/runtime/claude-wake-generation-upgrade.ts";

const workspaceId = "a".repeat(64);
const runtimeSourceRevision = "1".repeat(40);

function fixture(): string {
  return mkdtempSync(join(tmpdir(), "ut-tdd-claude-generation-upgrade-"));
}

function digest(bytes: string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function generation(generationId = "generation-1") {
  return {
    schema: CLAUDE_WAKE_GENERATION_SCHEMA,
    generation: generationId,
    workspaceId,
    inboxSchema: "ut-tdd.claude-inbox/v3" as const,
  };
}

describe("Claude wake generation rolling upgrade", () => {
  it("U-CHSCHEMA-001/002: generation/profile are closed records", () => {
    const marker = generation();
    expect(parseClaudeWakeGeneration(JSON.stringify(marker))).toEqual(marker);
    expect(parseClaudeWakeGeneration(JSON.stringify({ ...marker, unknown: true }))).toBeUndefined();
    expect(
      parseClaudeWakeGeneration(JSON.stringify({ ...marker, workspaceId: undefined })),
    ).toBeUndefined();

    const markerBytes = `${JSON.stringify(marker)}\n`;
    const required = resolveRequiredClaudeWakeCapability();
    const profile = {
      schema: CLAUDE_WAKE_CAPABILITY_SCHEMA,
      generation: marker.generation,
      workspaceId,
      markerDigest: digest(markerBytes),
      runtimeSourceRevision,
      capabilityRevision: required.minimumCompatibleRevision,
      policyDigest: required.requiredPolicyDigest,
      authorityEpoch: 1,
    };
    expect(parseClaudeWakeCapability(JSON.stringify(profile))).toEqual(profile);
    expect(parseClaudeWakeCapability(JSON.stringify({ ...profile, extra: 1 }))).toBeUndefined();
    expect(
      parseClaudeWakeCapability(JSON.stringify({ ...profile, authorityEpoch: 0 })),
    ).toBeUndefined();
  });

  it("U-CHSCHEMA-004/007: legacy marker is preserved as typed handoff and one generation becomes active", () => {
    const root = fixture();
    try {
      writeFileSync(join(root, "old.generation"), "8992:1787797435601\n", "utf8");
      const activated = activateClaudeWakeGeneration({
        root,
        sessionId: "current",
        workspaceId,
        generation: "generation-2",
        runtimeSourceRevision,
        leaseToken: "lease-current",
      });
      expect(activated.ok).toBe(true);
      expect(readdirSync(root).filter((name) => name.endsWith(".generation"))).toEqual([
        "current.generation",
      ]);
      expect(existsSync(join(root, "superseded", "1-old.generation"))).toBe(true);
      const handoffs = readdirSync(join(root, "handoffs"));
      expect(handoffs).toHaveLength(1);
      expect(JSON.parse(readFileSync(join(root, "handoffs", handoffs[0]), "utf8"))).toMatchObject({
        state: "restart_required",
        reason: "legacy_generation_marker",
        workspaceId,
      });
      expect(inspectClaudeWakeGeneration(root, workspaceId)).toMatchObject({
        ok: true,
        generation: "generation-2",
        authorityEpoch: 1,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-CHSCHEMA-006/008: multiple or foreign active generations fail closed before mutation", () => {
    const root = fixture();
    try {
      for (const id of ["one", "two"]) {
        writeFileSync(
          join(root, `${id}.generation`),
          `${JSON.stringify(generation(id))}\n`,
          "utf8",
        );
      }
      const before = readdirSync(root).sort();
      expect(
        activateClaudeWakeGeneration({
          root,
          sessionId: "next",
          workspaceId,
          generation: "next-generation",
          runtimeSourceRevision,
          leaseToken: "lease-next",
        }),
      ).toEqual({ ok: false, reason: "multiple_active_generations" });
      expect(readdirSync(root).sort()).toEqual(before);

      rmSync(root, { recursive: true, force: true });
      mkdirSync(root, { recursive: true });
      writeFileSync(
        join(root, "foreign.generation"),
        `${JSON.stringify({ ...generation("foreign"), workspaceId: "b".repeat(64) })}\n`,
        "utf8",
      );
      expect(
        activateClaudeWakeGeneration({
          root,
          sessionId: "next",
          workspaceId,
          generation: "next-generation",
          runtimeSourceRevision,
          leaseToken: "lease-next",
        }),
      ).toEqual({ ok: false, reason: "foreign_workspace_generation" });
      expect(readdirSync(root)).toEqual(["foreign.generation"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-CHSCHEMA-005/011: policy compatibility and current epoch/token are an AND gate", () => {
    const root = fixture();
    try {
      const first = activateClaudeWakeGeneration({
        root,
        sessionId: "one",
        workspaceId,
        generation: "generation-1",
        runtimeSourceRevision,
        leaseToken: "lease-one",
      });
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      expect(validateClaudeWakeClaimAuthority(root, first.authority, "lease-one")).toEqual({
        ok: true,
      });

      const second = activateClaudeWakeGeneration({
        root,
        sessionId: "two",
        workspaceId,
        generation: "generation-2",
        runtimeSourceRevision: "2".repeat(40),
        leaseToken: "lease-two",
      });
      expect(second.ok).toBe(true);
      expect(validateClaudeWakeClaimAuthority(root, first.authority, "lease-one")).toEqual({
        ok: false,
        reason: "claim_authority_revoked",
      });
      if (!second.ok) return;
      expect(validateClaudeWakeClaimAuthority(root, second.authority, "wrong-token")).toEqual({
        ok: false,
        reason: "claim_lease_token_mismatch",
      });

      const profilePath = join(root, "capabilities", "two.capability.json");
      const profile = JSON.parse(readFileSync(profilePath, "utf8"));
      writeFileSync(
        profilePath,
        `${JSON.stringify({ ...profile, policyDigest: `sha256:${"0".repeat(64)}` })}\n`,
      );
      expect(inspectClaudeWakeGeneration(root, workspaceId)).toEqual({
        ok: false,
        reason: "capability_policy_mismatch",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-CHSCHEMA-009: interrupted activation rolls back before replay", () => {
    const root = fixture();
    try {
      const first = activateClaudeWakeGeneration({
        root,
        sessionId: "one",
        workspaceId,
        generation: "generation-1",
        runtimeSourceRevision,
        leaseToken: "lease-one",
      });
      expect(first.ok).toBe(true);
      expect(() =>
        activateClaudeWakeGeneration({
          root,
          sessionId: "two",
          workspaceId,
          generation: "generation-2",
          runtimeSourceRevision,
          leaseToken: "lease-two",
          beforeStep: (step) => {
            if (step === "marker_written") throw new Error("injected_crash");
          },
        }),
      ).toThrow("injected_crash");

      const replay = activateClaudeWakeGeneration({
        root,
        sessionId: "two",
        workspaceId,
        generation: "generation-2",
        runtimeSourceRevision,
        leaseToken: "lease-two",
      });
      expect(replay.ok).toBe(true);
      expect(inspectClaudeWakeGeneration(root, workspaceId)).toMatchObject({
        ok: true,
        generation: "generation-2",
        authorityEpoch: 3,
      });
      const journals = readdirSync(join(root, "activation-journal")).map((name) =>
        JSON.parse(readFileSync(join(root, "activation-journal", name), "utf8")),
      );
      expect(journals.map((entry) => entry.state)).toEqual(["active", "rolled_back", "active"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
