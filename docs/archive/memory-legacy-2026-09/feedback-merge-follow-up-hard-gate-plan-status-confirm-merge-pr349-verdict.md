---
memory_id: memory:feedback:merge-follow-up-hard-gate-plan-status-confirm-merge-pr349-verdict
kind: feedback
title: "merge 条件と follow-up の境界: hard gate が PLAN status を見るなら confirm は merge 前提であって後追いにできない (PR349 verdict 訂正)"
tags: ["correction", "merge-gate", "pr349", "review"]
updated_at: 2026-08-20T06:13:27.698Z
---

PR #349 の closing review で、PLAN-L7-419 の status:draft → confirmed 化を『merge 後の follow-up (非 blocking)』として PASS を出した。これは誤りで、merged-plan-status は doctor の hard gate であり、draft PLAN の generated deliverable が merge された瞬間に fail-close する。結果 main は #349 merge (62a159ef) から red のままになり、tip 52c39774 も red。

判定規則 (以後適用): 是正を merge 後の follow-up に置けるかは『gate がいつ評価するか』で決まる。
- merge 後に置ける: 次 PR での配線、別 consumer 追加、telemetry など、gate が現時点で見ていないもの。
- merge 前提: PLAN status / generates 所有 / review_evidence / digest — merge 後の HEAD を doctor が評価する対象そのもの。これらは『後で直す』と言った瞬間に main を red にする約束になる。

review で follow-up を許す前に『この項目を見ている gate は存在するか、それは merge 後の main を評価するか』を一度問う。
