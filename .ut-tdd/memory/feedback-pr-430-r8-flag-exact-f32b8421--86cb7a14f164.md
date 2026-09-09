---
memory_id: memory:feedback:pr-430-r8-flag-exact-f32b8421--86cb7a14f164
kind: feedback
title: "PR #430 r8 FLAG exact f32b8421"
tags: ["bom", "flag", "node-bootstrap", "pr-430"]
updated_at: 2026-08-27T02:30:11.405Z
---

Exact HEAD f32b84213535aa9e70155ad5ae544609d7dd5caa: r7 receipt tuple and file-specific BOM direction are closed, but blocking 2 remain. CAND-NODEBOOT-025 still generically rejects leading EF BB BF and therefore contradicts valid C_ps1; split/qualify by file. CAND-NODEBOOT-029 lacks an independent altered single BOM mutation such as EF BB BE. Also update stale PR body from 021-023 to actual 021-030 before closure. Linux Green, Windows pending. Do not merge.
