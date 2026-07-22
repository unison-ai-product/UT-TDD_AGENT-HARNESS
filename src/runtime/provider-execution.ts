export const REQUIRED_PROVIDER_CAPABILITIES = [
  "deadline",
  "stdin",
  "terminal_observation",
  "process_tree_custody",
  "descendant_reap",
] as const;

export type ProviderCapabilityName = (typeof REQUIRED_PROVIDER_CAPABILITIES)[number];
export type ProviderCapabilities = Record<ProviderCapabilityName, boolean>;
export type ProviderTerminalKind =
  | "success"
  | "provider_nonzero"
  | "timeout"
  | "cancel"
  | "adapter_error";

export interface ProviderExecutionRequest {
  invocation_id: string;
  provider: string;
  command_plan: { command: string; args: readonly string[]; stdin: string };
  deadline_at: number;
}

export interface ProviderCapabilityOffer {
  execution_kind: string;
  capabilities: Partial<ProviderCapabilities>;
}

export interface ProviderExecutionFinding {
  execution_kind: string;
  missing_capabilities: ProviderCapabilityName[];
}

export type ProviderExecutionPreflight =
  | { ok: true; execution_kind: string; capabilities: ProviderCapabilities; findings: [] }
  | {
      ok: false;
      execution_kind: string;
      capabilities: Partial<ProviderCapabilities>;
      findings: [ProviderExecutionFinding];
    };

export interface ProviderCleanupReceipt {
  verified: boolean;
  orphan_count: number;
  custody_empty: boolean;
  reaped: boolean;
}

export interface ProviderTerminalReceipt {
  invocation_id: string;
  terminal_kind: ProviderTerminalKind;
  provider_exit_code?: number;
  reason?: string;
  started_at: number;
  completed_at: number;
  deadline_at: number;
  cleanup: ProviderCleanupReceipt;
}

export type ProviderExecutionOutcome =
  | { ok: true; receipt: ProviderTerminalReceipt }
  | {
      ok: false;
      reason:
        | "invalid-request"
        | "capability-rejected"
        | "invalid-receipt"
        | "cleanup-unverified"
        | "provider-failed";
      receipt?: ProviderTerminalReceipt;
      findings?: ProviderExecutionFinding[];
    };

export interface ProviderExecutionPort {
  negotiate(request: ProviderExecutionRequest): Promise<unknown>;
  spawn(
    request: ProviderExecutionRequest,
    preflight: ProviderExecutionPreflight & { ok: true },
  ): Promise<unknown>;
  now?: () => number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCapabilities(value: unknown): value is Partial<ProviderCapabilities> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([name, enabled]) =>
      REQUIRED_PROVIDER_CAPABILITIES.includes(name as ProviderCapabilityName) &&
      typeof enabled === "boolean",
  );
}

export function preflightProviderExecution(offer: unknown): ProviderExecutionPreflight {
  const executionKind =
    isRecord(offer) && typeof offer.execution_kind === "string" ? offer.execution_kind : "unknown";
  const capabilities =
    isRecord(offer) && isCapabilities(offer.capabilities) ? offer.capabilities : {};
  const missing = REQUIRED_PROVIDER_CAPABILITIES.filter(
    (capability) => capabilities[capability] !== true,
  );
  if (executionKind.length > 0 && executionKind !== "unknown" && missing.length === 0) {
    return {
      ok: true,
      execution_kind: executionKind,
      capabilities: capabilities as ProviderCapabilities,
      findings: [],
    };
  }
  return {
    ok: false,
    execution_kind: executionKind,
    capabilities,
    findings: [{ execution_kind: executionKind, missing_capabilities: missing }],
  };
}

function validCleanup(value: unknown): value is ProviderCleanupReceipt {
  return (
    isRecord(value) &&
    typeof value.verified === "boolean" &&
    Number.isInteger(value.orphan_count) &&
    (value.orphan_count as number) >= 0 &&
    typeof value.custody_empty === "boolean" &&
    typeof value.reaped === "boolean"
  );
}

export function validateProviderReceipt(
  value: unknown,
  request: ProviderExecutionRequest,
): value is ProviderTerminalReceipt {
  if (!isRecord(value) || Array.isArray(value)) return false;
  if (
    value.invocation_id !== request.invocation_id ||
    !["success", "provider_nonzero", "timeout", "cancel", "adapter_error"].includes(
      String(value.terminal_kind),
    ) ||
    !isFiniteNumber(value.started_at) ||
    !isFiniteNumber(value.completed_at) ||
    value.completed_at < value.started_at ||
    value.deadline_at !== request.deadline_at ||
    !validCleanup(value.cleanup)
  )
    return false;

  const exitCode = value.provider_exit_code;
  if (exitCode !== undefined && !Number.isInteger(exitCode)) return false;
  if (value.terminal_kind === "success") {
    return exitCode === 0 && value.completed_at <= request.deadline_at;
  }
  if (value.terminal_kind === "provider_nonzero") {
    return (
      typeof exitCode === "number" && exitCode !== 0 && value.completed_at <= request.deadline_at
    );
  }
  return exitCode === undefined;
}

export function finalizeProviderExecution(
  receipt: ProviderTerminalReceipt,
): ProviderExecutionOutcome {
  const cleanup = receipt.cleanup;
  if (!cleanup.verified || cleanup.orphan_count !== 0 || !cleanup.custody_empty || !cleanup.reaped)
    return { ok: false, reason: "cleanup-unverified", receipt };
  if (receipt.terminal_kind !== "success" || receipt.provider_exit_code !== 0) {
    return { ok: false, reason: "provider-failed", receipt };
  }
  return { ok: true, receipt };
}

export async function executeProviderWithReceipt(
  request: ProviderExecutionRequest,
  port: ProviderExecutionPort,
): Promise<ProviderExecutionOutcome> {
  const now = port.now ?? Date.now;
  if (
    request.invocation_id.trim().length === 0 ||
    request.provider.trim().length === 0 ||
    request.command_plan.command.trim().length === 0 ||
    !isFiniteNumber(request.deadline_at) ||
    request.deadline_at <= now()
  )
    return { ok: false, reason: "invalid-request" };

  let offer: unknown;
  try {
    offer = await port.negotiate(request);
  } catch {
    return { ok: false, reason: "capability-rejected" };
  }
  const preflight = preflightProviderExecution(offer);
  if (!preflight.ok) {
    return { ok: false, reason: "capability-rejected", findings: preflight.findings };
  }
  if (now() >= request.deadline_at) return { ok: false, reason: "invalid-request" };

  let rawReceipt: unknown;
  try {
    rawReceipt = await port.spawn(request, preflight);
  } catch {
    return { ok: false, reason: "invalid-receipt" };
  }
  if (!validateProviderReceipt(rawReceipt, request)) {
    return { ok: false, reason: "invalid-receipt" };
  }
  return finalizeProviderExecution(rawReceipt);
}

export const executeProvider = executeProviderWithReceipt;
