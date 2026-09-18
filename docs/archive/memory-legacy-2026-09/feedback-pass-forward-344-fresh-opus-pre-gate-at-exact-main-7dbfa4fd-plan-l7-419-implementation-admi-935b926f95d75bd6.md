---
memory_id: memory:feedback:pass-forward-344-fresh-opus-pre-gate-at-exact-main-7dbfa4fd-plan-l7-419-implementation-admission-conditions-c-1-c-2
kind: feedback
title: "PASS: Forward #344 fresh Opus pre-gate at exact main 7dbfa4fd (PLAN-L7-419 implementation admission, conditions C-1/C-2)"
tags: ["exact-main-7dbfa4fd", "forward-fsm", "issue-344", "plan-l7-419", "pre-gate", "verdict"]
updated_at: 2026-08-20T01:51:28.429Z
---

Forward #344 の fresh Opus pre-gate を claude-opus-5 (非作者、claim-blind / spec-blind) が exact main 7dbfa4fd491c6783f8f46fcde930553b6299ae83 で再導出し、PLAN-L7-419 の implementation admission を **PASS (blocking 0、条件付き)** と判定した。base は #348 の squash merge commit で、post-merge CI run 32320773810 は harness-check-linux / harness-check-windows / aggregate の 3 job とも success (= exact main で plan lint と doctor が green)。

依頼された 6 点の admission 項目を全て exact HEAD の実体から独立に確認した。

(1) typed evidence / expiry precedence: PLAN-L6-72 §1 の transition table に「欠落・期限切れの typed rule」列が存在し、lifecycle 12 event が specialized 3 件 (begin-implementation→forward-red-evidence-missing、prepare-review→forward-trace-freeze-missing、accept→forward-accept-evidence-missing) と generic 9 件 (forward-evidence-missing) に排他分割される。exception 5 event は forward-exception-context-missing。行数を機械抽出して再現し 9+3+5=17 行 = lifecycle 12 + exception 5 で一致。期限切れは §2 に「eligible に数えず missing と同じ precedence」、§4 の exit code 表 row 2 に forward-evidence-missing が登録済み。rule ID の宙吊りなし (forward-ledger-unavailable も §2.1 に既存定義)。

(2) github_issue_id=344: frontmatter が 344、references に #344 / #342 / #108 を保持、§0 が #342 を docs-only pair-freeze の predecessor と明示。#344 は OPEN、#342 は CLOSED、#347 は CLOSED/COMPLETED。

(3) requires PLAN-L7-418: PLAN-L7-418 の status を exact HEAD で確認し `confirmed`。PLAN Filing Rules の「requires は confirmed / completed のみ」を満たす。

(4) candidate 001..009 / P-FSM-001: docs/test-design/harness/L7-unit-test-design.md に CANDIDATE-U-FSM-001..009 が各 1 行ちょうど (重複登録なし)、CANDIDATE-P-FSM-001 も line 1350 に登録済み。PLAN-L7-419 §2 の列挙 9 件、AC の 001..009 表記、§4 工程の「候補9件」が相互整合。

(5) scope: §5 が GitHub Project/Issue projection・D1/D2/D3 custody・Episode E0-E15・PF-5 Pack admission・promotion/rollback を明示除外。draft の generates は PLAN doc 2 件のみで実装ファイルを先取りしていない。src/forward/** と tests/forward/** を generates に宣言している PLAN は exact HEAD 上に他に存在せず (既存 hit は tests/forward-convergence.test.ts と tests/forward-escape-issue-contract.test.ts で別パス)、実装 PR が所有権を宣言する時点で duplicate-artifact-ownership の衝突は起きない。

(6) reverse pairing: PLAN-REVERSE-419-forward-fsm-backfill.md が exact HEAD に実在し、kind=reverse / workflow_phase=R0 / parent=PLAN-L7-419 で双方向参照が成立。§1 に R0→R4 の phase 表と出口条件があり、§2 で src/forward/** の所有を Forward implementation PR 側に固定している。AC 項目「IMP-167 は Reverse へ送られる」は REVERSE-419 §2 の「IMP-167 など実装後に初めて判定できる不足は R1/R2 で観測し R0 の pair-freeze へ混ぜない」で実体化済み。IMP-156 は improvement-backlog.md line 251 で「解決」に更新済み。

なお PLAN-L7-419 の status が draft・review_evidence が [] ・AC が全て未チェックである点は admission の欠格ではない。PLAN-L6-72 §5 が「実装 PR が src/forward/** を生成するとき、PLAN-L7-419 はこの表と candidate ID を requires / generates / review_evidence で exact revision に束縛する」と宣言しており、先行の PLAN-L7-418 も実装 PR で status=confirmed と generates(src/**) と review_evidence を同時に確定した同じ形をとっている。

実装着手時に持ち込む条件と advisory:

C-1 (最優先、実装 PR で解消すること): CANDIDATE-U-FSM-001 は「許可表にない state/event 全般は forward-transition-illegal で拒否」、U-FSM-002 は「飛越し・逆行・terminal 後 command を拒否」と無条件に書かれているが、U-FSM-009 は evidence 欠落・期限切れを exit 2 へ閉じる。「不正遷移かつ evidence 欠落」の重複ケースでこの 2 系統の oracle は互いに矛盾する書き方になっている。契約側の正本は PLAN-L6-72 §2 の「これらの前置条件が満たされているのに表にない state/event を指定した場合『だけ』 forward-transition-illegal / exit 1」であり evidence 欠落が exit 1 に優先する。したがって契約自体は一意だが、候補文言は損失のある要約である。実装 PR で U-FSM-001/002 の oracle に「evidence が揃っている場合に限り exit 1」の限定を付けて 1:1 昇格すること。無条件のまま test 化すると U-FSM-009 と衝突して必ずどちらかが red になる。

C-2: PLAN-L6-72 §2 の specialized rule 3 件は「不正な from state から呼ばれた場合」を条件節に書いており (例: accept が review_ready から)、合法 from state + evidence 欠落 のときどの rule ID を返すかは §1 追補の「特化 rule を持つ行はそれを優先する」でのみ一意化される。実装 PR は §1 を precedence の正本として明示すること (#348 review の A-1 と同一論点)。

A-1: PLAN-REVERSE-419 の references は #342 のみで #344 を含まず、updated も 2026-08-19 のまま。#347 の required changes は L7-419 のみが対象だったため契約違反ではないが、実装 PR で Reverse 側の issue 参照も #344 へ揃えると traceability が閉じる。

A-2: PLAN-L6-72 §5 の「Issue #346」は PR 番号であり Issue は #345 (表記のみ、内容影響なし)。

結論: PLAN-L7-419 の implementation admission は exact main 7dbfa4fd491c6783f8f46fcde930553b6299ae83 で PASS。Luna による bounded implementation (src/forward/** と U/P-FSM) を開始してよい。C-1 は test oracle の内部矛盾に直結するため実装 PR の最初に解消すること。本 pre-gate では編集・commit・PR・merge を一切行っていない。
