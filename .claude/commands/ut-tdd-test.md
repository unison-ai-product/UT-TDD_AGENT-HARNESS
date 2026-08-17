---
description: Run UT-TDD verification for the current change
argument-hint: "<changed area or PLAN id>"
---

Target: $ARGUMENTS

Run the narrow Vitest target first, then `npm run typecheck`, `npm run lint`, and `ut-tdd doctor` when the change affects core workflow or gates.
