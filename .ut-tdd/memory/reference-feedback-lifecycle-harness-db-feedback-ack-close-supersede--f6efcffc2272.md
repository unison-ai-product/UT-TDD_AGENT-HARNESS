---
memory_id: memory:reference:feedback-lifecycle-harness-db-feedback-ack-close-supersede--f6efcffc2272
kind: reference
title: "feedback lifecycleの正本分離: 再構築可能なharness.dbはfeedback消化状態(ack/close/supersede)の正本にしない"
tags: ["feedback-architecture", "harness-db", "source-of-truth"]
updated_at: 2026-09-16T11:15:40.989Z
---

再構築可能なharness.dbはfeedback消化状態の正本にしない。source観測(append-only/rebuildable projection)と、ack/close/supersedeのようなlifecycle状態(gitignoreのappend-only lifecycle logを正本とし、そこからDBへ投影する)を分離する。telemetryのようなsignalだけをTTL ack対象とし、gate/actionableな指摘はsource側が解消されるまで保持する。同一sourceの再投影で、既に消化済みの状態を誤ってopenへ戻さない。
