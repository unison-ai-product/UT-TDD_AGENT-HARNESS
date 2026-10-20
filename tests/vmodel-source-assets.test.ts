import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { removeTestTree } from "./support/temp-tree.ts";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function collectCandidateIds(text: string): string[] {
  return [...text.matchAll(/`(CANDIDATE-[A-Z0-9-]+-[0-9]{3})`/g)].map((match) => match[1]);
}

function readCandidateDocuments(root: string): [string, ...string[]] {
  return [readFileSync(resolve(root, "docs/test-design/harness/L7-unit-test-design.md"), "utf8")];
}

function withCandidateDocuments(
  files: Record<string, string>,
  assert: (root: string) => void,
): void {
  const root = mkdtempSync(join(tmpdir(), "vmsrc009-"));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const path = resolve(root, relativePath);
      mkdirSync(resolve(path, ".."), { recursive: true });
      writeFileSync(path, content, "utf8");
    }
    assert(root);
  } finally {
    removeTestTree(root);
  }
}

type CandidateMarker = "bare" | "quoted";
type CandidateDeclarationKind = "table" | "heading";
type CandidateTableShape = "plain" | "ascii-parens" | "fullwidth-parens" | "em-dash";

function candidateDeclaration(
  id: string,
  kind: CandidateDeclarationKind,
  marker: CandidateMarker,
  shape: CandidateTableShape = "plain",
): string {
  const token = marker === "quoted" ? `\`${id}\`` : id;
  if (kind === "heading") return `## ${token} description`;
  if (shape === "ascii-parens") return `| ${token} (note) | description |`;
  if (shape === "fullwidth-parens") return `| ${token}（note） | description |`;
  if (shape === "em-dash") return `| ${token} — description |`;
  return `| ${token} | description |`;
}

function candidateIndex(content: string[] = []): string {
  return [
    "| Test ID | Description |",
    "|---|---|",
    "| `P-FSM-001` | existing formal oracle |",
    "| `I-DISP-001` | existing formal oracle |",
    "| `CANDIDATE-I-SP-001` | existing candidate |",
    "| `CANDIDATE-M-SP-001` | existing candidate |",
    ...content,
  ].join("\n");
}

function expectedCandidateIds(...additional: string[]): string[] {
  return ["CANDIDATE-I-SP-001", "CANDIDATE-M-SP-001", ...additional].sort();
}

function clean(value: string): string {
  return value.trim().replace(/^`|`$/g, "");
}

function tableRows(markdown: string, requiredHeaders: string[]): Array<Record<string, string>> {
  const lines = markdown.split(/\r?\n/);
  const rows: Array<Record<string, string>> = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = lines[index];
    const separator = lines[index + 1];
    if (!header.startsWith("|") || !separator.startsWith("|")) continue;
    const headers = header.split("|").slice(1, -1).map(clean);
    if (!requiredHeaders.every((required) => headers.includes(required))) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && lines[rowIndex].startsWith("|")) {
      const values = lines[rowIndex].split("|").slice(1, -1).map(clean);
      rows.push(Object.fromEntries(headers.map((key, column) => [key, values[column] ?? ""])));
      rowIndex += 1;
    }
  }
  return rows;
}

describe("checked Vモデル source assets", () => {
  const disposition = read("docs/governance/vmodel-document-disposition-catalog.md");
  const semanticItems = read("docs/governance/vmodel-semantic-item-catalog.md");
  const edges = read("docs/governance/vmodel-source-target-edges.md");
  const targetCatalog = read("docs/governance/vmodel-document-catalog.md");
  const profiles = read("docs/governance/vmodel-document-scale-profiles.md");
  const itemTargets = read("docs/governance/vmodel-item-target-ledger.md");

  it("U-VMSRC-001: 109 source documents are dispositioned exactly once", () => {
    const rows = tableRows(disposition, [
      "source_id",
      "disposition",
      "target",
      "profile / 判断理由",
    ]);
    const expected = Array.from(
      { length: 109 },
      (_, index) => `ZIP-DOC-${String(index + 1).padStart(3, "0")}`,
    );
    expect(rows.map((row) => row.source_id)).toEqual(expected);
    expect(new Set(rows.map((row) => row.source_id)).size).toBe(109);
    const allowed = new Set(["adopt", "merge", "reference", "defer", "not_applicable", "reject"]);
    expect(rows.filter((row) => !allowed.has(row.disposition))).toEqual([]);
    expect(rows.filter((row) => !row.target || !row["profile / 判断理由"])).toEqual([]);
  });

  it("U-VMSRC-002: 21 categories and 163 semantic items are complete and connected", () => {
    const categories = tableRows(semanticItems, ["category_id", "category_name"]);
    const items = tableRows(semanticItems, ["item_id", "category_id", "source_ref"]);
    expect(categories).toHaveLength(21);
    expect(new Set(categories.map((row) => row.category_id)).size).toBe(21);
    expect(items).toHaveLength(163);
    expect(new Set(items.map((row) => row.item_id)).size).toBe(163);
    const categoryIds = new Set(categories.map((row) => row.category_id));
    const sourceIds = new Set(
      tableRows(disposition, ["source_id", "disposition", "target"]).map((row) => row.source_id),
    );
    expect(items.filter((row) => !categoryIds.has(row.category_id))).toEqual([]);
    expect(
      items.filter((row) => row.source_ref !== "NO-SOURCE" && !sourceIds.has(row.source_ref)),
    ).toEqual([]);
    expect(items.filter((row) => row.source_ref === "NO-SOURCE").map((row) => row.item_id)).toEqual(
      ["iac"],
    );
  });

  it("U-VMSRC-003: typed target edges resolve without silent source omissions", () => {
    const sourceIds = tableRows(disposition, ["source_id", "disposition", "target"]).map(
      (row) => row.source_id,
    );
    const edgeRows = tableRows(edges, ["edge_id", "source_id", "target_type", "target_ref"]);
    const allowedTypes = new Set(["target_slot", "artifact_path", "artifact_family", "plan_alias"]);
    expect(new Set(edgeRows.map((row) => row.edge_id)).size).toBe(edgeRows.length);
    expect(edgeRows.filter((row) => !allowedTypes.has(row.target_type))).toEqual([]);
    const sourcesWithEdges = new Set(edgeRows.map((row) => row.source_id));
    expect(sourceIds.filter((sourceId) => !sourcesWithEdges.has(sourceId))).toEqual([]);

    const targetSlots = new Set(
      tableRows(targetCatalog, ["doc_type_id", "layer", "sub_doc"]).map((row) => row.doc_type_id),
    );
    for (const edge of edgeRows) {
      if (edge.target_type === "target_slot") expect(targetSlots.has(edge.target_ref)).toBe(true);
      if (edge.target_type === "artifact_path" || edge.target_type === "artifact_family") {
        expect(existsSync(resolve(repoRoot, edge.target_ref))).toBe(true);
      }
      if (edge.target_type === "plan_alias") {
        expect(existsSync(resolve(repoRoot, `docs/plans/${edge.target_ref}.md`))).toBe(true);
      }
    }
  });

  it("U-VMSRC-004: profile master has three size and five product definitions", () => {
    const definitions = tableRows(profiles, ["profile_id", "profile_axis", "profile_rank"]);
    expect(definitions).toHaveLength(8);
    expect(definitions.filter((row) => row.profile_axis === "size")).toHaveLength(3);
    expect(definitions.filter((row) => row.profile_axis === "product")).toHaveLength(5);
    const decisions = tableRows(profiles, ["profile_id", "doc_type_id", "decision"]);
    const decisionProfiles = new Set(decisions.map((row) => row.profile_id));
    for (const profile of definitions) expect(decisionProfiles.has(profile.profile_id)).toBe(true);
  });

  it("U-VMSRC-005: Forward FSM uses one exact authored state sequence", () => {
    const adr = read("docs/adr/ADR-008-forward-fsm-plan-asset-v2.md");
    const states = [
      "proposed",
      "planned",
      "pair_freeze_ready",
      "pair_frozen",
      "red_frozen",
      "implementing",
      "implementation_complete",
      "trace_freeze_ready",
      "trace_frozen",
      "review_ready",
      "reviewed",
      "accepted",
      "archived",
    ];
    const contract = YAML.parse(read("docs/process/vmodel-contract.yaml")) as {
      forward_workflow: { states: string[]; exception_states: string[] };
    };
    expect(contract.forward_workflow.states).toEqual(states);
    expect(contract.forward_workflow.exception_states).toEqual([
      "blocked",
      "superseded",
      "rejected",
      "reopened",
    ]);
    for (const state of states) {
      expect(adr).toContain(state);
    }
  });

  it("U-VMSRC-006: declarative V-model contract covers L0-L14 and G0.5/G1-G14 exactly once", () => {
    const contract = YAML.parse(read("docs/process/vmodel-contract.yaml")) as {
      forward_workflow: {
        pair_reciprocity_exceptions: string[];
        pair_reciprocity_exception_contracts: Array<{
          layer: string;
          reason: string;
          allowed_pair_layers: string[];
          required_backlinks: string[];
        }>;
      };
      layers: Array<{
        layer: string;
        gate: string;
        pair_layers: string[];
        required_artifacts: string[];
        evidence_families: string[];
        exit_criteria: string;
        defect_routing: string;
        verification_plan_id?: string;
        governance_artifact?: string;
        case_id_prefix?: string;
        evidence_manifest?: string;
      }>;
    };
    const expectedLayers = Array.from({ length: 15 }, (_, index) => `L${index}`);
    const expectedGates = ["G0.5", ...Array.from({ length: 14 }, (_, index) => `G${index + 1}`)];
    expect(contract.layers.map((entry) => entry.layer)).toEqual(expectedLayers);
    expect(contract.layers.map((entry) => entry.gate)).toEqual(expectedGates);
    expect(new Set(contract.layers.map((entry) => entry.layer)).size).toBe(15);
    expect(new Set(contract.layers.map((entry) => entry.gate)).size).toBe(15);
    for (const entry of contract.layers) {
      expect(entry.pair_layers.length).toBeGreaterThan(0);
      expect(entry.required_artifacts.length).toBeGreaterThan(0);
      expect(entry.evidence_families.length).toBeGreaterThan(0);
      expect(entry.exit_criteria).not.toBe("");
      expect(entry.defect_routing).not.toBe("");
      expect(entry.pair_layers.every((layer) => expectedLayers.includes(layer))).toBe(true);
    }
    const byLayer = new Map(contract.layers.map((entry) => [entry.layer, entry]));
    const exceptions = new Set(contract.forward_workflow.pair_reciprocity_exceptions);
    expect(contract.forward_workflow.pair_reciprocity_exception_contracts).toHaveLength(2);
    for (const exception of contract.forward_workflow.pair_reciprocity_exception_contracts) {
      expect(exceptions.has(exception.layer)).toBe(true);
      expect(exception.reason).not.toBe("");
      expect(exception.allowed_pair_layers).toEqual(byLayer.get(exception.layer)?.pair_layers);
      expect(exception.required_backlinks.length).toBeGreaterThan(0);
    }
    for (const entry of contract.layers) {
      if (exceptions.has(entry.layer)) continue;
      for (const pair of entry.pair_layers) {
        expect(byLayer.get(pair)?.pair_layers).toContain(entry.layer);
      }
    }
    for (const entry of contract.layers.filter((layer) => Number(layer.layer.slice(1)) >= 8)) {
      expect(entry.verification_plan_id).toMatch(`PLAN-${entry.layer}-`);
      expect(entry.governance_artifact).toMatch(/^docs\//);
      expect(entry.case_id_prefix).toMatch(/^[A-Z]+-$/);
      expect(entry.evidence_manifest).toMatch(/^\.ut-tdd\/evidence\//);
    }
  });

  it("U-VMSRC-007: all semantic items enter self-audit without false-green", () => {
    const assessment = read("docs/governance/vmodel-semantic-item-self-assessment.md");
    const rows = tableRows(assessment, ["item_id", "source_ref", "state"]);
    expect(rows).toHaveLength(163);
    expect(new Set(rows.map((row) => row.item_id)).size).toBe(163);
    expect(rows.every((row) => row.state === "pending_review")).toBe(true);
    expect(rows.filter((row) => row.state === "verified")).toEqual([]);
  });

  it("U-VMSRC-008: additive L1/L14 delta preserves the prior confirmed freeze", () => {
    const frozenL1 = read("docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md");
    const frozenL14 = read("docs/test-design/harness/L14-operational-test-design.md");
    const l1 = read("docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md");
    const l14 = read("docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md");
    expect(l1).toMatch(/^---[\s\S]*?\nstatus: confirmed\n/);
    expect(l14).toMatch(/^---[\s\S]*?\nstatus: confirmed\n/);
    expect(frozenL1).toMatch(/^---[\s\S]*?\nstatus: confirmed\n/);
    expect(frozenL14).toMatch(/^---[\s\S]*?\nstatus: confirmed\n/);
    expect(l14).toContain("`PLAN-L1-07`のadditive L1 delta");
    expect(l14).not.toContain("PLAN-L1-06再凍結");
    expect(l14).not.toContain("PLAN-L1-06とVUP要件docをconfirmedへ戻さない");
  });

  it("U-VMSRC-009: planned oracle candidates keep kind-qualified unique identities", () => {
    const candidateDocuments = readCandidateDocuments(repoRoot);
    const unitDesign = candidateDocuments[0];
    const candidateIds = candidateDocuments.flatMap(collectCandidateIds);
    expect(candidateIds.length).toBeGreaterThan(0);
    expect(new Set(candidateIds).size).toBe(candidateIds.length);
    expect(candidateIds).not.toContain("CANDIDATE-P-FSM-001");
    expect(unitDesign).toContain("| `P-FSM-001` |");
    expect(unitDesign).toContain("| `I-DISP-001` |");
    expect(candidateIds).toContain("CANDIDATE-I-SP-001");
    expect(candidateIds).toContain("CANDIDATE-M-SP-001");
  });

  it("preserves repeated declaration IDs so U-VMSRC-009 can detect duplicates", () => {
    const id = "CANDIDATE-U-DOCSPLIT-900";
    const markdown = candidateIndex([
      candidateDeclaration(id, "table", "quoted"),
      candidateDeclaration(id, "table", "quoted"),
    ]);
    withCandidateDocuments(
      { "docs/test-design/harness/L7-unit-test-design.md": markdown },
      (root) => {
        expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
          expectedCandidateIds(id, id),
        );
      },
    );
  });

  it.fails("CANDIDATE-U-DOCSPLIT-026: repeated citations are not candidate declarations", () => {
    const id = "CANDIDATE-U-DOCSPLIT-900";
    const markdown = candidateIndex([
      `| \`${id}\` | declared once |`,
      `| Another row | \`${id}\` |`,
      `\`${id}\` is repeated in prose and as a reference.`,
      `参照: \`${id}\``,
    ]);
    withCandidateDocuments(
      { "docs/test-design/harness/L7-unit-test-design.md": markdown },
      (root) => {
        const candidates = readCandidateDocuments(root).flatMap(collectCandidateIds).sort();
        expect(candidates).toEqual(expectedCandidateIds(id));
      },
    );
  });

  const tableShapes: CandidateTableShape[] = [
    "plain",
    "ascii-parens",
    "fullwidth-parens",
    "em-dash",
  ];
  for (const marker of ["quoted", "bare"] as const) {
    for (const shape of tableShapes) {
      const id = "CANDIDATE-U-DOCSPLIT-900";
      const markdown = candidateIndex([candidateDeclaration(id, "table", marker, shape)]);
      const title = `CANDIDATE-U-DOCSPLIT-026: table ${marker} ${shape} declaration is collected`;
      const check = () =>
        withCandidateDocuments(
          { "docs/test-design/harness/L7-unit-test-design.md": markdown },
          (root) => {
            expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
              expectedCandidateIds(id),
            );
          },
        );
      if (marker === "quoted") it(title, check);
      else it.fails(title, check);
    }
  }

  for (const marker of ["quoted", "bare"] as const) {
    const id = "CANDIDATE-U-DOCSPLIT-900";
    const markdown = candidateIndex([candidateDeclaration(id, "heading", marker)]);
    const title = `CANDIDATE-U-DOCSPLIT-026: heading ${marker} declaration is collected`;
    const check = () =>
      withCandidateDocuments(
        { "docs/test-design/harness/L7-unit-test-design.md": markdown },
        (root) => {
          expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
            expectedCandidateIds(id),
          );
        },
      );
    if (marker === "quoted") it(title, check);
    else it.fails(title, check);
  }

  it.fails("CANDIDATE-U-DOCSPLIT-026: adjacent direct-child L7 files are read", () => {
    const splitCandidate = "CANDIDATE-U-DOCSPLIT-900";
    const index = candidateIndex();
    const splitDoc = [
      candidateDeclaration(splitCandidate, "table", "quoted"),
      `| another cell | \`${splitCandidate}\` |`,
      `\`${splitCandidate}\` is repeated in body prose and a reference.`,
      `参照: \`${splitCandidate}\``,
    ].join("\n");
    withCandidateDocuments(
      {
        "docs/test-design/harness/L7-unit-test-design.md": index,
        "docs/test-design/harness/L7-split-x-test-design.md": splitDoc,
      },
      (root) => {
        const candidates = readCandidateDocuments(root).flatMap(collectCandidateIds).sort();
        expect(candidates).toEqual(expectedCandidateIds(splitCandidate));
      },
    );
  });

  const declarationPairs: Array<[CandidateDeclarationKind, CandidateDeclarationKind]> = [
    ["table", "table"],
    ["heading", "heading"],
    ["table", "heading"],
  ];
  const markerPairs: Array<[CandidateMarker, CandidateMarker]> = [
    ["bare", "bare"],
    ["quoted", "quoted"],
    ["bare", "quoted"],
    ["quoted", "bare"],
  ];
  for (const [firstKind, secondKind] of declarationPairs) {
    for (const placement of ["same-file", "cross-file"] as const) {
      for (const [firstMarker, secondMarker] of markerPairs) {
        const id = "CANDIDATE-U-DOCSPLIT-900";
        const first = candidateDeclaration(id, firstKind, firstMarker);
        const second = candidateDeclaration(id, secondKind, secondMarker);
        const files: Record<string, string> =
          placement === "same-file"
            ? { "docs/test-design/harness/L7-unit-test-design.md": candidateIndex([first, second]) }
            : {
                "docs/test-design/harness/L7-unit-test-design.md": candidateIndex([first]),
                "docs/test-design/harness/L7-split-x-test-design.md": second,
              };
        const title = `CANDIDATE-U-DOCSPLIT-026: duplicate ${firstKind}/${secondKind}, ${placement}, ${firstMarker}/${secondMarker} stays visible`;
        const check = () =>
          withCandidateDocuments(files, (root) => {
            expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
              expectedCandidateIds(id, id),
            );
          });
        if (placement === "same-file" && firstMarker === "quoted" && secondMarker === "quoted") {
          it(title, check);
        } else {
          it.fails(title, check);
        }
      }
    }
  }

  for (const shape of ["ascii-parens", "fullwidth-parens"] as const) {
    for (const placement of ["same-file", "cross-file"] as const) {
      for (const [firstMarker, secondMarker] of markerPairs) {
        const id = "CANDIDATE-U-DOCSPLIT-900";
        const first = candidateDeclaration(id, "table", firstMarker, shape);
        const second = candidateDeclaration(id, "table", secondMarker, "plain");
        const files: Record<string, string> =
          placement === "same-file"
            ? { "docs/test-design/harness/L7-unit-test-design.md": candidateIndex([first, second]) }
            : {
                "docs/test-design/harness/L7-unit-test-design.md": candidateIndex([first]),
                "docs/test-design/harness/L7-split-x-test-design.md": second,
              };
        const title = `CANDIDATE-U-DOCSPLIT-026: ${shape} and plain are duplicate declarations, ${placement}, ${firstMarker}/${secondMarker}`;
        const check = () =>
          withCandidateDocuments(files, (root) => {
            expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
              expectedCandidateIds(id, id),
            );
          });
        if (placement === "same-file" && firstMarker === "quoted" && secondMarker === "quoted") {
          it(title, check);
        } else {
          it.fails(title, check);
        }
      }
    }
  }

  const excludedReferences: Array<{ name: string; lines: string[] }> = [
    {
      name: "candidate in a non-leading table cell",
      lines: ["| Description | Reference |", "|---|---|", "| note | `CANDIDATE-U-DOCSPLIT-900` |"],
    },
    {
      name: "prefixed first cell is a reference",
      lines: [
        "| Test ID | Description |",
        "|---|---|",
        "| 参照: `CANDIDATE-U-DOCSPLIT-900` | note |",
      ],
    },
    {
      name: "fenced example is not a declaration",
      lines: ["```md", "| `CANDIDATE-U-DOCSPLIT-900` | note |", "```"],
    },
    {
      name: "range and enumeration in body prose are references",
      lines: [
        "候補 `CANDIDATE-U-DOCSPLIT-900`..`CANDIDATE-U-DOCSPLIT-901` and `CANDIDATE-U-DOCSPLIT-900 / CANDIDATE-U-DOCSPLIT-901`",
      ],
    },
    {
      name: "ID after heading prose is a reference",
      lines: ["## Existing candidates include `CANDIDATE-U-DOCSPLIT-900`"],
    },
  ];
  for (const excluded of excludedReferences) {
    const markdown = candidateIndex(excluded.lines);
    const title = `CANDIDATE-U-DOCSPLIT-026: ${excluded.name}`;
    const check = () =>
      withCandidateDocuments(
        { "docs/test-design/harness/L7-unit-test-design.md": markdown },
        (root) => {
          expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
            expectedCandidateIds(),
          );
        },
      );
    it.fails(title, check);
  }

  for (const kind of ["range", "enumeration"] as const) {
    for (const marker of ["quoted", "bare"] as const) {
      const ids = ["CANDIDATE-U-DOCSPLIT-900", "CANDIDATE-U-DOCSPLIT-901"];
      const tokens = ids.map((id) => (marker === "quoted" ? `\`${id}\`` : id));
      const separator = kind === "range" ? ".." : " / ";
      const markdown = candidateIndex([`| ${tokens.join(separator)} | note |`]);
      const title = `CANDIDATE-U-DOCSPLIT-026: ${marker} table-cell ${kind} is a reference`;
      const check = () =>
        withCandidateDocuments(
          { "docs/test-design/harness/L7-unit-test-design.md": markdown },
          (root) => {
            expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
              expectedCandidateIds(),
            );
          },
        );
      if (marker === "quoted") it.fails(title, check);
      else it(title, check);
    }
  }

  it("does not collect a non-three-digit candidate suffix", () => {
    const markdown = candidateIndex(["| `CANDIDATE-U-DOCSPLIT-900A` | note |"]);
    withCandidateDocuments(
      { "docs/test-design/harness/L7-unit-test-design.md": markdown },
      (root) =>
        expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
          expectedCandidateIds(),
        ),
    );
  });

  it("excludes non-direct-child, non-L7, and other-tree documents", () => {
    const id = "CANDIDATE-U-DOCSPLIT-900";
    const declaration = candidateDeclaration(id, "table", "quoted");
    withCandidateDocuments(
      {
        "docs/test-design/harness/L7-unit-test-design.md": candidateIndex(),
        "docs/test-design/harness/sub/L7-nested-test-design.md": declaration,
        "docs/test-design/other/L7-out-test-design.md": declaration,
        "docs/test-design/harness/not-l7-test-design.md": declaration,
      },
      (root) => {
        expect(readCandidateDocuments(root).flatMap(collectCandidateIds).sort()).toEqual(
          expectedCandidateIds(),
        );
      },
    );
  });

  it("U-VMSRC-010: all 163 semantic items have an explicit non-inferred target decision record", () => {
    const semanticRows = tableRows(semanticItems, ["item_id", "category_id", "source_ref"]);
    const targetRows = tableRows(itemTargets, [
      "edge_id",
      "item_id",
      "source_ref",
      "source_digest",
      "target_status",
      "target_kind",
      "target_ref",
      "判断理由",
      "plan_id",
    ]);
    expect(targetRows).toHaveLength(163);
    expect(new Set(targetRows.map((row) => row.item_id)).size).toBe(163);
    expect(new Set(targetRows.map((row) => row.edge_id)).size).toBe(163);
    expect(targetRows.map((row) => row.item_id).sort()).toEqual(
      semanticRows.map((row) => row.item_id).sort(),
    );
    const semanticSource = new Map(semanticRows.map((row) => [row.item_id, row.source_ref]));
    expect(targetRows.filter((row) => row.source_ref !== semanticSource.get(row.item_id))).toEqual(
      [],
    );
    const allowedStatuses = new Set([
      "pending_review",
      "adopt",
      "merge",
      "reference",
      "defer",
      "not_applicable",
      "reject",
    ]);
    expect(targetRows.filter((row) => !allowedStatuses.has(row.target_status))).toEqual([]);
    expect(targetRows.filter((row) => !/^ITEM-TARGET-[A-Z0-9-]+$/.test(row.edge_id))).toEqual([]);
    expect(targetRows.filter((row) => !/^[a-f0-9]{64}$/.test(row.source_digest))).toEqual([]);
    expect(targetRows.filter((row) => !row.判断理由 || !row.plan_id)).toEqual([]);
    expect(
      targetRows.filter(
        (row) =>
          row.target_status === "pending_review" &&
          (row.target_kind !== "—" || row.target_ref !== "—"),
      ),
    ).toEqual([]);
    expect(
      targetRows.filter(
        (row) =>
          ["adopt", "merge", "reference", "defer"].includes(row.target_status) &&
          (row.target_kind === "—" || row.target_ref === "—"),
      ),
    ).toEqual([]);
  });
});
