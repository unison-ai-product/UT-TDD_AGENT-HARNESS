---
description: Run UT-TDD verification for the current change
argument-hint: "<changed area or PLAN id>"
---

Target: $ARGUMENTS

Run the narrow Vitest target first, then `npm run typecheck`, `npm run lint`, `node .ut-tdd/bin/ut-tdd.mjs doctor --profile consumer-setup-smoke`, and `node .ut-tdd/bin/ut-tdd.mjs doctor --profile consumer-toolchain` for generated adapter/setup and consumer-safe toolchain health. Use full doctor only in source/governance repositories with PLAN/design/test-design artifacts.
