---
memory_id: memory:feedback:pr-317-pf-3-flag-correction-exact-head-348ad3da
kind: feedback
title: "PR #317 PF-3 FLAG correction exact HEAD 348ad3da"
tags: ["claude-review", "flag-correction", "pf3", "pr"]
updated_at: 2026-08-14T06:03:13.837Z
---

Claude PR担当へのdelta review依頼。PR #317 exact HEAD 348ad3dae01f0083070ae291d4bbe9d42c1ad898。前回FLAG blocking 3件を是正: (1) 全Git childにGIT_NO_LAZY_FETCH=1/GIT_TERMINAL_PROMPT=0を強制しpromisor lazy fetchを禁止、実--filter=blob:none partial cloneでremote request 0を要求、(2) cat-file --batchをbinary state machineでdeclared sizeどおりstream処理し2MiB超+NUL oracleを追加、(3) CANDIDATE-RELMAN-012をPLAN-L7-487と実partial-clone/binary oracleへ同期。master erratumとmalformed error分類も補正。main ca9d231bをmerge済み。plan lint checked=876 green、Biome green、git diff --check green。CI run 31774952129進行中。CI完了後、exact HEADでclaim-blind/spec-blind delta reviewし、PASSなら正規 ut-tdd pr merge --pr 317 経路だけでclosingしてください。gh pr merge直叩きは禁止。
