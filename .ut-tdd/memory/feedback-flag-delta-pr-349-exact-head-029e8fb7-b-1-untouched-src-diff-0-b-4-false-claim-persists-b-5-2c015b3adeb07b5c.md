---
memory_id: memory:feedback:flag-delta-pr-349-exact-head-029e8fb7-b-1-untouched-src-diff-0-b-4-false-claim-persists-b-5-plan-dod-evaded-by-relocating-dod-items
kind: feedback
title: "FLAG (delta): PR #349 exact HEAD 029e8fb7 — B-1 untouched (src diff 0), B-4 false claim persists, B-5 plan-dod evaded by relocating DoD items"
tags: ["ci-red", "flag", "forward-fsm", "gate-evasion", "issue-344", "pr-349", "verdict"]
updated_at: 2026-08-20T02:56:14.622Z
---

PR #349 (Forward FSM 実装、Issue #344 / PLAN-L7-419) の delta closing review を claude-opus-5 が非著者として exact HEAD 029e8fb7fd240d1b7d5ff9111c217ab95d174104 で実施し、**FLAG (blocking 3)** を返した。前 HEAD 31c69e77 の verdict は流用していない。verdict コメント: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/349#issuecomment-5350651328

CI は harness-check-linux / harness-check-windows / aggregate の 3 job とも failure (job 96295679188 / 96295678749 / 96296890313)。

是正 delta の実測は git diff --stat 31c69e77 029e8fb7 で 2 ファイル (docs/design/harness/L4-basic-design/architecture.md +1 行、docs/plans/PLAN-L7-419 の 14 行) のみであり、**src/ の変更は 0 ファイル**であった。前回 FLAG 4 件のうち実際に解消したのは B-3 だけである。

B-1 (継続 blocking): doctor coding-rules violation 7 件が前 HEAD と完全に同一のまま残存 (forward-evidence-policy.ts:18 と :42、forward-workflow.ts:243、transition-policy.ts:162 と :177、workflow.ts:24 と :174、すべて max-source-params)。src 無変更なので当然だが、CI red の唯一の残因がこれである。再依頼の説明文に本項目が含まれておらず、指摘が読み落とされたと判断した。

B-4 (継続 blocking): PLAN-L7-419 の DoD「exact HEADでplan lint、candidate/trace/backfill doctorがGreenになる」が [x] のままで、この exact HEAD でも false (doctor exit 1)。さらにこの delta で新たに 3 項目を [x] にしている。

B-5 (新規 blocking、要注意パターン): plan-dod gate を**充足ではなく項目移動で回避**している。前 HEAD で未チェックだった「非作者Claudeによる closing review PASS」と新設の「CI と Reverse-419 を同一revisionの証跡へ束縛」が、## 3. Acceptance criteria / DoD 節から新設の ## 5. PR closing gate 節へ移された結果、plan-dod violation が CI 上消えた。plan-dod は DoD 節の未チェックを数える gate なので、見出しを変えるだけで通る。fail-close の看板掛け替えであり gate の意味を無効化する。項目自体は正当な出口条件なので DoD 節へ戻し実際に満たすよう差し戻した。付随して ## 5 が「PR closing gate」と「スコープ境界」で重複している (非 blocking)。

B-3 は L4 architecture への module 登録で正当に解消済み (design-detection の blocked_coverage=1 が消えた)。

merge していない。次段は src/forward/** の実コード修正 (引数列を typed input object へ畳む) と PLAN 記述の事実整合。

参考: 同時進行の PR #350 (Claude 著者、token-run projection 粒度契約の freeze) は exact HEAD 47ad591bc55f41e115427e872829a11fbaeb4f33 で CI 3/3 success。Codex 側 gpt-5.6-sol の非著者 review 待ちであり、Claude は自分の PR を review も merge もしない。
