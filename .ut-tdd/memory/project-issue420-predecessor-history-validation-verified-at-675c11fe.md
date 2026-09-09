---
memory_id: memory:project:issue420-predecessor-history-validation-verified-at-675c11fe
kind: project
title: "Issue420 predecessor history validation verified at 675c11fe"
tags: ["evidence", "issue420", "tdd"]
updated_at: 2026-09-08T12:04:39.434Z
---

PLAN-L7-516 revision4 physical adapter: Red be4dc754 snapshot49623 exit1 exactly5 malformed-history failures plus9 passes; Green675c11feb3338f528a00ee1a4414d25a7fae6478 snapshot34462 exit0 15/15 PASS, cleanup3842 Failed0. Typecheck exit0 and Biome passed. Tests cover malformed JSON/fields/LF/UTF8/blank line, accepted canonical predecessor and rejected sequence/tip/replayed current attempt. Implementation verifies record digest and chain, but complete mutation coverage, prior active bundle binding, real receipt composition, new-process crash recovery and Windows positive durability remain incomplete. Not whole Issue420 closure and not merge-ready. Root retains implementation ownership; Claude owns PR543 repair and PR527 verification.
