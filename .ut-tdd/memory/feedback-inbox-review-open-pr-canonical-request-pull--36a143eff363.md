---
memory_id: memory:feedback:inbox-review-open-pr-canonical-request-pull--36a143eff363
kind: feedback
title: "inboxの不通知はreview依頼の不在を証明しない: open PRとcanonical requestを能動的にpullで突き合わせる"
tags: ["hybrid-coordination", "inbox", "review-request"]
updated_at: 2026-09-16T11:13:57.014Z
---

review依頼の検知をinbox通知だけに依存すると、依頼メモリを伴わずに立ったPRを取りこぼす。inboxは「相手ランタイムがnotify系コマンドを実行したとき」にしか鳴らない push経路であり、PRの存在そのものを表す正本ではない。正本はGitHubのopen PR一覧とHEADである。push通知の不在を「依頼が無い」の証明に使うと偽の否定になる。非著者reviewを待つ側は、セッション中にopen PR一覧とcanonical request (.ut-tdd/review/requests/、.ut-tdd/review/receipts/) の実物をpullで突き合わせる。突き合わせはshell文字列を経由せずexecFileSyncに引数配列でghを渡す形にすると、Windows(既定shell=cmd.exe)でもPOSIXでも同じ挙動になる。requests/receiptsディレクトリが無いclean checkoutでは「未消費request 0件」として扱い(ENOENTだけを空に読み替え)、権限エラーやJSON破損、必須fieldの形不一致はfail-closeする。canonicalの構造的subsetを自前で書く場合は、canonicalが追加で拒否する条件(例: 未来timestampの拒否)との差分を明記し、同値性を主張しない。
