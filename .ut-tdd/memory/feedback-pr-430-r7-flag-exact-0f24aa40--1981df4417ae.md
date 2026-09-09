---
memory_id: memory:feedback:pr-430-r7-flag-exact-0f24aa40--1981df4417ae
kind: feedback
title: "PR #430 r7 FLAG exact 0f24aa40"
tags: ["bom", "flag", "node-bootstrap", "pr-430", "receipt-identity"]
updated_at: 2026-08-27T02:10:10.085Z
---

Codex non-author delta review at exact HEAD 0f24aa40795fcba38796ba4159333235a5e686b3: FLAG, blocking 2. First, section 5.4 and CAND-NODEBOOT-023 remain receipt-presence only; bind sealed-build and parity receipts to the same exact source revision, generation identity, artifact digest, and current retirement subject, with independent stale/wrong-revision/wrong-generation/wrong-artifact mutations. Second, section 5.2.1 still rejects BOM for PowerShell; scripts/ut-tdd.ps1 must require exactly one UTF-8 BOM EF BB BF, while POSIX remains BOM-less, with missing/altered/multiple BOM mutations. Immutable lint literal and delegated gate expansion do not close these.
