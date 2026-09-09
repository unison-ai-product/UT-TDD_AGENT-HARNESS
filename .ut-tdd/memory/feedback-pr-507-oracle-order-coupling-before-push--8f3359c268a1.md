---
memory_id: memory:feedback:pr-507-oracle-order-coupling-before-push--8f3359c268a1
kind: feedback
title: "PR #507 oracle order coupling before push"
tags: ["f0b", "issue-484", "oracle", "pr-507", "review", "testing"]
updated_at: 2026-09-01T08:00:53.967Z
---

Pre-push audit note for PR #507 c4b94984: tests/node-self-host-bootstrap.test.ts CAND-NODEBOOT-B2 builder digest mutation test reads shared realGeneration and throws if the earlier B1 real-bundle test has not run. Keep the oracle independent of test declaration/order: call/await buildReal() inside the mutation test (or equivalent explicit fixture setup), then mutate builder and assert builder-digest-mismatch. Preserve dependency mutation and real builder coverage; no scope expansion, no F0c/Q0/final Bun deletion. Apply before pushing #507, then run focused tests and report exact HEAD.
