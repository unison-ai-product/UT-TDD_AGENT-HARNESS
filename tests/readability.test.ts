import { describe, expect, it } from "vitest";
import {
  analyzeReadability,
  loadFreezeReadabilityDocs,
  loadL6ReadabilityDocs,
  loadSystemReadabilityDocs,
  readabilityMessages,
} from "../src/lint/readability";

describe("readability lint (freeze doc mojibake guard)", () => {
  it("detects replacement characters and em-space/ascii mojibake", () => {
    const result = analyzeReadability([
      { path: "a.md", text: "# title\n§3.1 実�画\n" },
      { path: "b.md", text: "# gate-confirm lint \u2001Efunction design\n" },
      { path: "c.md", text: "逕ｨ隱樊峩譁ｰ\n" },
    ]);
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      { path: "a.md", marker: "replacement-character", line: 2 },
      { path: "b.md", marker: "em-space-before-ascii", line: 1 },
      { path: "c.md", marker: "halfwidth-katakana", line: 1 },
      { path: "c.md", marker: "cp932-mojibake", line: 1 },
    ]);
  });

  it("flags halfwidth katakana — the 工程表→蟾･遞玖｡ｨ class the curated kanji list missed", () => {
    const result = analyzeReadability([{ path: "d.md", text: "## 3. 蟾･遞玖｡ｨ\n" }]);
    expect(result.ok).toBe(false);
    expect(result.violations.map((v) => v.marker)).toContain("halfwidth-katakana");
  });

  it("system readability band spans the whole docs tree and the active tree is mojibake-free", () => {
    const docs = loadSystemReadabilityDocs();
    const paths = docs.map((doc) => doc.path.replaceAll("\\", "/"));
    expect(docs.length).toBeGreaterThan(50);
    expect(paths).toContain("docs/plans/PLAN-M-00-verify-cutover.md");
    expect(paths).toContain("docs/governance/README.md");
    expect(paths).toContain("CLAUDE.md");
    expect(analyzeReadability(docs).violations).toEqual([]);
  });

  it("formats a clear doctor message", () => {
    const messages = readabilityMessages(
      analyzeReadability([{ path: "a.md", text: "l6-fr-coverage 窶・weak" }]),
    );
    expect(messages[0]).toContain("readability — ⚠ mojibake markers 1件");
    expect(messages[0]).toContain("a.md:1:cp932-mojibake");
  });

  it("real L6 design docs are readable", () => {
    const result = analyzeReadability(loadL6ReadabilityDocs());
    expect(result.violations).toEqual([]);
  });

  it("freeze review docs include the PM-trace L5 plans and remain readable", () => {
    const docs = loadFreezeReadabilityDocs();
    const paths = docs.map((doc) => doc.path.replaceAll("\\", "/"));
    expect(paths).toContain("docs/plans/PLAN-L5-03-internal-processing.md");
    expect(paths).toContain("docs/plans/PLAN-L5-05-roster.md");
    expect(paths).toContain("docs/plans/PLAN-L5-06-skill.md");
    expect(paths).toContain("docs/plans/PLAN-L5-07-drift.md");
    expect(analyzeReadability(docs).violations).toEqual([]);
  });
});
