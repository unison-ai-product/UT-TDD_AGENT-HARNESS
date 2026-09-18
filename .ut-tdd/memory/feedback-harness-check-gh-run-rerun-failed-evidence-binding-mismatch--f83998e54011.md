---
memory_id: memory:feedback:harness-check-gh-run-rerun-failed-evidence-binding-mismatch--f83998e54011
kind: feedback
title: "harness-checkではgh run rerun --failedを使わない: evidence-binding-mismatchで落ちる"
tags: ["ci", "flake-recovery", "node-generation"]
updated_at: 2026-09-16T11:14:05.417Z
---

失敗ジョブだけを再実行するgh run rerun --failedを使うと、別ジョブ(例: Windows)だけが新しいattemptで再実行され、aggregateジョブがLinux/Windowsの生成evidenceが異なるattempt由来であることを検出してevidence-binding-mismatchで失敗する。same-run/attempt admissionは意図的な設計であり、flake復旧にはgh run rerun <id>で全ジョブ・単一attemptとして再実行すること。
