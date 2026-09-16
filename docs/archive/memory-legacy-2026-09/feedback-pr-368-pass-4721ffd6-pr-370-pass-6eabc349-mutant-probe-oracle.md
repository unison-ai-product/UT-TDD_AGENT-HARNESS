---
memory_id: memory:feedback:pr-368-pass-4721ffd6-pr-370-pass-6eabc349-mutant-probe-oracle
kind: feedback
title: "PR 368 PASS (4721ffd6) / PR 370 PASS (6eabc349) — 両者とも mutant probe で oracle の判別性を確認"
tags: ["mutation-probe", "pr-368", "pr-370", "review"]
updated_at: 2026-08-21T05:58:50.454Z
---

2026-08-21 に 2 件の closing PASS を出した。いずれも mutation probe (修正の該当行だけを外して対象テストを走らせる) で oracle が mutant を殺すことを実測してから PASS にしている。

PR #368 exact HEAD 4721ffd6600bfcfd54473a3d0980183c1b16a9e9 = PASS (blocking 0)。evidence ownership の付け替えが是正され、CI typecheck ブロックが entry-2 へ戻った。review-evidence ok / violations 0 / auditGreenCommandDigests mismatch 0 を実走確認。src/tests は ac755bb0 から無変更なので、そこで実測した 10/10 green と mutant kill (request.reviewRevision の 1 行削除で U-RELMAN-020 が単独失敗) がそのまま有効。この PR で閉じた blocking は計 5 件 (digest 不一致 / IMP-077 / revision 束縛欠落 / 判別しない回帰 / evidence 付け替え)。

PR #370 exact HEAD 6eabc349 = PASS (blocking 0)。.generation marker が workspaceId 入り v1 JSON になり、production writer が実際に書き、reader が照合する形になった。sessionStatus は active/unknown/absent の三値で unknown が到達可能。workspace 照合の 1 行を外す mutant で U-MEMBACKLOG-003 が単独失敗することを確認。前回指摘した『fixture が意味ありげな内容を書くのに reader が読まない』空振りも、oracle が production writer に marker を書かせる形へ変わって解消した。

未解決の非 blocking で後続作業が要るもの: PLAN-L7-495 の green_commands 3 件に anchor_commit が無く、PR #361 (issue #191、anchor 全 entry 必須化) と **merge 順序で衝突する**。後発側で plan digest-migrate --execute による backfill が必要。もう 1 件、.generation の mtime は wake wait 開始時の 1 回だけ書かれるが Stop hook timeout 930 秒 > 閾値 900 秒なので、正常な待機 1 回が閾値を追い越して待機中の session が absent と報告される。

教訓 (再確認): closing PASS を出す前に mutation probe を回すと、『回帰が入っている』という主張が実際に成立しているかを一手で確かめられる。PR #368 では初回この確認で vacuous な回帰を検出できた。
