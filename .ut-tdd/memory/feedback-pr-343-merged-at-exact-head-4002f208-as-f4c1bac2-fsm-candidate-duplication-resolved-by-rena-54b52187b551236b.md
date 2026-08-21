---
memory_id: memory:feedback:pr-343-merged-at-exact-head-4002f208-as-f4c1bac2-fsm-candidate-duplication-resolved-by-rename-and-merge-pre-existing-u-prefix-drift-fixed-and-gh-pr-checks-reported-a-cancelled-run-as-fail
kind: feedback
title: "PR 343 merged at exact HEAD 4002f208 as f4c1bac2: FSM candidate duplication resolved by rename-and-merge, pre-existing U- prefix drift fixed, and gh pr checks reported a cancelled run as fail"
tags: ["candidate-ledger", "ci-pitfall", "forward-fsm", "merged", "pass", "plan-l7-419", "pr-343"]
updated_at: 2026-08-19T11:47:51.338Z
---

PR #343 (PLAN-L7-419 Forward FSM pair-freeze) を merge した。exact HEAD 4002f208da63c05c77fec436eed572208965b7b9、squash merge commit f4c1bac2f63321b00370e6bd6646b3175c93dd26、mergedAt 2026-08-19T11:47:16Z。verdict = PASS (blocking 0)。PR comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/343#issuecomment-5341655015。

FLAG-1 の解消を件数で実測: PR head の docs/test-design/harness/L7-unit-test-design.md で CANDIDATE-FSM-00X (旧系列) = 0 件、CANDIDATE-U-FSM-00X = 7 件、CANDIDATE-P-FSM-00X = 2 件 (台帳 1 行 + 2295 行 U-OIDGATE-001 fixture 内言及、一意性検査対象外)。重複ゼロ。git grep "CANDIDATE-FSM-00" -- docs/ src/ tests/ も 0 件で旧 ID への stale reference なし。指示どおり「新規追加」ではなく「既存 7 行の改名 + 統合」で修正された。

副次効果として **元からあった prefix drift も解消**。台帳が CANDIDATE-U-FSM-001..007 になり、設計正本 PLAN-L6-72:64,71 の U-FSM-001..007 表記と一致した。

統合の質: U-FSM-001 が正例 (許可表どおり exit 0) と負例 (typed forward-transition-illegal exit 1 + event/外部 intent 0 件) の両方を持つ形になり、旧 FSM-001 の positive カバレッジが失われていない。副作用ゼロ assertion は 002/004/005 へも展開され期待結果は統合前より強い。U-FSM-007 は旧 FSM-007 のより厳密な trigger「同一 sequence 付き event 列」を採用。PLAN §2 の記述も台帳へ追従済み。

merge 根拠: CI run 32247290218 の headSha が 4002f208 と一致、conclusion=success、harness-check / linux / windows の 3 つとも pass、完了 2026-08-19T11:43:22Z。mergeStateStatus=CLEAN。--match-head-commit で exact HEAD を固定して squash。

**CI 判定の落とし穴 (再発防止)**: 途中 `gh pr checks 343` が fail を返したが、これは eb957b9a / 0a75fada の **cancelled** な旧 run (32247123798 / 32246639031、いずれも conclusion=cancelled) を読んでいたもので実際の失敗ではなかった。`gh pr checks` の集計だけで red と判断せず、**必ず `gh run list --branch <branch>` で現 HEAD に対応する run を特定し `gh run view <id> --json headSha` で照合する**こと。2026-08-19 の PR #339 で同型の誤引用 (cancelled run を根拠に引用) を既に一度やっている。

review_evidence の扱い: 本 PLAN は status: draft のまま (pair-freeze なので正しい)、review_evidence: [] はキーの存在まで。plan-dod は confirmed/completed のみ対象なので未チェック AC は gate に触れない。AC「非作者 Claude closing review が PASS」は PR comment と本 memory に記録し、review_evidence への entry は実装 PR の confirm と同時に入れる (draft 段階で evidence を先置きしない、という PLAN 自身の方針と一致)。

次: 実装 (src/forward/** と U/P-FSM) は本 pair-freeze が main に到達した後、別 Issue/PR で gpt-5.6-luna が着手する。Opus が pre/post gate。親 Issue #342 / #108 は close していない。
