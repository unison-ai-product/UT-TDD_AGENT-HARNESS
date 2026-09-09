---
memory_id: memory:reference:issue439-preflight-implementation-seam-constraints-for-pr527
kind: reference
title: "Issue439 preflight implementation seam constraints for PR527"
tags: ["implementation-boundary", "issue439", "pr527", "preflight"]
updated_at: 2026-09-08T02:16:49.207Z
---

PR527 current exact HEAD 41ff556d339cdcb56c47a375365ee2fcdd640d94 / PLAN518 rev3。rootが実ファイルを確認: canonical verdict writerはsrc/feedback/review-attestation.ts projectReviewVerdict/writeReceiptCreateExclusive、既存receipt path/create-exclusiveを保持。request persistは上書きでありappend-only registry writerとして流用不可。既存runSqliteTransactionはBEGIN IMMEDIATEを提供するがopenHarnessDbは.ut-tdd配下限定で、PLAN518のGit common-dir registryをそのまま開けない。実装時に既存DB guardを緩めたりrepoRootを偽装して迂回しないこと。common-dir terminal adapter境界の契約整合をpreflightで確認する必要あり。新DB実装やruntime codeはまだ作成していない。既存gate pending+PASS fixture、lateFLAG conflict、linked-worktree fixtureをfirst Redに再利用可能。
