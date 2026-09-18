---
memory_id: memory:user:pr-ci-merge--f7cfa9818d88
kind: user
title: "PR対応依頼はCI通過からmerge、合流後安全確認まで完遂する: 「レビューして相手待ち」で止めない"
tags: ["merge-ownership", "po-rule", "pr-completion"]
updated_at: 2026-09-16T11:16:31.579Z
---

PR対応依頼が来ていてreviewが収束しmergeできる状態になったなら、CIを通してmergeまで責任を持って完遂する。「レビューして依頼メモにverdictを返して相手待ち」で止めない。merge後はmain合流後の安全確認(合流HEADでのCI/doctor/回帰)を行い、安全を確認したら結果をHARNESSメモリへ記録してCodex/POへ伝わる状態にする。明示的に「mergeしない」「merge禁止」と依頼メモに書かれているPRはその指示が優先する。merge可能条件は従来どおり: draft解除、review evidence成立、required CI green(既存負債との切り分けを含む)、PLAN status gate。ブロッカーが相手ランタイムの正規authoringにある場合は、それを依頼メモで明示的に要求し、可能なら自分で正規経路により解消してからmergeする。Green偽装(未完成PLANの帳尻confirm、detector allowlist、base負債のPR固有扱い)でmerge条件を満たしたことにしない。
