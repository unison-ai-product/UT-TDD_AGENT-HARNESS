---
memory_id: memory:feedback:pr351-pf3-closing-review-flag-advisory-blocking-eager-collector-ci-exit-timeout
kind: feedback
title: "PR351 PF3 closing review FLAG: advisory 非blocking は真だが eager collector が CI exit を timeout 経路で変える"
tags: ["doctor", "pr351", "review"]
updated_at: 2026-08-20T05:57:30.136Z
---

PR #351 exact HEAD cd6d7f14 non-author closing review = FLAG。

判定の核: 「doctor hard-gate と CI exit code は不変」は verdict ロジックとしては構造的に真 (buildDoctorResult は ok を checks のみから算出し leadingMessages を見ない = 静的に証明可能、テスト不要)。しかし nodeDoctorDeps が collectWorktreeTopology を eager 実行し、それが runDoctor の既定引数であるため、本 repo 実測 worktree=198 / detached=66 / retained refs=280 / git subprocess spawn 約193ms・status -uall 約200ms から、最良でも約1分、最悪 66x280 の逐次 merge-base spawn で約59分が nodeDoctorDeps() 1回あたり乗る。doctor は既に実測114秒。verdict 不変でも timeout 経路で exit behavior は変わる。

教訓 (一般化): advisory の安全性主張を『判定ロジックを触っていない』だけで検証すると、資源経路での exit 変化を見落とす。非blocking advisory のレビューでは (a) verdict 経路の静的証明 と (b) 収集コストの実測 を必ず対にする。

もう一つ: green-command output_digest は anchor_commit の blob hash (src/lint/green-command-digest.ts:31)。PR #349 では anchor と一致していたのに HEAD とのズレで私が過剰 block した。今回は anchor と HEAD の blob が同一で claimed だけが両方と不一致 = 真の mismatch。anchor blob を実際に計算してから mismatch を主張する、という手順が両方の判定を分けた。
