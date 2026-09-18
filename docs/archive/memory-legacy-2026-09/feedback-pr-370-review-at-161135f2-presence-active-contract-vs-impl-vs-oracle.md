---
memory_id: memory:feedback:pr-370-review-at-161135f2-presence-active-contract-vs-impl-vs-oracle
kind: feedback
title: "PR 370 review at 161135f2: presence を証明できないのに active と主張 (contract vs impl vs oracle 三者不一致)"
tags: ["issue-227", "plan-l7-495", "pr-370", "review"]
updated_at: 2026-08-21T05:27:11.129Z
---

PR #370 (Issue #227 / PLAN-L7-495) exact HEAD 161135f24b9e93dc544e4ef4c03bc28bfff3d195 = FLAG (blocking 1)。CI run 32444783011 は headSha 一致で success、CLEAN。

B-1: PLAN-L7-495 凍結契約 §3 は 'target workspace 固有の session 存在を証明できない場合は unknown として扱い、存在を推測しない' と書いているが、実装は sessionStatus: activeSessionCount > 0 ? 'active' : 'absent' で unknown を一度も生成しない。activeClaudeSessionCount は root 直下の *.generation を mtime だけで数え、marker には workspace 紐付けが無い (PR 自身のコメントが認めている)。結果、別 workspace の session が生きているだけで sessions=active と表示される。oracle U-MEMBACKLOG-003 がこの挙動を固定しており、marker 本文に 'workspace' という文字列を書いているのに読み手が中身を見ないので検証したように見えて何も検証していない。publish≠delivery を主題にする PR が presence については証明できない存在を主張しており、同じ誤りを別の面で犯している。

教訓 (一般化): union 型に unknown 系のメンバを宣言したら、それを生成する経路が実在するかを必ず確認する。**宣言されているが到達不能な状態**は、契約が要求する fail-close を実装が満たしていない典型的な兆候である。また fixture が意味ありげな内容 (ここでは marker 本文の 'workspace') を書いていても、読み手がそれを読まないなら oracle は空振りしている — テストの見た目ではなく、production 側が何を読むかで判断する。

非 blocking: (N-1) .generation の mtime は wake wait 開始時に 1 回だけ書かれ待機中も更新されない一方、Stop hook timeout は 930 秒で閾値は 900 秒 = 1 回の正常な待機が閾値を追い越し、生きている session を absent と報告する。(N-2) digest が own pending 0 のとき 'no unclaimed Claude payload' と言い切った直後に target_mismatch 警告を出す。(N-3) hook 検出が JSON.stringify(Stop).includes('claude-memory-wake') の部分一致で statusMessage にも反応する。

PASS 側: foreign target の別集計、publish の deliveryState=pending 監査、hook parse 失敗を configured 扱いにしない fail-close、summarizeEntries の workspaceId 引数化、generates が既存 src の所有権を再宣言していない点。
