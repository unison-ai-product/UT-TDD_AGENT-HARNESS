---
memory_id: memory:feedback:verify-upstream-canonical-plan-before-judging-a-contract-point-undetermined-or-po-bound
kind: feedback
title: "Verify upstream canonical PLAN before judging a contract point undetermined or PO-bound"
tags: ["closing-review", "plan-l7-515", "po-escalation", "pr-447", "process"]
updated_at: 2026-08-28T01:08:24.125Z
---

closing review で blocking を「契約未確定 / PO 判断待ち」と判定する前に、**上流の canonical PLAN を
必ず確認する**。実装 PR が持ち込んだ PLAN (下流) にしか当たらないと、既に merge 済みの正本が
その論点を pin していても「未確定」と誤判定し、判断を PO へ不当に転送してしまう。

**実例 (2026-08-27〜28、PR #447 / Issue #414)**: approval nonce の consumption cardinality を
「PLAN-L7-519 にも test design にも規定が無く未確定、PO 判断が必要」と receipt
`6321a408d689e53880ef9807a3aac69bcf1ef97d9f929bba628c8bc68ff0243c` に記載した。しかし上流の
`PLAN-L7-515` §2 (PR #438 で merge 済み) が「遷移名ごとの human approval nonce」「各 mutation
(draft Release / asset upload / tag / canary pointer append) 単位の approval receipt と nonce」
「未使用 nonce は一度だけ consume」と既に pin していた。正解は trade-off 無しの一択であり、
adapter が 1 nonce を 3 sub-mutation へ replay しているのは**既存契約違反**だった。
PO 判断事項は最初から存在しなかった。

**Why**: 「PO 判断待ち」は作業を止めるラベルであり、誤って貼ると進行が空転する。CLAUDE.md
§PO 判断への反射的エスカレーション禁止 (2026-08-05) は、advisor 相談と repo 実測を経ずに
PO へ上げることを禁じている。上流 PLAN の未読はその「実測」の欠落そのもの。
さらに引継ぎ memo に「PO 判断が要る論点」として転記されると、次セッションが検証せず再転記して
誤ラベルが固定化する (本件は実際に 1 セッション跨いで固定化した)。

**How to apply**:
1. review で「契約に規定が無い」と書く前に、対象 PLAN の `requires` / 上流 PLAN と、同じ
   契約語 (nonce / digest / identity 等) を持つ merge 済み PLAN を grep する。
   `grep -n "<契約語>" docs/plans/PLAN-*.md` で足りる。
2. 上流が pin していれば判定は「未確定」ではなく「既存正本違反」。是正方針は上流契約への整合。
3. 引継ぎ memo の「PO 判断待ち」は次セッションで**再検証してから**転記する。無検証の転記をしない。
4. 実装 PR が契約 PLAN を同梱している場合、上流整合が一度も検査されていないので、
   この誤判定が起きやすい。§PR スコープ規律 4 に従い close→分割再出を既定にする。

関連: [[feedback-pr-447-exact-head-c1040ba0-claude-closing-review-flag-blocking-3-including-remotewrites-0-m]]
