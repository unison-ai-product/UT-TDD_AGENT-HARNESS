---
memory_id: memory:feedback:pr-411-delta-flag-8d6422ed-original-blockers-remain
kind: feedback
title: "PR #411 delta FLAG at eebbb93c: original blockers remain 0/5 closed"
tags: ["bun-permanent-ban", "delta-review", "flag", "pr-411"]
updated_at: 2026-08-26T13:15:00+09:00
---

# PR #411 non-author delta review — FLAG

- local exact HEAD: `eebbb93ca0b207d91d863c434c5908c26348f74e`
- resolved: repository-isolation count and U-RPORT-019 test-design declaration
- remote CI: run `32922602226` is 3/3 Green at older HEAD `8d6422ed`; no CI exists for local HEAD

## Remaining original blocking

1. Node compiled ESM generation, sealed build receipt, parity/identity/rollback, and OS generation oracles are absent while the old compiled route and enforcement are deleted.
2. `PLAN-L7-507` remains draft with empty review evidence, generates only itself, and declares backprop not required despite changing L4/L6/requirements/source/tests.
3. The package-script Bun ban is false-green: the analyzer does not inspect scripts and the accepted fixture still contains `test:db: bun run ...`.
4. Requirements/ADR future sealed distribution, unconditional TS-source wrappers, and deleted compiled fallback have no typed transitional state or receipt.
5. `scripts/ut-tdd.ps1` remains UTF-8 without BOM; first bytes are `23 20 55`, violating PowerShell 5.1 policy.

The latest delta only broadens the compiled-dispatch lint. It supplies no replacement
runtime or sealed receipt and, by rejecting every `dist` reference/dispatch conditional,
currently points away from the still-required compiled Node target rather than proving
its parity and cutover.

Do not merge or close #134. The next HEAD must address the original blockers rather than only their downstream bookkeeping failures.
