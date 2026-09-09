---
memory_id: memory:project:issue420-root-takeover-boundary-fix-verified-windows-success-remains-unproven
kind: project
title: "Issue420 root takeover boundary fix verified Windows success remains unproven"
tags: ["handoff", "issue420", "verification"]
updated_at: 2026-09-08T11:44:35.378Z
---

Root took physical adapter lease after worker terminal cleanup. HEADb491666c fixed mkdir-before-boundary defect; snapshot20420 8/8 PASS exit0 and both snapshots removed; tsc/Biome0. However Windows positive install is NOT proven: existing reconciliation test expects permission denial on Windows due directory fsync EPERM. Root then fixed no-clobber false Green by directly reaching sealActivationBundle and asserting EEXIST (not earlier fsync failure), and clarified test title. Current HEAD7da50d49 tsc/Biome0, snapshot61854 active; do not edit C:/dev/ut-issue420-runtime-adapter-contract. No PR or completion claim. Pending owner consultation: exact PLAN-L7-516 Windows supported durability mechanism; cannot silently ignore directory fsync error or claim Windows release success. Real PF5/Node verifier production composition also remains. Separately #424 clean sync handoff has been queued since11:25Z, please acknowledge when taking lease; root will implement remaining canonical apply after returned lease.
