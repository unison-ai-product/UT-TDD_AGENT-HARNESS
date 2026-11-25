import childProcess from "node:child_process";
import { appendFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { join } from "node:path";

const log = join(process.cwd(), "session-start-commands.jsonl");
const originalExecFileSync = childProcess.execFileSync;

childProcess.execFileSync = (file, args, options) => {
  if (file === "git" || file === "gh") {
    appendFileSync(log, `${JSON.stringify({ file, args })}\n`);
  }
  if (file === "gh") return "[]";
  return originalExecFileSync(file, args, options);
};
syncBuiltinESMExports();
