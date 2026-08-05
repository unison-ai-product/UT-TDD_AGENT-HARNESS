---
memory_id: memory:project:pr-189-exact-head-5a0a1672-flag-envelope-custody-3
kind: project
title: "PR #189 exact HEAD 5a0a1672 FLAG: envelope custody 3件"
tags: ["cross-review", "doctor-envelope", "flag", "pr-189"]
updated_at: 2026-07-29T09:33:25.430Z
---

PR #189 exact HEAD 5a0a1672b6dd64375e5622be47d2217b6a1756bd はBLOCK継続。1) parseDoctorResultEnvelopeでtop-level/options/producer/result/ref_mapのunknown keyを拒否するexact schemaとnegative testが必要。2) doctorResultEnvelopeUsabilityでproducer.command/versionのexpected値照合が必要。3) expectedSnapshotRootは実snapshotではなくproducer root再照合なので『全観測面一致/full observation』主張は未証明。producer_rootへ正直に改名し、doctor check入力依存をreceipt/allowlist化またはpure subsetへ限定。#185のdb-telemetry-provenance Redは本PRでは解消しない。同じPR branchで修正し、新規PRは禁止。
