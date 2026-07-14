import { rmSync } from "node:fs";

export interface TempTreeCleanupDeps {
  collectGarbage?: () => void;
  remove?: (
    path: string,
    options: {
      recursive: true;
      force: true;
      maxRetries: number;
      retryDelay: number;
    },
  ) => void;
}

export function removeTestTree(path: string, deps: TempTreeCleanupDeps = {}): void {
  const collectGarbage =
    deps.collectGarbage ??
    (() => {
      const bun = (globalThis as { Bun?: { gc?: (force?: boolean) => void } }).Bun;
      bun?.gc?.(true);
    });
  collectGarbage();
  (deps.remove ?? rmSync)(path, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 50,
  });
}
