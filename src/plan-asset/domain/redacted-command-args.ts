export const REDACTED_ARGS_SCHEMA = "redacted-argv/v1" as const;

export interface RedactedCommandArgs {
  readonly schemaVersion: typeof REDACTED_ARGS_SCHEMA;
  readonly values: readonly string[];
}

const instances = new WeakSet<object>();

export function createRedactedCommandArgs(values: readonly string[]): RedactedCommandArgs {
  return brand(redact(values));
}

export function restoreRedactedCommandArgs(values: readonly string[]): RedactedCommandArgs | null {
  return JSON.stringify(redact(values)) === JSON.stringify(values) ? brand(values) : null;
}

export function isRedactedCommandArgs(value: unknown): value is RedactedCommandArgs {
  return Boolean(value) && typeof value === "object" && instances.has(value as object);
}

export function storedRedactedArgsValid(value: unknown): value is RedactedCommandArgs {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).sort().join(",") === "schemaVersion,values" &&
    record.schemaVersion === REDACTED_ARGS_SCHEMA &&
    Array.isArray(record.values) &&
    record.values.length > 0 &&
    record.values.every((item) => typeof item === "string" && item.length > 0) &&
    JSON.stringify(redact(record.values)) === JSON.stringify(record.values)
  );
}

function redact(values: readonly string[]): readonly string[] {
  const result: string[] = [];
  let redactNext = false;
  for (const raw of values) {
    const value = String(raw);
    if (redactNext) {
      result.push("[REDACTED]");
      redactNext = false;
    } else if (/^(--?(?:token|api[-_]?key|password|secret|authorization))$/i.test(value)) {
      result.push(value);
      redactNext = true;
    } else {
      result.push(
        value.replace(
          /^((?:--?)?(?:token|api[-_]?key|password|secret|authorization)=).+$/i,
          "$1[REDACTED]",
        ),
      );
    }
  }
  return result;
}

function brand(values: readonly string[]): RedactedCommandArgs {
  const instance = Object.freeze({
    schemaVersion: REDACTED_ARGS_SCHEMA,
    values: Object.freeze([...values]),
  });
  instances.add(instance);
  return instance;
}
