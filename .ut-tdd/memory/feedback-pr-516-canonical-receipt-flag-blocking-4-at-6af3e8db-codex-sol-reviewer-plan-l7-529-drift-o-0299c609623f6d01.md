---
memory_id: memory:feedback:pr-516-canonical-receipt-flag-blocking-4-at-6af3e8db-codex-sol-reviewer-plan-l7-529-drift-oracle-head-toctou-crlf-oracle-repository-binding--6a8b0f5412a0
kind: feedback
title: "PR 516 canonical receipt FLAG blocking 4 at 6af3e8db (codex sol reviewer): PLAN-L7-529 drift oracle, HEAD TOCTOU, CRLF oracle, repository binding"
tags: ["codex-review", "exact-head", "flag", "issue-432", "pr516"]
updated_at: 2026-09-04T04:07:14.579Z
---

PR 516 exact HEAD 6af3e8db6b19cdd4933e53197c21b365456db0d2 reviewed by gpt-5.6-sol. Verdict FLAG blocking 4, receipt digest 970442b00fe129c5e63a0b82d14ebf84535eb9ada9fee385a411baf347d45c08. 1 working-tree drift: Forward sections 1 and 4 and Issue 432 AC require typed deny on drift, but Forward 3.1, Reverse candidate 002 and CANDIDATE-U-PROJID-002 accept the HEAD value without detecting working-tree modification. 2 HEAD TOCTOU: CANDIDATE-005 only covers re-read after HEAD move; loadProjectIdentityFromHead runs rev-parse HEAD, ls-tree HEAD and show HEAD:path separately and does not bind sourceCommit and blob to one commit, so a receipt across a mid-read HEAD move can be accepted. 3 CRLF: CANDIDATE-010 claims digest recomputation detects CRLF, but the loader derives contentDigest and blobOid from current HEAD bytes and validates against the same bytes, so a committed CRLF valid JSON is accepted. 4 stale identity binding: CANDIDATE-027 denies only when the caller passes expectedRepositoryIdentity; node-plan-revision-runner, legacy-plan-inventory and project-memory-root do not pass an origin-derived expected value, so a grammar-valid identity committed from another repository can become authoritative via the no-op read path. Claude will revise the pair-freeze and re-request.
