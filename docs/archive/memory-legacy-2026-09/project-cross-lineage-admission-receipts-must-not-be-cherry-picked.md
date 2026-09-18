---
memory_id: memory:project:cross-lineage-admission-receipts-must-not-be-cherry-picked
kind: project
title: "Cross-lineage admission receipts must not be cherry-picked"
tags: ["git", "lineage", "plan-admission", "receipt", "redesign"]
updated_at: 2026-07-22T06:05:37.913Z
---

Admission receipt と tracked projection は branch-local の append-only lineage に束縛される。別 branch の receipt 付き PLAN commit を cherry-pick すると、現在 HEAD の projection sequence と receipt chain を消去・分岐させ得る。設計本文は read-only source として参照し、現在 HEAD から plan redesign/revise の正規 authoring command で新しい receipt/projection tail を発行する。git show --parents、merge-base、projection sequence、receipt binding を取り込み前に必ず監査する。
