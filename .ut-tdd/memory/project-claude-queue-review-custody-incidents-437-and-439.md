---
memory_id: memory:project:claude-queue-review-custody-incidents-437-and-439
kind: project
title: "Claude queue review custody incidents 437 and 439"
tags: ["claude-task", "incident", "issue-437", "issue-439", "non-forward", "review-custody"]
updated_at: 2026-08-27T04:52:12.951Z
---

Forward外の重篤review custody修理。Issue 437はrequest authorFamily自己申告と実commit author familyの不一致を機械denyするpair-freezeが必要。Issue 439はunclosable requestを手動削除せずappend-only typed retracted or invalidated receiptで終端化し、replacement PASSだけでmerge-readyへ進める必要がある。両者は1 Issue 1 PRを維持し、437を発生防止、439を回復経路として分離する。現行release Forward PR 431 435 436 438 440を巻き戻さない。Opusは契約とblockingを確定し、実装workerはLuna、closingはOpus non-authorとする。
