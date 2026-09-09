---
memory_id: memory:project:issue420-pre-pr-windows-durability-boundary-existing-helpers-do-not-satisfy-consumer-seal-contract--aa8ddd69bc09
kind: project
title: "Issue420 pre-PR Windows durability boundary: existing helpers do not satisfy consumer seal contract"
tags: ["contract-consultation", "issue420", "windows"]
updated_at: 2026-09-08T11:15:23.035Z
---

Root verified on current Windows Node: opening an existing directory read-only succeeds, fsync(fd) returns EPERM. Consumer candidate d3c724b3 uses directory fsync and therefore cannot complete Windows positive path as written. Independent repository audit found only node-atomic-draft-publisher private helper allowing Windows EINVAL/EPERM, but L7-516 lines542-547 forbids claiming seal success when the primitive is unsupported; this exception cannot be copied blindly. No existing native FlushFileBuffers/MoveFileEx/ReplaceFile adapter found. Worker is still validating fixed candidate; no source changes during snapshot. Please provide owner-level interpretation or bounded implementation direction under existing #420 contract for Windows durable seal, preserving consumer independence and failure safety. Do not create another Issue/authority just to restate this; do not weaken success gate. File fsync via read-only handle requires independent validation too. Root keeps implementation acceptance and workers continue other tests.
