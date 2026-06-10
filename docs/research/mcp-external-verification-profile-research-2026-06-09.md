---
artifact_type: research_memo
status: confirmed
created: 2026-06-09
updated: 2026-06-09
related_audit: .ut-tdd/audit/A-125-mcp-external-verification-profile-scope.md
related_requirements: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md#6810-mcp--external-testing-tool-scope-and-workflow-triggers-a-125-2026-06-09
---

# MCP / External Verification Profile Research Memo

## Scope

This memo records the Web research basis for A-125. It is a research artifact, not a source of truth for implementation behavior. The authoritative scope remains requirements, ADR, physical-data, PLAN, and test-design artifacts.

Research question:

- Which installable MCP servers, developer plugins, and test foundations should UT-TDD model as verification profiles?
- Which ones improve cross-artifact impact analysis, diagram/export workflows, browser verification, GitHub workflow evidence, DB/service integration tests, or API mocks?
- What safety boundaries are required before those profiles can be automated?

## Source Check

Checked on 2026-06-09.

| Source | URL | Relevant finding | UT-TDD decision |
|---|---|---|---|
| MCP Registry announcement | https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/ | Official MCP Registry is an open catalog/API for discovering public MCP servers; preview status and self-reported registry data mean it is discovery metadata, not trust proof. | Use as discovery metadata only. Require official-source and package-integrity checks before trusted profile state. |
| MCP Inspector docs | https://modelcontextprotocol.io/docs/tools/inspector | Inspector is the official developer tool for testing/debugging MCP servers, supports npm/PyPI/local server inspection, and exposes tools/resources/prompts tabs. | Preferred smoke gate for configured MCP profiles. Minimum method is `tools/list` before accept. |
| modelcontextprotocol reference servers | https://github.com/modelcontextprotocol/servers | Reference servers include filesystem, git, memory, fetch, and time, but the repository warns they are educational examples and require threat-model-specific safeguards. | Treat as controlled local/reference profiles only. No production credentials or broad home-directory mounts in defaults. |
| Microsoft Playwright MCP | https://github.com/microsoft/playwright-mcp | Official Playwright MCP can be configured with `npx @playwright/mcp@latest` across multiple clients including Codex. | Optional interactive browser-verification profile. Deterministic CI should prefer test runners. |
| GitHub MCP Server configuration | https://github.com/github/github-mcp-server/blob/main/docs/server-configuration.md | GitHub MCP supports toolsets, explicit tool selection, and read-only mode; read-only mode disables write tools even if requested. | Default GitHub profile is read-only/narrow-toolset. Write operations require human approval. |
| Docker MCP Toolkit | https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/ | Docker MCP Toolkit provides profile-based containerized MCP execution, signed/attested catalog images, SBOMs, runtime CPU/memory limits, default no host filesystem access, sensitive request interception, and OAuth handling. | Preferred team/enterprise runtime profile when Docker Desktop is available. Still beta/environment-dependent. |
| Vitest Browser Mode | https://vitest.dev/guide/browser/ | Browser Mode runs tests in a browser; official docs show Bun install for `vitest @vitest/browser-playwright` and recommend Playwright/WebdriverIO for CI. | Optional browser-native test profile for UI/browser-targeted changes. |
| Testcontainers for Node.js | https://node.testcontainers.org/ | Provides lightweight throwaway instances of databases, browsers, or anything runnable in Docker containers. | Optional integration profile for DB/service-contract changes when Docker is available. |
| MSW | https://github.com/mswjs/msw | MSW works across browser and Node.js by reusing request handlers through environment-appropriate interception. | Optional API mock profile for API-bound tests and fixture standardization. |

## Selection Matrix

| Profile | Trigger signals | Value | Default state | Hard requirements |
|---|---|---|---|---|
| `mcp-inspector-smoke` | `mcp_server_added`, `mcp_profile_changed` | Confirms configured server exposes expected protocol surface before workflow accept. | Enabled as readiness profile, but real external inspection still requires explicit allow-list. | No raw payload in DB; store evidence path and normalized result only. |
| `playwright-mcp` | `ui_flow`, `web_target`, `browser_regression` | Agentic browser exploration, screenshots, and self-healing investigation. | Disabled by default. | Browser/tool output is evidence only; no credentialed browsing without approval. |
| `github-mcp-readonly` | `external_issue`, `ci_failure`, `pr_review`, `backlog_sync` | Issue/PR/CI/backlog context can be read and normalized into workflow evidence. | Disabled by default; intended default is read-only/narrow toolsets. | Write toolsets require human approval and separate profile. |
| `docker-mcp-toolkit` | `team_profile`, `enterprise_runtime`, `profile_isolation_required` | Containerized MCP gateway and profile isolation can reduce local setup and supply-chain drift. | Optional environment profile. | Docker Desktop availability, profile export/import policy, no committed user-specific `.vscode/mcp.json`. |
| `vitest-browser-playwright` | `ui_flow`, `browser_regression`, `component_interaction` | Deterministic browser-native tests in CI-capable provider. | Disabled until installed. | Bun-compatible package declaration, Playwright provider, no broad snapshot-only oracle. |
| `testcontainers` | `db_integration`, `migration`, `service_contract` | Disposable DB/service dependencies for integration tests. | Disabled until Docker available. | Docker availability and bounded image policy. |
| `msw` | `api_mock_gap`, `flaky_external_api` | Reusable browser/Node mocks and shared request-handler fixtures. | Disabled until dependency declared. | Mock fixtures must be contract-traced; do not hide real adapter failures. |

## Workflow Integration

The profile workflow should behave as follows:

1. Relation graph or changed-file signal emits one or more trigger signals.
2. `ut-tdd verify recommend --changed <path>` maps signals to profile recommendations.
3. `ut-tdd mcp profile probe <profile>` checks local readiness without installing packages.
4. `ut-tdd mcp inspect <profile> --method tools/list` is required for MCP profiles before accept.
5. External run results become bounded evidence under `.ut-tdd/evidence/verification-profiles/`.
6. DB projection later normalizes evidence into `mcp_server_runs`, `verification_recommendations`, and `external_tool_findings`.
7. Gates consume normalized rows, never raw MCP/tool output.

## Safety Rules

- No external profile is trusted by registry presence alone.
- External profiles are disabled by default.
- Generated local MCP config must stay outside Git-tracked secrets.
- Filesystem/git profiles are workspace-root scoped, not home-directory scoped.
- GitHub defaults to read-only/narrow toolsets.
- Docker MCP Toolkit is preferred only when its profile isolation and runtime controls are available.
- Browser traces, screenshots, MCP responses, provider transcripts, and secrets are not stored in DB rows.

## Residual Work

- Generated local MCP profile config and safety lint are routed to PLAN-L6-32 / PLAN-L7-33 / PLAN-REVERSE-33.
- Implement actual MCP Inspector invocation after readiness gates are confirmed.
- Implement DB collector/rebuild for A-125 projection rows.
- Implement doctor/profile safety lint for source verification, package integrity, workspace mounts, and credential non-persistence.
