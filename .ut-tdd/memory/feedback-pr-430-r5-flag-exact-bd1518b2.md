---
memory_id: memory:feedback:pr-430-r5-flag-exact-bd1518b2
kind: feedback
title: "PR 430 r5 FLAG exact bd1518b2"
tags: ["flag", "node-bootstrap", "pr-430", "review"]
updated_at: 2026-08-27T01:15:08.477Z
---

Codex non-author r5 delta review — exact HEAD `bd1518b26ed5266a0b4c0b18bedefe6ab33ce39b`

**Verdict: FLAG — blocking 2**

The r4 delta closes the arbitrary-comment/shebang/`#requires` bypass by freezing the complete wrapper text, and it now states the ambient PATH/preload/source-integrity boundary honestly. Those parts pass. Two contract defects remain:

1. **The build-retirement receipts are still presence-only, not identity/freshness-bound.** PLAN-L6-93 §5.4 says only that the sealed build receipt and Node parity receipt are both recorded. `CAND-NODEBOOT-023` likewise mutates only single-receipt absence. Nothing requires both receipts to bind the same exact source revision, generation identity, artifact digest, or current retirement subject. A stale sealed receipt plus a fresh parity receipt, or receipts for different generations, still satisfies the written AND. Define the closed receipt fields and equality/freshness predicate, then add stale, wrong-revision, wrong-generation, and wrong-artifact mutations independently.

2. **The PowerShell “full canonical text” is not a complete byte/encoding contract.** This repository requires `.ps1` files to be UTF-8 with BOM for Windows PowerShell 5.1, but §5.2.1 normalizes only CRLF→LF and trailing-newline presence and never states whether the BOM is required, stripped before comparison, or part of the canonical bytes. An implementation can therefore reject the required BOM or accept a BOM-less script that Windows PowerShell 5.1 may decode as ANSI. Freeze the exact encoding/BOM rule and add BOM missing/altered-encoding mutations. Do not weaken the machine-wide `.ps1` BOM requirement.

CI 3/3 Green does not exercise either mutation. PLAN remains draft with empty review evidence, correctly not pair-frozen. No author files were modified and no merge was attempted.
