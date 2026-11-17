import { describe, expect, it } from "vitest";
import {
  analyzePrivacyScan,
  type PrivacyScanInput,
  type PrivacyUnit,
} from "../src/lint/privacy-scan.ts";

// L7 §2: no source line may match the email shape, so every address is joined at runtime.
const at = "@";
const mail = (local: string, domain: string) => [local, domain].join(at);
const G = mail("support", "github.com");
const GU = mail("Support", "GitHub.com");
const COMMIT = "a".repeat(40);
const ID = COMMIT.slice(0, 12);

const meta = (field: PrivacyUnit["field"], texts: readonly string[]): PrivacyUnit => ({
  source: "commit-meta",
  path: null,
  commit: COMMIT,
  field,
  lines: texts.map((text, index) => ({ line: index + 1, text })),
});
const input = (
  units: PrivacyUnit[],
  mode: PrivacyScanInput["mode"] = "diff",
): PrivacyScanInput => ({
  mode,
  units,
  skipped: 0,
  denylist: null,
  baseline: mode === "tree" ? [] : null,
  baselineUnreadable: false,
  previousBaseline: mode === "tree" ? { kind: "found", baseline: [] } : null,
});
const rows = (units: PrivacyUnit[], mode: PrivacyScanInput["mode"] = "diff") =>
  analyzePrivacyScan(input(units, mode)).findings.map((f) =>
    [f.location, f.line, f.kind].join(":"),
  );
const message = (...texts: string[]) => meta("message", texts);
const signed = (address: string, who = "dependabot[bot]", key = "Signed-off-by") =>
  `${key}: ${who} <${address}>`;

describe("privacy scan E5 (L6 §3, issue #1754)", () => {
  // Red: E5 is not implemented yet, so the allowed forms still hit on main.
  it.fails("CANDIDATE-U-PRIVSCAN-019: lets only the Dependabot signed-off-by line through", () => {
    const noreply = signed(`${"49699333+dependabot"}[bot]${at}users.noreply.github.com`);
    const cases = [
      [message("subject", "", signed(G))],
      [message("subject", "", signed(G, undefined, "signed-off-by"))],
      [message("subject", "", noreply)],
      [message("subject\r", "\r", "body line\r", `${signed(G)}\r`, "\r", "tail\r")],
    ];
    for (const units of cases) {
      const result = analyzePrivacyScan(input(units));
      expect(result.findings).toEqual([]);
      expect(result.ok).toBe(true);
    }
  });

  // Guard oracle: green on HEAD (current code already hits every counterexample) and must stay so.
  it("CANDIDATE-U-PRIVSCAN-020: still hits lookalikes and every other field", () => {
    const hit = (line: number) => `commit:${ID}:message:${line}:privacy-email-hit`;
    const counterexamples = [
      `see ${signed(G)}`,
      `${signed(G)} extra`,
      signed(mail("support", "evil.jp")),
      signed(`${G}.evil.jp`),
      signed(G, "renovate[bot]"),
      signed(G, "Alice Example"),
      signed(G, undefined, "Co-authored-by"),
      signed(GU),
    ];
    for (const text of counterexamples) {
      expect(rows([message("subject", "", text)])).toEqual([hit(3)]);
    }
    const line = signed(G);
    expect(rows([meta("author", [line])])).toEqual([`commit:${ID}:author:1:privacy-email-hit`]);
    expect(rows([meta("committer", [line])])).toEqual([
      `commit:${ID}:committer:1:privacy-email-hit`,
    ]);
    const content = (source: "diff" | "tree"): PrivacyUnit => ({
      source,
      path: "docs/x.md",
      commit: source === "diff" ? COMMIT : null,
      field: "content",
      lines: [{ line: 1, text: line }],
    });
    expect(rows([content("diff")])).toEqual([`docs/x.md@${ID}:1:privacy-email-hit`]);
    expect(rows([content("tree")], "tree")).toEqual(["docs/x.md:1:privacy-email-hit"]);
  });
});
