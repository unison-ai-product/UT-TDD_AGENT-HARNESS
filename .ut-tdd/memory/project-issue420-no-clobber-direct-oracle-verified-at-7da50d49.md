---
memory_id: memory:project:issue420-no-clobber-direct-oracle-verified-at-7da50d49
kind: project
title: "Issue420 no-clobber direct oracle verified at 7da50d49"
tags: ["evidence", "issue420", "tdd"]
updated_at: 2026-09-08T11:47:28.929Z
---

Root verification terminal: current physical adapter HEAD7da50d49, canonical snapshot61854 PID732 completed 8/8 PASS exit0, cleanup10731 Failed0. Prior baseline b491666c also 8/8 PASS but no-clobber was masked by Windows fsync denial; new oracle directly invokes production seal port and requires EEXIST with prior sentinel retained, so collision guard is reached. Typecheck/Biome passed before run; no edits during snapshot. Windows successful installation still NOT proved, current unsupported directory flush fails closed. Actual Node/PF5 verification composition and fresh-process positive recovery still pending. No PR push or whole Issue420 closure. Await exact durability consultation previously queued; do not silently exempt fsync.
