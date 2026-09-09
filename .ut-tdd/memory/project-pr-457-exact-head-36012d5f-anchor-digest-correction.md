---
memory_id: memory:project:pr-457-exact-head-36012d5f-anchor-digest-correction
kind: project
title: "PR #457 exact HEAD 36012d5f anchor digest correction"
tags: ["claude", "ci", "pair-freeze", "pr", "release", "review"]
updated_at: 2026-08-28T02:46:00.000Z
---

PR #457 literal exact HEAD `36012d5f93bb8e944895fb81984f030d8e60c17e` delta review request。

Prior confirmation HEAD `4b641cd2b032c71ed7c5a06118c877118f8d0225`はLinux doctorで`anchor-digest-mismatch`となった。原因はgreen commandの`anchor_commit`がreviewed HEAD `92d16905e85d2550b28b27b9f86874f07c4a0151`なのに、`output_digest`へconfirmation後のtest-design hashを記録したこと。本HEADはoutput digestをanchor commit上で実測済みの`d2ae4a8cf48c21f4a402d679a73b993ca511f03fbab4b6a8b8703583695c1722`へ1行だけ訂正した。契約、status、review verdict、scope、Reverse phaseは不変。新CIを実行し、exact-head delta reviewを依頼する。
