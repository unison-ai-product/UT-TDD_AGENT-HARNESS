import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  accessSync,
  chmodSync,
  constants,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GitAuthoringProvenance } from "../../src/disposition/adapters/git-authoring-provenance.ts";
import { loadTrackedCatalogInput } from "../../src/disposition/adapters/tracked-vmodel-loader.ts";
import { gitBlobOid } from "../../src/disposition/domain/authoring-provenance.ts";
import { DocumentDispositionCatalog } from "../../src/disposition/domain/document-disposition-catalog.ts";
import type { AuthoringProvenancePort } from "../../src/disposition/ports/authoring-provenance.ts";
import { openHarnessDb } from "../../src/state-db/index.ts";
import { migrate } from "../../src/state-db/migration.ts";
import { rebuildHarnessDb } from "../../src/state-db/projection-writer.ts";
import { projectVmodelAuthoring } from "../../src/state-db/vmodel-projections.ts";
import { headSnapshotRoot } from "../support/workspace-roots.ts";

const tables = [
  "vmodel_sources",
  "vmodel_categories",
  "vmodel_meta_source_mappings",
  "vmodel_semantic_items",
  "vmodel_source_item_edges",
  "vmodel_source_target_edges",
  "vmodel_item_target_edges",
  "document_scale_profiles",
] as const;
const repoRoot = headSnapshotRoot();

describe("I-DISP-001 V-model projection", () => {
  it("materializes exact tracked identities and is a delete/rebuild fixed point", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      projectVmodelAuthoring(repoRoot, db);
      expect(count(db, "vmodel_sources")).toBe(109);
      expect(count(db, "vmodel_categories")).toBe(21);
      expect(count(db, "vmodel_meta_source_mappings")).toBe(1);
      expect(count(db, "vmodel_semantic_items")).toBe(163);
      expect(count(db, "vmodel_item_target_edges")).toBe(163);
      expect(
        Number(
          db
            .prepare("SELECT COUNT(*) AS count FROM findings WHERE source = ?")
            .get("vmodel-item-target")?.count ?? 0,
        ),
      ).toBe(163);
      expect(count(db, "document_scale_profiles")).toBe(8);
      const first = snapshot(db);
      projectVmodelAuthoring(repoRoot, db);
      expect(snapshot(db)).toEqual(first);
      clear(db);
      projectVmodelAuthoring(repoRoot, db);
      expect(snapshot(db)).toEqual(first);
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-001: projects all pending items to physical-data without a PLAN seed", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      projectVmodelAuthoring(repoRoot, db);
      expect(count(db, "vmodel_semantic_items")).toBe(163);
      expect(count(db, "vmodel_item_target_edges")).toBe(163);
      const itemTargetColumns = db
        .prepare("PRAGMA table_info(vmodel_item_target_edges)")
        .all()
        .map((column) => column.name);
      expect(itemTargetColumns).toContain("design_path");
      const pendingTargets = db
        .prepare(
          `SELECT target_status, plan_id, design_path
             FROM vmodel_item_target_edges ORDER BY item_id`,
        )
        .all();
      expect(pendingTargets).toHaveLength(163);
      expect(pendingTargets.every((row) => row.target_status === "pending_review")).toBe(true);
      expect(pendingTargets.every((row) => row.plan_id === null)).toBe(true);
      expect(pendingTargets.map((row) => row.design_path)).toEqual(
        Array(163).fill("docs/design/harness/L5-detailed-design/physical-data.md"),
      );
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-002: accepts defer with tracked design_path and NULL legacy plan_id", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      const ledger = ledgerWithDesignPath({
        designPath: "docs/design/harness/L5-detailed-design/physical-data.md",
        planId: "—",
      });
      const deps = authoringDepsWithLedger(repoRoot, ledger);
      let projectionFailure: unknown;
      try {
        projectVmodelAuthoring(repoRoot, db, deps);
      } catch (error) {
        projectionFailure = error;
      }

      // Current observation: projectVmodelAuthoring returns successfully here;
      // the following SELECT fails with `no such column: design_path`. Neither
      // NULL-plan persistence nor the tracked-path guard is established here.
      expect(projectionFailure).toBeUndefined();
      expect(
        db
          .prepare(
            "SELECT target_status, plan_id, design_path FROM vmodel_item_target_edges WHERE edge_id = ?",
          )
          .get("ITEM-TARGET-KIKAKU"),
      ).toMatchObject({
        target_status: "defer",
        plan_id: null,
        design_path: "docs/design/harness/L5-detailed-design/physical-data.md",
      });
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-002 contrast: rejects legacy plan_id-only defer without a design_path column", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      const ledger = legacyLedgerWithPlanOnlyDefer(
        "PLAN-L7-417-source-disposition-profile-projection",
      );
      expect(ledger).not.toContain("design_path");
      let projectionFailure: unknown;
      try {
        projectVmodelAuthoring(repoRoot, db, authoringDepsWithLedger(repoRoot, ledger));
      } catch (error) {
        projectionFailure = error;
      }
      expect(projectionFailure).toBeInstanceOf(Error);
    } finally {
      db.close();
    }
  });

  describe("CANDIDATE-U-DISPPTR-003 physical path variants", () => {
    const validPath = "docs/design/harness/L5-detailed-design/physical-data.md";
    const missingPath = "docs/design/harness/L5-detailed-design/missing-physical-data.md";
    const unreadablePath = "docs/design/harness/L5-detailed-design/unreadable-fixture.md";
    const gitSymlinkPath = "docs/design/harness/L5-detailed-design/git-symlink-fixture.md";
    const junctionPath = "docs/design/harness/L5-detailed-design/junction-escape/target.md";
    let tempRoot: string;
    let junctionOutside: string | undefined;

    beforeAll(() => {
      tempRoot = createDocsGitFixture({ ensureTracked: missingPath });
      rmSync(join(tempRoot, missingPath));
      addTrackedFixtureFile(tempRoot, unreadablePath);
      addTrackedFixtureFile(tempRoot, gitSymlinkPath);
      const symlinkOid = execFileSync("git", ["hash-object", gitSymlinkPath], {
        cwd: tempRoot,
        encoding: "utf8",
      }).trim();
      execFileSync(
        "git",
        ["update-index", "--add", "--cacheinfo", `120000,${symlinkOid},${gitSymlinkPath}`],
        { cwd: tempRoot, stdio: "ignore" },
      );

      addTrackedFixtureFile(tempRoot, junctionPath);
      commitFixtureIndex(tempRoot);
      expect(
        execFileSync("git", ["ls-tree", "HEAD", "--", gitSymlinkPath], {
          cwd: tempRoot,
          encoding: "utf8",
        }),
      ).toMatch(/^120000\s/m);
      expect(
        execFileSync("git", ["ls-tree", "HEAD", "--", junctionPath], {
          cwd: tempRoot,
          encoding: "utf8",
        }),
      ).toMatch(/^100644\s/m);
      junctionOutside = mkdtempSync(join(tmpdir(), "ut-t1-disposition-junction-outside-"));
      writeFileSync(join(junctionOutside, "target.md"), "outside target\n", "utf8");
      const junctionDirectory = dirname(join(tempRoot, junctionPath));
      rmSync(junctionDirectory, { recursive: true });
      const junctionParent = dirname(junctionDirectory);
      symlinkSync(
        junctionOutside,
        join(junctionParent, "junction-escape"),
        process.platform === "win32" ? "junction" : "dir",
      );
    });

    afterAll(() => {
      rmSync(tempRoot, { recursive: true, force: true });
      if (junctionOutside) rmSync(junctionOutside, { recursive: true, force: true });
    });

    it.fails("rejects lexical/noncanonical paths after a valid tracked-path baseline", () => {
      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        seedPlan(db);
        expect(projectFailure(tempRoot, db, validPath)).toBeUndefined();
        const invalidPaths = [
          missingPath,
          "",
          "physical-data.md",
          "C:/docs/design/harness/L5-detailed-design/physical-data.md",
          "docs/design/harness/../harness/L5-detailed-design/physical-data.md",
          "docs\\design\\harness\\L5-detailed-design\\physical-data.md",
          "docs/design/harness/L5-detailed-design/cafe\u0301.md",
          "docs/design/harness/L5-detailed-design/../L5-detailed-design/physical-data.md",
          "docs/governance/README.md",
        ];

        for (const designPath of invalidPaths) {
          expect(
            projectFailure(tempRoot, db, designPath),
            `design_path=${JSON.stringify(designPath)}`,
          ).toBeInstanceOf(Error);
        }
      } finally {
        db.close();
      }
    });

    const verifyPosixUnreadableTarget = () => {
      const path = join(tempRoot, unreadablePath);
      const originalMode = statSync(path).mode & 0o777;
      chmodSync(path, 0);
      try {
        expect(statSync(path).mode & 0o444).toBe(0);
        expect(() => accessSync(path, constants.R_OK)).toThrow();
        const db = openHarnessDb(":memory:");
        try {
          migrate(db);
          seedPlan(db);
          expect(projectFailure(tempRoot, db, validPath)).toBeUndefined();
          expect(projectFailure(tempRoot, db, unreadablePath)).toBeInstanceOf(Error);
        } finally {
          db.close();
        }
      } finally {
        chmodSync(path, originalMode);
      }
    };

    if (process.platform === "win32") {
      it.skip("read-inaccessible target fixture requires POSIX permission semantics", () => {});
    } else if (process.getuid?.() === 0) {
      it.skip("root bypasses POSIX read-permission checks, so chmod is not an access-denial fixture", () => {});
    } else {
      it.fails(
        "rejects a tracked target with no read permission on POSIX",
        verifyPosixUnreadableTarget,
      );
    }

    it.fails("rejects a Git mode-120000 target even when a regular worktree file exists", () => {
      const path = join(tempRoot, gitSymlinkPath);
      const indexEntry = execFileSync("git", ["ls-files", "--stage", "--", gitSymlinkPath], {
        cwd: tempRoot,
        encoding: "utf8",
      });
      expect(indexEntry).toMatch(/^120000\s/m);
      expect(lstatSync(path).isFile()).toBe(true);

      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        seedPlan(db);
        expect(projectFailure(tempRoot, db, validPath)).toBeUndefined();
        expect(projectFailure(tempRoot, db, gitSymlinkPath)).toBeInstanceOf(Error);
      } finally {
        db.close();
      }
    });

    it.fails("rejects a tracked target that resolves through a junction/symlink outside the fixture", () => {
      if (!junctionOutside) throw new Error("junction escape fixture was not initialized");
      const physicalTarget = realpathSync.native(join(tempRoot, junctionPath));
      expect(existsSync(physicalTarget)).toBe(true);
      expect(readFileSync(physicalTarget, "utf8")).toBe("outside target\n");
      expect(physicalTarget.startsWith(realpathSync.native(junctionOutside))).toBe(true);
      expect(
        execFileSync("git", ["ls-files", "--error-unmatch", "--", junctionPath], {
          cwd: tempRoot,
          encoding: "utf8",
        }).trim(),
      ).toBe(junctionPath);

      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        seedPlan(db);
        expect(projectFailure(tempRoot, db, validPath)).toBeUndefined();
        expect(projectFailure(tempRoot, db, junctionPath)).toBeInstanceOf(Error);
      } finally {
        db.close();
      }
    });
  });

  describe("CANDIDATE-U-DISPPTR-007 rebuild boundary", () => {
    const targetPath = "docs/design/harness/L0-planning/charter.md";
    const alternatePath = "docs/design/harness/L4-basic-design/architecture.md";
    const dispositionPath = "docs/governance/vmodel-document-disposition-catalog.md";
    const sourceTargetPath = "docs/governance/vmodel-source-target-edges.md";
    let tempRoot: string;
    let negativeRoot: string;
    let originalDisposition: string;
    let originalSourceTargets: string;

    beforeAll(() => {
      tempRoot = createDocsGitFixture({ ensureTracked: targetPath });
      negativeRoot = createDocsGitFixture({ ensureTracked: targetPath });
      originalDisposition = readFileSync(join(negativeRoot, dispositionPath), "utf8");
      originalSourceTargets = readFileSync(join(negativeRoot, sourceTargetPath), "utf8");
    });

    afterAll(() => {
      rmSync(tempRoot, { recursive: true, force: true });
      rmSync(negativeRoot, { recursive: true, force: true });
    });

    it("rebuilds the normal fixture through V-model and spec-IR projections", () => {
      const db = openHarnessDb(":memory:");
      try {
        const result = rebuildFixture(tempRoot, db);
        expect(result.ok).toBe(true);
        expect(
          db
            .prepare(
              "SELECT authoring_source_path, projection_table FROM document_catalog_entries WHERE doc_type_id = ?",
            )
            .get("DOC-L0-CHARTER"),
        ).toMatchObject({
          authoring_source_path: targetPath,
          projection_table: "spec_defs",
        });
        expect(
          db
            .prepare(
              "SELECT edge_id, target_type, target_ref FROM vmodel_source_target_edges WHERE edge_id IN (?, ?) ORDER BY edge_id",
            )
            .all("EDGE-001", "EDGE-071"),
        ).toEqual([
          { edge_id: "EDGE-001", target_type: "artifact_path", target_ref: targetPath },
          { edge_id: "EDGE-071", target_type: "artifact_path", target_ref: targetPath },
        ]);
        expect(count(db, "spec_defs")).toBeGreaterThan(0);
      } finally {
        db.close();
      }
    });

    describe("ID/slot-only binding", () => {
      beforeEach(() => {
        prepareFixtureCatalogEdits(negativeRoot, [
          { path: dispositionPath, rowId: "ZIP-DOC-001", cells: { 4: "`DOC-L0-CHARTER`" } },
          { path: dispositionPath, rowId: "ZIP-DOC-071", cells: { 4: "`DOC-L0-CHARTER`" } },
          {
            path: sourceTargetPath,
            rowId: "EDGE-001",
            cells: { 4: "`target_slot`", 5: "`DOC-L0-CHARTER`" },
          },
          {
            path: sourceTargetPath,
            rowId: "EDGE-071",
            cells: { 4: "`target_slot`", 5: "`DOC-L0-CHARTER`" },
          },
        ]);
      });

      afterEach(() =>
        restoreFixtureCatalog(
          negativeRoot,
          dispositionPath,
          sourceTargetPath,
          originalDisposition,
          originalSourceTargets,
        ),
      );

      it.fails("rejects slot-only ZIP-DOC-001/071 bindings after a valid physical-path rebuild", () => {
        expectRebuildRejectsWithoutChangingProjection(tempRoot, negativeRoot);
      });
    });

    describe("different tracked path", () => {
      beforeEach(() => {
        prepareFixtureCatalogEdits(
          negativeRoot,
          [
            { path: dispositionPath, rowId: "ZIP-DOC-001", cells: { 4: `\`${alternatePath}\`` } },
            { path: dispositionPath, rowId: "ZIP-DOC-071", cells: { 4: `\`${alternatePath}\`` } },
            {
              path: sourceTargetPath,
              rowId: "EDGE-001",
              cells: { 5: `\`${alternatePath}\`` },
            },
            {
              path: sourceTargetPath,
              rowId: "EDGE-071",
              cells: { 5: `\`${alternatePath}\`` },
            },
          ],
          alternatePath,
        );
      });

      afterEach(() =>
        restoreFixtureCatalog(
          negativeRoot,
          dispositionPath,
          sourceTargetPath,
          originalDisposition,
          originalSourceTargets,
        ),
      );

      it.fails("rejects ZIP-DOC-001/071 bindings to another tracked regular file after baseline rebuild", () => {
        expectRebuildRejectsWithoutChangingProjection(tempRoot, negativeRoot);
      });
    });

    it.fails("rejects a tracked charter target whose physical entity is missing and preserves committed projections", () => {
      const db = openHarnessDb(":memory:");
      try {
        const baseline = rebuildFixture(tempRoot, db);
        expect(baseline.ok).toBe(true);
        const before = rebuildProjectionSnapshot(db);
        rmSync(join(tempRoot, targetPath));

        let rebuildFailure: unknown;
        try {
          // No test-owned transaction: the real rebuild must reject inside its
          // projection transaction and preserve the earlier committed snapshot.
          rebuildFixture(tempRoot, db);
        } catch (error) {
          rebuildFailure = error;
        }

        expect(rebuildFailure).toBeInstanceOf(Error);
        expect(rebuildProjectionSnapshot(db)).toEqual(before);
      } finally {
        db.close();
      }
    });
  });

  it("rolls back deletion when tracked provenance is tampered", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      projectVmodelAuthoring(repoRoot, db);
      const before = snapshot(db);
      const provenance = new GitAuthoringProvenance(repoRoot);
      let projectionFailure: unknown;
      db.exec("BEGIN IMMEDIATE");
      try {
        clear(db);
        projectVmodelAuthoring(repoRoot, db, {
          provenance,
          read: (path) =>
            path.endsWith("vmodel-source-manifest.md")
              ? new TextEncoder().encode("tampered")
              : readFileSync(path),
        });
      } catch (error) {
        projectionFailure = error;
      } finally {
        db.exec("ROLLBACK");
      }
      expect(projectionFailure).toBeInstanceOf(Error);
      expect(String(projectionFailure)).toContain("catalog-provenance-invalid");
      expect(snapshot(db)).toEqual(before);
    } finally {
      db.close();
    }
  });
});

function seedPlan(db: ReturnType<typeof openHarnessDb>): void {
  db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run(
    "PLAN-L7-417-source-disposition-profile-projection",
  );
}

function count(db: ReturnType<typeof openHarnessDb>, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count ?? 0);
}

function snapshot(db: ReturnType<typeof openHarnessDb>) {
  return {
    ...Object.fromEntries(
      tables.map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()]),
    ),
    findings: db
      .prepare("SELECT * FROM findings WHERE source = ? ORDER BY finding_id")
      .all("vmodel-item-target"),
  };
}

function rebuildProjectionSnapshot(db: ReturnType<typeof openHarnessDb>) {
  const projectionTables = [...tables, "document_catalog_entries", "spec_defs"];
  return Object.fromEntries(
    projectionTables.map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()]),
  );
}

function expectCharterEdges(db: ReturnType<typeof openHarnessDb>, targetPath: string): void {
  expect(
    db
      .prepare(
        "SELECT edge_id, target_type, target_ref FROM vmodel_source_target_edges WHERE edge_id IN (?, ?) ORDER BY edge_id",
      )
      .all("EDGE-001", "EDGE-071"),
  ).toEqual([
    { edge_id: "EDGE-001", target_type: "artifact_path", target_ref: targetPath },
    { edge_id: "EDGE-071", target_type: "artifact_path", target_ref: targetPath },
  ]);
}

const trackedCatalogPaths = [
  "docs/governance/vmodel-source-manifest.md",
  "docs/governance/vmodel-document-disposition-catalog.md",
  "docs/governance/vmodel-semantic-item-catalog.md",
  "docs/governance/vmodel-source-target-edges.md",
  "docs/governance/vmodel-item-target-ledger.md",
] as const;

function prepareFixtureCatalogEdits(
  root: string,
  edits: Array<{ path: string; rowId: string; cells: Record<number, string> }>,
  expectedTrackedRegularPath?: string,
): void {
  const paths = [...new Set(edits.map((edit) => edit.path))];
  for (const edit of edits) updateFixtureTableRow(root, edit);
  execFileSync("git", ["add", "--", ...paths], { cwd: root, stdio: "ignore" });
  commitFixtureIndex(root);
  expect(
    execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: root,
      encoding: "utf8",
    }),
  ).toBe("");
  validateTrackedFixtureCatalog(root);
  if (expectedTrackedRegularPath) {
    const absolutePath = join(root, expectedTrackedRegularPath);
    expect(lstatSync(absolutePath).isFile()).toBe(true);
    expect(
      execFileSync("git", ["ls-files", "--stage", "--", expectedTrackedRegularPath], {
        cwd: root,
        encoding: "utf8",
      }),
    ).toMatch(/^100644\s/m);
  }
}

function restoreFixtureCatalog(
  root: string,
  dispositionPath: string,
  sourceTargetPath: string,
  originalDisposition: string,
  originalSourceTargets: string,
): void {
  writeFileSync(join(root, dispositionPath), originalDisposition, "utf8");
  writeFileSync(join(root, sourceTargetPath), originalSourceTargets, "utf8");
  execFileSync("git", ["add", "--", dispositionPath, sourceTargetPath], {
    cwd: root,
    stdio: "ignore",
  });
  commitFixtureIndex(root);
  expect(
    execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: root,
      encoding: "utf8",
    }),
  ).toBe("");
  validateTrackedFixtureCatalog(root);
}

function validateTrackedFixtureCatalog(root: string): void {
  const bundle = Object.fromEntries(
    trackedCatalogPaths.map((path) => [path, readFileSync(join(root, path))]),
  );
  const input = loadTrackedCatalogInput(
    bundle,
    new GitAuthoringProvenance(root).receipts(trackedCatalogPaths),
  );
  expect(DocumentDispositionCatalog.create(input).ok).toBe(true);
}

function expectRebuildRejectsWithoutChangingProjection(
  baselineRoot: string,
  negativeRoot: string,
): void {
  const db = openHarnessDb(":memory:");
  try {
    const baseline = rebuildFixture(baselineRoot, db);
    expect(baseline.ok).toBe(true);
    expectCharterEdges(db, "docs/design/harness/L0-planning/charter.md");
    const before = rebuildProjectionSnapshot(db);

    let rebuildFailure: unknown;
    try {
      rebuildFixture(negativeRoot, db);
    } catch (error) {
      rebuildFailure = error;
    }
    expect(rebuildFailure).toBeInstanceOf(Error);
    expect(rebuildProjectionSnapshot(db)).toEqual(before);
  } finally {
    db.close();
  }
}

function updateFixtureTableRow(
  root: string,
  edit: { path: string; rowId: string; cells: Record<number, string> },
): void {
  const path = join(root, edit.path);
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => {
    const firstCell = line.split("|")[1]?.trim().replace(/^`|`$/g, "");
    return firstCell === edit.rowId;
  });
  if (lineIndex < 0) throw new Error(`fixture row not found: ${edit.path} ${edit.rowId}`);
  const cells = lines[lineIndex].split("|");
  for (const [index, value] of Object.entries(edit.cells)) {
    const cellIndex = Number(index);
    if (cellIndex >= cells.length - 1) throw new Error(`fixture cell out of range: ${index}`);
    cells[cellIndex] = ` ${value} `;
  }
  lines[lineIndex] = cells.join("|");
  writeFileSync(path, lines.join("\n"), "utf8");
}

function rebuildFixture(root: string, db: ReturnType<typeof openHarnessDb>) {
  return rebuildHarnessDb({
    repoRoot: root,
    db,
    skipTokenTelemetry: true,
    relationGraph: { nodes: [], edges: [], verificationProfiles: [], findings: [] },
    documentExports: {
      document_export_runs: [],
      document_export_datasets: [],
      document_export_artifacts: [],
      findings: [],
      actionsTaken: [],
      ok: true,
    },
  });
}

function projectFailure(root: string, db: ReturnType<typeof openHarnessDb>, designPath: string) {
  try {
    projectVmodelAuthoring(
      root,
      db,
      authoringDepsWithLedger(
        root,
        ledgerWithDesignPath({
          designPath,
          planId: "PLAN-L7-417-source-disposition-profile-projection",
        }),
      ),
    );
  } catch (error) {
    return error;
  }
  return undefined;
}

function clear(db: ReturnType<typeof openHarnessDb>): void {
  for (const table of [...tables].reverse()) db.exec(`DELETE FROM ${table}`);
  db.prepare("DELETE FROM findings WHERE source = ?").run("vmodel-item-target");
}

function ledgerWithDesignPath(input: { designPath: string; planId: string }): string {
  const lines = readFileSync(
    join(repoRoot, "docs/governance/vmodel-item-target-ledger.md"),
    "utf8",
  ).split(/\r?\n/);
  let header: string[] | undefined;
  let inItemTable = false;
  const result = lines.map((line) => {
    if (!inItemTable && line.startsWith("| `edge_id` | `item_id` |")) {
      inItemTable = true;
      header = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replace(/^`|`$/g, ""));
      return `${line.slice(0, -1)} \`design_path\` |`;
    }
    if (inItemTable && !line.startsWith("|")) inItemTable = false;
    if (!inItemTable || !line.startsWith("|")) return line;
    if (/^\|\s*[-:| ]+\|\s*$/.test(line)) return `${line.slice(0, -1)}---|`;

    const columns = [...(header ?? []), "design_path"];
    const values = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const cells = Object.fromEntries(
      (header ?? []).map((key, index) => [key, values[index] ?? ""]),
    );
    if (cells.edge_id === "`ITEM-TARGET-KIKAKU`") {
      cells.target_status = "`defer`";
      cells.target_kind = "`plan_alias`";
      cells.target_ref = "`PLAN-L7-417-source-disposition-profile-projection`";
      cells["判断理由"] = "valid design_path defer fixture";
      cells.plan_id = input.planId === "—" ? "—" : `\`${input.planId}\``;
      values[values.length] = input.designPath ? `\`${input.designPath}\`` : "";
      for (const [key, value] of Object.entries(cells)) {
        const index = columns.indexOf(key);
        if (index >= 0) values[index] = value;
      }
    } else {
      values.push("—");
    }
    return `| ${columns.map((key, index) => values[index] ?? "").join(" | ")} |`;
  });
  return result.join("\n");
}

function legacyLedgerWithPlanOnlyDefer(planId: string): string {
  const expanded = ledgerWithDesignPath({ designPath: "", planId });
  const lines = expanded.split(/\r?\n/);
  let inItemTable = false;
  return lines
    .map((line) => {
      if (!inItemTable && line.startsWith("| `edge_id` | `item_id` |")) inItemTable = true;
      if (inItemTable && !line.startsWith("|")) inItemTable = false;
      if (!inItemTable || !line.startsWith("|")) return line;
      const cells = line.split("|");
      cells.splice(-2, 1);
      return cells.join("|");
    })
    .join("\n");
}

function authoringDepsWithLedger(
  root: string,
  ledger: string,
): Parameters<typeof projectVmodelAuthoring>[2] {
  const ledgerPath = "docs/governance/vmodel-item-target-ledger.md";
  const ledgerBytes = new TextEncoder().encode(ledger);
  const provenance = new GitAuthoringProvenance(root);
  const digest = createHash("sha256").update(ledgerBytes).digest("hex");
  const receipts: AuthoringProvenancePort = {
    receipts: (paths) =>
      provenance.receipts(paths).map((receipt) =>
        receipt.path === ledgerPath
          ? {
              ...receipt,
              blobOid: gitBlobOid(ledgerBytes),
              contentDigest: digest,
            }
          : receipt,
      ),
  };
  return {
    read: (path) => (path === ledgerPath ? ledgerBytes : readFileSync(join(root, path))),
    provenance: receipts,
  };
}

function createDocsGitFixture(input: { ensureTracked: string }): string {
  const root = mkdtempSync(join(tmpdir(), "ut-t1-disposition-target-fixture-"));
  cpSync(join(repoRoot, "docs"), join(root, "docs"), { recursive: true });
  const extraPath = join(root, input.ensureTracked);
  if (!existsSync(extraPath)) {
    // Small missing-file fixtures are added to the Git index before the
    // worktree entry is removed by the calling test.
    mkdirSync(dirname(extraPath), { recursive: true });
    writeFileSync(extraPath, "tracked fixture path\n", "utf8");
  }
  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "docs"], { cwd: root, stdio: "ignore" });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=UT-TDD test",
      "-c",
      "user.email=ut-tdd-test@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-m",
      "test fixture",
    ],
    { cwd: root, stdio: "ignore" },
  );
  return root;
}

function addTrackedFixtureFile(root: string, relativePath: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "tracked fixture target\n", "utf8");
  execFileSync("git", ["add", "--", relativePath], { cwd: root, stdio: "ignore" });
}

function commitFixtureIndex(root: string): void {
  execFileSync(
    "git",
    [
      "-c",
      "user.name=UT-TDD test",
      "-c",
      "user.email=ut-tdd-test@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-m",
      "add disposition target boundary fixtures",
    ],
    { cwd: root, stdio: "ignore" },
  );
}
