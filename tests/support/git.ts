import { execFileSync } from "node:child_process";

export function gitTextRaw(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function gitTextTrimmed(cwd: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function gitChecked(root: string, args: readonly string[]): void {
  execFileSync("git", ["-C", root, ...args], { stdio: "pipe" });
}
