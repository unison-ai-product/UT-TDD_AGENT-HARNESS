---
memory_id: memory:feedback:review-dispatch-outcome-attempt-attempt--4a4fff588c48
kind: feedback
title: "開始済みのreview dispatchを途中で止めない: outcomeの無いattemptは以降の全attemptをブロックする"
tags: ["delegation", "review-custody", "review-dispatch"]
updated_at: 2026-09-16T11:14:09.590Z
---

ut-tdd codex|claude --role <reviewer> --execute のreview dispatchを開始後に強制停止(kill)しない。開始時にattemptディレクトリが作られ、outcome eventはdispatchが完走したときだけ書かれる。途中で止めたattemptはoutcomeの無いまま残り、以降のそのrequestに対する全attemptがattempt_outcome_indeterminateを返す。custodyはattemptにちょうど1つのoutcomeが無い状態をfail-closeするため、途中停止は自分だけでなく相手ランタイムのcanonical reviewもブロックする。dispatchするかどうかはコマンド実行前に決め、実行中に決めない。自分のfamilyが著者のPRでは、peer reviewを自分で起動せず、exact-head requestを共有メモリ経由で公開してpeerセッションに拾わせる。もし途中停止した残骸が既にあるなら、attemptディレクトリが空でcustody jsonlに該当digestのeventが0件であることを確認してから、空ディレクトリだけをrmdirで削除する。他familyのoutcomeを捏造しない。
