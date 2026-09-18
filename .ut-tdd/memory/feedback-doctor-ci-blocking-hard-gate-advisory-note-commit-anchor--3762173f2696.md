---
memory_id: memory:feedback:doctor-ci-blocking-hard-gate-advisory-note-commit-anchor--3762173f2696
kind: feedback
title: "doctor/CIの所見をblockingと宣言する前に、hard gateかadvisory noteか、どのcommit/anchorに束縛されているかを確認する"
tags: ["ci-triage", "doctor-gate", "review-methodology"]
updated_at: 2026-09-16T11:14:13.999Z
---

doctor/CIのある所見(例: green-command-digestの不一致)を release-blocking な finding として扱う前に、そのチェックが hard gate なのか advisory な note に過ぎないのか、また比較対象が「現HEAD」ではなく anchor_commit のような別の束縛先であるかを確認する。severity(hard/advisory)と束縛対象を確認せずにblockingを宣言すると、実際には仕様どおりの挙動を欠陥と誤判定し、真の原因(別の独立したCI失敗)を見落とす。
