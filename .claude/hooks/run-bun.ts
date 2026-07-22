import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { delimiter, isAbsolute, join } from "node:path";
import { spawn } from "node:child_process";

function findBun(): string {
  const names = process.platform === "win32" ? ["bun.exe"] : ["bun"];
  const directories = (process.env.PATH ?? "").split(delimiter).filter(isAbsolute);
  if (process.platform === "win32" && process.env.APPDATA) {
    directories.push(join(process.env.APPDATA, "npm", "node_modules", "bun", "bin"));
  }
  for (const directory of directories) {
    for (const name of names) {
      const candidate = join(directory, name);
      try {
        const resolved = realpathSync(candidate);
        if (!statSync(resolved).isFile()) continue;
        if (process.platform !== "win32") accessSync(resolved, constants.X_OK);
        return resolved;
      } catch {}
    }
  }
  throw new Error("native Bun executable not found; install Bun or add bun.exe/bun to PATH");
}

try {
  const child = spawn(findBun(), process.argv.slice(2), {
    stdio: ["pipe", "inherit", "inherit"],
    windowsHide: true,
  });
  process.stdin.pipe(child.stdin);
  child.on("error", fail);
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
  });
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.once(signal, () => child.kill(signal));
  }
} catch (error) {
  fail(error);
}

function fail(error: unknown): void {
  process.stderr.write(`UT-TDD hook launcher: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
