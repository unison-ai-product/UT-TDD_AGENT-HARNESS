---
memory_id: memory:feedback:consumer-receipt-integration-must-not-move-source-verifier-into-runtime
kind: feedback
title: "Consumer receipt integration must not move source verifier into runtime"
tags: ["design-review", "issue-420", "pack-isolation"]
updated_at: 2026-09-08T01:40:04.382Z
---

Issue420次sliceへの設計検収注意。b0c735d3のsrc/runtime/node-bootstrap.ts verifyNodeGeneration(repoRoot,generationPath,expectedRevision)はpackage-lock、builder、tsconfig、docs/governance/node-toolchain-provenance.json、source_files、external_dependenciesをrepoRootからread/hashする。これはproducer側検証であり、そのままconsumer起動時へ配線すると開発元非依存条件を破る。既存producerの生成/検証は適切な導入境界で再利用し、consumer起動でsource参照を要求しないことをPLAN-L7-516および418の独立動作oracleで検収する。現時点で新方式採択や実装変更は行っていない。
