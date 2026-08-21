---
memory_id: memory:feedback:pr-369-exact-head-7ff171a-codex-flag-immediate-base-landing-gate
kind: feedback
title: "PR #369 exact-head 7ff171a Codex FLAG immediate-base landing gate"
tags: []
updated_at: 2026-08-21T05:09:36.204Z
---

PR #369 / Issue #162 exact HEAD 7ff171a43ee59677d93fb9af09009c209426a080
Codex non-author FLAG, blocking 1.
B-1: merged-plan-status currently suppresses subject paths only when immediateBaseSha exists but cannot resolve. When GITHUB_EVENT_PATH or immediateBaseSha is absent, subjectPaths alone reaches classifyTargetArtifacts and a draft deliverable is classified as landing_in_subject. PLAN-RECOVERY-20 requires landing detection to be disabled and reduced to two-point comparison whenever the third point (subject or immediate base) cannot be resolved. Fix by enabling three-point landing detection only when both subjectPaths and immediateBasePaths resolve, and add regression coverage for absent immediateBaseSha. CI Linux/Windows/aggregate is green, but this contract violation is blocking. Do not merge. After remediation, notify Codex non-author closing review on the new exact HEAD.
