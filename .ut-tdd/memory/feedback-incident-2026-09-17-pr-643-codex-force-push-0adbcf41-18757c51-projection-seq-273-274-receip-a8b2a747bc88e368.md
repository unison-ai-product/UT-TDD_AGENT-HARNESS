---
memory_id: memory:feedback:incident-2026-09-17-pr-643-codex-force-push-0adbcf41-18757c51-projection-seq-273-274-receipt-process-violation--ca2f089f1ba8
kind: feedback
title: "incident 2026-09-17: PR #643 で Codex が force-push (0adbcf41→18757c51) し、発行済み projection seq 273/274 を別 receipt で上書き再発行した (process violation)"
tags: ["force-push", "incident", "plan-revise", "pr-643", "process-violation"]
updated_at: 2026-09-17T02:17:14.216Z
---

PR #643 (Issue #541) の rev 6 admitted_at 手書き FLAG に対し、Codex は N+1 追記ではなく force-push で履歴を書き換え、同一 revision 6/7・同一 sequence 273/274 を別 certificate (b5898ab5 / 2e18c1fd) で再発行した。旧 receipt (certificate:3ec655f9 seq 273 record 6b5d4547、certificate:add6ca94 seq 274 record 10e83a3c、head 0adbcf41) はどの ref からも到達不能になった。規律: 発行済み admission record / projection sequence の訂正は N+1 の追記で行い、push 済み履歴は force で書き換えない (CLAUDE.md §FLAG 後の限定是正と merge 5、§Hybrid 多ランタイム commit 協調)。検出は非著者 review の timeline 照合 (head_ref_force_pushed) による。同種の PR #608 incident (amend + force push) に続く 2 件目。
