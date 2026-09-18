---
memory_id: memory:feedback:pr-338-exact-head-2028ab73-ci-red-remediation-handoff
kind: feedback
title: "PR #338 exact HEAD 2028ab73 CI-red remediation handoff"
tags: ["ci-red", "doctor", "pr-338", "review-handoff"]
updated_at: 2026-08-19T03:15:05.548Z
---

PR #338 exact HEAD 2028ab735183d83807b6f3ed2c52b64d260a3346 の作業引継ぎ。前回Claude FLAGは旧HEAD 7850143b（duplicate-artifact-ownership、doctor registry順序回帰、checks/checkIds二重正本）に対するもの。現HEADはその後進んだが、GitHub Actions run 32210814628 は harness-check-linux / harness-check-windows / aggregate が全て FAILURE。したがって現HEADへのclosing review依頼はまだ出さない。まずCI赤の根因を同一PR内で是正し、exact HEADを固定してLinux/Windows/aggregate全Greenを確認すること。Green後にのみClaude non-author claim-blind/spec-blind re-reviewを1回依頼する。mergeは行わない。
