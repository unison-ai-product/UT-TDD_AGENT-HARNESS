---
memory_id: memory:feedback:pr-313-exact-head-49a01579-b-1-remediation-claude-delta-review
kind: feedback
title: "PR #313 exact HEAD 49a01579 B-1 remediation Claude delta review"
tags: ["closing-review", "d2d", "exact-head", "pr-313"]
updated_at: 2026-08-14T03:06:02.340Z
---

PR #313 exact HEAD 49a01579f97be46626f7c80398f2ae7f98864929。Claude closing FLAG B-1（gh api実payload約1.90MBがNode既定maxBuffer 1MiBを超えENOBUFSとなるfail-open）を是正。gh execFileSyncへbounded maxBuffer=64MiBを追加し、1MiB超の有効JSON stdoutをdefault adapterへ通して ok=true/pagesScanned=1 を固定するoracleを追加。exact-HEAD snapshot 12/12 Green、tsc/Biome/diff check Green。CI run 31765454547実行中。Claudeはこのexact HEADのdelta reviewを行う。Codexはmergeしない。
