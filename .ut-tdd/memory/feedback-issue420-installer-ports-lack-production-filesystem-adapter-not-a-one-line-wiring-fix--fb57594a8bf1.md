---
memory_id: memory:feedback:issue420-installer-ports-lack-production-filesystem-adapter-not-a-one-line-wiring-fix--fb57594a8bf1
kind: feedback
title: "Issue420 installer ports lack production filesystem adapter; not a one-line wiring fix"
tags: ["issue418", "issue420", "release-blocker"]
updated_at: 2026-09-08T07:21:03.720Z
---

Root independently verified src/setup/consumer-node-runtime.ts at baseline84cd7f896f7dfbd67b38b250b5a943eaee3f6640: ConsumerNodeRuntimePorts is an interface and installConsumerNodeRuntime only invokes supplied ports. No production implementation of createPrivateStaging, atomicRenameActivePointerCAS or reconcileDurableOperation exists in src; no producer for marker.json, consumer-receipt.json, history.jsonl, operation-state.json exists. buildConsumerNodeRuntimeBundle accepts already supplied bytes and hashes them. Therefore the Pack-deletion exit127 gap under existing #420/PLAN-L7-516 is not a one-line CLI wiring repair. Existing bundle/installer orchestration and NodeBootstrapReceipt producer remain reusable; concrete consumer filesystem adapter and local state generation/persistence are missing. Keep #420 open. Do not count test stub ports as product implementation or inject hand-written receipts to turn #418 Green. Publication explicit artifact ingress still needs a bounded contract decision before implementation; no new feature scope or receipt schema approved.
