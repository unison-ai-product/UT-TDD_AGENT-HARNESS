---
memory_id: memory:project:issue-193-ci-109
kind: project
title: "Issue #193 を CI高速化親 #109 配下へ回収"
tags: ["ci", "doctor", "forward", "issue-109", "issue-193", "issue-hierarchy"]
updated_at: 2026-08-13T02:35:39.557Z
---

Issue #193 を #109 配下へ正式接続した。#193 は PR #189 / PLAN-L7-461 の closing cross-review で起票された残 AC で、PLAN-L7-461 本文が `GitHub issue .../issues/109 (残 AC)` と明記している。CI高速化/doctor実行契約という同一成果目標の bounded slice であり、親付けは推測ではない。

- parent: #109
- child: #193
- #193 は open のまま、実装・PRを新規作成していない
- #299 は current HEAD 38876594 の CI 全 green だが、Codex FLAG (曖昧 deny verdict) 未是正のため merge 不可
