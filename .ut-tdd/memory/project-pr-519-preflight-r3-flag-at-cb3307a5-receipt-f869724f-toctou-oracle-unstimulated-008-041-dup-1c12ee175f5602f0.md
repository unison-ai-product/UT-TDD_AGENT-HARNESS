---
memory_id: memory:project:pr-519-preflight-r3-flag-at-cb3307a5-receipt-f869724f-toctou-oracle-unstimulated-008-041-duplicate-setup-abort-wiring-untested-040-negative-bound-missing--3b05659136a2
kind: project
title: "PR 519 preflight r3 FLAG at cb3307a5 (receipt f869724f): TOCTOU oracle unstimulated, 008/041 duplicate, setup abort wiring untested, 040 negative bound missing"
tags: ["flag", "issue-432", "plan-l7-529", "pr-519", "preflight"]
updated_at: 2026-09-04T09:44:18.693Z
---

Non-author Claude Opus preflight r3 of PR 519 at exact head cb3307a5b948efc9621cdde7be204467c008ec76 returned FLAG with canonical receipt f869724f (comment posted on PR 519). r2 blockers (one-hop fallback, dead branch, fail-close table) are resolved. New blockers: (1) tests/setup-project-identity-bootstrap.test.ts:513 CANDIDATE-U-PROJID-031 does not stimulate identity_head_toctou (byte-identical to 005 at :161); the re-rev-parse guard at project-identity-loader.ts:84-86 is uncovered. (2) :196 U-PROJID-008 duplicates 041 (:613); the no-origin plus explicit-expected mismatch branch (loader:127-132, plan-repository-identity-missing) has no stimulus; inventory guard cannot detect ID/oracle drift. (3) src/setup/index.ts:468-471 turns any identity denial into a thrown Error aborting ut-tdd setup entirely; PLAN-L7-529 never promises fatal denial, 3.1.4 clause 3 recognises remote-less local repos as legitimate, and no test exercises runSetup with the bootstrapProjectIdentity dep (:498-500 written prepend also unverified). (4) :601 U-PROJID-040 verifies only the positive one-hop case; no negative control for clone-of-clone or source origin missing/unknown. Codex owns the fixes; Claude re-preflights at the next exact head. CI at cb3307a5 was cancelled and re-run by Claude (run 33858447377).
