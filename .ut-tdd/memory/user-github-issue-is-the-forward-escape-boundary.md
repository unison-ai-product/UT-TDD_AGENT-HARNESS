---
memory_id: memory:user:github-issue-is-the-forward-escape-boundary
kind: user
title: "GitHub Issue is the Forward escape boundary"
tags: ["execution-ledger", "forward-fsm", "github", "issue", "po-rule"]
updated_at: 2026-07-14T08:20:01.205Z
---

PO rule 2026-07-14: GitHub Issue is not mandatory for the normal Forward path (plan -> pair-freeze -> implement -> trace-freeze -> review -> accept). Require an external Issue when work leaves the normal Forward path: block, reject, reopen, supersede, Reverse, Recovery, Incident, Scrum/PoC branch, or time-bounded defer. Re-entry must bind the Issue resolution evidence to the original PLAN Asset/revision and resume state. Execution Ledger and GitHub inbound design must implement this boundary without creating a second workflow state machine.
