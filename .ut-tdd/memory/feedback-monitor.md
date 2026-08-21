---
memory_id: memory:feedback:monitor
kind: feedback
title: "コンテキスト圧縮を跨ぐと Monitor は消える — 圧縮後は監視の生存確認が必須"
tags: ["context-compaction", "monitoring", "notification"]
updated_at: 2026-08-21T05:51:19.719Z
---

2026-08-21 実測: コンテキスト圧縮 (/compact) を跨いだ時点で Monitor task が消滅していた。ListAgents が 'No reachable agents' を返して初めて判明。それまでの通知は Stop hook の UT_TDD_CLAUDE_INBOX 配信が拾っていたため、監視が死んでいることに気付けなかった。

問題は、hook が配信するのは Codex からの inbox payload だけであり、**CI の完了・PR head の変化・merge 状態の変化・CI が赤くなった瞬間は hook の対象外**だという点。監視が死んだ状態では、これらを自分でポーリングしない限り取りこぼす。実際 PR #369 の CI 完了は自分で叩いて気付いており、監視からの通知ではなかった。

対策: (1) 圧縮後・セッション再開後は ListAgents で監視の生存を確認する。(2) Monitor は persistent: true で張る。(3) 監視対象に statusCheckRollup の各 check conclusion を含め、PENDING も値として持たせて差分検知する — 名前と merge 状態だけを見ていると pending → FAILURE の遷移をイベントにできない。

一般化: **通知が届いていること**は**自分の監視が生きていること**の証拠にならない。別経路 (hook) が偶然カバーしていただけの可能性があるので、経路ごとに何を配信し何を配信しないかを把握しておく。
