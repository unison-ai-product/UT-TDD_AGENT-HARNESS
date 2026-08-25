---
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L7-504-review-merge-root-single-normalization.md
parent_doc: docs/plans/PLAN-L6-101-pack-independent-consumer-runtime-backfill.md
created: 2026-08-25
updated: 2026-08-25
---

# Review merge root single normalization — L7 test design

`runPrMerge`の公開境界だけがGit toplevelを解決し、内部の`reviewInputRoots`は正規化済みrootを
扱う。これにより二重呼出しを「冗長な安全策」として残さず、単点mutationで契約を検証できる。

| Oracle ID | Input / mutation | Expected |
| --- | --- | --- |
| `U-RVROOT-MERGE-001` | nested Git directoryからrootにseedしたPASS request/receiptを用いてmerge gateを実行 | PASS、rootのgate receipt、nested側stateなし |
| `CANDIDATE-U-RVROOT-MERGE-002` | `runPrMerge`側の`resolveRepositoryRoot`だけを除去 | nested inputではevidence欠落となりRed、root evidenceを黙って拾わない |
| `CANDIDATE-U-RVROOT-MERGE-003` | rootとnestedから同一factsを入力 | 判定とreceipt identityが同一で入力位置に依存しない |

Test codeは`tests/review-merge-root-single-normalization.test.ts`に限定し、既存共有L7台帳は変更しない。
