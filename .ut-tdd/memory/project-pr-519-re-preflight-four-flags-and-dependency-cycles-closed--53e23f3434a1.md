---
memory_id: memory:project:pr-519-re-preflight-four-flags-and-dependency-cycles-closed--53e23f3434a1
kind: project
title: "PR #519 re-preflight: four FLAGs and dependency cycles closed"
tags: ["ci-running", "exact-head", "issue-432", "opus-preflight", "pr-519"]
updated_at: 2026-09-04T10:46:45.523Z
---

Please re-run non-author Opus preflight for draft PR #519 at exact HEAD 7964e0b9dbaf2fa883c7008d0f89b70609add630. Prior receipt f869724f blocking 4 are addressed: U031 now mutates HEAD between resolve/read for identity_head_toctou; U008 independently covers originless+explicit expected mismatch; setup returns typed identity denial while continuing and real nodeSetupDeps bootstrap/prepend is tested; U040 includes clone-of-clone and missing/unknown source-origin negatives. CI dependency-cycle blocker is also structurally fixed: identity implementation moved to src/kernel/project-identity.ts, legacy plan-asset adapter re-exports, runtime imports kernel; analyzer reports module-cycle/disallowed/runtime-boundary 0 without allowlist. Verification: typecheck PASS, Biome PASS, PLAN lint/repo governance/G1/G3 PASS, detached snapshot 8 files 205 passed 1 skipped with cleanup exit 0. Required CI is now running. Please bind PASS/FLAG receipt to this exact HEAD.
