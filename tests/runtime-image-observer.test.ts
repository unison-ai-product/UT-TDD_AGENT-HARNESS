import { describe, expect, it } from "vitest";
import {
  missingRuntimeImageScopes,
  NodeOnlyProcessObserver,
} from "../src/runtime/runtime-image-observer.ts";

describe("RuntimeImageScanner boundary", () => {
  it("CAND-NODEBOOT-202 blocks fallback runtimes before a child can spawn", () => {
    const observer = new NodeOnlyProcessObserver();
    const result = observer.invoke(
      { command: "bun", args: ["run", "status"], options: { shell: false } },
      () => {
        throw new Error("must not run");
      },
    );
    expect(result).toMatchObject({ outcome: "blocked", spawned: false, reason: "bun-runtime" });
  });

  it("CAND-NODEBOOT-203/204 fail closed for every unobserved runtime-image scope", () => {
    expect(missingRuntimeImageScopes(["status"])).toEqual([
      "doctor",
      "test",
      "hook",
      "descendant",
      "download",
    ]);
    expect(
      missingRuntimeImageScopes(["status", "doctor", "test", "hook", "descendant", "download"]),
    ).toEqual([]);
  });
});
