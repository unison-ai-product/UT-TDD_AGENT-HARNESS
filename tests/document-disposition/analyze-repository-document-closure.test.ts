import { describe, expect, it } from "vitest";
import { analyzeRepositoryDocumentClosure } from "../../src/document-disposition/domain/analyze-repository-document-closure";

function snapshot(snapshotDigest: string, paths: readonly string[]) {
  return {
    snapshotDigest,
    members: paths.map((path) => ({ path })),
  };
}

function record(baselinePath: string) {
  return {
    baselinePath,
    disposition: "retain" as const,
    reason: "現行設計と一致",
    targets: [],
    planIds: [],
    applicationStatus: "verified" as const,
    applicability: { kind: "applicable" as const },
  };
}

describe("analyzeRepositoryDocumentClosure U-DOCLEDGER-003", () => {
  it("exactly-once ledgerはclosed/exit 0を返す", () => {
    const result = analyzeRepositoryDocumentClosure({
      baselineSnapshot: snapshot("baseline", ["docs/a.md", "docs/b.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md", "docs/b.md"]),
      ledger: { records: [record("docs/a.md"), record("docs/b.md")] },
      policyRevision: "document-closure-v1",
    });

    expect(result).toEqual({
      finalSnapshotDigest: "final",
      findings: [],
      routeRequirements: [],
      closure: "closed",
      exitCode: 0,
    });
  });

  it("missing recordをstable findingとして全件返し、入力を変更しない", () => {
    const input = {
      baselineSnapshot: snapshot("baseline", ["docs/a.md", "docs/b.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md", "docs/b.md"]),
      ledger: { records: [record("docs/a.md")] },
      policyRevision: "document-closure-v1",
    } as const;
    const before = structuredClone(input);

    const first = analyzeRepositoryDocumentClosure(input);
    const second = analyzeRepositoryDocumentClosure(input);

    expect(first).toEqual({
      finalSnapshotDigest: "final",
      findings: [
        expect.objectContaining({
          ruleId: "doc-disposition-missing",
          subjectIdentity: "docs/b.md",
          exitCode: 1,
        }),
      ],
      routeRequirements: [],
      closure: "blocked",
      exitCode: 1,
    });
    expect(second.findings.map(({ findingId }) => findingId)).toEqual(
      first.findings.map(({ findingId }) => findingId),
    );
    expect(input).toEqual(before);
  });

  it("snapshotに存在しないunique ledger recordをphantomとして返す", () => {
    const result = analyzeRepositoryDocumentClosure({
      baselineSnapshot: snapshot("baseline", ["docs/a.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md"]),
      ledger: { records: [record("docs/a.md"), record("docs/z.md")] },
      policyRevision: "document-closure-v1",
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        ruleId: "doc-disposition-phantom",
        subjectIdentity: "docs/z.md",
      }),
    ]);
  });

  it("exact duplicateを1件のduplicate findingへ正規化し、二次missingを出さない", () => {
    const result = analyzeRepositoryDocumentClosure({
      baselineSnapshot: snapshot("baseline", ["docs/a.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md"]),
      ledger: { records: [record("docs/a.md"), record("docs/a.md")] },
      policyRevision: "document-closure-v1",
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        ruleId: "doc-disposition-duplicate",
        subjectIdentity: "docs/a.md",
      }),
    ]);
  });

  it("case-fold collisionをOS非依存で検出し、finding順を固定する", () => {
    const result = analyzeRepositoryDocumentClosure({
      baselineSnapshot: snapshot("baseline", ["docs/A.md", "docs/a.md"]),
      finalSnapshot: snapshot("final", ["docs/A.md", "docs/a.md"]),
      ledger: { records: [record("docs/A.md"), record("docs/a.md")] },
      policyRevision: "document-closure-v1",
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        ruleId: "doc-disposition-duplicate",
        subjectIdentity: "docs/A.md|docs/a.md",
      }),
    ]);
  });

  it("missing/phantom/duplicateを同時に隠さずstable順で返す", () => {
    const input = {
      baselineSnapshot: snapshot("baseline", ["docs/a.md", "docs/b.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md", "docs/b.md", "docs/c.md"]),
      ledger: {
        records: [record("docs/a.md"), record("docs/a.md"), record("docs/z.md")],
      },
      policyRevision: "document-closure-v1",
    } as const;

    const result = analyzeRepositoryDocumentClosure(input);

    expect(result.findings.map(({ ruleId, subjectIdentity }) => [ruleId, subjectIdentity])).toEqual(
      [
        ["doc-disposition-duplicate", "docs/a.md"],
        ["doc-disposition-missing", "docs/b.md"],
        ["doc-disposition-phantom", "docs/z.md"],
      ],
    );
    expect(analyzeRepositoryDocumentClosure(input)).toEqual(result);
  });

  it("finalで追加されたpathはbaseline disposition missingとして扱わない", () => {
    const result = analyzeRepositoryDocumentClosure({
      baselineSnapshot: snapshot("baseline", ["docs/a.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md", "docs/new.md"]),
      ledger: { records: [record("docs/a.md")] },
      policyRevision: "document-closure-v1",
    });

    expect(result.findings).toEqual([]);
  });

  it("不完全なdispositionをstable findingとしてclosureで拒否する", () => {
    const incomplete = {
      ...record("docs/a.md"),
      disposition: "update",
      targets: [],
      planIds: [],
      applicability: {
        kind: "conditional",
        reason: "",
        observedCondition: "flag=on",
        reevaluationTrigger: "",
      },
    } as const;
    const input = {
      baselineSnapshot: snapshot("baseline", ["docs/a.md"]),
      finalSnapshot: snapshot("final", ["docs/a.md"]),
      ledger: { records: [incomplete] },
      policyRevision: "document-closure-v1",
    } as const;

    const result = analyzeRepositoryDocumentClosure(input);

    expect(result).toEqual({
      finalSnapshotDigest: "final",
      findings: [
        expect.objectContaining({
          ruleId: "doc-disposition-incomplete",
          subjectIdentity: "docs/a.md",
          exitCode: 1,
        }),
      ],
      routeRequirements: [],
      closure: "blocked",
      exitCode: 1,
    });
    expect(analyzeRepositoryDocumentClosure(input)).toEqual(result);
  });
});
