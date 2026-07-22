import { describe, expect, it } from "vitest";
import {
  executeProviderWithReceipt,
  finalizeProviderExecution,
  type ProviderExecutionPort,
  type ProviderTerminalReceipt,
  preflightProviderExecution,
  validateProviderReceipt,
} from "../src/runtime/provider-execution";

const capabilities = {
  deadline: true,
  stdin: true,
  terminal_observation: true,
  process_tree_custody: true,
  descendant_reap: true,
};
const request = {
  invocation_id: "inv-1",
  provider: "claude",
  command_plan: { command: "claude", args: ["--print"], stdin: "task" },
  deadline_at: 2_000,
};
const receipt = (change: Partial<ProviderTerminalReceipt> = {}): ProviderTerminalReceipt => ({
  invocation_id: "inv-1",
  terminal_kind: "success",
  provider_exit_code: 0,
  started_at: 1_100,
  completed_at: 1_200,
  deadline_at: 2_000,
  cleanup: { verified: true, orphan_count: 0, custody_empty: true, reaped: true },
  ...change,
});
function port(overrides: Partial<ProviderExecutionPort> = {}): ProviderExecutionPort {
  return {
    now: () => 1_000,
    negotiate: async () => ({ execution_kind: "native", capabilities }),
    spawn: async () => receipt(),
    ...overrides,
  };
}

describe("provider execution contract", () => {
  it("U-ADAPTER-010: fails closed when any required capability is false or unknown", () => {
    const result = preflightProviderExecution({
      execution_kind: "native",
      capabilities: { ...capabilities, descendant_reap: false },
    });
    expect(result.ok).toBe(false);
    expect(result.findings[0]?.missing_capabilities).toEqual(["descendant_reap"]);
    expect(
      preflightProviderExecution({
        execution_kind: "native",
        capabilities: { ...capabilities, invented_capability: true },
      }),
    ).toMatchObject({ ok: false });
  });

  it("U-ADAPTER-011: never silently falls back or spawns after rejected preflight", async () => {
    let spawned = false;
    const result = await executeProviderWithReceipt(
      request,
      port({
        negotiate: async () => ({ execution_kind: "hook", capabilities: {} }),
        spawn: async () => {
          spawned = true;
          return receipt();
        },
      }),
    );
    expect(result).toMatchObject({ ok: false, reason: "capability-rejected" });
    expect(spawned).toBe(false);
  });

  it("U-ADAPTER-012: validates one discriminated receipt for the same invocation", () => {
    expect(validateProviderReceipt(receipt(), request)).toBe(true);
    expect(validateProviderReceipt([{ ...receipt() }, { ...receipt() }], request)).toBe(false);
    expect(validateProviderReceipt(receipt({ invocation_id: "spoof" }), request)).toBe(false);
    expect(validateProviderReceipt(receipt({ terminal_kind: "provider_nonzero" }), request)).toBe(
      false,
    );
  });

  it("U-ADAPTER-013: checks the deadline again after capability negotiation", async () => {
    let spawned = false;
    let tick = 1_000;
    const result = await executeProviderWithReceipt(
      request,
      port({
        now: () => tick,
        negotiate: async () => {
          tick = 2_000;
          return { execution_kind: "native", capabilities };
        },
        spawn: async () => {
          spawned = true;
          return receipt();
        },
      }),
    );
    expect(result).toEqual({ ok: false, reason: "invalid-request" });
    expect(spawned).toBe(false);
  });

  it("U-ADAPTER-014: parent exit zero cannot override incomplete cleanup", () => {
    expect(
      finalizeProviderExecution(
        receipt({
          cleanup: { verified: true, orphan_count: 1, custody_empty: false, reaped: false },
        }),
      ),
    ).toMatchObject({ ok: false, reason: "cleanup-unverified" });
  });

  it("U-ADAPTER-015: separates provider non-zero from cleanup and success", async () => {
    const nonzero = receipt({ terminal_kind: "provider_nonzero", provider_exit_code: 7 });
    expect(
      await executeProviderWithReceipt(request, port({ spawn: async () => nonzero })),
    ).toMatchObject({ ok: false, reason: "provider-failed", receipt: nonzero });
    expect(await executeProviderWithReceipt(request, port())).toMatchObject({
      ok: true,
      receipt: { terminal_kind: "success", provider_exit_code: 0 },
    });
    for (const terminal_kind of ["timeout", "cancel", "adapter_error"] as const) {
      expect(
        finalizeProviderExecution(receipt({ terminal_kind, provider_exit_code: undefined })),
      ).toMatchObject({ ok: false, reason: "provider-failed" });
      expect(
        finalizeProviderExecution(
          receipt({
            terminal_kind,
            provider_exit_code: undefined,
            cleanup: { verified: false, orphan_count: 0, custody_empty: true, reaped: true },
          }),
        ),
      ).toMatchObject({ ok: false, reason: "cleanup-unverified" });
    }
  });
});
