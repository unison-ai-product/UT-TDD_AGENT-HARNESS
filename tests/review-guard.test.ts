import { describe, expect, it } from "vitest";
import {
  assessReviewSession,
  detectWorkingTreeMutation,
  isExemptUntrackedMemoryAddition,
  isReadOnlyDelegationRole,
  isReviewCustodyProjection,
  reviewGuardMessages,
  summarizeStagedReview,
} from "../src/runtime/review-guard.ts";

describe("review-guard (IMP-137 / PLAN-L7-85)", () => {
  describe("isReadOnlyDelegationRole", () => {
    it("U-RGUARD-001: consult/verify (相談/検証) roles are read-only", () => {
      for (const role of [
        "tl",
        "qa",
        "uiux",
        "reviewer",
        "review",
        "security",
        "audit",
        "code-reviewer",
        "blind-review",
        "blind-reviewer",
      ]) {
        expect(isReadOnlyDelegationRole(role)).toBe(true);
      }
    });

    it("U-RGUARD-002: worker roles (se/docs) and unknown roles may mutate", () => {
      for (const role of ["se", "docs", "po", "aim", "implementer", "anything"]) {
        expect(isReadOnlyDelegationRole(role)).toBe(false);
      }
    });

    it("U-RGUARD-003: role matching is case-insensitive and trimmed", () => {
      expect(isReadOnlyDelegationRole("  QA ")).toBe(true);
      expect(isReadOnlyDelegationRole("TL")).toBe(true);
    });
  });

  describe("detectWorkingTreeMutation", () => {
    it("U-RGUARD-004: returns paths present after but not before (sorted, unique)", () => {
      const mutated = detectWorkingTreeMutation(
        ["src/a.ts"],
        ["src/a.ts", "src/c.ts", "src/b.ts", "src/b.ts"],
      );
      expect(mutated).toEqual(["src/b.ts", "src/c.ts"]);
    });

    it("U-RGUARD-005: no new paths -> empty", () => {
      expect(detectWorkingTreeMutation(["x"], ["x"])).toEqual([]);
      expect(detectWorkingTreeMutation(["x", "y"], ["x"])).toEqual([]);
    });
  });

  describe("assessReviewSession", () => {
    it("U-RGUARD-013: delegation-owned review custody projection is not reviewer mutation", () => {
      const a = assessReviewSession({
        role: "blind-reviewer",
        before: [],
        after: [
          ".ut-tdd/review/requests/request.json",
          ".ut-tdd/review/receipts/receipt.json",
          ".ut-tdd/review/verdicts/digest/attempts/attempt-1/verdict.txt",
        ],
      });
      expect(a.mutatedPaths).toEqual([]);
      expect(a.violation).toBe(false);
      expect(isReviewCustodyProjection(".ut-tdd/review/receipts/x.json")).toBe(true);
      expect(
        isReviewCustodyProjection(".ut-tdd/review/verdicts/digest/attempts/attempt-1/verdict.txt"),
      ).toBe(true);
      expect(isReviewCustodyProjection(".ut-tdd/review/other/x.json")).toBe(false);
    });
    it("U-RGUARD-006: read-only role that mutates the tree is a violation", () => {
      const a = assessReviewSession({
        role: "qa",
        before: ["docs/x.md"],
        after: ["docs/x.md", "src/lint/coding-rules.ts"],
      });
      expect(a).toMatchObject({
        role: "qa",
        readOnly: true,
        mutatedPaths: ["src/lint/coding-rules.ts"],
        violation: true,
      });
    });

    it("U-RGUARD-007: worker role mutating the tree is NOT a violation", () => {
      const a = assessReviewSession({
        role: "se",
        before: [],
        after: ["src/new.ts"],
      });
      expect(a.readOnly).toBe(false);
      expect(a.mutatedPaths).toEqual(["src/new.ts"]);
      expect(a.violation).toBe(false);
    });

    it("U-RGUARD-008: read-only role that leaves the tree clean is NOT a violation", () => {
      const a = assessReviewSession({ role: "tl", before: ["a"], after: ["a"] });
      expect(a.violation).toBe(false);
      expect(a.mutatedPaths).toEqual([]);
    });

    it("U-RGUARD-014: a newly added untracked .ut-tdd/memory/ file (another lane's `ut-tdd memory add`) is NOT a violation (issue #721)", () => {
      const a = assessReviewSession({
        role: "blind-reviewer",
        before: [],
        after: [".ut-tdd/memory/x.md"],
        untrackedAdded: [".ut-tdd/memory/x.md"],
      });
      expect(a.mutatedPaths).toEqual([]);
      expect(a.violation).toBe(false);
    });

    it("U-RGUARD-015: an already-tracked .ut-tdd/memory/ file modified during the session IS a violation (not in untrackedAdded)", () => {
      const a = assessReviewSession({
        role: "blind-reviewer",
        before: [],
        after: [".ut-tdd/memory/existing.md"],
        untrackedAdded: [],
      });
      expect(a.mutatedPaths).toEqual([".ut-tdd/memory/existing.md"]);
      expect(a.violation).toBe(true);
    });

    it("U-RGUARD-016: a newly added untracked file outside .ut-tdd/memory/ IS a violation", () => {
      const a = assessReviewSession({
        role: "blind-reviewer",
        before: [],
        after: ["src/foo.ts"],
        untrackedAdded: ["src/foo.ts"],
      });
      expect(a.mutatedPaths).toEqual(["src/foo.ts"]);
      expect(a.violation).toBe(true);
    });

    it("U-RGUARD-017: review custody projection exemption is unchanged when untrackedAdded is provided", () => {
      const a = assessReviewSession({
        role: "blind-reviewer",
        before: [],
        after: [
          ".ut-tdd/review/requests/request.json",
          ".ut-tdd/memory/new.md",
          ".ut-tdd/memory/existing.md",
        ],
        untrackedAdded: [".ut-tdd/memory/new.md"],
      });
      expect(a.mutatedPaths).toEqual([".ut-tdd/memory/existing.md"]);
      expect(a.violation).toBe(true);
    });
  });

  describe("isExemptUntrackedMemoryAddition", () => {
    it("U-RGUARD-018: exempts only paths under .ut-tdd/memory/ present in untrackedAdded", () => {
      const untrackedAdded = new Set([".ut-tdd/memory/new.md"]);
      expect(isExemptUntrackedMemoryAddition(".ut-tdd/memory/new.md", untrackedAdded)).toBe(true);
      expect(isExemptUntrackedMemoryAddition(".ut-tdd/memory/other.md", untrackedAdded)).toBe(
        false,
      );
      expect(isExemptUntrackedMemoryAddition("src/foo.ts", new Set(["src/foo.ts"]))).toBe(false);
    });
  });

  describe("reviewGuardMessages", () => {
    it("U-RGUARD-009: violation surfaces the mutated paths + IMP-137 guidance", () => {
      const msgs = reviewGuardMessages({
        role: "qa",
        readOnly: true,
        mutatedPaths: ["src/x.ts", "docs/y.md"],
        violation: true,
      });
      expect(msgs.length).toBe(2);
      expect(msgs[0]).toContain("review-guard - violation");
      expect(msgs[0]).toContain("src/x.ts");
      expect(msgs[1]).toContain("IMP-137");
    });

    it("U-RGUARD-010: no violation -> no messages", () => {
      expect(
        reviewGuardMessages({
          role: "se",
          readOnly: false,
          mutatedPaths: ["x"],
          violation: false,
        }),
      ).toEqual([]);
    });
  });

  describe("summarizeStagedReview", () => {
    it("U-RGUARD-011: staged set is sorted/unique; suspect = staged ∩ review-mutated", () => {
      const s = summarizeStagedReview(
        ["src/b.ts", "src/a.ts", "src/b.ts"],
        ["src/b.ts", "src/z.ts"],
      );
      expect(s.staged).toEqual(["src/a.ts", "src/b.ts"]);
      expect(s.suspect).toEqual(["src/b.ts"]);
      expect(s.ok).toBe(false);
    });

    it("U-RGUARD-012: no review-mutated overlap -> ok=true", () => {
      const s = summarizeStagedReview(["src/a.ts"]);
      expect(s.suspect).toEqual([]);
      expect(s.ok).toBe(true);
    });
  });
});
