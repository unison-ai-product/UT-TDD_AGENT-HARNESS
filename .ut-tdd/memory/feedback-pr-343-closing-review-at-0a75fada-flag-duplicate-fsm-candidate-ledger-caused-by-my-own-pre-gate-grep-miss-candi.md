---
memory_id: memory:feedback:pr-343-closing-review-at-0a75fada-flag-duplicate-fsm-candidate-ledger-caused-by-my-own-pre-gate-grep-miss-candidate-fsm-001-007-already-existed-without-the-u-prefix
kind: feedback
title: "PR 343 closing review at 0a75fada: FLAG duplicate FSM candidate ledger, caused by my own pre-gate grep miss (CANDIDATE-FSM-001..007 already existed without the U- prefix)"
tags: ["candidate-ledger", "flag", "forward-fsm", "plan-l7-419", "pr-343", "prefix-drift", "self-correction"]
updated_at: 2026-08-19T11:18:52.650Z
---

PR #343 (PLAN-L7-419 Forward FSM pair-freeze) の Claude non-author closing review、exact HEAD 0a75fadaaa059339173a0c8037ec1b0e6b4492f3。verdict = FLAG (blocking 1)。PR comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/343#issuecomment-5341393362 に全文。

## 最重要: Claude の pre-gate B-3 は誤りだった (自己訂正)

pre-gate memory project-plan-l7-419-forward-fsm-opus-pre-gate-... で「Red-freeze が 8 本中 7 本存在しない。CANDIDATE-P-FSM-001 の 1 件だけで U-FSM-001..007 は 0 件」と書いたのは **誤り**。main 2f3f15af の docs/test-design/harness/L7-unit-test-design.md:1341-1348 に CANDIDATE-FSM-001 〜 CANDIDATE-FSM-007 と CANDIDATE-P-FSM-001 の **8 件すべてが既に登録されていた**。Claude が `U-FSM|P-FSM` で grep したため U- prefix を持たない CANDIDATE-FSM-00X を取りこぼした。「0 件」は検出失敗であって不在ではない。この誤った pre-gate が PR #343 の blocking を生んだ。

教訓: **oracle 台帳の不在を主張する前に、prefix 違いを含めた表記ゆれで再 grep すること**。設計正本と台帳で ID 表記が食い違っている場合 (本件がまさにそれ)、片方の表記だけで引くと必ず取りこぼす。

## FLAG-1 (blocking): candidate 台帳が二重になる

PR #343 は CANDIDATE-U-FSM-001..007 を新規追加するが既存 CANDIDATE-FSM-001..007 は残るため、7 個の振る舞いに 14 行が並ぶ。対応は 1:1: U-FSM-003/004/005/006 は既存 FSM-003/004/005/006 と **同じ typed error code** (forward-red-evidence-missing / forward-trace-freeze-missing / forward-accept-evidence-missing / forward-exception-context-missing)、U-FSM-007 は FSM-007 と同じ replay 決定性、U-FSM-002 は FSM-002 の条件拡張、U-FSM-001 は FSM-001 の negative 側だが FSM-002 と code が重複。

追加された実質的価値は「副作用ゼロの assertion」(event/外部 intent 0 件、state 不変、review state 非昇格、二重 projection なし) であり、これは既存行の**期待結果を強くするもの**。別 ID 系列を立てる理由にならない。

害: 実装 PR が 15 候補を満たす義務を負い、oracle-test-trace が 7 振る舞いに 14 citation を要求し、正本が判別不能になる。**ID 文字列が異なるので U-VMSRC-009 の一意性検査は通る** = 機械では捕まらない重複。

## 併せて検出: 元からの prefix drift

設計正本 PLAN-L6-72:64,71 は `U-FSM-001..007` / `P-FSM-001` と書くが、台帳は `CANDIDATE-FSM-001..007` (U- 欠落) と `CANDIDATE-P-FSM-001` (P- は正しい)。**U 系列だけ prefix が落ちている**状態が元から存在した。

## 最小修正

新規追加せず、既存 1341-1347 の 7 行を (1) ID を CANDIDATE-U-FSM-00X へ改名して L6-72 の表記に揃える、(2) 期待結果へ #343 の副作用ゼロ assertion を統合、(3) FSM-001 の positive は残し U-FSM-001 の negative は FSM-002 と統合または役割分担を明記、と編集する。重複を作らず prefix drift も同時解消できる。CANDIDATE-P-FSM-001 は変更不要。行 2295 の U-OIDGATE-001 fixture は P 系列のみ参照するため影響しない。

## PLAN 側は良好 (pre-gate の他指摘はすべて解消)

B-1 解消 = §4 工程 (直列/理由付き) と §3 AC/DoD checkbox と review_evidence: [] キー追加 (3 文 stub から実体化)。B-2 解消 = requires: [PLAN-L7-418] へ昇格 (confirmed なので可)。B-5 解消 = github_issue_id: 342、#108 の子として位置づけ #224 は Related に留める整理。B-6 解消 = PLAN-REVERSE-419 の workflow_phase を R4 → R0 へ修正、route_signal も drift → reverse。IMP-156 を observed → implemented とし U-PA-043 / U-PA-044 を根拠引用 (Claude pre-gate の対応と一致)。IMP-167 は Reverse へ送る整理も妥当。§5 で D1/D2/D3 custody / Episode E0-E15 / PF-5 Pack admission / promotion rollback を除外し、generates は PLAN 2 件のみで src/forward/** を先取りしていない。

次の手: FLAG-1 修正 → exact HEAD 更新 → CI green 確認 → Claude closing PASS → merge。CI は run 32246639031 が pending。
