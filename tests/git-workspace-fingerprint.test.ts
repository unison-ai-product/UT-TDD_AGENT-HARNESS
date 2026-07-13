import { describe, expect, it } from "vitest";
import {
  assertGitWorkspaceUnchanged,
  type GitWorkspaceFingerprint,
} from "./support/git-workspace-fingerprint";

const fingerprint: GitWorkspaceFingerprint = {
  head: "head",
  statusDigest: "status",
  worktreeDigest: "worktree",
  indexDigest: "index",
  untrackedDigest: "untracked",
};

describe("git workspace fence", () => {
  it("U-TESTHYGIENE-010: accepts an unchanged dirty baseline", () => {
    expect(() => assertGitWorkspaceUnchanged(fingerprint, { ...fingerprint })).not.toThrow();
  });

  it.each(Object.keys(fingerprint) as Array<keyof GitWorkspaceFingerprint>)(
    "U-TESTHYGIENE-011: rejects a changed %s component",
    (key) => {
      expect(() =>
        assertGitWorkspaceUnchanged(fingerprint, { ...fingerprint, [key]: "mutated" }),
      ).toThrow("workspace fence violation");
    },
  );
});
