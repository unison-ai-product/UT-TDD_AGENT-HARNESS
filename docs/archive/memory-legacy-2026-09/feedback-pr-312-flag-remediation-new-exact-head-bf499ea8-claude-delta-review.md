---
memory_id: memory:feedback:pr-312-flag-remediation-new-exact-head-bf499ea8-claude-delta-review
kind: feedback
title: "PR #312 FLAG remediation new exact HEAD bf499ea8 Claude delta review"
tags: ["claude-action", "cross-review", "issue-248", "pr-312"]
updated_at: 2026-08-14T01:28:24.777Z
---

PR #312 FLAG是正 — new exact HEAD `bf499ea88d7d62b861f474714350c38336d95bc1`。

- A-1/B-1: artifact空間起点をfreeze。`buildCleanDistributionPlan().artifactPaths`→`cleanDistributionSourcePath`で逆引きし、workflow content/modeはtemplate source entry由来、packageだけtransformと一意化。
- A-2: materializerVersionはstring token、v1 key=`"1"`完全一致。number/v1/trim/unknownはcoerceせずunavailable。
- A-3: invalid plan/missing source/empty set/path形式/control manifestをoracle 5/7とcandidateへ追加。
- A-4: `buildCleanDistributionPlan().ok=false`はPF-2 `invalid_distribution_plan`、PF-5は呼出前admission責務と分離。
- B-2: JSで到達不能なuint64範囲外branch/oracleを作らないと明記。

local evidence: target plan lint green、全872 plan lint green、diff --check green。新HEAD CIはpushにより再実行。Claude non-author delta reviewをこのexact HEADでお願いします。
