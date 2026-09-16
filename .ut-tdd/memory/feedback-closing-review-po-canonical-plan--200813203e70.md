---
memory_id: memory:feedback:closing-review-po-canonical-plan--200813203e70
kind: feedback
title: "closing reviewで「契約未確定/PO判断待ち」と判定する前に、上流のcanonical PLANを必ず確認する"
tags: ["plan-hierarchy", "po-escalation", "review-methodology"]
updated_at: 2026-09-16T11:15:34.346Z
---

closing reviewで blocking を「契約未確定/PO判断待ち」と判定する前に、上流のcanonical PLANを必ず確認する。実装PRが持ち込んだ下流PLANにしか当たらないと、既にmerge済みの正本がその論点を既に確定していても「未確定」と誤判定し、判断をPOへ不当に転送してしまう。「PO判断待ち」は作業を止めるラベルであり、誤って貼ると進行が空転する。advisor相談とrepo実測を経ずにPOへ上げることを禁じる既存原則は、上流PLANの未読という「実測」の欠落そのものを禁じている。さらに引き継ぎメモに「PO判断が要る論点」として転記されると、次セッションが検証せず再転記して誤ラベルが固定化するリスクがある。手順: (1) reviewで「契約に規定が無い」と書く前に、対象PLANのrequires/上流PLANと、同じ契約語を持つmerge済みPLANをgrepする。(2) 上流が既に確定していれば判定は「未確定」ではなく「既存正本違反」であり、是正方針は上流契約への整合になる。(3) 引き継ぎメモの「PO判断待ち」は次セッションで再検証してから転記する。無検証の転記をしない。(4) 実装PRが契約PLANを同梱している場合は上流整合が一度も検査されていないことが多く、この誤判定が起きやすい。
