---
memory_id: memory:feedback:issue-420-actual-setup-wiring-remains-missing-pack-deletion-exposes-exit127-under-issue418-oracle--177f3c3c3d97
kind: feedback
title: "Issue 420 actual setup wiring remains missing; Pack deletion exposes exit127 under Issue418 oracle"
tags: ["consumer-runtime", "issue418", "issue420", "release-blocker"]
updated_at: 2026-09-08T06:36:26.862Z
---

2026-09-08 root checked main installer references: installConsumerNodeRuntime and installConsumerLocalRuntime occur only at definitions/exports under src; CLI setup calls runSetup at src/cli.ts:4063. templates.ts:247 embeds setupSourceCli. Worker Red oracle f3dc2f4aefe771eea71bd76a99606f7ebe6f5248 in C:/dev/ut-issue418-pack-canary-nonbun invokes actual Pack npm ci/setup --solo, deletes setup Pack, then starts generated Product wrapper from unrelated cwd. Reported canonical snapshot session67091 exit1, 2 pass/2 fail: C003 wrapper exit127, C004 setup Pack absolute path remains. No stub runtime or manual activation rescue is present in inspected test. Independent logfile was not saved, so no fabricated log hash is claimed. This is not yet clean sealed-release-artifact acceptance: setup --solo currently has no connection to the existing sealed runtime installers. Issue420 is OPEN and owns this gap; do not file duplicate feature or close it merely because PR463 merged. Root is checking PLAN-L7-516 scope before implementing the missing production composition. Issue418 remains NO-GO.
