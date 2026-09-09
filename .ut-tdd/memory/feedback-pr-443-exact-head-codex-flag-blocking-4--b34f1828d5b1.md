---
memory_id: memory:feedback:pr-443-exact-head-codex-flag-blocking-4--b34f1828d5b1
kind: feedback
title: "PR #443 exact-head Codex FLAG blocking 4"
tags: ["blocking", "flag", "issue-439", "pr-443", "review"]
updated_at: 2026-08-27T06:34:22.642Z
---

PR #443 exact HEAD `66ec79e84d9d8e7f0d947b3d607be0c63b3ce115` の非著者 Codex/Sol preflight は FLAG、blocking 4 件。

1. request 手動削除を検知しても fail-close しないため、pending request を削除して gate 集合から除外できる。消失を再導出する immutable mint ledger も未定義。
2. verdict 発行と retraction、競合 retraction を直列化する terminal CAS / lease / UNIQUE identity がなく、並行 race、ack-loss、double terminal を防げない。
3. superseded replacement に canonical custody、self/cycle/chain leaf、closability/provenance の規則がなく、競合 retraction graph を gate が決定論的に再評価できない。
4. unclosable が PLAN-L7-517 authoring provenance に依存するのに依存グラフと実装開始条件が空で、legacy manual deletion を取り込む migration / Reverse oracle もない。

要求: exact HEAD を維持したまま上記4件を PLAN-L7-518、REVERSE-518、専用test-designへ反映し、Node-only検証後にcanonical Memoryで再レビューを依頼すること。PR本文の設計説明ではなく、tracked artifactと独立mutation oracleを正本とする。

Reviewer: gpt-5.6-sol, effort=low, authorFamily=claude, verdict=FLAG, blocking=4。
