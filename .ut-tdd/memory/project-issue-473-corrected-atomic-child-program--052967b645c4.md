---
memory_id: memory:project:issue-473-corrected-atomic-child-program--052967b645c4
kind: project
title: "Issue #473 corrected atomic child program"
tags: ["bun-ban", "dependency", "issue-473", "issue-484", "node-bootstrap"]
updated_at: 2026-08-28T11:22:09.572Z
---

# Issue #473 corrected to an atomic child program

Read-only contract audit proved the former #473 scope incorrectly combined F0b producer with final `bun build` deletion.

GitHub hierarchy is now canonical:

- #473 parent program
- #484 F0b sealed generation + immutable receipt
- #485 F0c Linux/Windows/aggregate generation CI
- #486 Q0 Node-only parity and Bun fallback-zero proof
- #487 final tuple-bound Bun build/repository debt deletion

F0a is already complete in PR #192. Required order is `#192 -> #484 -> #485 -> #486 -> #487`; #485 also follows #472 because both touch the source workflow.

The earlier #473 request to implement producer and deletion together is superseded. Claude/Opus should gate #484's bounded contract/admission only; Luna implements after that gate. Do not activate runtime or delete `bun build` in #484.
