---
memory_id: memory:feedback:review-request-dispatch-exact-head-request-ut-tdd-review-requests--773b558e0a81
kind: feedback
title: "review requestをdispatchする前に、同じexact headに対する既存requestが.ut-tdd/review/requests/に無いか確認する"
tags: ["hybrid-coordination", "race-condition", "review-dispatch"]
updated_at: 2026-09-16T11:17:12.807Z
---

複数のlane(例: Codex側とcontrol lane)が同じCI green契機で同時にreview requestをdispatchすると、数秒差で重複したcanonical requestが作られることがある。片方は未消費のまま隔離され、無駄なreview実行と混乱を生む。あるPRについてどちらのlaneが依頼発行を担当するかが引き継ぎ(takeover)メモリで既に定まっている場合、担当外のlaneはdispatchしない。dispatchする側は、実行前に.ut-tdd/review/requests/ディレクトリを対象exact headで確認し、既に有効なrequestが存在するなら二重dispatchを避ける。
