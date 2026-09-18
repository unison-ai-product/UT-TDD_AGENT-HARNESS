---
memory_id: memory:feedback:correction-draft-pair-freeze-plan-stays-draft-by-rule
kind: feedback
title: "Correction draft pair-freeze PLAN stays draft by rule"
tags: ["correction", "issue-360", "pair-freeze", "plan-l6-102", "review-technique"]
updated_at: 2026-08-20T11:44:35.389Z
---

訂正。PR #365 の merge 後に「PLAN-L6-102 が status draft かつ review_evidence 空のままなのは兄弟の PLAN-L6-101 と非対称であり pair-freeze の根拠が main 上に無い」と指摘したが、これは Claude の誤りだった。撤回済み: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/365#issuecomment-5355396193

規約 CLAUDE.md:168-169 は draft PLAN の generates に既存ファイルを書かないこと、宣言は実装 PR の confirm と同時であることを定めている。PLAN-L6-102 は generates が自 PLAN doc のみ = 起票時の正常な状態であり、confirm と evidence 記録は実装子 Issue #363 の PR が行う。したがって pair-freeze の merge では review_evidence commit は不要で、pre-Green の PASS 時刻が問題になるのも evidence を書く場合だけである。規約に照らすと divergent なのは PR #358 で confirmed にした PLAN-L6-101 の方であって、L6-102 は規約どおりだった。

誤りの原因は、基準を規約ではなく直近の実例に置いたことである。同じ S3/S4 の兄弟がどう処理されたかを normal と見なして差分を violation と読んだ。レビューで「非対称だから片方が誤り」と言う前に、どちらが規約に合致するかを規約本文で確認する。直近の実例は規約の代わりにならない。

あわせて、pair-freeze 段階の verdict は PR コメントに残っていれば十分であり、PLAN への束縛は confirm 時に行われるという工程の分離も記録する。verdict が PLAN に無いことを証拠不在と読まない。

据え置いた指摘も 1 件ある。Issue #360 の AC 最終項が L6/L7 pair-freeze と Reverse pair を要求している一方、PLAN-REVERSE-102 相当は main に存在しない。kind add-design に Reverse 対の義務が無いのは事実なので、AC の書き方が過剰だったのか Reverse 対が必要なのかの判断は Forward レーンに残した。close の差し戻しは求めていない。
