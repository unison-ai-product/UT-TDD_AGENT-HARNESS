# A-125 MCP / External Verification Profile Scope

Date: 2026-06-09
Context: User expanded A-124 to include Web-researched MCP servers, external installable plugins, test foundations, trigger automation, and workflow integration.

## Current State

Implemented before A-125:

- A-124 scoped cross-artifact relation graph, impact expansion, diagram export, and tool adapter normalization.
- Existing CLI has `doctor`, `plan lint`, `vmodel lint`, and local Bun/vitest test execution.
- Existing docs already mention future MCP serverization in ADR-006, but there was no concrete MCP profile catalog, trigger rule, DB projection, or verification profile model.

Not yet implemented:

- Actual MCP Inspector server invocation.
- DB collector/rebuild for MCP and external verification profile rows.

Implemented in follow-up:

- `ut-tdd mcp profile list --json`
- `ut-tdd mcp profile probe <name>`
- `ut-tdd mcp inspect <name> --method tools/list`
- `ut-tdd verify recommend --changed <path> [--format text|json|mermaid]`
- `ut-tdd verify run --profile <name> [--dry-run] [--allow-external]`
- `--save-evidence` for profile list/probe/inspect/recommend/run, writing normalized JSON under `.ut-tdd/evidence/verification-profiles/`
- `doctor` surfaces changed-file verification profile recommendation counts.
- Recommendation output is shaped for later `verification_recommendations` DB rows: changed files, signals, profiles, reasons, and graph edges.
- Disabled external profiles are refused by default. Probe checks package declarations, executable availability, and auth env without installing packages.

## Web Research

Detailed source URLs and selection matrix are recorded in `docs/research/mcp-external-verification-profile-research-2026-06-09.md`. This audit keeps only the routing summary.

Primary/official sources checked:

- MCP Registry: official centralized metadata repository for public MCP servers; preview status; namespace verification; not a security scanner.
- modelcontextprotocol/servers: reference servers include filesystem, git, memory, fetch, and other examples; repository warns reference servers are educational and require threat-model-specific safeguards.
- MCP Inspector: official tool for testing and debugging MCP servers; can run through `npx` and inspect npm/PyPI/local servers.
- Microsoft Playwright MCP: official Playwright MCP server installable through `npx @playwright/mcp@latest`; useful for persistent browser-context automation and exploratory/self-healing loops.
- GitHub MCP Server: official server with configurable toolsets and individual tools; narrow toolsets reduce context and tool choice noise.
- Docker MCP Toolkit: profile-based gateway with signed/attested catalog images, SBOM, resource limits, filesystem restrictions, and OAuth handling.
- Vitest Browser Mode: supports browser-native tests; CI should use Playwright or WebdriverIO providers; Bun installation is documented.
- Testcontainers for Node.js: provides disposable databases/services/container dependencies for tests.
- MSW: API mocking library for browser and Node.js; useful as reusable mock profile for API-bound tests.

Security signal checked:

- Public reporting exists for malicious MCP package impersonation and credential exposure risk. A-125 therefore treats registry/catalog metadata as discovery input, not trust proof.

## Decision

MCP servers, plugins, and external test foundations are modeled as profiles:

1. Profile catalog stores package/source/command/risk/auth/network/Docker/read-only/allowed-tools metadata.
2. Workflow signals recommend profiles through DB projection, not agent memory.
3. Profile probes and MCP Inspector smoke create `mcp_server_runs`.
4. External verification commands create `tool_runs`, `test_runs`, and normalized `external_tool_findings`.
5. Gate decisions use normalized DB rows and bounded evidence, never raw MCP/tool output.

## Changes

- Added requirements §6.8.10 for MCP / external testing tool scope and workflow triggers.
- Added `docs/research/mcp-external-verification-profile-research-2026-06-09.md` as the Web research evidence memo.
- Added physical-data §9.6 DB projection tables and invariants.
- Added ADR-002 A-125 addendum.
- Added IMP-121 / IMP-122 / IMP-123 / IMP-124.
- Added Forward and mode workflow rules for MCP verification profiles.
- Back-propagated A-125 to L1/L3 functional requirements as an existing FR bundle extension.

## Back-Propagation Decision

`backprop_decision`: `requires_requirement_backprop`

Reason: The request changes the harness' verification capability, workflow triggers, and security posture. It is not only a lower-layer tool-install detail.

## Residual Work

Future implementation should create L6/L7 PLANs for:

- MCP profile schema DB collector and generated local config. Generated local config and profile safety lint now have PLAN-L6-32 / PLAN-L7-33 / PLAN-REVERSE-33 as the official route.
- Actual MCP Inspector server invocation for configured profiles.
- DB-backed relation graph impact to verification profile recommendation.
- External profile runner implementations beyond built-in Bun/Vitest and doctor profiles.
- Doctor/profile safety lint.
- DB collector/rebuild for `mcp_server_profiles`, `mcp_profile_triggers`, `mcp_server_runs`, `verification_profiles`, `verification_recommendations`, and `external_tool_findings`.
