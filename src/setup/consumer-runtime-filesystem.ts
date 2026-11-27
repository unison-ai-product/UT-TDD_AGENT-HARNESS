import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  type Stats,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export type PointerSnapshot = { readonly bytes: Buffer; readonly mode: number } | null;

export class UnpublishedPointerError extends Error {
  constructor(cause: unknown) {
    super("consumer runtime pointer publication did not occur", { cause });
  }
}

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException | undefined)?.code;
}

export function readPointer(path: string): PointerSnapshot {
  let stat: Stats;
  try {
    stat = lstatSync(path);
  } catch (error) {
    if (errorCode(error) === "ENOENT") return null;
    throw error;
  }
  if (!stat.isFile()) throw new Error("consumer_runtime_external_path");
  return { bytes: readFileSync(path), mode: stat.mode & 0o777 };
}

export function samePointer(left: PointerSnapshot, right: PointerSnapshot): boolean {
  if (left === null || right === null) return left === right;
  return left.mode === right.mode && left.bytes.equals(right.bytes);
}

function assertPointer(path: string, expected: PointerSnapshot): void {
  if (!samePointer(readPointer(path), expected)) throw new Error("consumer_runtime_indeterminate");
}

export function fsyncDirectory(path: string): void {
  let fd: number | undefined;
  try {
    fd = openSync(path, "r");
    fsyncSync(fd);
  } catch (error) {
    // Windows can reject a directory handle for flushing. Preserve other I/O failures.
    if (process.platform !== "win32" || errorCode(error) !== "EPERM") throw error;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function createRuntimeDirectories(path: string, owned: string[]): void {
  const missing: string[] = [];
  let current = path;
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (current === parent) throw new Error("consumer_runtime_external_path");
    missing.push(current);
    current = parent;
  }
  for (const directory of missing.reverse()) {
    mkdirSync(directory);
    owned.push(directory);
  }
}

export function removeRuntimeCandidate(path: string): void {
  const owned = lstatSync(path);
  if (!owned.isDirectory()) throw new Error("consumer_runtime_external_path");
  const mode = owned.mode & 0o777;
  chmodSync(path, mode | 0o700);
  try {
    rmSync(path, { recursive: true, force: false });
  } finally {
    const remaining = lstatSync(path, { throwIfNoEntry: false });
    if (remaining && remaining.dev === owned.dev && remaining.ino === owned.ino)
      chmodSync(path, mode);
  }
}

interface PointerPublication {
  readonly pointerPath: string;
  readonly tempPath: string;
  readonly bytes: Buffer;
  readonly prior: PointerSnapshot;
  readonly beforeRename: () => void;
}

function restorePriorPointerMode(
  path: string,
  prior: PointerSnapshot,
  writable: PointerSnapshot,
): void {
  const observed = readPointer(path);
  if (samePointer(observed, prior)) return;
  if (!prior || !writable || !samePointer(observed, writable))
    throw new Error("consumer_runtime_indeterminate");
  chmodSync(path, prior.mode);
  assertPointer(path, prior);
}

/** Swap one pointer while the caller holds the runtime lock. */
export function publishActivePointer(input: PointerPublication): void {
  const { pointerPath, tempPath, prior } = input;
  let published = false;
  let ownedTemp = false;
  let writablePrior: PointerSnapshot = null;
  try {
    const fd = openSync(tempPath, "wx", 0o600);
    ownedTemp = true;
    try {
      writeFileSync(tempPath, input.bytes, { flag: "r+" });
      chmodSync(tempPath, 0o444);
      fsyncSync(fd);
      assertPointer(pointerPath, prior);
      // Win32 replacement needs a writable destination. The new file is already read-only.
      if (process.platform === "win32" && prior && (prior.mode & 0o222) === 0) {
        writablePrior = { bytes: prior.bytes, mode: prior.mode | 0o222 };
        chmodSync(pointerPath, writablePrior.mode);
      }
      input.beforeRename();
      assertPointer(pointerPath, writablePrior ?? prior);
      renameSync(tempPath, pointerPath);
      published = true;
      // The write-capable handle still refers to the new pointer across the rename.
      fsyncSync(fd);
      fsyncDirectory(dirname(pointerPath));
    } finally {
      closeSync(fd);
    }
  } catch (error) {
    if (published || (!ownedTemp && errorCode(error) === "EEXIST")) throw error;
    try {
      try {
        restorePriorPointerMode(pointerPath, prior, writablePrior);
      } finally {
        if (ownedTemp) rmSync(tempPath, { force: false });
      }
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "consumer_runtime_indeterminate");
    }
    throw new UnpublishedPointerError(error);
  }
}
