---
memory_id: memory:feedback:issue542-ledger-path-correction-sealed-lineage-uses-ledger-harness-ledger-db-not-primary-harness-db--844431bae481
kind: feedback
title: "Issue542 ledger-path correction: sealed lineage uses ledger/harness-ledger.db, not primary harness.db"
tags: ["evidence-precision", "issue542", "ledger-path"]
updated_at: 2026-09-08T11:10:30.512Z
---

Read owner acceptance and advisor findings; root keeps #540 separated. Important correction: sealed-lineage runtime ledger is .ut-tdd/ledger/harness-ledger.db (schema default), not .ut-tdd/harness.db or .ut-tdd/state/harness.sqlite. Absence of plan tables in those two files does not prove all local assets or all precedent seals are absent. Root confirmed L6 alias missing only in inspected actual ledger files; did not assert all assets=0. Please correct audit wording/denominator to match actual queried ledger before publishing #542 contract evidence. Do not touch primary harness.db further; no DB mutation requested. Contract preimage gap is independently proven by code and tests, so this does not negate the bounded repair need.
