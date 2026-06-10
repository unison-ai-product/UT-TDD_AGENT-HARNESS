# ADR-002: 依存方向ルール (schema 安定核) + 依存マップ自動生成・構想 vs 実装 drift チェック

- **Status**: accepted
- **Date**: 2026-05-29
- **Deciders**: PM (Opus) + PO (ユーザー)
- **関連**: `docs/design/harness/L4-basic-design/architecture.md` §3 / `docs/design/harness/L5-detailed-design/module-decomposition.md` §4・§7 / `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` / improvement-backlog IMP-032

## Context

UT-TDD harness の core が module 化する (cli/schema/lint/plan/vmodel/runtime/doctor + 将来 workflow/adapter ...) なかで、module 間の依存が複雑化する。逆依存や循環依存が混入すると保守が破綻し、テスト容易性も失われる。

L4 architecture §3 / L5 module-decomposition §4 で「**全依存は schema へ一方向・循環禁止・fs は副作用端点に隔離**」を設計したが、**設計宣言と実装 (実 import グラフ) が時間とともに乖離しないか**を継続検証する仕組みが必要。

PO 意図 (2026-05-29): UT harness の state/DB を構築する際に **依存関係の自動マップ生成機能**を入れる想定。**構想 (設計が宣言する依存方向) と実装 (実 import) でどれだけ差が出るかをチェックし、修正したい**。

## Decision

1. **依存方向ルールを正式採択**: 全依存は `schema` へ向かう一方向 (schema は何も import しない安定核)。`cli`/`doctor` が最外 (副作用層)。**循環依存禁止** (D-03=0)。`fs` (Node built-in) は依存方向ルール対象外の副作用アクセスとし、core ロジック (`analyzeX(docs?)` pure) と `loadX()` (fs 端点) を分離する。
2. **依存マップ自動生成 + 構想 vs 実装 drift lint を機能化** (将来、IMP-032): 実 import グラフを機械生成し、設計 doc が宣言する「期待依存マップ」(architecture §3 / module-decomposition §4 を形式化したもの) と照合。乖離 (逆依存 / 循環 / 想定外 edge) を **fail-close で検出**。OSS 候補 = `knip` / `madge` (L3 §7.1 tech-fork 調査)。

## Rationale

- 既存 lint 群 (g3-trace / fr-registry / doc-consistency / entity-coverage) と同じ「**設計 ↔ 実装の機械的整合**」哲学。zod で enum drift を根絶したのと同様、**依存 drift をグラフ照合で根絶**する。
- 「構想 vs 実装の差を測って修正する」= dogfooding の中核。harness 自身が自分の依存構造を監査できることは、対象リポジトリへの harness 価値の実証にもなる。
- 循環依存は core の根幹リスク (architecture §3 の D-03=0 保証) であり、ADR で固定して将来 module 追加時の必須参照点にする価値が高い。

## Alternatives considered

| 案 | 判定 | 理由 |
|----|------|------|
| 手動レビューのみ | 却下 | module 増加で drift 見逃しが不可避。機械検証でないと D-03=0 を保証できない |
| ADR 化しない (§3/§4 のまま) | 却下 | 構造の根幹で将来必ず参照される判断。履歴・却下理由が散逸する |
| 依存方向を強制しない (自由 import) | 却下 | 循環・テスト不能・保守破綻のリスク。安定核 (schema) 設計が崩れる |

## Consequences

- (+) 依存構造が機械検証可能になり、循環・逆依存を CI/doctor で fail-close できる。
- (+) **構想 (設計) と実装の gap を定量化・可視化し修正できる** (PO 意図の実現)。
- (+) 将来 module 追加時の依存判断の正本が ADR として残る。
- (−) dependency-map auto-gen + drift lint の実装コスト (L7、IMP-032)。OSS (knip/madge) 流用で緩和。
- (−) 「期待依存マップ」を設計 doc から形式化する作業が必要 (architecture §3 を機械可読形式へ)。

## Follow-ups

- **IMP-032** として「依存マップ自動生成 + 構想 vs 実装 drift lint」を L7 で起票。architecture §3 を「期待依存マップ」(YAML/JSON) として形式化し、実 import グラフと照合。
- **最小スライス実装済 (IMP-075、PLAN-L7-16)**: 上記 IMP-032 (import グラフの循環/逆依存/想定外 edge 照合、knip/madge) の前段として、**「architecture §3.1 building block 集合 ⊇ `src/` 実在 module」の包含 drift** を `src/lint/module-drift.ts` (doctor `checkModuleDrift`、warn-first) で実装した。これは A-103 で発見した impl→design back-fill 漏れ (handover/setup/web を「将来」放置した meta-drift) の再発防止網 (U-MDRIFT-005 が実 repo 孤児0 を CI 担保)。**IMP-032 本体 (import グラフ drift) は引き続き carry** — module 集合包含と import edge 照合は別検査 (前者=module の有無、後者=module 間の依存方向)。
- module-decomposition §7 の「ADR-002 候補」を本 ADR (accepted) 参照に更新。
- L6 機能設計で drift lint のアルゴリズム (グラフ構築 + 照合 + 差分レポート) を pseudocode 化。
## A-124 Addendum: cross-artifact graph and tool adapter selection

Date: 2026-06-09

The earlier ADR-002 decision covers dependency direction and the first `module-drift` slice. A-124 extends the target from module-set drift to a cross-artifact relation graph:

- source import graph
- design-declared expected dependencies
- doc/PLAN/FR references
- test-to-source and test-to-artifact edges
- DB projection source-to-table edges
- generated diagram artifacts

The relation graph must be projected into `harness.db` and exported to diagrams. The DB remains a rebuildable projection, not the authoring source.

### Tool research summary

| tool | role | adoption stance |
|---|---|---|
| `dependency-cruiser` | Validate and visualize JS/TS dependencies with project rules. Useful for circular dependencies, forbidden dependencies, missing package dependencies, orphans, and DOT output. | Preferred optional adapter for dependency rules and graph export. |
| `knip` | Find unused dependencies, exports, and files in TypeScript/JavaScript projects. | Optional adapter for dead-node / unused edge detection. |
| `madge` | Generate dependency graphs and detect circular dependencies. | Optional lightweight helper, secondary to dependency-cruiser for rules. |
| Graphviz DOT | Render large graphs to SVG/PDF/PNG. | Optional renderer for large graph snapshots and CI artifacts. |
| Mermaid | Markdown-native diagrams that render in GitHub. | Preferred documentation diagram format for small/medium workflow and relation views. |
| D2 | Text-to-diagram language with CLI export to SVG/PNG/PDF. | Optional renderer for cleaner architecture/review diagrams. |

### Decision

Do not make any external tool the source of truth. The core graph collector is TypeScript/Bun and writes normalized rows to `harness.db`. External tools are adapters:

1. Run tool.
2. Store raw output as evidence.
3. Normalize to `graph_nodes`, `dependency_edges`, `tool_runs`, `findings`, and `diagram_artifacts`.
4. Gate only on normalized rows.

### First implementation slice

1. Build source import graph from `src/**/*.ts` and `tests/**/*.ts`.
2. Build doc reference graph from Markdown path/ID references.
3. Project both into `graph_nodes` and `dependency_edges`.
4. Add `ut-tdd graph impact --changed <path>` to compute `impact_results`.
5. Add `ut-tdd graph export --format mermaid|dot --scope <scope>`.
6. Wire doctor to warn-first when graph projection is missing and fail-close when impact rules are enabled for G7/accept.

## A-125 Addendum: MCP server and external verification profile selection

Date: 2026-06-09

The A-124 graph tells UT-TDD what is impacted. A-125 tells it which external capability should be activated to verify the impact. Web research on 2026-06-09 selected these candidates for scope:

| candidate | role | adoption stance |
|---|---|---|
| MCP Registry | Discovery metadata for public MCP servers with namespace/installation metadata. | Use as metadata source only; not a security scanner. |
| MCP Inspector | Interactive/CLI developer tool for testing and debugging MCP servers. | Preferred smoke tool for every configured MCP profile. |
| Microsoft Playwright MCP | Browser automation MCP for exploratory automation, screenshots, and self-healing/browser-state-heavy loops. | Optional interactive verification profile; deterministic CI should prefer Playwright/Vitest tests. |
| GitHub MCP Server | GitHub issue/PR/repo/actions/code-security toolsets. | Optional workflow automation profile; default profile must be read-only or narrow toolset. |
| modelcontextprotocol reference servers | filesystem/git/memory/fetch/postgres/sqlite reference capabilities. | Controlled local/reference profiles only; default filesystem/git profiles must be workspace-scoped. |
| Docker MCP Toolkit | Containerized MCP gateway with profiles, signed/attested images, OAuth handling, and runtime resource constraints. | Preferred team/enterprise runtime profile when Docker Desktop is available. |
| Vitest Browser Mode + Playwright provider | Browser-native component/UI tests. | Optional test profile for UI/browser-targeted changes. |
| Testcontainers for Node.js | Disposable databases/services for integration tests. | Optional test profile for DB/service contract verification when Docker is available. |
| MSW | Browser/Node API mocking. | Optional test profile for API-bound test stabilization and fixture reuse. |

### Decision

External tools are not installed or enabled globally by default. UT-TDD will model them as **profiles**:

1. `mcp_server_profiles` / `verification_profiles` define allowed commands, package refs, risk tier, auth/network/Docker requirements, and trigger signals.
2. Relation graph impact expansion recommends profiles via `verification_recommendations`.
3. `ut-tdd mcp profile probe` and MCP Inspector smoke prove a profile is callable.
4. Runs are persisted as `mcp_server_runs`, `tool_runs`, `test_runs`, and normalized `external_tool_findings`.
5. Gate decisions use only normalized DB rows and bounded evidence files.

### Security posture

- Prefer read-only and narrow toolsets.
- Do not mount home directories into filesystem/git MCP profiles.
- Do not store credentials, raw provider transcripts, or unredacted MCP payloads in DB.
- Treat registry/catalog metadata as discovery input, not proof of safety.
- Docker MCP Toolkit is a preferred packaged option when its resource limits, signing/attestation, OAuth handling, and profile isolation are available.

### First implementation slice

1. Add profile schema and generated local config path.
2. Implemented first slice: `ut-tdd mcp profile list --json` and `ut-tdd mcp profile probe <name>` expose catalog and readiness checks without installing packages.
3. Implemented readiness gate: `ut-tdd mcp inspect <name> --method tools/list` combines target MCP profile checks with MCP Inspector profile checks and refuses external inspection by default. Actual Inspector server invocation remains later scope.
4. Implemented first slice: `ut-tdd verify recommend --changed <path>` maps changed-file signals to profile triggers and can emit Mermaid impact evidence. DB-backed relation graph expansion remains separate A-124 scope.
5. Implemented first slice: `ut-tdd verify run --profile <name> --dry-run` and built-in profile execution. Disabled external profiles require explicit `--allow-external`, package/auth/Docker readiness, and a wired runner. `--save-evidence` persists normalized JSON under `.ut-tdd/evidence/verification-profiles/`.
6. Wire doctor warn-first for recommended-but-unavailable profiles and fail-close at G7/accept only after profile rules are enabled.

## A-126 Addendum: canonical document export selection

Date: 2026-06-09

A-126 extends the dependency/relation graph decision to canonical document conversion. The target is not generic review reporting; it is conversion of UT-TDD source documents into human-friendly spreadsheet / Excel / PPTX formats:

- concept / planning documents;
- requirements and acceptance documents;
- detailed design documents;
- PLAN and ADR documents;
- test-design and evidence-summary documents;
- D2 PPTX export as an optional diagram-to-deck bridge for architecture/workflow visuals.

### Tool research summary

| tool | role | adoption stance |
|---|---|---|
| CSV / Markdown summary | Built-in conversion outputs for document matrices and summaries. | Default, no external dependency. |
| ExcelJS | Excel workbook creation and manipulation for Node/browser with TypeScript definitions. | Optional XLSX renderer candidate for structured requirements/design/trace workbooks. |
| SheetJS CE | Broad JavaScript spreadsheet format support. | Optional spreadsheet renderer/parser candidate when compatibility matters. |
| PptxGenJS | JavaScript/TypeScript OOXML PowerPoint generation. | Optional PPTX renderer candidate for concept, requirements, design, ADR, PLAN, and test-design decks. |
| D2 PPTX export | Diagram export into PPTX. | Optional diagram-to-deck renderer for architecture/workflow visuals. |

### Decision

Generated spreadsheet/deck files are not source-of-truth documents. The source of truth is the canonical Markdown/docs plus normalized DB projection and explicit review/gate/handover evidence.

1. Parse canonical documents into a structured document projection.
2. Preserve source path, section ID, FR/AC/AT/PLAN/ADR IDs, status, trace, and evidence links.
3. Build a deterministic export dataset from that projection.
4. Redact the dataset before rendering.
5. Render CSV / Markdown by default.
6. Render XLSX / PPTX only through optional renderer profiles with readiness evidence.
7. Store artifact metadata in `document_export_runs`, `document_export_datasets`, and `document_export_artifacts`.
8. Gate on canonical docs, normalized rows, and recorded human decisions, not manually edited Office files.

### First implementation slice

Future L7 work may implement:

1. `parseCanonicalDocumentStructure` from concept, requirements, detailed design, PLAN, ADR, and test-design docs.
2. `buildDocumentExportDataset` for document matrices and deck outlines.
3. `renderDocumentExport` for CSV and Markdown only.
4. Optional renderer probes for ExcelJS / SheetJS / PptxGenJS / D2.
5. `ut-tdd export docs --kind requirements|concept|design|plan|adr|test-design --format csv|md|xlsx|pptx` only after TDD Red and PLAN route.
