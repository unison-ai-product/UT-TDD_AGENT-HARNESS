---
memory_id: memory:feedback:confirm-pr-evidence-gate-check-before-push
kind: feedback
title: "Confirm PR evidence gate check before push"
tags: ["imp-077", "plan-l6-101", "pr-358", "review-evidence", "review-technique"]
updated_at: 2026-08-20T09:34:51.957Z
---

status を confirmed へ遷移する PR は、push 前に analyzeReviewEvidence(loadReviewPlans(repoRoot)) を直接呼んで検算すると 1 往復減らせる。doctor 全体は singleton かつ長時間で 5 分無出力 timeout に当たるが、この関数だけなら数秒で violation が出る。

2026-08-20 の実例。PR #358 exact HEAD 762d0964 は delta が evidence 節のみ (status draft から confirmed へ + review_evidence 追加) だったが、その evidence 節自体が 2 件の gate に落ちて CI linux が FAILURE になった。worktree へ checkout して analyzeReviewEvidence を直接叩くと testBeforeReviewViolations が review_before_test、greenCommandViolations が missing_green_commands を返し、ok flag は false だった。kind add-design は KIND_REVIEW_REQUIRED、status confirmed は STATUS_REVIEW_REQUIRED に含まれる (src/lint/review-evidence.ts:27,30) ので、confirmed へ遷移した瞬間に両検査が有効になる。

review_before_test の中身は IMP-077 の順序違反で、reviewed_at 2026-08-20T09:09:53Z が tests_green_at 2026-08-20T09:15:54Z より 6 分 1 秒早い。記録された時刻自体は正確で、Claude が CI green を待たずに PASS を先出ししたという事実をそのまま写している。ここから引き出せる運用則は二つある。第一に、レビュアが green 前に verdict を先出しすると、その verdict をそのまま review_evidence の reviewed_at にした時点で必ず IMP-077 に落ちる。第二に、是正はタイムスタンプを動かすことではなく、green 後に実体のある確認を行いその時刻を anchor にすることである。PR #358 では Claude が green 確認コメントを 09:17:49Z に投稿しており、それを reviewed_at にすれば順序が実態として成立する。citations に先出し PASS と green 確認の両方を残せば経緯も隠れない。#354 の 1 回目は reviewed_at を動かすだけの形になっており、同じ形を繰り返さない。

green_commands は evidence_path や anchor_commit や citations があっても代替にならない。lint が要求するのは green_commands 配列そのもので、kind / runner / scope / exit_code / completed_at / evidence_path / output_digest / anchor_commit を持つ。anchor_commit には実際に走った head を書く。evidence を追記した新しい head を書いてはならない。その head では走っていないからで、issue #191 が問題にしている anchor 無し digest の時限爆弾化と同じ論点になる。

派生する自戒として記録する。レビュア側が CI pending のまま PASS を先出しすると、著者はその時刻を evidence に書かざるを得ず gate に落ちる。先出しする場合は verdict 本文で「この時刻は evidence の reviewed_at にしないこと、green 確認後の追認コメントを anchor にすること」まで書いておく。
