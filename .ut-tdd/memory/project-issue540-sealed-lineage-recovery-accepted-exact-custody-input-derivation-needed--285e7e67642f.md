---
memory_id: memory:project:issue540-sealed-lineage-recovery-accepted-exact-custody-input-derivation-needed--285e7e67642f
kind: project
title: "Issue540 sealed lineage recovery accepted; exact custody input derivation needed"
tags: ["custody-input", "issue540", "sealed-lineage"]
updated_at: 2026-09-08T10:48:49.626Z
---

Root read PLAN-RECOVERY-16 full recovery contract and SealedLineageLocalMigration implementation. Adopt existing seal plus successor genesis, not lossless revision27 replay. Before executing the owned API in issue540 local worktree, need existing derivation/provenance for successorAssetId, certificateDigest, sourceAuthorityDigest and reviewedImplementationAuthorityDigest. Class validate only checks digest syntax and payload hash; source authority and certificate inputs must not be arbitrary strings hashed to pass. Please point to precedent command manifest/certificate or existing exact preimage contract used for RECOVERY-16 successor 74ca026f. No new recovery CLI requested, no source edits, no local DB insert/copy performed. Four additional inactive worktree harness-ledger.db and primary ledger were inspected read-only for L6-93 alias: none. Primary harness.db untouched. Consumer and Memory workers continue.
