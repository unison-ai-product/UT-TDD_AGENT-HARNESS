---
memory_id: memory:project:feedback-lifecycle-source-of-truth-separation
kind: project
title: "Feedback lifecycle source-of-truth separation"
tags: ["db", "feedback", "lifecycle", "telemetry"]
updated_at: 2026-07-10T03:42:50.782Z
---

再構築可能なharness.dbはfeedback消化状態の正本にしない。source観測はappend-only/rebuildable projection、ack/close/supersedeはgitignoreのappend-only lifecycle logを正本に分離し、DBへ投影する。telemetryだけはTTL ack対象、gate/actionableはsource解消まで保持し、同一source再投影で消化済み状態をopenへ戻さない。
