---
memory_id: memory:feedback:pr-346-merged-at-exact-head-875312d3-as-665e3cba-fsm-contract-tables-materialized-ledger-vs-frontmatter-status-boundary-set-with-no-fallback-and-codex-closed-an-evidence-gate-precedence-conflict-claude-had-missed
kind: feedback
title: "PR 346 merged at exact HEAD 875312d3 as 665e3cba: FSM contract tables materialized, ledger-vs-frontmatter status boundary set with no fallback, and Codex closed an evidence-gate precedence conflict Claude had missed"
tags: ["contract-tables", "forward-fsm", "issue-345", "merged", "pass", "plan-l6-72", "pr-346"]
updated_at: 2026-08-19T12:21:05.645Z
---

PR #346 (PLAN-L6-72 FSM contract tables 具体化、Issue #345) を merge した。exact HEAD 875312d364f48ce12e1fb4cd8cb909359d3d7275、squash merge commit 665e3cba86efa2182fdb71848c69a328ce3585af、mergedAt 2026-08-19T12:20:17Z。verdict = PASS (blocking 0 / advisory 2 carry)。PR comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/346#issuecomment-5342015264。

FLAG-1 解消: 新設 §2.1「frontmatter status との境界」が Claude 提示の選択肢 (a) を採用。FSM state は Forward ledger のみを正本、status: draft|confirmed|completed とは独立軸、workflow status|transition|explain は frontmatter を読まず推測変換もしない。決定的なのはフォールバック禁止 — ledger entry 不在 / projection 再構築不能なら forward-ledger-unavailable / exit 3 とし draft・confirmed・completed のいずれも補完値にしない。これで 2 つの真実が黙って乖離する経路が構造的に塞がった。あわせて supersede の from が「13 正規 state のうち archived 以外」へ緩和され accepted からの supersede が可能になった (Claude が挙げた実例 = PLAN-L6-89 が confirmed の PLAN-L6-72 を supersede し doctor plan-supersession が双方向強制、と矛盾しなくなった)。「Forward ledger 操作であって PLAN frontmatter の supersession とは別概念」と明記され §2.1 の独立性主張とも整合。

FLAG-2 解消: transition は exit mapping 表、status/explain は query の説明・取得の成否で決め verdict allow|deny|explain にかかわらず valid read-only envelope は exit 0。merge 済 CANDIDATE-U-FSM-001 の「正例 exit 0 / 負例 exit 1」(transition 対象) と競合しない。

advisory 3 件も反映: producer 列が non-author-family の述語表現に (散文依存が解消)、resume の保守的再入の意図と evidence 非継承を明記、cardinality の単位を subjectId + subjectRevision ごとの active frontier / exception 行だけ exception event ごと と明示。

**Codex が自力で塞いだ曖昧性 (Claude のレビューが拾えていなかった)**: 3 push 目の evidence gate precedence。begin-implementation を許可外 from (planned 等) から Red evidence 無しで呼ぶと closed-world 規則では forward-transition-illegal (exit 1) だが CANDIDATE-U-FSM-003 は forward-red-evidence-missing を期待する — 同じ入力で 2 つの oracle が矛盾していた。「既知 event の必須 evidence 欠落は closed-world の一般エラーより先に返す。前置条件が満たされているのに表にない state/event を指定した場合だけ illegal-transition」という precedence で一意に分離された。#344 admission 条件「候補が表を参照して一意に判定可能」を満たすために必要な修正だった。教訓: closed-world な禁止規則と event 固有の fail-close を同居させたら、必ず**どちらが先に評価されるか**を書く。書かないと negative oracle 同士が同じ入力で衝突する。

merge 根拠: run 32250840770 の headSha が 875312d3 と一致、conclusion=success、harness-check / linux / windows の 3 つとも pass、完了 2026-08-19T12:18:21Z。mergeStateStatus=CLEAN。--match-head-commit で固定して squash。d627f861 / 91f3ae86 の run は cancelled (superseded) であり失敗ではない。

carry advisory 2 件 (実装 slice へ): C-1 forward-ledger-unavailable は本 PR 新設の typed rule ID だが対応する candidate oracle が無い (exit 3 クラス全体が oracle 未カバー)。C-2 許可 from state にいるが evidence が expiry 超過のケース (例 red_frozen で red-test-run が 24h 超) は precedence 節の列挙に含まれず §3 一般 policy に落ちる。実装時に forward-red-evidence-missing へ倒す想定でよいか確認が要る。

次: #344 の Forward FSM 実装 admission は、これで表を参照して一意に判定できる状態になった。Claude が #344 pre-gate を再導出して PASS なら luna 起動。
